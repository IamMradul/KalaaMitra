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
  X
} from 'lucide-react'
import AIService, { AIAnalysisResult } from '@/lib/ai-service'

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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showAiResult, setShowAiResult] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setAiResult(null)
      setShowAiResult(false)
      setError('')
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setAiResult(null)
    setShowAiResult(false)
    setError('')
  }

  const analyzeImage = async () => {
    if (!imageUrl) {
      setError('Please provide an image first')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const aiService = AIService.getInstance()
      const result = await aiService.analyzeProductImage(imageUrl)
      setAiResult(result)
      setShowAiResult(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyAIResults = () => {
    if (!aiResult) return

    // Update form fields with AI results
    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement
    const categoryInput = document.querySelector('input[name="category"]') as HTMLInputElement
    const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement
    const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement

    if (titleInput && !titleInput.value) {
      titleInput.value = `Beautiful ${aiResult.category}`
    }
    if (categoryInput && !categoryInput.value) {
      categoryInput.value = aiResult.category
    }
    if (descriptionInput && !descriptionInput.value) {
      descriptionInput.value = aiResult.description
    }
    if (priceInput && !priceInput.value) {
      // Use the middle of the price range
      const suggestedPrice = (aiResult.pricingSuggestion.minPrice + aiResult.pricingSuggestion.maxPrice) / 2
      priceInput.value = suggestedPrice.toFixed(2)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
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
                      Category & Tags
                    </h5>
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
                      <strong>Range:</strong> ${aiResult.pricingSuggestion.minPrice} - ${aiResult.pricingSuggestion.maxPrice}
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
              {error}
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
              Price ($) *
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
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Product'}
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
