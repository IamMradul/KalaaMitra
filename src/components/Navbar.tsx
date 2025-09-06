'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/components/LanguageProvider'
import { ShoppingCart, LogOut, Menu, X, Palette, Bell, Moon, Sun, User } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { supabase } from '@/lib/supabase'
import NotificationsList from '@/components/NotificationsList'
import { useTranslation } from 'react-i18next';
import { translateText } from '@/lib/translate';
import '@/lib/i18n';

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const { currentLanguage, changeLanguage, isLoading: languageLoading } = useLanguage()
  const { theme, toggle } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [translatedName, setTranslatedName] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasLiveAuctions, setHasLiveAuctions] = useState(false)
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

  // Poll for live auctions and unread count every 30s
  useEffect(() => {
    fetchLiveAuctions()
    const iv = setInterval(() => {
      fetchLiveAuctions()
      if (user?.id) fetchUnread(user.id)
    }, 30000)
    return () => clearInterval(iv)
  }, [user?.id])

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

  const fetchUnread = async (uid?: string | null) => {
    if (!uid) return setUnreadCount(0)
    try {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('read', false)
      setUnreadCount(count || 0)
    } catch (err) {
      console.error('failed fetch unread', err)
    }
  }

  const fetchLiveAuctions = async () => {
    try {
      const now = new Date().toISOString()
      const { count } = await supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'running').gt('ends_at', now)
      setHasLiveAuctions((count || 0) > 0)
    } catch (err) {
      console.error('failed to fetch live auctions', err)
    }
  }


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
              <div className="w-20 h-8 bg-[var(--bg-2)] rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-[var(--bg-2)] rounded animate-pulse"></div>
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
              className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] relative group"
            >
              <span className="relative z-10">{t('navigation.marketplace')}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-heritage-gold to-heritage-red transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/auctions" 
              className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] relative group"
            >
                <span className="relative z-10">{t('navigation.auctions') || 'Auctions'}</span>
                {hasLiveAuctions && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">{t('navigation.live') || 'LIVE'}</span>
                )}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-heritage-gold to-heritage-red transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {loading ? (
              <div className="flex items-center space-x-6">
                <div className="w-20 h-8 bg-[var(--bg-2)] rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-[var(--bg-2)] rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                {profile?.role === 'seller' && (
                  <Link 
                    href="/dashboard" 
                    className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] relative group"
                  >
                    <span className="relative z-10">{t('navigation.dashboard')}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-heritage-gold to-heritage-red transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}
                <Link 
                  href="/cart" 
                  className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium relative hover:scale-105 transform hover:translate-y-[-2px] group"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-heritage-gold to-heritage-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-medium animate-pulse-glow">
                    0
                  </span>
                </Link>
                <div className="flex items-center space-x-6">
                  <div className="relative" onMouseLeave={() => setNotifOpen(false)}>
                    <button onClick={() => { setNotifOpen(!notifOpen); fetchUnread(user?.id) }} className="p-2 rounded-xl hover:bg-heritage-gold/50">
                      <Bell className="w-5 h-5 text-[var(--text)]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 z-50">
                        <div className="card rounded shadow-lg p-3">
                          <NotificationsList />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Profile dropdown */}
                  <div className="relative">
                    <button className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-heritage-gold/20" onClick={() => setIsMenuOpen(s => !s)}>
                      {profile?.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.profile_image} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-heritage-gold to-heritage-red text-white flex items-center justify-center font-semibold">
                          {profile?.name ? profile.name.split(' ').map(s=>s[0]).slice(0,2).join('') : <User className="w-4 h-4" />}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-sm font-medium text-[var(--text)]">{translatedName || profile?.name}</div>
                        <div className="text-xs text-[var(--muted)]">{profile?.role || ''}</div>
                      </div>
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 z-50" onMouseLeave={() => setIsMenuOpen(false)}>
                        <div className="card rounded shadow-lg p-2">
                          <Link href="/profile" className="block px-3 py-2 rounded hover:bg-[var(--bg-2)]">{t('navigation.profile') || 'Profile'}</Link>
                          <button onClick={toggle} className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-2)]">{theme === 'dark' ? <span className="flex items-center space-x-2"><Sun className="w-4 h-4" /> <span>{t('navigation.light') || 'Light'}</span></span> : <span className="flex items-center space-x-2"><Moon className="w-4 h-4" /> <span>{t('navigation.dark') || 'Dark'}</span></span>}</button>
                          <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-2)] flex items-center space-x-2"><LogOut className="w-4 h-4" /><span>{t('navigation.signout')}</span></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
                ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  href="/auth/signin"
                  className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium hover:scale-105 transform hover:translate-y-[-2px] px-4 py-2 rounded-xl hover:bg-heritage-gold/50"
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
              className="ml-4 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-heritage-gold"
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

          {/* Mobile theme toggle (visible on small screens) */}
            <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => toggle()}
              className="theme-toggle p-1"
              data-theme={theme}
              aria-label="Toggle theme"
            >
              <div className="knob" />
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-2xl text-[var(--text)] hover:text-heritage-gold hover:bg-heritage-gold/50 transition-all duration-300 hover:scale-105"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-heritage-gold/50 bg-[var(--bg-2)]/95 backdrop-blur-md rounded-3xl mt-4 shadow-medium animate-slide-in-up text-[var(--text)]">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/marketplace" 
                className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.marketplace')}
              </Link>
              <Link 
                href="/auctions" 
                className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="inline-flex items-center">
                  {t('navigation.auctions') || 'Auctions'}
                  {hasLiveAuctions && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">{t('navigation.live') || 'LIVE'}</span>
                  )}
                </span>
              </Link>
          {loading ? (
                <div className="space-y-4">
            <div className="w-32 h-8 bg-[var(--bg-2)] rounded animate-pulse mx-6"></div>
            <div className="w-32 h-8 bg-[var(--bg-2)] rounded animate-pulse mx-6"></div>
                </div>
              ) : user ? (
                <>
                  {profile?.role === 'seller' && (
                    <Link 
                      href="/dashboard" 
                      className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('navigation.dashboard')}
                    </Link>
                  )}
                  <Link 
                    href="/notifications" 
                    className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navigation.notifications') || 'Notifications'}
                  </Link>
                  <Link 
                    href="/cart" 
                    className="text-[var(--text)] hover:text-heritage-gold transition-all duration-300 font-medium px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl hover:translate-x-2 transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navigation.cart')}
                  </Link>
                    <div className="pt-4 border-t border-heritage-gold/50 px-6">
                    <span className="text-[var(--text)] font-medium block mb-3 px-4 py-2 bg-[var(--bg-2)] rounded-xl backdrop-blur-sm">
                      {translatedName || profile?.name}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-[var(--text)] hover:text-heritage-gold transition-all duration-300 px-6 py-3 hover:bg-heritage-gold/50 rounded-2xl w-full hover:translate-x-2 transform"
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
                <label htmlFor="mobile-language" className="block text-sm text-[var(--muted)] mb-2">
                  {t('navigation.language')}
                </label>
                <select
                  id="mobile-language"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-heritage-gold"
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
              {/* Mobile Theme Toggle */}
              <div className="pt-4 px-6">
                <label className="block text-sm text-gray-600 mb-2">{t('navigation.theme') || 'Theme'}</label>
                <div>
                  <button
                    onClick={() => { toggle(); }}
                    className="theme-toggle"
                    data-theme={theme}
                    aria-pressed={theme === 'dark'}
                    aria-label="Toggle theme"
                  >
                    <div className="knob" />
                    <div className="text-xs font-medium ml-2">{theme === 'dark' ? (t('navigation.dark') || 'Dark') : (t('navigation.light') || 'Light')}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
