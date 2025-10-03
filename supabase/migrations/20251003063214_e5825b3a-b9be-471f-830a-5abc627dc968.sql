-- Phase 1: Remove Overly Permissive RLS Policies (Security Fix)
-- These policies grant too broad access and create security vulnerabilities
-- Fine-grained policies remain in place to provide proper role-based access

-- 1. Remove overly broad profile access policy
-- Problem: Allows ANY authenticated user to see ALL profile emails
-- What remains: "Users can view their own complete profile" + "Admins can view all profiles"
DROP POLICY IF EXISTS "Require authentication for profile access" ON public.profiles;

-- 2. Remove overly broad messages access policy  
-- Problem: Allows ANY authenticated user to read ALL contact form submissions
-- What remains: "Users can view only their own messages" + "Admins can view all messages"
DROP POLICY IF EXISTS "Require authentication to view messages" ON public.messages;

-- 3. Remove overly broad lessons access policy
-- Problem: Exposes lesson storage keys to unauthenticated users
-- What remains: "Students, course instructors and assigned instructors can view" (enrollment-based)
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;