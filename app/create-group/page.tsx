'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Users, Globe, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { supabase } from '@/utils/supabase/client'

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }
]

const ageRanges = [
  '18-25',
  '26-35',
  '36-45',
  '46-55',
  '56+'
]

export default function CreateGroupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restrictionType: 'nationality',
    restrictionValue: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      
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
        console.error('Error creating group:', error)
        alert('Error creating group. Please try again.')
      } else {
        // Redirect to verification page with group data
        router.push(`/verify?groupId=${data[0].id}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating group. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Create a New Group</h1>
            <p className="text-xl text-gray-600">
              Set up your anonymous community with specific membership criteria
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
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
                  {formData.restrictionType === 'nationality' ? 'Select Country' : 'Select Age Range'}
                </label>
                <select
                  id="restrictionValue"
                  required
                  value={formData.restrictionValue}
                  onChange={(e) => setFormData({ ...formData, restrictionValue: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                >
                  <option value="">
                    {formData.restrictionType === 'nationality' ? 'Choose a country' : 'Choose an age range'}
                  </option>
                  {formData.restrictionType === 'nationality'
                    ? countries.map((country) => (
                        <option key={country.code} value={country.code} className="bg-white">
                          {country.name}
                        </option>
                      ))
                    : ageRanges.map((range) => (
                        <option key={range} value={range} className="bg-white">
                          {range}
                        </option>
                      ))
                  }
                </select>
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
          </div>
        </div>
      </div>
    </div>
  )
}
