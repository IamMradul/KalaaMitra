'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, profile, loading } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const googleSession = localStorage.getItem('googleUserSession')
      setLocalStorageData({
        googleSession: googleSession ? JSON.parse(googleSession) : null,
        allKeys: Object.keys(localStorage)
      })
    }
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Present' : 'None'}</p>
              {user && (
                <div className="ml-4 text-sm">
                  <p>ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                  <p>Name: {'name' in user ? user.name : 'N/A'}</p>
                </div>
              )}
              <p><strong>Profile:</strong> {profile ? 'Present' : 'None'}</p>
              {profile && (
                <div className="ml-4 text-sm">
                  <p>ID: {profile.id}</p>
                  <p>Name: {profile.name}</p>
                  <p>Role: {profile.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* LocalStorage State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage State</h2>
            <div className="space-y-2">
              <p><strong>Google Session:</strong> {localStorageData?.googleSession ? 'Present' : 'None'}</p>
              {localStorageData?.googleSession && (
                <div className="ml-4 text-sm">
                  <p>ID: {localStorageData.googleSession.id}</p>
                  <p>Email: {localStorageData.googleSession.email}</p>
                  <p>Name: {localStorageData.googleSession.name}</p>
                </div>
              )}
              <p><strong>All Keys:</strong></p>
              <div className="ml-4 text-sm">
                {localStorageData?.allKeys?.map((key: string) => (
                  <p key={key}>• {key}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => {
                localStorage.removeItem('googleUserSession')
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Google Session
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
