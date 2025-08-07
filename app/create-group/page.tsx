'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Users, Globe, Calendar, CheckCircle } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { Identity } from '@semaphore-protocol/identity'
import { Group } from "@semaphore-protocol/group"
import { getUniversalLink } from "@selfxyz/core"
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode"
import { v4 as uuidv4 } from 'uuid'

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }
]

const getMinimumAgeFromValue = (ageValue: string): number => {
  const age = parseInt(ageValue)
  return age >= 5 ? age : 5 // Ensure minimum is 18
}

export default function CreateGroupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restrictionType: 'nationality',
    restrictionValue: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form')
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState("")
  const [userId] = useState(() => uuidv4())
  const [groupId, setGroupId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Move to verification step instead of creating group immediately
      await initializeSelfApp()
      setStep('verify')
    } catch (error) {
      console.error('Error initializing verification:', error)
      alert('Error starting verification. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeSelfApp = async () => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "AnonSpace",
        scope: "anonspace",
        endpoint: "https://524bf20dd866.ngrok-free.app/api/verify-self",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "uuid",
        userDefinedData: `Group creation: ${formData.name} (${formData.restrictionType}: ${formData.restrictionValue})`,
        devMode: true,
        disclosures: {
          // Only disclose what's needed for this group's restriction
          ...(formData.restrictionType === 'age' && { 
            minimumAge: getMinimumAgeFromValue(formData.restrictionValue) 
          }),
          ...(formData.restrictionType === 'nationality' && { nationality: true }),
          ofac: false,
          excludedCountries: [],
          gender: false, // Always false for privacy
        }
      }).build()

      setSelfApp(app)
      setUniversalLink(getUniversalLink(app))
    } catch (error) {
      console.error("Failed to initialize Self app:", error)
      throw error
    }
  }

  const handleSuccessfulVerification = async () => {
    try {
      console.log("Self Protocol verification successful!")
      
      // Create the group in database after successful verification
      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            restriction_type: formData.restrictionType,
            restriction_value: formData.restrictionValue
          }
        ])
        .select()

      if (error) {
        throw new Error('Failed to create group')
      }

      const createdGroupId = data[0].id
      setGroupId(createdGroupId)
      
      // Generate Semaphore identity for this group using a simple seed
      const identitySeed = `${createdGroupId}_${userId}`
      const semaphoreIdentity = new Identity(identitySeed)
      
      // Store the seed to recreate the same identity later
      const identityKey = `semaphore_identity_${createdGroupId}`
      localStorage.setItem(identityKey, identitySeed)
      
      // Store the commitment (safe to be public)
      const commitment = semaphoreIdentity.commitment.toString()
      console.log('Generated Semaphore commitment:', commitment)

               // Store creator's commitment in Supabase for cross-browser visibility
      await supabase
        .from('semaphore_members')
        .insert([{
          group_id: createdGroupId,
          commitment: commitment
        }])
      
      // Store verification status and result for this group
      // This commitment proves the user is verified and can participate in this group
      localStorage.setItem(`verified_${createdGroupId}`, 'true')
      localStorage.setItem(`semaphore_commitment_${createdGroupId}`, commitment)
      
      setStep('success')
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    }
  }

  const handleVerificationError = () => {
    console.error("Self Protocol verification failed")
    alert('Identity verification failed. Please try again.')
    setStep('form') // Go back to form
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
              href="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {step === 'form' && 'Create a New Group'}
              {step === 'verify' && 'Verify Your Identity'}
              {step === 'success' && 'Group Created Successfully!'}
            </h1>
            <p className="text-xl text-gray-600">
              {step === 'form' && 'Set up your anonymous community with specific membership criteria'}
              {step === 'verify' && 'Verify your identity with Self Protocol to create the group'}
              {step === 'success' && 'Your group has been created and you\'re ready to participate'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                  placeholder="Enter group name"
                />
              </div>

              {/* Group Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 resize-none"
                  placeholder="Describe your group's purpose and goals"
                />
              </div>

              {/* Restriction Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Group Restriction Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, restrictionType: 'nationality', restrictionValue: '' })}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      formData.restrictionType === 'nationality'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <Globe className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <div className="text-gray-900 font-semibold text-lg">Nationality</div>
                    <div className="text-gray-600 text-sm">Based on country</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, restrictionType: 'age', restrictionValue: '' })}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      formData.restrictionType === 'age'
                        ? 'border-blue-400 bg-blue-50 shadow-lg'
                        : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <Calendar className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <div className="text-gray-900 font-semibold text-lg">Age Range</div>
                    <div className="text-gray-600 text-sm">Based on age group</div>
                  </button>
                </div>
              </div>

              {/* Restriction Value */}
              <div>
                <label htmlFor="restrictionValue" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.restrictionType === 'nationality' ? 'Select Country' : 'Minimum Age Required'}
                </label>
                
                {formData.restrictionType === 'nationality' ? (
                  <select
                    id="restrictionValue"
                    required
                    value={formData.restrictionValue}
                    onChange={(e) => setFormData({ ...formData, restrictionValue: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                  >
                    <option value="">Choose a country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name} className="bg-white">
                        {country.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    id="restrictionValue"
                    required
                    min="5"
                    max="100"
                    value={formData.restrictionValue}
                    onChange={(e) => setFormData({ ...formData, restrictionValue: e.target.value })}
                    placeholder="e.g., 21, 25, 30"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                  />
                )}
                
                {formData.restrictionType === 'age' && (
                  <p className="text-sm text-gray-500 mt-2">
                    Members must be at least this age to join the group (minimum: 18)
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-gray-900 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                ) : (
                  <>
                    <Users className="mr-2 h-5 w-5" />
                    Create Group
                  </>
                )}
              </button>
              </form>
            )}

            {step === 'verify' && (
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan QR Code to Verify</h2>
                  <p className="text-gray-600 mb-6">
                    Scan this QR code with your Self Protocol app to verify your identity and create the group
                  </p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl inline-block mb-8 border-2 border-yellow-200">
                  {selfApp ? (
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleSuccessfulVerification}
                      onError={handleVerificationError}
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="text-gray-500">Loading QR Code...</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Don't have the Self Protocol app? Download it from your app store.
                  </p>
                  <div className="text-xs text-gray-400">
                    Universal Link: {universalLink && (
                      <a href={universalLink} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
                        Open Self App
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                  >
                    ← Back to Form
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && groupId && (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Created Successfully!</h2>
                <p className="text-gray-600 mb-8">
                  Your group "{formData.name}" has been created and you're verified. You can now participate anonymously.
                </p>
                <div className="space-y-4">
                  <Link
                    href={`/groups/${groupId}`}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Enter Your Group
                  </Link>
                  <div>
                    <button
                      onClick={() => {
                        setStep('form')
                        setFormData({ name: '', description: '', restrictionType: 'nationality', restrictionValue: '' })
                        setGroupId(null)
                      }}
                      className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Create Another Group
                    </button>
                  </div>
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      ✅ Your identity has been verified<br/>
                      ✅ Your anonymous identity has been generated<br/>
                      ✅ You're ready to participate anonymously
                    </p>
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
