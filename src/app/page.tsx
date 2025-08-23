import Link from 'next/link'
import { Palette, ShoppingBag, Sparkles, Users, Shield, Zap, Star, Heart, Globe, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative section-padding overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-300 to-red-300 rounded-full mix-blend-multiply filter blur-3xl floating-element"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full mix-blend-multiply filter blur-3xl floating-element"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-red-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl floating-element"></div>
        </div>

        <div className="container-custom relative">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-3 glass-card rounded-full border border-orange-200/50 shadow-soft mb-12 animate-slide-in-up">
              <Star className="w-5 h-5 text-orange-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Artisan Marketplace</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight animate-slide-in-up animate-delay-100">
              Welcome to{' '}
              <span className="gradient-text-animated">
                KalaMitra
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-16 animate-slide-in-up animate-delay-200">
              Where tradition meets innovation. Join our community of artisans and art lovers, 
              preserving cultural heritage while embracing the future of digital commerce.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center mb-20 animate-slide-in-up animate-delay-300">
              <Link href="/auth/signup?role=seller" className="btn-primary group">
                <span className="flex items-center justify-center space-x-3">
                  <Palette className="w-6 h-6" />
                  <span>Join as Artisan</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>

              <Link href="/marketplace" className="btn-secondary group">
                <span className="flex items-center justify-center space-x-3">
                  <ShoppingBag className="w-6 h-6" />
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-12 max-w-3xl mx-auto animate-slide-in-up animate-delay-400">
              <div className="text-center group">
                <div className="text-4xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
                <div className="text-gray-600 font-medium">Artisans</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">1000+</div>
                <div className="text-gray-600 font-medium">Products</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
                <div className="text-gray-600 font-medium">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white/60 backdrop-blur-sm relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-2xl floating-element"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full mix-blend-multiply filter blur-2xl floating-element"></div>
        </div>

        <div className="container-custom relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 animate-slide-in-up">
              Why Choose{' '}
              <span className="gradient-text-animated">KalaMitra</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up animate-delay-100">
              We're building the future of artisan commerce with AI-powered tools and a community-driven approach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="card-glass p-10 text-center group animate-slide-in-up animate-delay-100">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-soft">
                <Sparkles className="w-12 h-12 text-gradient-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">AI-Powered Tools</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Enhance your products with AI photo editing and storytelling capabilities. 
                Make your art shine with cutting-edge technology.
              </p>
            </div>

            <div className="card-glass p-10 text-center group animate-slide-in-up animate-delay-200">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-soft">
                <Users className="w-12 h-12 text-gradient-secondary" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Community First</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Connect with fellow artisans and art enthusiasts in our vibrant community. 
                Share knowledge, collaborate, and grow together.
              </p>
            </div>

            <div className="card-glass p-10 text-center group animate-slide-in-up animate-delay-300">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-soft">
                <Shield className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Secure & Reliable</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Enterprise-grade security ensures your business and customers are protected. 
                Focus on your art while we handle the security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-10 right-20 w-80 h-80 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-2xl floating-element"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full mix-blend-multiply filter blur-2xl floating-element"></div>
        </div>

        <div className="container-custom relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 animate-slide-in-up">
              How It <span className="gradient-text-animated">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up animate-delay-100">
              Get started with KalaMitra in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-10">
            <div className="text-center group animate-slide-in-up animate-delay-100">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-medium hover:shadow-glow">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign Up</h3>
              <p className="text-gray-600">Choose your role as an artisan or buyer</p>
            </div>
            <div className="text-center group animate-slide-in-up animate-delay-200">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-medium hover:shadow-glow">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Profile</h3>
              <p className="text-gray-600">Set up your stall and showcase your work</p>
            </div>
            <div className="text-center group animate-slide-in-up animate-delay-300">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-medium hover:shadow-glow">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Selling</h3>
              <p className="text-gray-600">List your products and reach customers</p>
            </div>
            <div className="text-center group animate-slide-in-up animate-delay-400">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-medium hover:shadow-glow">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Grow Business</h3>
              <p className="text-gray-600">Use AI tools to enhance your products</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-orange-500 to-red-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl floating-element"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl floating-element"></div>
        </div>

        <div className="container-custom relative">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 animate-slide-in-up">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-orange-100 mb-12 leading-relaxed animate-slide-in-up animate-delay-100">
              Whether you're an artisan looking to showcase your work or an art lover seeking unique pieces, 
              KalaMitra is your gateway to a world of creativity and tradition.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center animate-slide-in-up animate-delay-200">
              <Link href="/auth/signup?role=seller" className="btn-primary bg-white text-orange-600 hover:bg-gray-100 group">
                <span className="flex items-center justify-center space-x-3">
                  <span>Start Selling</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
              <Link href="/marketplace" className="btn-secondary border-white text-white hover:bg-white hover:text-orange-600 group">
                <span className="flex items-center justify-center space-x-3">
                  <span>Start Shopping</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
