-- ============================================================================
-- One wallet balance (2026-11-12)
--
-- user_wallet had two balance columns: the old app wallet (Flutter / mobile /
-- the `wallet` Edge Function) used `total`; the web uses `balance`. From now
-- on `balance` is the only balance. The mobile app moves to the web REST API
-- (/api/wallet/*), so there is one Paystack key, one webhook and one balance.
--
--   1. Cancel the three stale pending rows in the old ledger so nothing can
--      ever pay them out.
--   2. Move every `total` into `balance` (dev data: 28 wallets, ₦2,900, all
--      ₦100 welcome bonuses plus one ₦100 credit), then zero `total`.
--   3. Point every function that still wrote `total` at `balance`:
--        create_wallet_for_new_user (₦100 welcome bonus, trigger on users)
--        update_users_wallet        (old-ledger trigger: topup / receive /
--                                    course_sale / withdrawal / transfer /
--                                    gift / course_purchase rows)
--        wallet_credit_topup, wallet_begin_withdrawal, wallet_fail_withdrawal,
--        wallet_reverse_topup        (only the `wallet` Edge Function; drop
--                                    them once mobile is on /api/wallet)
--  3b. Point every function that still read/spent `total` at `balance`
--      (FOR UPDATE + same insufficient-funds checks):
--        nm_create_escrow_order, contribute_to_funding_with_wallet,
--        pay_ajo_contribution, ajo_enforce_payout_collateral,
--        pay_cooperative_due, deposit_to/withdraw_from_flexible_savings,
--        contribute_to/withdraw_from_goal_savings,
--        contribute_to/withdraw_from_locked_savings
--   4. CHECK (total = 0): anything that still writes `total` now fails loudly
--      instead of putting money where nobody can see it.
--   5. Abort (roll everything back) if any function still mentions
--      user_wallet.total.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Stale pending rows → failed (failed = never paid out, never re-credited:
--    wallet_complete_withdrawal / wallet_credit_topup only act on 'pending',
--    and wallet_fail_withdrawal treats 'failed' as already refunded).
--    • ₦100 withdrawal, 2026-03-21  (WD_1774118068341_…)
--    • ₦53,750 withdrawal, 2026-10-02 (WTH-1790941093568-JDZA)
--    • ₦1,000 top-up, 2026-11-12    (TUP_8bf5f32f7abb450e9dc984a3450d8ea2)
-- ---------------------------------------------------------------------------
UPDATE public.transactions
SET status = 'failed'
WHERE status = 'pending'
  AND id IN (
    '456f1221-eef7-474c-b5fe-d0630c9e672d',
    '9ea16289-6bf6-4bb1-b3c9-f9ed2f1d6e9d',
    '55e05317-e421-46b3-aee5-c1a08f218775'
  );

-- ---------------------------------------------------------------------------
-- 2. total → balance
-- ---------------------------------------------------------------------------
UPDATE public.user_wallet
SET balance = coalesce(balance, 0) + coalesce(total, 0),
    total = 0
WHERE coalesce(total, 0) <> 0;

UPDATE public.user_wallet SET total = 0 WHERE total IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Writers of `total` → `balance` (same signatures and return values)
-- ---------------------------------------------------------------------------

-- New users still get the ₦100 welcome bonus the app has always given.
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Old-ledger trigger (rows written by transfer_to_user, the Edge Function and
-- old app builds). Same rules as before, on `balance`.
CREATE OR REPLACE FUNCTION public.update_users_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.type IN ('topup', 'receive', 'course_sale') AND NEW.status = 'success' THEN
    INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
    VALUES (NEW.user_id, NEW.amount, NEW.amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance,
          total_accumulated = coalesce(public.user_wallet.total_accumulated, 0) + EXCLUDED.total_accumulated;
  ELSIF NEW.type IN ('withdrawal', 'transfer', 'gift', 'course_purchase') AND NEW.status = 'success' THEN
    UPDATE public.user_wallet SET balance = balance - NEW.amount
    WHERE user_id = NEW.user_id AND coalesce(balance, 0) >= NEW.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient funds for %', NEW.type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_credit_topup(p_ref text, p_amount_paid numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'topup' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status = 'success' THEN RETURN 'already_credited'; END IF;
  IF v_tx.status <> 'pending' THEN RETURN 'not_pending'; END IF;
  IF p_amount_paid IS NULL OR p_amount_paid < v_tx.amount THEN
    UPDATE public.transactions SET status = 'failed' WHERE id = v_tx.id;
    RETURN 'amount_mismatch';
  END IF;

  UPDATE public.transactions SET status = 'success' WHERE id = v_tx.id;
  INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
  VALUES (v_tx.user_id, v_tx.amount, v_tx.amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance,
        total_accumulated = coalesce(public.user_wallet.total_accumulated, 0) + EXCLUDED.total_accumulated;
  RETURN 'credited';
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_begin_withdrawal(
  p_user_id uuid,
  p_amount double precision,
  p_bank_code text,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
BEGIN
  IF p_amount IS NULL OR p_amount < 100 THEN RAISE EXCEPTION 'Minimum withdrawal is ₦100'; END IF;

  UPDATE public.user_wallet SET balance = balance - p_amount
  WHERE user_id = p_user_id AND coalesce(balance, 0) >= p_amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_ref := 'WDR_' || replace(gen_random_uuid()::text, '-', '');
  -- 'pending' rows are ignored by update_users_wallet(), so this is the only debit.
  INSERT INTO public.transactions (user_id, amount, type, status, ref, bank_code, bank_name, account_number, account_name)
  VALUES (p_user_id, p_amount, 'withdrawal', 'pending', v_ref, p_bank_code, p_bank_name, p_account_number, p_account_name);
  RETURN v_ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_fail_withdrawal(p_ref text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'withdrawal' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status IN ('failed', 'rejected', 'reversed') THEN RETURN 'already_refunded'; END IF;
  UPDATE public.transactions SET status = 'failed' WHERE id = v_tx.id;
  UPDATE public.user_wallet SET balance = coalesce(balance, 0) + v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'refunded';
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_reverse_topup(p_ref text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx record;
BEGIN
  SELECT id, user_id, amount, status::text AS status INTO v_tx
  FROM public.transactions WHERE ref = p_ref AND type::text = 'topup' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_tx.status <> 'success' THEN
    UPDATE public.transactions SET status = 'rejected' WHERE id = v_tx.id AND status::text = 'pending';
    RETURN 'not_credited';
  END IF;
  UPDATE public.transactions SET status = 'rejected' WHERE id = v_tx.id;
  UPDATE public.user_wallet SET balance = coalesce(balance, 0) - v_tx.amount WHERE user_id = v_tx.user_id;
  RETURN 'reversed';
END;
$$;

COMMENT ON FUNCTION public.wallet_credit_topup(text, numeric) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_begin_withdrawal(uuid, double precision, text, text, text, text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_fail_withdrawal(text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON FUNCTION public.wallet_reverse_topup(text) IS
  'Legacy: only the `wallet` Edge Function. Drop once mobile uses /api/wallet.';
COMMENT ON COLUMN public.user_wallet.total IS
  'Retired 2026-11-12 (always 0). The balance is user_wallet.balance.';

-- ---------------------------------------------------------------------------
-- 3b. Readers/spenders of `total` → `balance`.
--     These live only in the database (sources: naija_impact repo migrations
--     20260825120000, 20260825130000, 20260825140000, 20260305135459,
--     20260827100000). Bodies are unchanged except for the wallet lines:
--       • the balance is read with FOR UPDATE (no two spends of the same naira)
--       • debits / credits go to `balance`
--     Same signatures, return values, messages ('Insufficient balance') and
--     ledger rows as before. CREATE OR REPLACE keeps the existing grants.
-- ---------------------------------------------------------------------------

-- Marketplace wallet checkout (web lib/actions/marketplace.ts + mobile).
CREATE OR REPLACE FUNCTION public.nm_create_escrow_order(
    p_listing_id uuid,
    p_quantity integer,
    p_delivery_option text,
    p_delivery_address text DEFAULT NULL::text,
    p_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_listing       record;
  v_order_id      uuid;
  v_total         numeric;
  v_platform_fee  numeric;
  v_seller_payout numeric;
  v_tracking      text;
  v_buyer_balance double precision;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Load listing
  select * into v_listing from public.nm_listings where id = p_listing_id and is_active = true;
  if not found then raise exception 'Listing not found or inactive'; end if;
  if v_listing.stock < p_quantity then raise exception 'Insufficient stock'; end if;
  if v_listing.user_id = auth.uid() then raise exception 'Cannot buy your own listing'; end if;

  v_total := (v_listing.price * p_quantity) + v_listing.delivery_fee;
  v_platform_fee := round(v_total * 0.025, 2); -- 2.5% platform fee
  v_seller_payout := v_total - v_platform_fee;
  v_tracking := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  -- Check and debit buyer's wallet
  select balance into v_buyer_balance from public.user_wallet where user_id = auth.uid() for update;
  if v_buyer_balance is null or v_buyer_balance < v_total then
    raise exception 'Insufficient balance';
  end if;

  update public.user_wallet set balance = balance - v_total where user_id = auth.uid();

  insert into public.transactions (user_id, amount, type, status, ref)
  values (auth.uid(), v_total, 'marketplace_purchase', 'success', 'NM_ORDER_' || v_tracking);

  -- Create order
  insert into public.nm_orders (
    listing_id, buyer_id, seller_id, quantity, unit_price,
    delivery_fee, total_amount, delivery_option, delivery_address,
    status, tracking_code, notes
  ) values (
    p_listing_id, auth.uid(), v_listing.seller_id, p_quantity, v_listing.price,
    v_listing.delivery_fee, v_total, p_delivery_option::public.nm_delivery_option,
    p_delivery_address, 'pending', v_tracking, p_notes
  ) returning id into v_order_id;

  -- Create escrow record
  insert into public.nm_escrow (
    order_id, buyer_id, seller_id, amount, platform_fee, seller_payout, status, funded_at
  ) values (
    v_order_id, auth.uid(), v_listing.seller_id, v_total, v_platform_fee, v_seller_payout, 'funded', now()
  );

  -- Deduct stock
  update public.nm_listings set stock = stock - p_quantity, orders_count = orders_count + 1
  where id = p_listing_id;

  return v_order_id;
end;
$function$;

-- Funding: the debit/credit itself is done by update_users_wallet() (now on
-- `balance`, section 3) from the 'gift' / 'receive' rows; only the check moves.
CREATE OR REPLACE FUNCTION public.contribute_to_funding_with_wallet(
    p_funding_id UUID,
    p_amount DOUBLE PRECISION,
    p_funding_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contributor_id UUID;
    v_creator_id UUID;
    v_contributor_balance DOUBLE PRECISION;
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_contributor_id := auth.uid();
    IF v_contributor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT user_id INTO v_creator_id FROM public.funding WHERE id = p_funding_id;
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Funding not found';
    END IF;

    IF v_creator_id = v_contributor_id THEN
        RAISE EXCEPTION 'Cannot contribute to your own funding';
    END IF;

    SELECT balance INTO v_contributor_balance
    FROM public.user_wallet
    WHERE user_id = v_contributor_id
    FOR UPDATE;

    IF v_contributor_balance IS NULL OR v_contributor_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_reference := 'FND_' || p_funding_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);

    -- Debit (applied once by update_users_wallet()).
    INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
    VALUES (v_contributor_id, p_amount, 'gift', 'success', v_reference || '_debit', v_creator_id);

    -- Credit (applied once by update_users_wallet()).
    INSERT INTO public.transactions (user_id, amount, type, status, ref, other_user_id)
    VALUES (v_creator_id, p_amount, 'receive', 'success', v_reference || '_credit', v_contributor_id);

    INSERT INTO public.funding_transactions (
        user_id, funding_id, funding_type, amount, reference, transaction_status
    ) VALUES (
        v_contributor_id, p_funding_id, p_funding_type::public.funding_type, p_amount, v_reference, 'success'
    )
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'funding_id', p_funding_id,
        'contributor_id', v_contributor_id,
        'creator_id', v_creator_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Ajo: pay a contribution.
CREATE OR REPLACE FUNCTION public.pay_ajo_contribution(p_contribution_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_member_id UUID;
    v_amount NUMERIC(14,2);
    v_status public.fintech_payment_status;
    v_balance DOUBLE PRECISION;
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT c.member_id, c.amount, c.status
      INTO v_member_id, v_amount, v_status
    FROM public.fintech_ajo_contributions c
    WHERE c.id = p_contribution_id;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Contribution not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.fintech_ajo_group_members m
        WHERE m.id = v_member_id AND m.user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'This contribution does not belong to you';
    END IF;

    IF v_status IN ('paid', 'waived') THEN
        RAISE EXCEPTION 'This contribution does not require payment';
    END IF;

    SELECT balance INTO v_balance FROM public.user_wallet WHERE user_id = v_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < v_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_reference := 'AJO_CONTRIB_' || p_contribution_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    UPDATE public.user_wallet
    SET balance = balance - v_amount
    WHERE user_id = v_user_id;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, v_amount, 'ajo_contribution', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    UPDATE public.fintech_ajo_contributions
    SET status = 'paid'::public.fintech_payment_status,
        paid_at = NOW(),
        transaction_id = v_transaction_id,
        updated_at = NOW()
    WHERE id = p_contribution_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', v_amount,
        'contribution_id', p_contribution_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Ajo: payout release trigger takes next cycle's contribution as collateral.
CREATE OR REPLACE FUNCTION public.ajo_enforce_payout_collateral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_member                record;
  v_group                 record;
  v_balance               double precision;
  v_next_contribution_id  uuid;
  v_reference             text;
  v_transaction_id        uuid;
begin
  if NEW.status = 'paid' and OLD.status is distinct from 'paid' then
    select * into v_member from fintech_ajo_group_members where id = NEW.member_id;
    select * into v_group from fintech_ajo_groups where id = NEW.group_id;

    select id into v_next_contribution_id
    from fintech_ajo_contributions
    where member_id = NEW.member_id
      and group_id = NEW.group_id
      and status in ('pending', 'overdue')
    order by due_at asc
    limit 1;

    if v_next_contribution_id is not null then
      select balance into v_balance from user_wallet where user_id = v_member.user_id for update;

      if v_balance is null or v_balance < v_group.contribution_amount then
        raise exception
          'Cannot release payout: member does not have next cycle''s contribution (%) available in their wallet',
          v_group.contribution_amount;
      end if;

      v_reference := 'AJO_COLLATERAL_' || NEW.id::text;

      update user_wallet
      set balance = balance - v_group.contribution_amount
      where user_id = v_member.user_id;

      insert into transactions (user_id, amount, type, status, ref)
      values (v_member.user_id, v_group.contribution_amount, 'ajo_contribution', 'success', v_reference)
      returning id into v_transaction_id;

      update fintech_ajo_contributions
      set status = 'paid', paid_at = now(), updated_at = now(), transaction_id = v_transaction_id
      where id = v_next_contribution_id;
    end if;
  end if;

  return NEW;
end;
$function$;

-- Cooperative: pay a monthly due.
CREATE OR REPLACE FUNCTION public.pay_cooperative_due(
    p_due_id UUID,
    p_amount NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_wallet_balance DOUBLE PRECISION;
    v_transaction_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF NOT EXISTS (
        SELECT 1 FROM public.cooperative_dues
        WHERE id = p_due_id AND user_id = v_user_id AND status != 'paid'
    ) THEN
        RAISE EXCEPTION 'Due not found or already paid';
    END IF;

    SELECT balance INTO v_wallet_balance
    FROM public.user_wallet WHERE user_id = v_user_id FOR UPDATE;

    IF v_wallet_balance IS NULL OR v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    UPDATE public.user_wallet
    SET balance = balance - p_amount
    WHERE user_id = v_user_id;

    -- 'cooperative_due' is not handled by update_users_wallet(), so this is the only debit.
    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (
        v_user_id,
        p_amount,
        'cooperative_due',
        'success',
        'DUE_' || extract(epoch from now())::bigint::text || '_' || gen_random_uuid()::text
    )
    RETURNING id INTO v_transaction_id;

    UPDATE public.cooperative_dues
    SET status = 'paid',
        paid_at = now(),
        transaction_id = v_transaction_id,
        updated_at = now()
    WHERE id = p_due_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save: flexible savings.
CREATE OR REPLACE FUNCTION public.deposit_to_flexible_savings(
    p_account_id UUID,
    p_amount NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_balance DOUBLE PRECISION;
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.fintech_safe_flexible_accounts
        WHERE id = p_account_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Savings account not found';
    END IF;

    SELECT balance INTO v_balance FROM public.user_wallet WHERE user_id = v_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_reference := 'SAVE_FLEX_DEP_' || p_account_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    UPDATE public.user_wallet
    SET balance = balance - p_amount
    WHERE user_id = v_user_id;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, p_amount, 'save_deposit', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    -- fintech_flexible_balance_trigger updates the pot from this insert.
    INSERT INTO public.fintech_safe_flexible_transactions (account_id, user_id, type, amount, notes)
    VALUES (p_account_id, v_user_id, 'deposit', p_amount, p_notes);

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'account_id', p_account_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_from_flexible_savings(
    p_account_id UUID,
    p_amount NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_pot_balance NUMERIC(14,2);
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT balance INTO v_pot_balance
    FROM public.fintech_safe_flexible_accounts
    WHERE id = p_account_id AND user_id = v_user_id;

    IF v_pot_balance IS NULL THEN
        RAISE EXCEPTION 'Savings account not found';
    END IF;

    IF v_pot_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient savings balance';
    END IF;

    v_reference := 'SAVE_FLEX_WD_' || p_account_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    -- fintech_flexible_balance_trigger updates the pot from this insert.
    INSERT INTO public.fintech_safe_flexible_transactions (account_id, user_id, type, amount, notes)
    VALUES (p_account_id, v_user_id, 'withdrawal', p_amount, p_notes);

    INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
    VALUES (v_user_id, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, p_amount, 'save_withdrawal', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'account_id', p_account_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Save: goal savings.
CREATE OR REPLACE FUNCTION public.contribute_to_goal_savings(
    p_goal_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_status public.fintech_goal_status;
    v_target NUMERIC(14,2);
    v_current NUMERIC(14,2);
    v_balance DOUBLE PRECISION;
    v_transaction_id UUID;
    v_reference TEXT;
    v_new_amount NUMERIC(14,2);
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT status, target_amount, current_amount
      INTO v_status, v_target, v_current
    FROM public.fintech_safe_goal_savings
    WHERE id = p_goal_id AND user_id = v_user_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Goal not found';
    END IF;

    IF v_status <> 'in_progress' THEN
        RAISE EXCEPTION 'This goal is no longer accepting contributions';
    END IF;

    SELECT balance INTO v_balance FROM public.user_wallet WHERE user_id = v_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_reference := 'SAVE_GOAL_DEP_' || p_goal_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    UPDATE public.user_wallet
    SET balance = balance - p_amount
    WHERE user_id = v_user_id;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, p_amount, 'save_deposit', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    UPDATE public.fintech_safe_goal_savings
    SET current_amount = current_amount + p_amount,
        status = CASE WHEN v_current + p_amount >= v_target
                      THEN 'achieved'::public.fintech_goal_status
                      ELSE status END,
        updated_at = NOW()
    WHERE id = p_goal_id
    RETURNING current_amount INTO v_new_amount;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'goal_id', p_goal_id,
        'current_amount', v_new_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_from_goal_savings(
    p_goal_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current NUMERIC(14,2);
    v_target NUMERIC(14,2);
    v_status public.fintech_goal_status;
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT current_amount, target_amount, status
      INTO v_current, v_target, v_status
    FROM public.fintech_safe_goal_savings
    WHERE id = p_goal_id AND user_id = v_user_id;

    IF v_current IS NULL THEN
        RAISE EXCEPTION 'Goal not found';
    END IF;

    IF v_current < p_amount THEN
        RAISE EXCEPTION 'Insufficient goal balance';
    END IF;

    v_reference := 'SAVE_GOAL_WD_' || p_goal_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    UPDATE public.fintech_safe_goal_savings
    SET current_amount = current_amount - p_amount,
        status = CASE WHEN v_status = 'achieved' AND v_current - p_amount < v_target
                      THEN 'in_progress'::public.fintech_goal_status
                      ELSE status END,
        updated_at = NOW()
    WHERE id = p_goal_id;

    INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
    VALUES (v_user_id, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, p_amount, 'save_withdrawal', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'goal_id', p_goal_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Save: locked savings.
CREATE OR REPLACE FUNCTION public.contribute_to_locked_savings(
    p_locked_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_status public.fintech_record_status;
    v_matures_at TIMESTAMPTZ;
    v_balance DOUBLE PRECISION;
    v_transaction_id UUID;
    v_reference TEXT;
    v_new_amount NUMERIC(14,2);
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT status, matures_at INTO v_status, v_matures_at
    FROM public.fintech_safe_locked_savings
    WHERE id = p_locked_id AND user_id = v_user_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Locked savings plan not found';
    END IF;

    IF v_status <> 'active' OR NOW() >= v_matures_at THEN
        RAISE EXCEPTION 'This plan is no longer accepting contributions';
    END IF;

    SELECT balance INTO v_balance FROM public.user_wallet WHERE user_id = v_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_reference := 'SAVE_LOCKED_DEP_' || p_locked_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    UPDATE public.user_wallet
    SET balance = balance - p_amount
    WHERE user_id = v_user_id;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, p_amount, 'save_deposit', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    UPDATE public.fintech_safe_locked_savings
    SET current_amount = current_amount + p_amount,
        updated_at = NOW()
    WHERE id = p_locked_id
    RETURNING current_amount INTO v_new_amount;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount', p_amount,
        'locked_id', p_locked_id,
        'current_amount', v_new_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_from_locked_savings(
    p_locked_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current NUMERIC(14,2);
    v_penalty_rate NUMERIC(6,4);
    v_matures_at TIMESTAMPTZ;
    v_is_early BOOLEAN;
    v_penalty_amount NUMERIC(14,2);
    v_net_amount NUMERIC(14,2);
    v_transaction_id UUID;
    v_reference TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    SELECT current_amount, early_withdrawal_penalty, matures_at
      INTO v_current, v_penalty_rate, v_matures_at
    FROM public.fintech_safe_locked_savings
    WHERE id = p_locked_id AND user_id = v_user_id;

    IF v_current IS NULL THEN
        RAISE EXCEPTION 'Locked savings plan not found';
    END IF;

    IF v_current < p_amount THEN
        RAISE EXCEPTION 'Insufficient locked balance';
    END IF;

    v_is_early := NOW() < v_matures_at;
    v_penalty_amount := CASE WHEN v_is_early THEN ROUND(p_amount * v_penalty_rate, 2) ELSE 0 END;
    v_net_amount := p_amount - v_penalty_amount;

    v_reference := 'SAVE_LOCKED_WD_' || p_locked_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;

    -- fintech_update_locked_savings_status (BEFORE UPDATE trigger) closes the
    -- plan once matures_at has passed.
    UPDATE public.fintech_safe_locked_savings
    SET current_amount = current_amount - p_amount,
        updated_at = NOW()
    WHERE id = p_locked_id;

    INSERT INTO public.user_wallet (user_id, balance, total_accumulated)
    VALUES (v_user_id, v_net_amount, v_net_amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = coalesce(public.user_wallet.balance, 0) + EXCLUDED.balance;

    INSERT INTO public.transactions (user_id, amount, type, status, ref)
    VALUES (v_user_id, v_net_amount, 'save_withdrawal', 'success', v_reference)
    RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'reference', v_reference,
        'amount_withdrawn', p_amount,
        'penalty_amount', v_penalty_amount,
        'net_amount', v_net_amount,
        'was_early', v_is_early,
        'locked_id', p_locked_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Nothing may put money in `total` again.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_wallet ALTER COLUMN total SET DEFAULT 0;
ALTER TABLE public.user_wallet DROP CONSTRAINT IF EXISTS user_wallet_total_retired;
ALTER TABLE public.user_wallet ADD CONSTRAINT user_wallet_total_retired CHECK (coalesce(total, 0) = 0);

-- ---------------------------------------------------------------------------
-- 5. Abort if any function still references user_wallet.total: with the CHECK
--    above it would fail on every call. Raising rolls back this whole
--    migration, so nothing is half-applied. (`total_accumulated`, `v_total`
--    and `total_amount` don't match: \m…\M are word boundaries.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_fns text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ' ORDER BY 1) INTO v_fns
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosrc ~* 'user_wallet'
    AND p.prosrc ~* '\mtotal\M';
  IF v_fns IS NOT NULL THEN
    RAISE EXCEPTION 'Still reading/writing user_wallet.total — move to balance first: %', v_fns;
  END IF;
END;
$$;
