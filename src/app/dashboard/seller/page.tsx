'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Sparkles, Camera, BookOpen, Palette, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Product = Database['public']['Tables']['products']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function SellerDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stallProfile, setStallProfile] = useState<Profile | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [addProductLoading, setAddProductLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('Unknown')

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      
      // Test profiles table
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (profilesError) {
        console.error('Profiles table error:', profilesError)
        setDbStatus(`Profiles table error: ${profilesError.message}`)
        return
      }
      
      // Test products table
      const { data: productsTest, error: productsError } = await supabase
        .from('products')
        .select('count')
        .limit(1)
      
      if (productsError) {
        console.error('Products table error:', productsError)
        setDbStatus(`Products table error: ${productsError.message}`)
        return
      }
      
      console.log('Database connection successful')
      setDbStatus('Connected - All tables accessible')
    } catch (error) {
      console.error('Database connection test failed:', error)
      setDbStatus(`Connection failed: ${error}`)
    }
  }

  useEffect(() => {
    console.log('Dashboard useEffect - loading:', loading, 'user:', !!user, 'profile:', !!profile)
    
    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to signin')
        router.push('/auth/signin')
      } else if (profile?.role !== 'seller') {
        console.log('User is not seller, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.log('User is seller, fetching products and setting stall profile')
        fetchProducts()
        setStallProfile(profile)
        testDatabaseConnection() // Test database connection
      }
    }
  }, [user, profile, loading, router])

  const fetchProducts = async () => {
    if (!user) return

    setProductsLoading(true)
    try {
      console.log('Fetching products for user:', user.id)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      console.log('Products fetched successfully:', data?.length || 0, 'products')
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      alert('User not authenticated')
      return
    }

    setAddProductLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const imageUrl = formData.get('imageUrl') as string

    // Basic validation
    if (!title || !category || !description || isNaN(price) || price <= 0) {
      alert('Please fill in all required fields with valid values.')
      setAddProductLoading(false)
      return
    }

    try {
      console.log('=== ADDING PRODUCT ===')
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      console.log('Profile role:', profile?.role)
      console.log('Product data:', { title, category, description, price, imageUrl })
      
      // First, let's check if the products table exists and we can access it
      console.log('Testing products table access...')
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Products table access error:', testError)
        alert(`Database error: ${testError.message}. Please check if the products table exists.`)
        return
      }
      
      console.log('Products table accessible, proceeding with insert...')
      
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            seller_id: user.id,
            title,
            category,
            description,
            price,
            image_url: imageUrl || null,
          },
        ])
        .select()

      if (error) {
        console.error('Error adding product:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Provide specific error messages based on error type
        if (error.code === '23503') {
          alert('Foreign key constraint failed. Your profile may not exist in the database.')
        } else if (error.code === '42P01') {
          alert('Products table does not exist. Please run the database setup SQL.')
        } else if (error.code === '42501') {
          alert('Permission denied. Check your Row Level Security policies.')
        } else {
          alert(`Failed to add product: ${error.message}`)
        }
        throw error
      }

      console.log('Product added successfully:', data)
      alert('Product added successfully!')
      
      setShowAddProduct(false)
      fetchProducts()
      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error('Error adding product:', error)
      if (error instanceof Error) {
        alert(`Failed to add product: ${error.message}`)
      } else {
        alert('Failed to add product. Please try again.')
      }
    } finally {
      setAddProductLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait while we verify your account</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied or user not found</p>
          <p className="text-sm text-gray-400 mt-2">
            User: {user ? 'Yes' : 'No'} | Profile: {profile ? 'Yes' : 'No'} | Role: {profile?.role}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Seller Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage your virtual stall and products
          </p>
          
          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>User ID: {user?.id}</p>
            <p>Profile Role: {profile?.role}</p>
            <p>Products Count: {products.length}</p>
            <p>Products Loading: {productsLoading ? 'Yes' : 'No'}</p>
            <p>Database Status: {dbStatus}</p>
            <button
              onClick={testDatabaseConnection}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Test Database Connection
            </button>
          </div>
        </motion.div>

        {/* Stall Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-orange-200"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Virtual Stall</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Stall Information</h3>
              <p className="text-gray-600 mb-2">
                <strong>Name:</strong> {stallProfile?.name}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Bio:</strong> {stallProfile?.bio || 'No bio added yet'}
              </p>
              <Link
                href={`/stall/${user.id}`}
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Public Stall
              </Link>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">AI Tools (Coming Soon)</h3>
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Enhance Photo with AI
                </button>
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Story with AI
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-200"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Your Products</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    signOut()
                  }
                }}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {productsLoading ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-500 text-lg">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products yet</p>
              <p className="text-gray-400">Start by adding your first product</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Palette className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-orange-600">${product.price}</p>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Product</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title
                  </label>
                  <input
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter product title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Pottery, Textiles, Jewelry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe your product"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    name="imageUrl"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addProductLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addProductLoading ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
