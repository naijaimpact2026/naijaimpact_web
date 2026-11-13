-- Hubnovo World: squads (teams of 3–5 for Friday team missions).
-- Idempotent. Server-only tables (the app reads/writes them with the service role).

CREATE TABLE IF NOT EXISTS public.competition_squads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  pathway         text NOT NULL CHECK (pathway IN ('career', 'enterprise')),
  name            text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  code            text NOT NULL CHECK (code ~ '^[A-Z2-9]{6}$'),
  leader_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  chat_channel_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, code)
);

CREATE TABLE IF NOT EXISTS public.competition_squad_members (
  squad_id        uuid NOT NULL REFERENCES public.competition_squads(id) ON DELETE CASCADE,
  competition_id  uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (squad_id, user_id),
  UNIQUE (competition_id, user_id)          -- one squad per player per competition
);

CREATE INDEX IF NOT EXISTS competition_squad_members_squad_idx ON public.competition_squad_members (squad_id, joined_at);

ALTER TABLE public.competition_squads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_squad_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.competition_squads, public.competition_squad_members FROM anon, authenticated;
GRANT ALL ON public.competition_squads, public.competition_squad_members TO service_role;

-- Join a squad safely: locks the squad row so two people joining at once
-- can't push it past 5, and checks the player is in the same pathway.
CREATE OR REPLACE FUNCTION public._unsafe_join_squad(
  p_squad_id uuid,
  p_user_id  uuid,
  p_max      integer DEFAULT 5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad   public.competition_squads%ROWTYPE;
  v_pathway text;
  v_count   integer;
BEGIN
  SELECT * INTO v_squad FROM public.competition_squads WHERE id = p_squad_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'squad_not_found'; END IF;

  SELECT pathway INTO v_pathway FROM public.competition_participants
  WHERE competition_id = v_squad.competition_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_joined'; END IF;
  IF v_pathway IS DISTINCT FROM v_squad.pathway THEN RAISE EXCEPTION 'wrong_pathway'; END IF;

  IF EXISTS (SELECT 1 FROM public.competition_squad_members WHERE competition_id = v_squad.competition_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'already_in_squad';
  END IF;

  SELECT count(*) INTO v_count FROM public.competition_squad_members WHERE squad_id = p_squad_id;
  IF v_count >= p_max THEN RAISE EXCEPTION 'squad_full'; END IF;

  INSERT INTO public.competition_squad_members (squad_id, competition_id, user_id)
  VALUES (p_squad_id, v_squad.competition_id, p_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public._unsafe_join_squad(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._unsafe_join_squad(uuid, uuid, integer) TO service_role;
