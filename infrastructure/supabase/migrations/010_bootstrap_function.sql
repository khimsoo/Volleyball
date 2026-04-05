-- ─── Bootstrap Coach Organization ────────────────────────────────────────────
-- Called on first sign-in to create the coach's org and user profile atomically.

CREATE OR REPLACE FUNCTION public.bootstrap_coach_organization(
  p_first_name TEXT,
  p_last_name  TEXT,
  p_org_name   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID;
  v_org_id        UUID;
  v_user_email    TEXT;
BEGIN
  -- Get the calling user's id and email from auth.users
  v_user_id    := auth.uid();
  v_user_email := (SELECT email FROM auth.users WHERE id = v_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotent: if user already has a profile, return existing org
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = v_user_id;
    RETURN jsonb_build_object('organization_id', v_org_id, 'created', false);
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  -- Create user profile linked to auth.users
  INSERT INTO public.users (id, organization_id, role, first_name, last_name, email)
  VALUES (v_user_id, v_org_id, 'coach', p_first_name, p_last_name, v_user_email);

  RETURN jsonb_build_object('organization_id', v_org_id, 'created', true);
END;
$$;

-- Only the authenticated user themselves can call this
REVOKE ALL ON FUNCTION public.bootstrap_coach_organization(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_coach_organization(TEXT, TEXT, TEXT) TO authenticated;
