'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'seller') {
        router.push('/dashboard')
      } else {
        router.push('/marketplace')
      }
    }
  }, [user, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }

    try {
      await signIn(email, password)
      // User will be redirected based on their role
    } catch (error: unknown) {
      console.error('Signin error details:', error)
      
      // Handle different types of errors
      if (error instanceof Error) {
        setError(error.message)
        
        // Log additional error details for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Error name:', error.name)
          console.log('Error message:', error.message)
          console.log('Error stack:', error.stack)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      
      // Clear password field on error for security
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">KM</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your KalaMitra account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-orange-600 hover:text-orange-500">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Helpful Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Having trouble signing in?</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Make sure your email is confirmed (check your inbox)</li>
              <li>• Check that Caps Lock is off</li>
              <li>• Try resetting your password if you forgot it</li>
              <li>• Ensure you&apos;re using the correct email address</li>
              <li>• <strong>Note:</strong> For security reasons, we show the same message for wrong credentials and non-existent accounts</li>
              <li>• If you don&apos;t have an account, please <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">sign up first</Link></li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}
