'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ShoppingCart, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/lib/activity'
import { hammingDistanceHex as hammingHex } from '@/lib/image-similarity'
import { Database } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type ProductBase = Database['public']['Tables']['products']['Row']
type ProductWithFeatures = ProductBase & {
  image_avg_r?: number | null
  image_avg_g?: number | null
  image_avg_b?: number | null
  image_ahash?: string | null
}
type Product = ProductBase & {
  seller: {
    name: string
  }
}

export default function Marketplace() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLogTimer, setSearchLogTimer] = useState<NodeJS.Timeout | null>(null)
  const [recommended, setRecommended] = useState<ProductBase[]>([])
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    // Handle Google session from OAuth callback
    const googleSession = searchParams.get('google_session')
    if (googleSession) {
      try {
        const googleUser = JSON.parse(decodeURIComponent(googleSession))
        localStorage.setItem('googleUserSession', JSON.stringify(googleUser))
        console.log('Google session stored:', googleUser)
        
        // Reload the page to trigger auth context update
        window.location.href = window.location.pathname
        return
      } catch (error) {
        console.error('Error parsing Google session:', error)
      }
    }

    fetchProducts()
  }, [searchParams])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])]
      setCategories(uniqueCategories)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  // Debounced search logging
  useEffect(() => {
    if (!user) return
    if (!searchTerm) return
    if (searchLogTimer) clearTimeout(searchLogTimer)
    const t = setTimeout(() => {
      logActivity({ userId: user.id, activityType: 'search', query: searchTerm })
    }, 800)
    setSearchLogTimer(t)
    return () => clearTimeout(t)
  }, [user, searchTerm])

  // Fetch recommendations (client-side to leverage user session for RLS)
  useEffect(() => {
    const fetchRecs = async () => {
      if (!user) return
      try {
        setRecLoading(true)
        const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
        const { data: activities, error: actErr } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', thirtyDaysAgo)

        if (actErr) {
          setRecommended([])
          return
        }

        if (!activities || activities.length === 0) {
          setRecommended([])
          return
        }

        const { data: allProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')

        if (prodErr || !allProducts) {
          setRecommended([])
          return
        }

        const scores = new Map<string, number>()
        const viewedIds = new Set<string>()
        const viewedCategories = new Set<string>()
        const productById = new Map<string, ProductWithFeatures>()
        for (const p of allProducts as ProductWithFeatures[]) productById.set(p.id, p)

        for (const a of activities) {
          if (a.activity_type === 'view' && a.product_id) {
            // Track viewed product and its category
            viewedIds.add(a.product_id)
            const vp = productById.get(a.product_id)
            if (vp?.category) viewedCategories.add(String(vp.category))
          }
          if (a.activity_type === 'search' && a.query) {
            const q = String(a.query).toLowerCase()
            for (const p of allProducts) {
              const title = (p.title || '').toLowerCase()
              const desc = (p.description || '').toLowerCase()
              const cat = (p.category || '').toLowerCase()
              if (title.includes(q) || desc.includes(q) || cat.includes(q)) {
                scores.set(p.id, (scores.get(p.id) || 0) + 2)
              }
            }
          }
        }

        // Category-based: boost products in categories of viewed items, excluding the exact viewed items
        if (viewedCategories.size > 0) {
          for (const p of allProducts) {
            if (viewedIds.has(p.id)) continue
            if (p.category && viewedCategories.has(String(p.category))) {
              scores.set(p.id, (scores.get(p.id) || 0) + 2)
            }
          }
        }

        // Content-based similarity: title/description token overlap with viewed products
        const viewedProducts = [...viewedIds]
          .map(id => productById.get(id))
          .filter((p): p is ProductWithFeatures => Boolean(p))
        const tokenize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
        const toSet = (arr: string[]) => new Set(arr)
        const jaccard = (a: Set<string>, b: Set<string>) => {
          let inter = 0
          for (const t of a) if (b.has(t)) inter++
          const uni = a.size + b.size - inter
          return uni === 0 ? 0 : inter / uni
        }
        for (const p of allProducts as ProductWithFeatures[]) {
          if (viewedIds.has(p.id)) continue
          let bestSim = 0
          for (const vp of viewedProducts) {
            const a = toSet([...tokenize(vp.title || ''), ...tokenize(vp.description || '')])
            const b = toSet([...tokenize(p.title || ''), ...tokenize(p.description || '')])
            const sim = jaccard(a, b)
            if (sim > bestSim) bestSim = sim
          }
          if (bestSim > 0) {
            // scale similarity to points (0..1 -> 0..3)
            const bonus = Math.min(3, Math.max(0, bestSim * 3))
            scores.set(p.id, (scores.get(p.id) || 0) + bonus)
          }
        }

        // Image-based similarity (fast): average color distance + aHash Hamming distance
        const colorOf = (x: ProductWithFeatures | undefined | null) => x && x.image_avg_r != null ? { r: x.image_avg_r as number, g: x.image_avg_g as number, b: x.image_avg_b as number } : null
        const aHashOf = (x: ProductWithFeatures | undefined | null) => x && x.image_ahash ? String(x.image_ahash) : null
        for (const p of allProducts as ProductWithFeatures[]) {
          if (viewedIds.has(p.id)) continue
          const pc = colorOf(p)
          const ph = aHashOf(p)
          if (!pc && !ph) continue
          let colorScore = 0
          let hashScore = 0
          for (const vp of viewedProducts) {
            const vc = colorOf(vp)
            const vh = aHashOf(vp)
            if (pc && vc) {
              const dr = pc.r - vc.r, dg = pc.g - vc.g, db = pc.b - vc.b
              const dist = Math.sqrt(dr*dr + dg*dg + db*db) // 0..441
              const sim = Math.max(0, 1 - dist / 441)
              colorScore = Math.max(colorScore, sim)
            }
            if (ph && vh) {
              const hd = hammingHex(ph, vh)
              const sim = Math.max(0, 1 - hd / 64)
              hashScore = Math.max(hashScore, sim)
            }
          }
          const combined = (colorScore * 1.5) + (hashScore * 1.5) // weight up to 3 points
          if (combined > 0) {
            scores.set(p.id, (scores.get(p.id) || 0) + combined)
          }
        }

        // "Exact same one in different price": boost items with very similar titles in same category but different id
        const normalizeTitle = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
        const viewedTitleNorms = new Set(viewedProducts.map(vp => normalizeTitle(vp.title)))
        for (const p of allProducts as ProductWithFeatures[]) {
          if (viewedIds.has(p.id)) continue
          const nt = normalizeTitle(p.title)
          if (viewedTitleNorms.has(nt)) {
            scores.set(p.id, (scores.get(p.id) || 0) + 2)
          }
        }

        if (scores.size === 0) {
          setRecommended([])
          return
        }

        const ranked = [...(allProducts as ProductWithFeatures[])]
          .filter(p => scores.has(p.id) && !viewedIds.has(p.id))
          .sort((a: ProductWithFeatures, b: ProductWithFeatures) => {
            const sa = scores.get(a.id) || 0
            const sb = scores.get(b.id) || 0
            if (sb !== sa) return sb - sa
            return (b.created_at || '').localeCompare(a.created_at || '')
          })
          .slice(0, 12)

        setRecommended(ranked as ProductBase[])
      } finally {
        setRecLoading(false)
      }
    }
    fetchRecs()
  }, [user])

  const addToCart = async (productId: string) => {
    // TODO: Implement cart functionality
    alert('Cart functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full"
        />
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
          <h1 className="text-4xl font-bold heritage-title mb-4">
            Artisan Marketplace
          </h1>
          <p className="text-lg text-[var(--heritage-brown)]">
            Discover unique handcrafted treasures from talented artisans
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="heritage-card p-6 mb-8 border border-heritage-gold/40"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products, categories, or artisans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <span className="text-orange-400 text-4xl">🎨</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-orange-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <p className="text-xs text-gray-500 mb-3">by {product.seller?.name || 'Unknown Artisan'}</p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-orange-600">₹{product.price}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addToCart(product.id)}
                          className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                          title="Add to Wishlist"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center text-gray-600"
        >
          Showing {filteredProducts.length} of {products.length} products
        </motion.div>

        {/* Recommendations */}
        {user && recommended.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Because you viewed similar products
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl-grid-cols-4 gap-6">
              {recommended.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <span className="text-orange-400 text-4xl">🎨</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-orange-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-orange-600">₹{product.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
