'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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
        
        // Check if this is a new user who needs a profile created
        const pendingProfile = localStorage.getItem('pendingProfile')
        if (pendingProfile) {
          try {
            const profileData = JSON.parse(pendingProfile)
            if (profileData.id === userId) {
              console.log('Creating profile for new user:', userId)
              
              const { error: createError } = await supabase
                .from('profiles')
                .insert([{
                  id: profileData.id,
                  name: profileData.name,
                  email: profileData.email,
                  role: profileData.role,
                  bio: null,
                  profile_image: null,
                  created_at: new Date().toISOString()
                }])

              if (createError) {
                console.error('Failed to create profile:', createError)
                setProfile(null)
                return
              }

              console.log('Profile created successfully')
              
              // Remove pending profile data
              localStorage.removeItem('pendingProfile')
              
              // Fetch the newly created profile
              const { data: newProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

              if (fetchError) {
                console.error('Error fetching new profile:', fetchError)
                setProfile(null)
                return
              }

              setProfile(newProfile)
              return
            }
          } catch (parseError) {
            console.error('Error parsing pending profile:', parseError)
          }
        }
        
        // If no pending profile or other error, set profile to null
        setProfile(null)
        return
      }

      console.log('Profile fetched:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller') => {
    try {
      console.log('Starting signup process for:', email, 'role:', role)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Step 1: Create auth user
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
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }

      console.log('Auth signup successful:', data)
      console.log('User created:', data.user?.id)
      
      // Store user data in localStorage for profile creation after email confirmation
      if (data.user) {
        localStorage.setItem('pendingProfile', JSON.stringify({
          id: data.user.id,
          name: name,
          email: email,
          role: role
        }))
      }
      
      console.log('Signup process completed successfully')
      console.log('Please check your email to confirm your account before signing in.')
    } catch (error) {
      console.error('Error signing up:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error ? Object.keys(error) : 'No error object')
      
      // Provide more detailed error information
      if (error && typeof error === 'object' && 'message' in error) {
        throw error
      } else {
        throw new Error('Signup failed. Please try again.')
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Signin error:', error)
        throw error
      }

      console.log('Signin successful')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    // Prevent multiple simultaneous signout attempts
    if (isSigningOut) {
      console.log('Signout already in progress, ignoring duplicate call')
      return
    }
    
    setIsSigningOut(true)
    
    try {
      console.log('=== SIGNING OUT USER ===')
      console.log('Current user:', user?.id)
      console.log('Current profile:', profile?.id)
      console.log('Current session:', session?.user?.id)
      
      // Clear localStorage data
      console.log('Clearing localStorage...')
      localStorage.removeItem('pendingProfile')
      
      // Clear all state immediately to prevent UI issues
      console.log('Clearing local state immediately...')
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Sign out from Supabase with timeout
      console.log('Calling Supabase auth.signOut() with timeout...')
      
      // Create a promise with timeout
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signout timeout')), 5000)
      )
      
      try {
        const result = await Promise.race([signOutPromise, timeoutPromise])
        if (result && typeof result === 'object' && 'error' in result) {
          const { error } = result as { error: any }
          if (error) {
            console.error('Supabase signout error:', error)
          } else {
            console.log('Supabase signout successful')
          }
        }
      } catch (timeoutError) {
        console.warn('Supabase signout timed out, continuing with local cleanup...')
      }
      
      // Manual cleanup as backup
      console.log('Performing manual session cleanup...')
      try {
        // Clear any stored session data by setting an empty session
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: ''
        })
      } catch (cleanupError) {
        console.warn('Manual cleanup failed:', cleanupError)
      }
      
      // Browser-level cleanup
      console.log('Performing browser-level cleanup...')
      try {
        // Clear any stored auth data in browser storage
        if (typeof window !== 'undefined') {
          // Clear localStorage
          localStorage.clear()
          // Clear sessionStorage
          sessionStorage.clear()
          // Clear any cookies related to auth
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        }
      } catch (browserCleanupError) {
        console.warn('Browser cleanup failed:', browserCleanupError)
      }
      
      console.log('All cleanup completed, redirecting to home page...')
      
      // Force a page reload to clear any cached data
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error during signout:', error)
      console.log('Attempting to clear state even with error...')
      
      // Even if there's an error, clear the local state
      setUser(null)
      setProfile(null)
      setSession(null)
      localStorage.removeItem('pendingProfile')
      
      console.log('State cleared, redirecting to home page...')
      window.location.href = '/'
      
      throw error
    } finally {
      // Reset the flag
      setIsSigningOut(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
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
