-- element_id in exercise content can be timestamp-sized; INT overflows (Postgres 22003)
ALTER TABLE public.duel_attempts
  ALTER COLUMN element_id TYPE BIGINT USING element_id::BIGINT;
