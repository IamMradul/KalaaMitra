'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/LanguageProvider'
import { ShoppingCart, LogOut, Menu, X, Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import { translateText } from '@/lib/translate';
import '@/lib/i18n';

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const { currentLanguage, changeLanguage, isLoading: languageLoading } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [translatedName, setTranslatedName] = useState('')
  const { i18n, t } = useTranslation();
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'assamese', label: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'bengali', label: 'বাংলা', flag: '🇮🇳' },
    { code: 'bodo', label: 'बर’ / बड़ो', flag: '🇮🇳' },
    { code: 'dogri', label: 'डोगरी', flag: '🇮🇳' },
    { code: 'gujarati', label: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kannad', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'kashmiri', label: 'کٲشُر / कश्मीरी', flag: '🇮🇳' },
    { code: 'konkani', label: 'कोंकणी', flag: '🇮🇳' },
    { code: 'maithili', label: 'मैथिली', flag: '🇮🇳' },
    { code: 'malyalam', label: 'മലയാളം', flag: '🇮🇳' },
    { code: 'manipuri', label: 'ꯃꯦꯇꯩꯂꯣꯟ (Meitei)', flag: '🇮🇳' },
    { code: 'marathi', label: 'मराठी', flag: '🇮🇳' },
    { code: 'nepali', label: 'नेपाली', flag: '🇳🇵' },
    { code: 'oriya', label: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'punjabi', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'sanskrit', label: 'संस्कृत', flag: '🇮🇳' },
    { code: 'santhali', label: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
    { code: 'sindhi', label: 'سنڌي / सिंधी', flag: '🇮🇳' },
    { code: 'tamil', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'telgu', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'urdu', label: 'اردو', flag: '🇵🇰' },
  ];

  // Ensure client-side rendering to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Translate user name when profile or language changes
  useEffect(() => {
    const translateUserName = async () => {
      if (profile?.name && currentLanguage) {
        try {
          const translated = await translateText(profile.name, currentLanguage)
          setTranslatedName(translated)
        } catch {
          setTranslatedName(profile.name)
        }
      } else {
        setTranslatedName(profile?.name || '')
      }
    }
    translateUserName()
  }, [profile?.name, currentLanguage])

  // Prevent hydration mismatch by showing consistent structure during loading
  if (!mounted) {
    return (
      <nav className="glass-nav border-b border-heritage-gold/40 shadow-soft sticky top-0 z-50 heritage-bg">
        <div className="container-custom">
          <div className="flex justify-between items-center py-6">
            {/* Logo placeholder */}
            <div className="flex items-center space-x-4 group">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--heritage-gold)] to-[var(--heritage-gold)] rounded-2xl flex items-center justify-center">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold heritage-title">KalaMitra</span>
            </div>
            {/* Navigation placeholder */}
            <div className="hidden md:flex items-center space-x-10">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }



  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  // Language change handler
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value);
  };

  return (
    <nav className="glass-nav border-b border-heritage-gold/40 shadow-soft sticky top-0 z-50 heritage-bg">
      <div className="container-custom">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--heritage-gold)] to-[var(--heritage-red)] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-medium hover:shadow-glow animate-float-slow border-2 border-heritage-gold">
              <Palette className="w-7 h-7 text-white" />
            </div>
              <span className="text-3xl font-bold heritage-title" key={`brand-${currentLanguage}`}>
                {t('brand.name')}
              </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link 
              href="/marketplace" 
              className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] relative group"
            >
              <span className="relative z-10">{t('navigation.marketplace')}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-heritage-gold to-heritage-red transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {loading ? (
              <div className="flex items-center space-x-6">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                {profile?.role === 'seller' && (
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] relative group"
                  >
                    <span className="relative z-10">{t('navigation.dashboard')}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-heritage-gold to-heritage-red transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}
                <Link 
                  href="/cart" 
                  className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium relative hover:scale-105 transform hover:translate-y-[-2px] group"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-heritage-gold to-heritage-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-medium animate-pulse-glow">
                    0
                  </span>
                </Link>
                <div className="flex items-center space-x-6">
                  <span className="text-gray-700 font-medium px-4 py-2 bg-white/50 rounded-xl backdrop-blur-sm">
                    {translatedName || profile?.name}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-gray-700 hover:text-heritage-gold transition-all duration-300 hover:scale-105 transform hover:translate-y-[-2px] px-4 py-2 rounded-xl hover:bg-heritage-gold/50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('navigation.signout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  href="/auth/signin"
                  className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] px-4 py-2 rounded-xl hover:bg-heritage-gold/50"
                >
                  {t('navigation.signin')}
                </Link>
                <Link 
                  href="/auth/signup"
                  className="btn-primary text-sm px-8 py-3"
                >
                  {t('auth.signupTitle')}
                </Link>
              </div>
            )}
            {/* Language Selector */}
            <select
              className="ml-4 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-heritage-gold"
              value={currentLanguage}
              onChange={handleLanguageChange}
              disabled={languageLoading}
              aria-label="Select language"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-2xl text-gray-700 hover:text-heritage-gold hover:bg-heritage-gold/50 transition-all duration-300 hover:scale-105"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-heritage-gold/50 bg-white/95 backdrop-blur-md rounded-3xl mt-4 shadow-medium animate-slide-in-up">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/marketplace" 
                className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.marketplace')}
              </Link>
              {loading ? (
                <div className="space-y-4">
                  <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mx-6"></div>
                  <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mx-6"></div>
                </div>
              ) : user ? (
                <>
                  {profile?.role === 'seller' && (
                    <Link 
                      href="/dashboard" 
                      className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('navigation.dashboard')}
                    </Link>
                  )}
                  <Link 
                    href="/cart" 
                    className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navigation.cart')}
                  </Link>
                  <div className="pt-4 border-t border-heritage-gold/50 px-6">
                    <span className="text-gray-700 font-medium block mb-3 px-4 py-2 bg-white/50 rounded-xl backdrop-blur-sm">
                      {translatedName || profile?.name}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-700 hover:text-heritage-gold transition-all duration-300 px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl w-full hover:translate-x-2 transform"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navigation.signout')}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-4 pt-4 border-t border-heritage-gold/50 px-6">
                  <Link 
                    href="/auth/signin"
                    className="text-gray-700 hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navigation.signin')}
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="btn-primary text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('auth.signupTitle')}
                  </Link>
                </div>
              )}

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-heritage-gold/50 px-6">
                <label htmlFor="mobile-language" className="block text-sm text-gray-600 mb-2">
                  {t('navigation.language')}
                </label>
                <select
                  id="mobile-language"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-heritage-gold"
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  disabled={languageLoading}
                  aria-label="Select language"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
