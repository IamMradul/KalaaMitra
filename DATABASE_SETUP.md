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
