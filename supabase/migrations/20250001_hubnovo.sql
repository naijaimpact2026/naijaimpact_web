-- ============================================================
-- Hubnovo Migration
-- Run this in Supabase SQL Editor to set up marketplace tables.
-- ============================================================

-- ─── marketplace_products ────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storefront_id   uuid REFERENCES marketplace_storefronts(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  category        text NOT NULL,
  subcategory     text,
  images          text[] NOT NULL DEFAULT '{}',
  price           numeric NOT NULL DEFAULT 0,
  negotiable      boolean NOT NULL DEFAULT false,
  condition       text NOT NULL DEFAULT 'new',  -- new|used_good|used_fair|refurbished
  brand           text,
  stock_quantity  integer NOT NULL DEFAULT 1,
  location        text,
  state           text,
  delivery_options text[] NOT NULL DEFAULT '{}',
  warranty        text,
  return_policy   text,
  specifications  jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'active', -- active|sold|paused|removed
  views           integer NOT NULL DEFAULT 0,
  ai_description  text,
  ai_title        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_products_seller_id_idx ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS marketplace_products_category_idx ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS marketplace_products_status_idx ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS marketplace_products_created_at_idx ON marketplace_products(created_at DESC);

-- ─── marketplace_storefronts ──────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_storefronts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug            text NOT NULL UNIQUE,
  business_name   text NOT NULL,
  tagline         text,
  description     text,
  logo_url        text,
  cover_url       text,
  category        text NOT NULL DEFAULT 'Other',
  opening_hours   text,
  phone           text,
  email           text,
  website         text,
  social_links    jsonb NOT NULL DEFAULT '{}',
  return_policy   text,
  shipping_policy text,
  status          text NOT NULL DEFAULT 'active', -- active|paused|suspended
  followers       integer NOT NULL DEFAULT 0,
  total_sales     integer NOT NULL DEFAULT 0,
  rating_average  numeric NOT NULL DEFAULT 0,
  rating_count    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_storefronts_owner_id_idx ON marketplace_storefronts(owner_id);
CREATE INDEX IF NOT EXISTS marketplace_storefronts_slug_idx ON marketplace_storefronts(slug);

-- ─── marketplace_orders ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          uuid NOT NULL REFERENCES users(id),
  seller_id         uuid NOT NULL REFERENCES users(id),
  product_id        uuid NOT NULL REFERENCES marketplace_products(id),
  quantity          integer NOT NULL DEFAULT 1,
  unit_price        numeric NOT NULL,
  total_amount      numeric NOT NULL,
  delivery_address  text,
  delivery_method   text NOT NULL DEFAULT 'delivery',
  status            text NOT NULL DEFAULT 'pending_payment',
  paystack_ref      text UNIQUE,
  escrow_held       boolean NOT NULL DEFAULT false,
  confirmed_at      timestamptz,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  dispute_reason    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_id_idx ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS marketplace_orders_seller_id_idx ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS marketplace_orders_status_idx ON marketplace_orders(status);

-- ─── marketplace_reviews ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES marketplace_orders(id),
  reviewer_id   uuid NOT NULL REFERENCES users(id),
  seller_id     uuid NOT NULL REFERENCES users(id),
  product_id    uuid NOT NULL REFERENCES marketplace_products(id),
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         text,
  body          text,
  images        text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, reviewer_id)
);

-- ─── marketplace_artisan_profiles ────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_artisan_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  category         text NOT NULL,
  profession_title text NOT NULL,
  bio              text,
  portfolio_images text[] NOT NULL DEFAULT '{}',
  portfolio_videos text[] NOT NULL DEFAULT '{}',
  certifications   text[] NOT NULL DEFAULT '{}',
  service_areas    text[] NOT NULL DEFAULT '{}',
  pricing_from     numeric,
  pricing_currency text NOT NULL DEFAULT 'NGN',
  available        boolean NOT NULL DEFAULT true,
  response_time    text,
  years_experience integer,
  languages        text[] NOT NULL DEFAULT '{}',
  verified         boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_artisan_profiles_category_idx ON marketplace_artisan_profiles(category);
CREATE INDEX IF NOT EXISTS marketplace_artisan_profiles_available_idx ON marketplace_artisan_profiles(available);

-- ─── marketplace_disputes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_disputes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES marketplace_orders(id),
  raised_by     uuid NOT NULL REFERENCES users(id),
  reason        text NOT NULL,
  description   text NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'open', -- open|under_review|resolved|closed
  resolution    text,
  admin_notes   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── marketplace_seller_trust_scores ─────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_seller_trust_scores (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  score                   numeric NOT NULL DEFAULT 50,
  transaction_count       integer NOT NULL DEFAULT 0,
  delivery_success_rate   numeric NOT NULL DEFAULT 100,
  response_time_hours     numeric,
  cancellation_rate       numeric NOT NULL DEFAULT 0,
  return_rate             numeric NOT NULL DEFAULT 0,
  complaint_rate          numeric NOT NULL DEFAULT 0,
  years_on_platform       numeric NOT NULL DEFAULT 0,
  repeat_customer_rate    numeric NOT NULL DEFAULT 0,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS Policies ────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_seller_trust_scores ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read active, seller can CRUD own
CREATE POLICY "products_read" ON marketplace_products FOR SELECT USING (status = 'active' OR seller_id = auth.uid()::uuid OR EXISTS(SELECT 1 FROM users WHERE users.id = seller_id AND users.auth_id = auth.uid()));
CREATE POLICY "products_insert" ON marketplace_products FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE users.id = seller_id AND users.auth_id = auth.uid()));
CREATE POLICY "products_update" ON marketplace_products FOR UPDATE USING (EXISTS(SELECT 1 FROM users WHERE users.id = seller_id AND users.auth_id = auth.uid()));

-- Storefronts: public read, owner write
CREATE POLICY "storefronts_read" ON marketplace_storefronts FOR SELECT USING (true);
CREATE POLICY "storefronts_insert" ON marketplace_storefronts FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE users.id = owner_id AND users.auth_id = auth.uid()));
CREATE POLICY "storefronts_update" ON marketplace_storefronts FOR UPDATE USING (EXISTS(SELECT 1 FROM users WHERE users.id = owner_id AND users.auth_id = auth.uid()));

-- Orders: buyer or seller can read own orders
CREATE POLICY "orders_read" ON marketplace_orders FOR SELECT USING (
  EXISTS(SELECT 1 FROM users WHERE users.id = buyer_id AND users.auth_id = auth.uid())
  OR EXISTS(SELECT 1 FROM users WHERE users.id = seller_id AND users.auth_id = auth.uid())
);
CREATE POLICY "orders_insert" ON marketplace_orders FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE users.id = buyer_id AND users.auth_id = auth.uid()));
CREATE POLICY "orders_update" ON marketplace_orders FOR UPDATE USING (
  EXISTS(SELECT 1 FROM users WHERE users.id = buyer_id AND users.auth_id = auth.uid())
  OR EXISTS(SELECT 1 FROM users WHERE users.id = seller_id AND users.auth_id = auth.uid())
);

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_read" ON marketplace_reviews FOR SELECT USING (status = 'active');
CREATE POLICY "reviews_insert" ON marketplace_reviews FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE users.id = reviewer_id AND users.auth_id = auth.uid()));

-- Artisan profiles: public read
CREATE POLICY "artisans_read" ON marketplace_artisan_profiles FOR SELECT USING (true);
CREATE POLICY "artisans_write" ON marketplace_artisan_profiles FOR ALL USING (EXISTS(SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid()));

-- Trust scores: public read, no direct write (updated by triggers/admin)
CREATE POLICY "trust_scores_read" ON marketplace_seller_trust_scores FOR SELECT USING (true);

-- Disputes: buyer or seller can read/insert
CREATE POLICY "disputes_read" ON marketplace_disputes FOR SELECT USING (
  EXISTS(SELECT 1 FROM marketplace_orders o JOIN users u ON u.id = o.buyer_id WHERE o.id = order_id AND u.auth_id = auth.uid())
  OR EXISTS(SELECT 1 FROM marketplace_orders o JOIN users u ON u.id = o.seller_id WHERE o.id = order_id AND u.auth_id = auth.uid())
);
CREATE POLICY "disputes_insert" ON marketplace_disputes FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE users.id = raised_by AND users.auth_id = auth.uid()));
