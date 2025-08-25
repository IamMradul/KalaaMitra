# Database Setup for KalaMitra

## Required Tables

You need to create these tables in your Supabase database for the app to work properly.

### 1. Profiles Table

```sql
-- Create the profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL,
  bio TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public read access to profiles (for marketplace)
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);
```

### 2. Products Table

```sql
-- Create the products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  -- Optional image features for similarity
  image_avg_r INTEGER,
  image_avg_g INTEGER,
  image_avg_b INTEGER,
  image_ahash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products" ON products
  FOR DELETE USING (auth.uid() = seller_id);
```

### 3. Cart Table
### 4. User Activity Table (for recommendations)

```sql
-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('view','search','add_to_cart','purchase','stall_view')) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  stall_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists without 'stall_view', run this migration:
-- DROP the old check and add the new one
-- NOTE: Confirm the actual constraint name in Table Editor; it may differ.
-- Example:
-- ALTER TABLE user_activity DROP CONSTRAINT IF EXISTS user_activity_activity_type_check;
-- ALTER TABLE user_activity
--   ADD CONSTRAINT user_activity_activity_type_check
--   CHECK (activity_type IN ('view','search','add_to_cart','purchase','stall_view'));

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Policies: users can insert their own activity; users can read only their activity
CREATE POLICY "Insert own activity" ON user_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Read own activity" ON user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow stall owners to read activity related to their stall and products
-- (Run these if you want sellers to see analytics for visitors)
CREATE POLICY IF NOT EXISTS "Sellers can read stall activity" ON user_activity
  FOR SELECT
  USING (stall_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Sellers can read product activity" ON user_activity
  FOR SELECT
  USING (
    product_id IS NOT NULL AND
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()
    )
  );

-- Optional helpful index
CREATE INDEX IF NOT EXISTS idx_user_activity_user_time ON user_activity(user_id, timestamp DESC);
```


```sql
-- Create the cart table
CREATE TABLE cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cart" ON cart
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert into their own cart" ON cart
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own cart" ON cart
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Users can delete from their own cart" ON cart
  FOR DELETE USING (auth.uid() = buyer_id);
```

## How to Set Up

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run each SQL block above**
4. **Check that tables are created in the Table Editor**

## Test the Connection

After setting up the tables, try signing up again. The detailed logging should now show exactly where any issues occur.

## Common Issues

1. **Table doesn't exist** - Run the SQL commands above
2. **Permission denied** - Check that RLS policies are correct
3. **Invalid role value** - Ensure role is either 'buyer' or 'seller'
4. **Foreign key constraint** - Make sure profiles table exists before products/cart

## Verify Setup

Check that you have:
- ✅ `profiles` table with correct columns
- ✅ `products` table with correct columns  
- ✅ `cart` table with correct columns
- ✅ RLS enabled on all tables
- ✅ Correct policies for each table
