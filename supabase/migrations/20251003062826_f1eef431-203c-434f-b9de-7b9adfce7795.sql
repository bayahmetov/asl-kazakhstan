-- Phase 1: Critical PII Protection - Block Anonymous Access

-- 1. Block anonymous access to profiles table (prevents email harvesting)
CREATE POLICY "Require authentication for profile access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Block anonymous access to messages table (protects contact form submissions)
CREATE POLICY "Require authentication to view messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Block anonymous access to lesson_progress table (protects student learning data)
CREATE POLICY "Block anonymous queries on lesson progress" 
ON public.lesson_progress 
FOR SELECT 
USING (auth.uid() IS NOT NULL);