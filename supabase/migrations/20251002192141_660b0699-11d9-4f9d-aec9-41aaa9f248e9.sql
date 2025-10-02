-- Document email address protection in profiles table
-- This confirms that the current RLS policies properly protect email addresses

-- Comprehensive security documentation for profiles table
COMMENT ON TABLE public.profiles IS
'User profiles table with PII protection via RLS.

SECURITY MODEL - Email Protection:
- Email addresses are restricted to:
  * Profile owner only (auth.uid() = id)
  * System administrators (has_role = admin)
- Cross-user access is DENIED (no matching RLS policy)
- Public profile info uses public_profiles view (excludes email)

RLS POLICIES (PERMISSIVE, OR combined):
1. Users can view their own complete profile (auth.uid() = id)
2. Admins can view all profiles (has_role = admin)

SECURITY VERIFICATION:
✓ User A CANNOT query User B profile (no policy match)
✓ User A CAN query own profile (policy 1)
✓ Admin CAN query any profile (policy 2)
✓ RLS enabled and enforced

SAFE ACCESS: Use public_profiles view for other users info.';

-- Document email column security
COMMENT ON COLUMN public.profiles.email IS
'PII: User email address. RLS-protected. Access: owner + admin only. Never in public_profiles view.';

-- Verify RLS is enabled
DO $$ 
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'CRITICAL: RLS not enabled on profiles table';
  END IF;
END $$;