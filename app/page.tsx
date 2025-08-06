import Link from 'next/link'
import { ArrowRight, Shield, Users, Vote, Globe, Lock, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-yellow-400 shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-gray-800" />
              <span className="text-2xl font-bold text-gray-800">AnonSpace</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                How it Works
              </Link>
              <Link href="/create-group" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Create Group
              </Link>
              <appkit-button />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-gradient-to-r from-yellow-100 to-purple-100 rounded-3xl p-12 mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Anonymous Social
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-purple-600">
                Communities
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Form groups based on nationality and age using Self Protocol. Vote anonymously on proposals using Semaphore. Your identity stays private, your voice stays heard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/create-group"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Create a Group
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/groups"
                className="bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Browse Groups
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge privacy protocols to ensure your anonymity while fostering meaningful connections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border-l-4 border-yellow-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Group Formation</h3>
              <p className="text-gray-600">
                Create groups based on nationality, age, or other criteria using Self Protocol verification.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-purple-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Vote className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Anonymous Voting</h3>
              <p className="text-gray-600">
                Vote on proposals anonymously using Semaphore zero-knowledge proofs.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-blue-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Shield className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy First</h3>
              <p className="text-gray-600">
                Your identity remains completely private while participating in community discussions.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-orange-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Globe className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Communities</h3>
              <p className="text-gray-600">
                Connect with people from around the world while maintaining your anonymity.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-green-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Lock className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Verification</h3>
              <p className="text-gray-600">
                Self Protocol ensures secure identity verification without revealing personal information.
              </p>
            </div>
            
            <div className="bg-white border-l-4 border-yellow-400 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-time Updates</h3>
              <p className="text-gray-600">
                Get instant updates on votes, proposals, and community activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to join anonymous communities and make your voice heard.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-yellow-50 rounded-2xl p-8">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-gray-900 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Verify Identity</h3>
              <p className="text-gray-600">
                Use Self Protocol to verify your nationality or age without revealing personal details.
              </p>
            </div>
            
            <div className="text-center bg-purple-50 rounded-2xl p-8">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Groups</h3>
              <p className="text-gray-600">
                Create or join groups based on your verified attributes and interests.
              </p>
            </div>
            
            <div className="text-center bg-blue-50 rounded-2xl p-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Participate Anonymously</h3>
              <p className="text-gray-600">
                Vote on proposals and share thoughts while maintaining complete anonymity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">AnonSpace</span>
              </div>
              <p className="text-gray-300 mb-4">
                Building the future of anonymous social communities with privacy-first technology.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/create-group" className="text-gray-300 hover:text-yellow-400 transition-colors">Create Group</Link></li>
                <li><Link href="/groups" className="text-gray-300 hover:text-yellow-400 transition-colors">Browse Groups</Link></li>
                <li><Link href="/verify" className="text-gray-300 hover:text-yellow-400 transition-colors">Verify Identity</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 AnonSpace. All rights reserved. Built with privacy in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
