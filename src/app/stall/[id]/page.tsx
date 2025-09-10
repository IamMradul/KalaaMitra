'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/lib/activity'
import { ArrowLeft, User, Palette, MapPin, Calendar } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/LanguageProvider'
import { translateArray, translateText } from '@/lib/translate'

type Product = Database['public']['Tables']['products']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function StallPage() {
  const { t, i18n } = useTranslation()
  const { currentLanguage } = useLanguage()
  const params = useParams()
  const { user } = useAuth()
  const [stallProfile, setStallProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchStallData(params.id as string)
    }
  }, [params.id, currentLanguage])

  useEffect(() => {
    if (user && params.id) {
      logActivity({ userId: user.id, activityType: 'stall_view', stallId: params.id as string })
    }
  }, [user, params.id])

  const fetchStallData = async (stallId: string) => {
    try {
      // Fetch stall profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', stallId)
        .single()

      if (profileError) throw profileError
      // Translate profile name/bio/description
      try {
        const lang = currentLanguage
        const name = await translateText(profileData.name || '', lang)
        const bio = await translateText(profileData.bio || '', lang)
        const desc = await translateText(profileData.store_description || '', lang)
        setStallProfile({ ...profileData, name, bio, store_description: desc })
      } catch {
        setStallProfile(profileData)
      }

      // Fetch stall products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', stallId)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      // Translate product titles and categories in this stall
      try {
        const lang = currentLanguage
        const titles = (productsData || []).map(p => p.title || '')
        const cats = (productsData || []).map(p => p.category || '')
        const trTitles = await translateArray(titles, lang)
        const trCats = await translateArray(cats, lang)
        const translated = (productsData || []).map((p, idx) => ({ ...p, title: trTitles[idx] || p.title, category: trCats[idx] || p.category }))
        setProducts(translated as Product[])
      } catch {
        setProducts(productsData || [])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching stall data:', error)
      setLoading(false)
    }
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

  if (!stallProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('errors.notFound')}</p>
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

        {/* Stall Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-glass rounded-xl p-8 mb-8 text-center"
        >
          <div className="w-24 h-24 bg-[var(--bg-2)] rounded-full flex items-center justify-center mx-auto mb-6">
            {stallProfile.profile_image ? (
              <Image
                src={stallProfile.profile_image}
                alt={stallProfile.name}
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-orange-600" />
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4">
            {stallProfile.name}&apos;s {t('navigation.profile')}
          </h1>
          
          {stallProfile.store_description && (
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-6">
              {stallProfile.store_description}
            </p>
          )}
          
          {!stallProfile.store_description && stallProfile.bio && (
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-6">
              {stallProfile.bio}
            </p>
          )}
          
          <div className="flex justify-center space-x-8 text-sm text-[var(--muted)]">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{t('navigation.dashboard')}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{t('profile.memberSince', { defaultValue: 'Member since' })} {new Date(stallProfile.created_at).getFullYear()}</span>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[var(--text)]">
              {t('marketplace.title')} - {stallProfile.name}
            </h2>
            <span className="text-[var(--muted)]">
              {products.length} {products.length !== 1 ? t('product.relatedProducts').toLowerCase() : t('product.item', { defaultValue: 'item' })}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 card-glass rounded-xl">
              <Palette className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
              <p className="text-[var(--muted)] text-lg">{t('marketplace.noProducts')}</p>
              <p className="text-[var(--muted)]">{t('marketplace.noProductsDescription')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="relative h-48 bg-[var(--bg-2)] flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover hover:scale-110 transition-transform duration-300"
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
                      <h3 className="font-semibold text-[var(--text)] mb-2 hover:text-orange-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-[var(--muted)] mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-orange-600">₹{product.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* About the Artisan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 card-glass rounded-xl p-8"
        >
          <h3 className="text-2xl font-semibold text-[var(--text)] mb-4 text-center">
            {t('product.meetTheArtisan')}
          </h3>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[var(--muted)] leading-relaxed mb-6">
              {stallProfile.store_description || stallProfile.bio || 
                `${stallProfile.name} is a passionate artisan dedicated to creating unique, handcrafted pieces that celebrate tradition and craftsmanship. Each creation is made with care and attention to detail, ensuring that every piece tells a story and brings beauty to your life.`
              }
            </p>
            <div className="flex justify-center space-x-6 text-sm text-[var(--muted)]">
              <div className="flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                <span>{t('seller.overview', { defaultValue: 'Business Overview' })}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{t('product.artisanInfo')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
