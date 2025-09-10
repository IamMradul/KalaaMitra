'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/lib/activity'
import { ShoppingCart, Heart, ArrowLeft, Star, User } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/LanguageProvider'
import { translateText } from '@/lib/translate'
import dynamic from 'next/dynamic'

const AuctionWidget = dynamic(() => import('@/components/AuctionWidget'), { ssr: false })

type Product = Database['public']['Tables']['products']['Row'] & {
  seller: {
    name: string
    bio: string | null
    profile_image: string | null
    store_description: string | null
  }
}

export default function ProductDetail() {
  const { t, i18n } = useTranslation()
  const { currentLanguage } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [hasActiveAuction, setHasActiveAuction] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id, currentLanguage])

  useEffect(() => {
    if (user && product?.id) {
      logActivity({ userId: user.id, activityType: 'view', productId: product.id })
    }
  }, [user, product?.id])

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(name, bio, profile_image, store_description)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      // Translate dynamic fields to current language (client-side)
      const lang = currentLanguage
      const translated = { ...data }
      translated.title = await translateText(data.title || '', lang)
      translated.category = await translateText(data.category || '', lang)
      translated.description = await translateText(data.description || '', lang)
      if (translated.seller) {
        translated.seller = { ...translated.seller }
        translated.seller.name = await translateText(data.seller?.name || '', lang)
        translated.seller.bio = await translateText(data.seller?.bio || '' , lang)
        translated.seller.store_description = await translateText(data.seller?.store_description || '' , lang)
      }
      setProduct(translated as Product)
      // check if product has an active auction
      try {
        const { data: a } = await supabase.from('auctions').select('*').eq('product_id', productId).in('status', ['scheduled','running']).limit(1)
        setHasActiveAuction((a && a.length > 0) || false)
      } catch (err) {
        setHasActiveAuction(false)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching product:', error)
      setLoading(false)
    }
  }

  const addToCart = async () => {
    // TODO: Implement cart functionality
  alert(t('cart.comingSoon'))
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('product.notFound')}</p>
          <Link
            href="/marketplace"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            {t('marketplace.backToMarketplace')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-2)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Link
            href="/marketplace"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('marketplace.backToMarketplace')}
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card rounded-xl p-6"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--bg-2)]">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-orange-400 text-8xl">🎨</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Info */}
            <div>
              <h1 className="text-4xl font-bold text-[var(--text)] mb-2">
                {product.title}
              </h1>
              <p className="text-lg text-[var(--muted)] mb-4">
                {product.category}
              </p>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[var(--muted)]">(4.8 • 24 {t('product.reviews').toLowerCase()})</span>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                ₹{product.price}
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                {t('product.description')}
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                  {t('product.quantity')}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-10 h-10 border border-[var(--border)] rounded-lg flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-lg font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
          className="w-10 h-10 border border-[var(--border)] rounded-lg flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={addToCart}
                  disabled={hasActiveAuction}
                  className={`flex-1 flex items-center justify-center px-6 py-3 ${hasActiveAuction ? 'bg-[var(--bg-2)] text-[var(--muted)] cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'} font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200`}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {hasActiveAuction ? t('auction.onAuction') : t('product.addToCart')}
                </button>
                <button className="px-6 py-3 border border-[var(--border)] text-[var(--text)] font-semibold rounded-lg hover:bg-[var(--bg-2)] transition-colors" title={t('product.addToWishlist')}>
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Artisan Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card-glass rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                {t('product.meetTheArtisan')}
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  {product.seller?.profile_image ? (
                    <Image
                      src={product.seller.profile_image}
                      alt={product.seller.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--text)]">
                    {product.seller?.name}
                  </h4>
                  <p className="text-[var(--muted)] text-sm">
                    {product.seller?.store_description || product.seller?.bio || 'Passionate artisan creating unique pieces'}
                  </p>
                  <Link
                    href={`/stall/${product.seller_id}`}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-1 inline-block"
                  >
                    {t('product.viewAllProducts')}
                  </Link>
                </div>
              </div>
            </motion.div>
            {/* Auction Widget */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">{t('auction.title')}</h3>
              <AuctionWidget productId={product.id} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
