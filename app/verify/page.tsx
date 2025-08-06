'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Shield, ArrowLeft, QrCode, CheckCircle } from 'lucide-react'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  const [qrCode, setQrCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    // Generate a mock QR code URL for Self Protocol verification
    // In a real implementation, this would integrate with Self Protocol
    const mockQrData = {
      groupId,
      timestamp: Date.now(),
      verificationUrl: `https://self.id/verify/${groupId}`
    }
    setQrCode(`data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="20" height="20" fill="black"/>
        <rect x="40" y="20" width="20" height="20" fill="white"/>
        <rect x="60" y="20" width="20" height="20" fill="black"/>
        <rect x="80" y="20" width="20" height="20" fill="white"/>
        <rect x="100" y="20" width="20" height="20" fill="black"/>
        <rect x="120" y="20" width="20" height="20" fill="white"/>
        <rect x="140" y="20" width="20" height="20" fill="black"/>
        <rect x="160" y="20" width="20" height="20" fill="white"/>
        <rect x="20" y="40" width="20" height="20" fill="white"/>
        <rect x="40" y="40" width="20" height="20" fill="black"/>
        <rect x="60" y="40" width="20" height="20" fill="white"/>
        <rect x="80" y="40" width="20" height="20" fill="black"/>
        <rect x="100" y="40" width="20" height="20" fill="white"/>
        <rect x="120" y="40" width="20" height="20" fill="black"/>
        <rect x="140" y="40" width="20" height="20" fill="white"/>
        <rect x="160" y="40" width="20" height="20" fill="black"/>
        <text x="100" y="190" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="black">Self Protocol</text>
      </svg>
    `)}`);
  }, [groupId])

  const handleVerify = () => {
    // Mock verification process
    setTimeout(() => {
      setIsVerified(true)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-yellow-400 shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-gray-800" />
              <span className="text-2xl font-bold text-gray-800">AnonSpace</span>
            </Link>
            <Link 
              href="/create-group"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Create Group
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Verify Your Identity</h1>
            <p className="text-xl text-gray-600">
              Use Self Protocol to verify your credentials without revealing personal information
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            {!isVerified ? (
              <div className="text-center">
                <div className="mb-8">
                  <QrCode className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan QR Code</h2>
                  <p className="text-gray-600 mb-6">
                    Scan this QR code with your Self Protocol app to verify your identity
                  </p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl inline-block mb-8 border-2 border-yellow-200">
                  <img src={qrCode || "/placeholder.svg"} alt="Self Protocol QR Code" className="w-48 h-48" />
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Don't have the Self Protocol app? Download it from your app store.
                  </p>
                  <button
                    onClick={handleVerify}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Simulate Verification
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Successful!</h2>
                <p className="text-gray-600 mb-8">
                  Your identity has been verified. You can now join the group and participate anonymously.
                </p>
                <div className="space-y-4">
                  <Link
                    href={`/groups/${groupId}`}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Enter Group
                  </Link>
                  <div>
                    <Link
                      href="/create-group"
                      className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Create Another Group
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
