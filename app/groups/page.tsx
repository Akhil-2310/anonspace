'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Users, Globe, Calendar, ArrowRight, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { supabase } from '@/utils/supabase/client'

interface Group {
  id: string
  name: string
  description: string
  restriction_type: string
  restriction_value: string
  created_at: string
}

const countryNames: { [key: string]: string } = {
  'US': 'United States',
  'UK': 'United Kingdom', 
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany'
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    filterGroups()
  }, [groups, searchTerm, filterType])

  const fetchGroups = async () => {
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        setGroups(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterGroups = () => {
    let filtered = groups

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by restriction type
    if (filterType !== 'all') {
      filtered = filtered.filter(group => group.restriction_type === filterType)
    }

    setFilteredGroups(filtered)
  }

  const getRestrictionDisplay = (group: Group) => {
    if (group.restriction_type === 'nationality') {
      return countryNames[group.restriction_value] || group.restriction_value
    }
    return group.restriction_value
  }

  const getRestrictionIcon = (restrictionType: string) => {
    return restrictionType === 'nationality' ? Globe : Calendar
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/create-group"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Create Group
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Groups</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover anonymous communities based on nationality, age, and shared interests
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                />
              </div>

              {/* Filter */}
              <div className="md:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-300"
                >
                  <option value="all">All Groups</option>
                  <option value="nationality">By Country</option>
                  <option value="age">By Age</option>
                </select>
              </div>
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No groups found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Be the first to create a group!'
                }
              </p>
              <Link
                href="/create-group"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center"
              >
                Create First Group
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const RestrictionIcon = getRestrictionIcon(group.restriction_type)
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-purple-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                            {group.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {group.description}
                    </p>

                    <div className="flex items-center space-x-2 mb-4">
                      <RestrictionIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {group.restriction_type === 'nationality' ? 'Country' : 'Age'}: {' '}
                        <span className="font-semibold text-gray-800">
                          {getRestrictionDisplay(group)}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Created {new Date(group.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/groups/${group.id}`}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                      >
                        <span>Join Group</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-12 bg-gradient-to-r from-yellow-100 to-purple-100 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {groups.length}
                </div>
                <div className="text-gray-600">Total Groups</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {groups.filter(g => g.restriction_type === 'nationality').length}
                </div>
                <div className="text-gray-600">Country-based</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {groups.filter(g => g.restriction_type === 'age').length}
                </div>
                <div className="text-gray-600">Age-based</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
