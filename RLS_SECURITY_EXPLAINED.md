# Row Level Security (RLS) Explanation for Profiles Table

## How Postgres RLS Works

Row Level Security in PostgreSQL uses **permissive policies** by default, which work with **OR logic**:
- If **ANY** policy allows access → User gets access ✅
- If **NO** policy allows access → User is denied ❌

**Important**: You do NOT need explicit "DENY" policies. If no "ALLOW" policy matches, access is automatically denied.

## Current Profiles Table Security

### RLS Policies on `profiles` Table

1. **"Users can view their own complete profile"**
   - Condition: `auth.uid() = id`
   - Effect: Users can see their own profile including email ✅

2. **"Admins can view all profiles"**
   - Condition: `has_role(auth.uid(), 'admin')`
   - Effect: Admins can see all profiles including emails ✅

3. **Implicit Denial for Everyone Else**
   - If neither policy matches → Access denied ❌
   - Regular users CANNOT see other users' emails

### Test Scenarios

#### Scenario 1: Student A tries to view Student A's profile
```sql
SELECT * FROM profiles WHERE id = 'student-a-id';
```
- Policy 1 matches: ✅ `auth.uid() = id` (Student A's ID)
- Result: **ALLOWED** - Student A sees their own profile with email

#### Scenario 2: Student A tries to view Student B's profile
```sql
SELECT * FROM profiles WHERE id = 'student-b-id';
```
- Policy 1 fails: ❌ `auth.uid() ≠ id` (Different IDs)
- Policy 2 fails: ❌ Student A is not admin
- Result: **DENIED** - No data returned

#### Scenario 3: Admin views any profile
```sql
SELECT * FROM profiles WHERE id = 'any-user-id';
```
- Policy 2 matches: ✅ `has_role(auth.uid(), 'admin')`
- Result: **ALLOWED** - Admin sees all profiles with emails

#### Scenario 4: Instructor tries to view student profile
```sql
SELECT * FROM profiles WHERE id = 'student-id';
```
- Policy 1 fails: ❌ `auth.uid() ≠ id` (Different IDs)
- Policy 2 fails: ❌ Instructor is not admin
- Result: **DENIED** - No email exposed

## Public Profiles View

For scenarios where you need to show user information WITHOUT exposing emails:

### `public_profiles` View
```sql
SELECT * FROM public_profiles WHERE id = 'any-user-id';
```

**Exposed fields:**
- ✅ `id`
- ✅ `full_name`
- ✅ `username`
- ✅ `avatar_url`
- ✅ `created_at`

**Protected fields:**
- ❌ `email` (NOT included in view)
- ❌ `role` (Fetched from separate `user_roles` table)

**Access:** Available to both authenticated and anonymous users via `security_invoker=on`

## Why This is Secure

### Defense in Depth

1. **Column-Level Protection**
   - `public_profiles` view excludes email column
   - Email only accessible through `profiles` table

2. **Row-Level Protection**
   - RLS policies restrict WHO can query
   - Even admins must be authenticated

3. **Application-Level Protection**
   - Frontend uses `public_profiles` for displaying others
   - Frontend uses `profiles` only for own profile

4. **Role-Based Protection**
   - Roles stored in separate `user_roles` table
   - Admin checks use security definer function
   - Prevents privilege escalation

## Common Security Questions

### Q: Can't users just bypass RLS in the frontend?
**A:** No. RLS is enforced at the **database level**, not the frontend. Even if someone modifies JavaScript in their browser, Postgres will still deny the query.

### Q: What if someone queries the database directly?
**A:** RLS is enforced for **all queries**, including direct database connections. Only the database superuser can bypass RLS.

### Q: Why not use explicit DENY policies?
**A:** Postgres RLS doesn't work that way. PERMISSIVE policies (default) use OR logic. Adding DENY policies requires RESTRICTIVE policies, which use AND logic and are more complex. The current approach is simpler and equally secure.

### Q: Can users enumerate other user IDs?
**A:** Even if they can guess IDs, they can't retrieve email addresses:
- Querying `profiles` with another user's ID returns empty
- Querying `public_profiles` returns only non-sensitive data

### Q: What about API endpoints?
**A:** Supabase API respects RLS. All queries go through Postgres with the authenticated user's credentials. The API cannot bypass RLS.

## Testing RLS Security

### How to Test

1. **Create test users:**
   - Student A
   - Student B  
   - Instructor C
   - Admin D

2. **Test from each user's session:**
   ```javascript
   // As Student A
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', 'student-b-id');
   
   // Result: Empty array (denied by RLS)
   ```

3. **Verify public_profiles works:**
   ```javascript
   // As Student A
   const { data } = await supabase
     .from('public_profiles')
     .select('*')
     .eq('id', 'student-b-id');
   
   // Result: { id, full_name, username, avatar_url, created_at }
   // No email field!
   ```

4. **Verify admin access:**
   ```javascript
   // As Admin D
   const { data } = await supabase
     .from('profiles')
     .select('*');
   
   // Result: All profiles including emails
   ```

## Summary

✅ **Emails are protected** - Only visible to profile owner and admins
✅ **Public info is accessible** - Via `public_profiles` view without emails
✅ **RLS is enforced** - At database level, cannot be bypassed
✅ **No explicit DENY needed** - Default behavior denies unmatched queries
✅ **Defense in depth** - Multiple layers of protection

The security scanner flagging this is a false positive based on expecting explicit DENY policies, which aren't necessary in the Postgres PERMISSIVE policy model.
