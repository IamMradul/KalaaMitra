'use client'

import { useState, useRef, useEffect } from 'react'
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
  RefreshCw
} from 'lucide-react'
import AIService, { AIAnalysisResult } from '@/lib/ai-service'
import { supabase } from '@/lib/supabase'

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
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || '')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)
  const [error, setError] = useState('')
  const [timeoutError, setTimeoutError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isComponentMounted = useRef(true)

  // Cleanup function to prevent memory leaks and stuck states
  useEffect(() => {
    isComponentMounted.current = true
    
    return () => {
      isComponentMounted.current = false
      // Clear any pending timeouts
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
        uploadTimeoutRef.current = null
      }
      // Reset states when component unmounts
      setIsUploading(false)
      setIsAnalyzing(false)
      setError('')
      setTimeoutError(false)
    }
  }, [])

  // Reset form state when initialData changes (for editing)
  useEffect(() => {
    if (initialData.imageUrl) {
      setImageUrl(initialData.imageUrl)
      setUploadedFile(null)
    }
  }, [initialData.imageUrl])

  const resetFormState = () => {
    if (!isComponentMounted.current) return
    
    setIsUploading(false)
    setIsAnalyzing(false)
    setError('')
    setTimeoutError(false)
    
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current)
      uploadTimeoutRef.current = null
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a temporary URL for preview
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setUploadedFile(file)
      setAiResult(null)
      setShowAiResult(false)
      setError('')
      setTimeoutError(false)
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setUploadedFile(null) // Clear uploaded file when using URL
    setAiResult(null)
    setShowAiResult(false)
    setError('')
    setTimeoutError(false)
  }

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Set up 10-second timeout
      uploadTimeoutRef.current = setTimeout(() => {
        if (isComponentMounted.current) {
          setTimeoutError(true)
          setError('Upload timed out after 10 seconds. Please try refreshing the page and uploading again.')
          setIsUploading(false)
        }
        reject(new Error('Upload timeout after 10 seconds'))
      }, 10000)

      const uploadPromise = async () => {
        try {
          console.log('Starting upload for file:', file.name, 'Size:', file.size)
          
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `product-images/${fileName}`

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

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath)

          console.log('Public URL generated:', publicUrl)
          
          // Clear timeout since upload succeeded
          if (uploadTimeoutRef.current) {
            clearTimeout(uploadTimeoutRef.current)
            uploadTimeoutRef.current = null
          }
          
          resolve(publicUrl)
        } catch (error) {
          // Clear timeout since we're handling the error
          if (uploadTimeoutRef.current) {
            clearTimeout(uploadTimeoutRef.current)
            uploadTimeoutRef.current = null
          }
          reject(error)
        }
      }

      uploadPromise()
    })
  }

  const analyzeImage = async () => {
    if (!imageUrl) {
      setError('Please provide an image first')
      return
    }

    if (!isComponentMounted.current) return

    setIsAnalyzing(true)
    setError('')
    setTimeoutError(false)

    try {
      const aiService = AIService.getInstance()
      
      // If we have an uploaded file, use it directly for AI analysis
      if (uploadedFile) {
        const result = await aiService.analyzeProductImageFromFile(uploadedFile)
        if (isComponentMounted.current) {
          setAiResult(result)
          setShowAiResult(true)
        }
      } else {
        // Use the URL for AI analysis
        const result = await aiService.analyzeProductImage(imageUrl)
        if (isComponentMounted.current) {
          setAiResult(result)
          setShowAiResult(true)
        }
      }
    } catch (err) {
      if (isComponentMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to analyze image')
      }
    } finally {
      if (isComponentMounted.current) {
        setIsAnalyzing(false)
      }
    }
  }

  const applyAIResults = () => {
    if (!aiResult) return

    // Update form fields with AI results
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
      // Use the middle of the price range
      const suggestedPrice = (aiResult.pricingSuggestion.minPrice + aiResult.pricingSuggestion.maxPrice) / 2
      priceInput.value = suggestedPrice.toFixed(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isComponentMounted.current) return
    
    setIsUploading(true)
    setError('')
    setTimeoutError(false)

    try {
      const formData = new FormData(e.currentTarget)
      
      // If we have an uploaded file, upload it to Supabase first
      if (uploadedFile) {
        console.log('Uploading file to Supabase...')
        const uploadedImageUrl = await uploadImageToSupabase(uploadedFile)
        console.log('Upload successful, URL:', uploadedImageUrl)
        formData.set('imageUrl', uploadedImageUrl)
      } else if (imageUrl && !imageUrl.startsWith('blob:')) {
        // If it's a URL (not a blob), use it directly
        console.log('Using existing URL:', imageUrl)
        formData.set('imageUrl', imageUrl)
      } else {
        setError('Please provide a valid image')
        setIsUploading(false)
        return
      }

      if (!isComponentMounted.current) return

      console.log('Calling onSubmit with formData...')
      await onSubmit(formData)
      console.log('onSubmit completed successfully')
      
      // Close the form after successful submission
      if (isComponentMounted.current) {
        onCancel()
      }
    } catch (err) {
      if (!isComponentMounted.current) return
      
      console.error('Error in handleSubmit:', err)
      if (timeoutError) {
        setError('Upload timed out. Please try refreshing the page and uploading again.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
      }
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    resetFormState()
    onCancel()
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
            AI-Powered Product Creation
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Product Image
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
                Upload Image
              </button>
              <span className="text-gray-500 text-sm">or</span>
              <input
                name="imageUrl"
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Paste image URL here"
              />
            </div>

            {imageUrl && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="absolute top-2 right-2 flex items-center px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>
            )}
          </div>

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
                    AI Analysis Results
                  </h4>
                  <button
                    type="button"
                    onClick={applyAIResults}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Apply to Form
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      Suggested Title & Category
                    </h5>
                    <p className="text-blue-800 mb-1"><strong>Title:</strong> {aiResult.title}</p>
                    <p className="text-blue-800 mb-1"><strong>Category:</strong> {aiResult.category}</p>
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
                      Pricing Suggestion
                    </h5>
                    <p className="text-blue-800 mb-1">
                      <strong>Range:</strong> ₹{aiResult.pricingSuggestion.minPrice} - ₹{aiResult.pricingSuggestion.maxPrice}
                    </p>
                    <p className="text-blue-700 text-sm">{aiResult.pricingSuggestion.reasoning}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <h5 className="font-medium text-blue-700 mb-2">AI-Generated Description</h5>
                  <p className="text-blue-800 text-sm italic">&ldquo;{aiResult.description}&rdquo;</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <div className="flex-1">
                {error}
                {timeoutError && (
                  <div className="mt-2 flex items-center text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try refreshing the page and uploading again
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Details Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                name="title"
                required
                defaultValue={initialData.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter product title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                name="category"
                required
                defaultValue={initialData.category}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Pottery, Textiles, Jewelry"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={initialData.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Describe your product (AI can help enhance this!)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) *
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initialData.price}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0.00"
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading Image...
                </>
              ) : loading ? (
                'Saving...'
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>

        {/* AI Tips */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 mb-2">💡 AI Tips for Artisans</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Upload a clear, well-lit image for better AI analysis</li>
            <li>• AI can help you avoid underpricing your valuable work</li>
            <li>• Use AI-generated descriptions as a starting point, then personalize them</li>
            <li>• Consider the cultural significance and craftsmanship in your pricing</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
