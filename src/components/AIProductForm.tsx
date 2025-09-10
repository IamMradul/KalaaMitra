'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  Sparkles, 
  DollarSign, 
  Tag, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Upload,
  X,
  Video
} from 'lucide-react'
import AIService, { AIAnalysisResult } from '@/lib/ai-service'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

interface AIProductFormProps {
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  loading?: boolean
  initialData?: {
    title?: string
    category?: string
    description?: string
    price?: number
    imageUrl?: string
  }
}

export default function AIProductForm({ 
  onSubmit, 
  onCancel, 
  loading = false,
  initialData = {}
}: AIProductFormProps) {
  const { t } = useTranslation()
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || '')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingAd, setIsGeneratingAd] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)
  const [error, setError] = useState('')
  const [adVideoUrl, setAdVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setUploadedFile(file)
      setAiResult(null)
      setShowAiResult(false)
      setError('')
      setAdVideoUrl('')
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setUploadedFile(null)
    setAiResult(null)
    setShowAiResult(false)
    setError('')
    setAdVideoUrl('')
  }

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      console.log('Starting upload for file:', file.name, 'Size:', file.size)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `product-images/${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      console.log('Uploading to path:', filePath)

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      console.log('Upload successful, getting public URL...')

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Error in uploadImageToSupabase:', error)
      throw error
    }
  }

  const analyzeImage = async () => {
    if (!imageUrl) {
  setError(t('ai.form.errors.noImage'))
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const aiService = AIService.getInstance()
      
      if (uploadedFile) {
        const result = await aiService.analyzeProductImageFromFile(uploadedFile)
        setAiResult(result)
        setShowAiResult(true)
      } else {
        const result = await aiService.analyzeProductImage(imageUrl)
        setAiResult(result)
        setShowAiResult(true)
      }
    } catch (err) {
  setError(err instanceof Error ? err.message : t('ai.form.errors.analyzeFailed'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateAd = async () => {
    if (!imageUrl || !aiResult) {
  setError(t('ai.form.errors.needAnalyzeFirst'))
      return
    }

    setIsGeneratingAd(true)
    setError('')

    try {
      const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement
      const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement
      const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement

      const adPrompt = `Create a vibrant promotional video ad showcasing an artisan product with the following details:
      Title: ${titleInput?.value || aiResult.title}
      Description: ${descriptionInput?.value || aiResult.description}
      Price: ₹${priceInput?.value || ((aiResult.pricingSuggestion.minPrice + aiResult.pricingSuggestion.maxPrice) / 2).toFixed(2)}
      Style: Dynamic panning shots with vibrant colors, highlighting the product's unique craftsmanship and cultural significance.`;

      const imageData = uploadedFile ? await uploadImageToSupabase(uploadedFile) : imageUrl

      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageData,
          prompt: adPrompt
        })
      })

      if (!response.ok) {
  throw new Error(t('ai.form.errors.generateFailed'))
      }

      const { videoUrl } = await response.json()
      setAdVideoUrl(videoUrl)
    } catch (err) {
  setError(err instanceof Error ? err.message : t('ai.form.errors.generateFailed'))
    } finally {
      setIsGeneratingAd(false)
    }
  }

  const applyAIResults = () => {
    if (!aiResult) return

    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement
    const categoryInput = document.querySelector('input[name="category"]') as HTMLInputElement
    const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement
    const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement

    if (titleInput) {
      titleInput.value = aiResult.title
    }
    if (categoryInput) {
      categoryInput.value = aiResult.category
    }
    if (descriptionInput) {
      descriptionInput.value = aiResult.description
    }
    if (priceInput) {
      const suggestedPrice = (aiResult.pricingSuggestion.minPrice + aiResult.pricingSuggestion.maxPrice) / 2
      priceInput.value = suggestedPrice.toFixed(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      
      if (uploadedFile) {
        console.log('Uploading file to Supabase...')
        const uploadedImageUrl = await uploadImageToSupabase(uploadedFile)
        console.log('Upload successful, URL:', uploadedImageUrl)
        formData.set('imageUrl', uploadedImageUrl)
      } else if (imageUrl && !imageUrl.startsWith('blob:')) {
        console.log('Using existing URL:', imageUrl)
        formData.set('imageUrl', imageUrl)
      } else {
        setError(t('ai.form.errors.invalidImage'))
        setIsUploading(false)
        return
      }

      if (adVideoUrl) {
        formData.set('adVideoUrl', adVideoUrl)
      }

      console.log('Calling onSubmit with formData...')
      await onSubmit(formData)
      console.log('onSubmit completed successfully')
      
      onCancel()
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError(err instanceof Error ? err.message : t('ai.form.errors.uploadFailed'))
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
            {t('ai.form.title')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              {t('ai.form.productImage')}
            </label>
            
            <div className="flex space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('ai.form.uploadImage')}
              </button>
              <span className="text-gray-500 text-sm">{t('ai.form.or')}</span>
              <input
                name="imageUrl"
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={t('ai.form.pasteImageUrl')}
              />
            </div>

            {imageUrl && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={t('ai.form.productPreviewAlt')}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex items-center px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {isAnalyzing ? t('ai.analyzing') : t('ai.analyzeWithAI')}
                  </button>
                  <button
                    type="button"
                    onClick={generateAd}
                    disabled={isGeneratingAd}
                    className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAd ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4 mr-2" />
                    )}
                    {isGeneratingAd ? t('ai.generatingAd') : t('ai.generateAdWithAI')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ad Preview */}
          {adVideoUrl && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('ai.generatedAdPreview')}
              </label>
              <video
                src={adVideoUrl}
                controls
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* AI Analysis Results */}
          <AnimatePresence>
            {showAiResult && aiResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-blue-800 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t('ai.aiAnalysisResults')}
                  </h4>
                  <button
                    type="button"
                    onClick={applyAIResults}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('ai.form.applyToForm')}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {t('ai.form.suggestedTitleCategory')}
                    </h5>
                    <p className="text-blue-800 mb-1"><strong>{t('ai.form.labels.title', { defaultValue: 'Title' })}:</strong> {aiResult.title}</p>
                    <p className="text-blue-800 mb-1"><strong>{t('ai.form.labels.category', { defaultValue: 'Category' })}:</strong> {aiResult.category}</p>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {t('ai.pricingSuggestion')}
                    </h5>
                    <p className="text-blue-800 mb-1">
                      <strong>{t('ai.range')}:</strong> ₹{aiResult.pricingSuggestion.minPrice} - ₹{aiResult.pricingSuggestion.maxPrice}
                    </p>
                    <p className="text-blue-700 text-sm">{aiResult.pricingSuggestion.reasoning}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <h5 className="font-medium text-blue-700 mb-2">{t('ai.aiGeneratedDescription')}</h5>
                  <p className="text-blue-800 text-sm italic">&ldquo;{aiResult.description}&rdquo;</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Product Details Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ai.form.fields.title.label')}
              </label>
              <input
                name="title"
                required
                defaultValue={initialData.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={t('ai.form.fields.title.placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ai.form.fields.category.label')}
              </label>
              <input
                name="category"
                required
                defaultValue={initialData.category}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={t('ai.form.fields.category.placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('ai.form.fields.description.label')}
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={initialData.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t('ai.form.fields.description.placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('ai.form.fields.price.label')}
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initialData.price}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t('ai.form.fields.price.placeholder')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('ai.form.uploadingImage')}
                </>
              ) : loading ? (
                t('ai.form.saving')
              ) : (
                t('ai.form.saveProduct')
              )}
            </button>
          </div>
        </form>

        {/* AI Tips */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-2">💡 {t('ai.tips.title')}</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• {t('ai.tips.items.uploadClearImage')}</li>
            <li>• {t('ai.tips.items.avoidUnderpricing')}</li>
            <li>• {t('ai.tips.items.personalizeDescriptions')}</li>
            <li>• {t("ai.tips.items.generateVideoAd")}</li>
            <li>• {t('ai.tips.items.culturalSignificance')}</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}