-- Fix RLS Policies for Google OAuth
-- Run this in your Supabase SQL Editor

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;

-- Create the correct policies
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- IMPORTANT: This policy allows the service role to bypass RLS
-- This is necessary for Google OAuth to work properly
CREATE POLICY "Service role bypass" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';
