'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { generateGoogleAuthURL } from '@/lib/google-oauth'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

interface AuthContextType {
  user: User | GoogleUser | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: (role: 'buyer' | 'seller') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | GoogleUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true)
    
    const initializeAuth = async () => {
      try {
        // Check for Google user session in localStorage (client-side only)
        const googleSession = localStorage.getItem('googleUserSession')
        if (googleSession) {
          try {
            const googleUser = JSON.parse(googleSession)
            console.log('Found Google session:', googleUser)
            setUser(googleUser)
            await fetchProfile(googleUser.id)
            setLoading(false)
            return
          } catch (error) {
            console.error('Error parsing Google session:', error)
            localStorage.removeItem('googleUserSession')
          }
        }

        // Get initial Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial Supabase session check:', session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes (only for Supabase users)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      // Only update if we don't have a Google user session
      const googleSession = localStorage.getItem('googleUserSession')
      if (!googleSession) {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller') => {
    try {
      console.log('Starting signup process for:', email, 'role:', role)
      
      // Check if user already exists in profiles table
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      
      if (existingProfile) {
        throw new Error('An account with this email already exists. Please sign in instead.')
      }
      
      // Create auth user with Supabase
      console.log('Step 1: Creating auth user...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role
          }
        }
      })

      if (error) {
        console.error('Auth signup error:', error)
        throw error
      }

      console.log('Auth signup successful:', data)
      
      // Store user data in localStorage for profile creation after email confirmation
      if (data.user && isClient) {
        const pendingProfileData = {
          id: data.user.id,
          name: name,
          email: email,
          role: role
        }
        localStorage.setItem('pendingProfile', JSON.stringify(pendingProfileData))
        console.log('Pending profile stored:', pendingProfileData)
      }
      
      console.log('Signup process completed successfully')
      console.log('Please check your email to confirm your account before signing in.')
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email)
      
      // Check if this email exists in our profiles table
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      
      if (profileCheckError && (profileCheckError.code === 'PGRST116' || profileCheckError.message.includes('0 rows'))) {
        console.log('No profile found for email:', email)
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      }
      
      if (profileCheckError) {
        console.error('Error checking profile existence:', profileCheckError)
        throw new Error('Sign in failed. Please try again.')
      }
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Signin error:', error)
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      }

      console.log('Signin successful:', data)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signInWithGoogle = async (role: 'buyer' | 'seller') => {
    try {
      console.log('Starting Google sign in for role:', role)
      
      // Create state parameter with role information
      const state = encodeURIComponent(JSON.stringify({ role }))
      
      // Generate Google OAuth URL
      const authUrl = generateGoogleAuthURL(state)
      
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw new Error('Google sign in failed. Please try again.')
    }
  }

  const signOut = async () => {
    if (isSigningOut) {
      console.log('Signout already in progress, ignoring duplicate call')
      return
    }
    
    setIsSigningOut(true)
    
    try {
      console.log('=== SIGNING OUT USER ===')
      
      // Clear app data in localStorage (client-side only)
      if (isClient) {
        try {
          localStorage.removeItem('pendingProfile')
          localStorage.removeItem('pendingGoogleRole')
          localStorage.removeItem('googleUserSession')
          localStorage.removeItem('km_session_json')
          localStorage.removeItem('km_session_updated_at')
          sessionStorage.clear()
        } catch (e) {
          console.warn('Storage clear failed:', e)
        }
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Sign out from Supabase (if it's a Supabase user)
      if (session) {
        await supabase.auth.signOut()
      }
      
      console.log('Sign out completed successfully')
    } catch (error) {
      console.error('Error during signout:', error)
      // Clear state even if there's an error
      setUser(null)
      setProfile(null)
      setSession(null)
    } finally {
      setIsSigningOut(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading: loading || !isClient, // Show loading until client is ready
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
