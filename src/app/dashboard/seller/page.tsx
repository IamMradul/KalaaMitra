 'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Edit, Trash2, Eye, Palette, LogOut, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { extractImageFeatures } from '@/lib/image-similarity'
import AIProductForm from '@/components/AIProductForm'
import SellerAnalytics from './SellerAnalytics'
import ProfileManager from './ProfileManager'
import SellerAuctionsList from './SellerAuctionsList'

type Product = Database['public']['Tables']['products']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function SellerDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [showAIProductForm, setShowAIProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stallProfile, setStallProfile] = useState<Profile | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [addProductLoading, setAddProductLoading] = useState(false)
  const [editProductLoading, setEditProductLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('Unknown')
  const [isTestingDb, setIsTestingDb] = useState(false)
  const hasInitialized = useRef(false)
  const dbTestedRef = useRef(false)
  const productsFetchedRef = useRef(false)

  const testDatabaseConnection = async () => {
    // Prevent multiple simultaneous database tests
    if (isTestingDb || dbStatus !== 'Unknown' || dbTestedRef.current) {
      console.log('Database test already in progress or completed, skipping...')
      return
    }

    // If we have a stored session and a previous successful DB test for this user, skip retesting
    try {
      const storedSessionRaw = localStorage.getItem('km_session_json')
      const testedUserId = localStorage.getItem('km_db_test_user')
      const testedDone = localStorage.getItem('km_db_test_done')
      if (storedSessionRaw && testedDone === 'true' && testedUserId && user?.id && testedUserId === user.id) {
        console.log('Skipping DB test: found prior success for this user in localStorage')
        dbTestedRef.current = true
        setDbStatus(localStorage.getItem('km_db_status') || 'Connected - All tables accessible')
        return
      }
    } catch {}

    setIsTestingDb(true)
    try {
      console.log('Testing database connection...')
      
      // Test profiles table
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (profilesError) {
        console.error('Profiles table error:', profilesError)
        setDbStatus(`Profiles table error: ${profilesError.message}`)
        return
      }
      
      // Test products table
      const { error: productsError } = await supabase
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
      dbTestedRef.current = true
      try {
        if (user?.id) {
          localStorage.setItem('km_db_test_user', user.id)
          localStorage.setItem('km_db_test_done', 'true')
          localStorage.setItem('km_db_status', 'Connected - All tables accessible')
          localStorage.setItem('km_db_tested_at', Date.now().toString())
        }
      } catch {}
    } catch (error) {
      console.error('Database connection test failed:', error)
      setDbStatus(`Connection failed: ${error}`)
      dbTestedRef.current = true
      try {
        if (user?.id) {
          localStorage.setItem('km_db_test_user', user.id)
          localStorage.setItem('km_db_test_done', 'true')
          localStorage.setItem('km_db_status', `Connection failed`)
          localStorage.setItem('km_db_tested_at', Date.now().toString())
        }
      } catch {}
    } finally {
      setIsTestingDb(false)
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
        setStallProfile(profile)
        // Only fetch products if not already fetched
        if (!productsFetchedRef.current) {
          fetchProducts()
        } else {
          console.log('Products already fetched, skipping...')
        }
        
        // Only test database connection once per session/user
        if (!hasInitialized.current && dbStatus === 'Unknown' && !dbTestedRef.current) {
          testDatabaseConnection()
          hasInitialized.current = true
        }
      }
    }

    // Cleanup function to reset loading states when component unmounts
    return () => {
      setProductsLoading(false)
      setAddProductLoading(false)
      setEditProductLoading(false)
    }
  }, [user, profile, loading, router, dbStatus])

  // Remove the problematic useEffect that causes infinite loops

  const fetchProducts = async () => {
    if (!user) return
    
    // Prevent multiple simultaneous executions
    if (productsLoading) {
      console.log('Products fetch already in progress, skipping...')
      return
    }

    setProductsLoading(true)
    try {
      console.log('Fetching products for user:', user.id)
      
      // Test basic Supabase connection first
      console.log('Testing basic Supabase connection...')
      try {
        const { data: testData, error: testError } = await supabase
          .from('products')
          .select('count')
          .limit(1)
        
        if (testError) {
          console.error('Basic connection test failed:', testError)
          throw testError
        }
        console.log('Basic connection test successful')
      } catch (testErr) {
        console.error('Basic connection test error:', testErr)
        throw testErr
      }
      
      // Test simple query without user filter first
      console.log('Testing simple products query...')
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('products')
          .select('id, title')
          .limit(5)
        
        if (simpleError) {
          console.error('Simple query failed:', simpleError)
          throw simpleError
        }
        console.log('Simple query successful, found:', simpleData?.length || 0, 'products')
      } catch (simpleErr) {
        console.error('Simple query error:', simpleErr)
        throw simpleErr
      }
      
      // Now try the actual user-specific query
      console.log('Testing user-specific query...')
      const fetchPromise = supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
      
      console.log('Supabase query created, awaiting response...')
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Products fetch timeout after 10 seconds')), 10000)
      })
      
      console.log('Starting race between fetch and timeout...')
      const raced = await Promise.race([fetchPromise, timeoutPromise])
      console.log('Race completed, processing result...')
      const { data, error } = raced as { data: Product[] | null; error: { message: string; details?: string; hint?: string; code?: string } | null }

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      console.log('Products fetched successfully:', data?.length || 0, 'products')
      setProducts(data || [])
      productsFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      productsFetchedRef.current = true
    } finally {
      setProductsLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setStallProfile(updatedProfile)
  }

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      alert('User not authenticated')
      return
    }

    // Prevent multiple simultaneous operations
    if (addProductLoading) {
      console.log('Add product operation already in progress, skipping...')
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
      console.log('User authenticated:', !!user)
      console.log('Profile exists:', !!profile)
      console.log('Product data:', { title, category, description, price, imageUrl })
      
      // Extract image features (best-effort)
      let features: { avgColor: { r: number; g: number; b: number }; aHash: string } | null = null
      if (imageUrl) {
        try {
          features = await extractImageFeatures(imageUrl)
        } catch {}
      }
      console.log('Proceeding with insert...')
      console.log('Insert data:', {
        seller_id: user.id,
        title,
        category,
        description,
        price,
        image_url: imageUrl || null,
      })
      
      // Add timeout to prevent hanging
      const insertPromise = supabase
        .from('products')
        .insert([
          {
            seller_id: user.id,
            title,
            category,
            description,
            price,
            image_url: imageUrl || null,
            // New optional columns if present in DB
            image_avg_r: features?.avgColor.r ?? null,
            image_avg_g: features?.avgColor.g ?? null,
            image_avg_b: features?.avgColor.b ?? null,
            image_ahash: features?.aHash ?? null,
          },
        ])
        .select()
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database insert timeout after 10 seconds')), 10000)
      })
      
      const raced = await Promise.race([insertPromise, timeoutPromise])
      const { data, error } = raced as { data: Product[] | null; error: { message: string; details?: string; hint?: string; code?: string } | null }

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
      
      // Reset form safely before closing modal
      const formElement = (e.currentTarget as HTMLFormElement | null)
      if (formElement && typeof formElement.reset === 'function') {
        formElement.reset()
      }
      
      fetchProducts()
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

  const handleEditProduct = async (productId: string, formData: FormData) => {
    if (!user) return

    setEditProductLoading(true)
    
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const imageUrl = formData.get('imageUrl') as string

    // Basic validation
    if (!title || !category || !description || isNaN(price) || price <= 0) {
      alert('Please fill in all required fields with valid values.')
      setEditProductLoading(false)
      return
    }

    try {
      console.log('Updating product:', { productId, title, category, description, price, imageUrl })
      
      const { error } = await supabase
        .from('products')
        .update({
          title,
          category,
          description,
          price,
          image_url: imageUrl || null,
        })
        .eq('id', productId)

      if (error) {
        console.error('Error updating product:', error)
        alert(`Failed to update product: ${error.message}`)
        throw error
      }

      console.log('Product updated successfully')
      alert('Product updated successfully!')
      
      setEditingProduct(null)
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      if (error instanceof Error) {
        alert(`Failed to update product: ${error.message}`)
      } else {
        alert('Failed to update product. Please try again.')
      }
    } finally {
      setEditProductLoading(false)
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
          <p className="text-[var(--muted)]">Loading dashboard...</p>
          <p className="text-sm text-[var(--muted)] mt-2">Please wait while we verify your account</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)]">Access denied or user not found</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            User: {user ? 'Yes' : 'No'} | Profile: {profile ? 'Yes' : 'No'} | Role: {profile?.role}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen heritage-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
            <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4">{t('seller.title')}</h1>
          <p className="text-lg text-[var(--muted)]">{t('seller.subtitle')}</p>
          
        </motion.div>

        {/* Profile Manager Section */}
        {stallProfile && (
          <ProfileManager 
            profile={stallProfile} 
            products={products} 
            onProfileUpdate={handleProfileUpdate} 
          />
        )}

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
              className="card-glass rounded-xl p-6 mb-8 border border-[var(--border)]"
        >
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">{t('seller.quickActions')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--text)] mb-2">{t('seller.productManagement')}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAIProductForm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('seller.addProductWithAI')}
                </button>
                <div className="text-xs text-[var(--muted)] text-center">{t('seller.addProductHint')}</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text)] mb-2">{t('seller.viewYourStall')}</h3>
              <Link
                href={`/stall/${user.id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('seller.viewPublicStall')}
              </Link>
              <div className="text-xs text-[var(--muted)] text-center mt-2">{t('seller.viewStallHint')}</div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
              className="card-glass rounded-xl p-6 mb-8 border border-[var(--border)]"
        >
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">{t('seller.analyticsTitle')}</h2>
          <SellerAnalytics sellerId={user.id} />
        </motion.div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
              className="card-glass rounded-xl p-6 border border-[var(--border)]"
        >
          {/* Auction creation form for sellers */}
          <div className="mb-6 border p-4 rounded bg-[var(--bg-2)] border-[var(--border)]">
            <h3 className="font-semibold mb-2">{t('auction.title')} - {t('common.save')}</h3>
                <div className="text-sm text-[var(--muted)] mb-3">{t('product.byAuthor', { name: profile?.name || '' })}</div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget as HTMLFormElement)
              const product_id = fd.get('product_id') as string
              const starting_price = Number(fd.get('starting_price'))
              const starts_at_raw = fd.get('starts_at') as string || ''
              const ends_at_raw = fd.get('ends_at') as string || ''
              // Convert local datetime-local (no timezone) to ISO string (UTC) to avoid timezone drift
              const starts_at = starts_at_raw ? new Date(starts_at_raw).toISOString() : null
              const ends_at = ends_at_raw ? new Date(ends_at_raw).toISOString() : null
              if (!product_id || !starting_price) return alert(t('auction.invalidAmount'))
              try {
                const res = await fetch('/api/auction', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ product_id, starting_price, starts_at, ends_at, seller_id: user?.id }) })
                const j = await res.json()
                if (!res.ok) throw new Error(j.error || 'Failed')
                alert(t('auction.created'))
                // Refresh products and seller auctions
                fetchProducts()
                // optional: refresh SellerAuctionsList by emitting event or refetch via state; simple approach: reload page
                // location.reload()
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                alert(t('errors.general') + ': ' + message)
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-[var(--muted)]">{t('product.byAuthor')}</label>
                  <select name="product_id" className="border p-2 rounded w-full bg-[var(--bg-2)] text-[var(--text)] border-[var(--border)]" required>
                    <option value="">Select product</option>
                    {products.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted)]">{t('product.addToCart')}</label>
                  <input name="starting_price" type="number" placeholder={t('auction.enterBid')} className="border p-2 rounded w-full bg-[var(--bg-2)] text-[var(--text)] border-[var(--border)]" required />
                </div>
                <div className="col-span-1 md:col-span-3 grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--muted)]">Starts at</label>
                    <input name="starts_at" type="datetime-local" className="border p-2 rounded w-full bg-[var(--bg-2)] text-[var(--text)] border-[var(--border)]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)]">Ends at</label>
                    <input name="ends_at" type="datetime-local" className="border p-2 rounded w-full bg-[var(--bg-2)] text-[var(--text)] border-[var(--border)]" />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{t('auction.created')}</button>
                </div>
              </div>
            </form>
          </div>
          {/* Seller's Auctions Management */}
          <div className="mb-6 border p-4 rounded bg-[var(--bg-2)] border-[var(--border)]">
            <h3 className="font-semibold mb-2">Your Auctions</h3>
            <SellerAuctionsList sellerId={user.id} />
          </div>
          <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-[var(--text)]">{t('seller.yourProducts')}</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAIProductForm(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 mr-2" />
        {t('seller.addProductWithAI')}
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    signOut()
                  }
                }}
                className="flex items-center px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-2)] transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
        {t('navigation.signout')}
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
        <p className="text-[var(--muted)] text-lg">{t('seller.loadingProducts')}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
        <Palette className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
        <p className="text-[var(--muted)] text-lg">{t('seller.noProducts')}</p>
        <p className="text-[var(--muted)]">{t('seller.startByAddingFirst')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
          className="card border overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
          <div className="h-48 bg-[var(--bg-2)] flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Palette className="w-12 h-12 text-[var(--muted)]" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--text)] mb-2">{product.title}</h3>
                    <p className="text-sm text-[var(--muted)] mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-orange-500">₹{product.price}</p>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                        }}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--text)] hover:bg-[var(--bg-2)] transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm border border-red-300 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>



        {/* Edit Product Modal (AI Unified) */}
        {editingProduct && (
          <AIProductForm
            initialData={{
              title: editingProduct.title || undefined,
              category: editingProduct.category || undefined,
              description: editingProduct.description || undefined,
              price: editingProduct.price || undefined,
              imageUrl: editingProduct.image_url || undefined,
            }}
            onSubmit={async (formData) => {
              try {
                await handleEditProduct(editingProduct.id, formData)
                setEditingProduct(null)
              } catch (error) {
                console.error('Error saving edited product:', error)
                // keep modal open on error
              }
            }}
            onCancel={() => setEditingProduct(null)}
            loading={editProductLoading}
          />
        )}

        {/* AI Product Form Modal */}
        {showAIProductForm && (
          <AIProductForm
            onSubmit={async (formData) => {
              try {
                // Convert FormData to the format expected by handleAddProduct
                const form = document.createElement('form')
                formData.forEach((value, key) => {
                  const input = document.createElement('input')
                  input.name = key
                  input.value = value as string
                  form.appendChild(input)
                })
                
                // Create a synthetic event
                const syntheticEvent = {
                  preventDefault: () => {},
                  currentTarget: form
                } as React.FormEvent<HTMLFormElement>
                
                await handleAddProduct(syntheticEvent)
                setShowAIProductForm(false)
              } catch (error) {
                console.error('Error submitting AI form:', error)
                // Don't close the form if there's an error
              }
            }}
            onCancel={() => setShowAIProductForm(false)}
            loading={addProductLoading}
          />
        )}
      </div>
    </div>
  )
}
