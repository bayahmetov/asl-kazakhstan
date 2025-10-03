-- Fix signup error: role_change_audit constraint violation
-- When a new user signs up, auth.uid() is NULL during the trigger execution
-- We need to handle this case in the audit_role_changes function

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_audit (user_id, new_role, changed_by)
    VALUES (NEW.user_id, NEW.role, COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by)
    VALUES (NEW.user_id, OLD.role, NEW.role, COALESCE(auth.uid(), NEW.user_id));
  END IF;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.audit_role_changes() IS
'Audit trigger for role changes. Uses COALESCE(auth.uid(), NEW.user_id) to handle signup scenario where auth.uid() is NULL.';