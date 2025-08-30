-- Fix Products Table RLS Policies
-- Run this in your Supabase SQL Editor

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;

-- Create the correct policies with proper clauses

-- Policy 1: Anyone can view products
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

-- Policy 2: Sellers can insert their own products
CREATE POLICY "Sellers can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Policy 3: Sellers can update their own products
CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (auth.uid() = seller_id);

-- Policy 4: Sellers can delete their own products
CREATE POLICY "Sellers can delete their own products" ON products
  FOR DELETE USING (auth.uid() = seller_id);

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
WHERE tablename = 'products'
ORDER BY policyname;
