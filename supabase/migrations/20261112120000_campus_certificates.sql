-- Hubnovo World: stage certificates. Issued once per player per stage when the
-- stage is passed (score 60+ and the stage finale passed). The holder name and
-- campus are snapshots, so a certificate never changes after it is issued.
-- Verified publicly at https://hubnovo.com/certificates/<code>.

CREATE TABLE IF NOT EXISTS public.competition_certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE CHECK (code ~ '^[A-Z2-9]{12}$'),
  competition_id   uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stage            integer NOT NULL CHECK (stage >= 1),
  pathway          text NOT NULL CHECK (pathway IN ('career', 'enterprise')),
  score            integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  holder_name      text NOT NULL,
  institution_name text,
  issued_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz,
  UNIQUE (competition_id, user_id, stage)
);

CREATE INDEX IF NOT EXISTS competition_certificates_user_idx ON public.competition_certificates (user_id, issued_at);

ALTER TABLE public.competition_certificates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.competition_certificates FROM anon, authenticated;
GRANT ALL ON public.competition_certificates TO service_role;
