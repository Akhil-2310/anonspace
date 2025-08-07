'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Users, Globe, Calendar, ArrowLeft, User } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { isUserMember } from '@/utils/semaphore'
import { Group } from "@semaphore-protocol/group"

interface GroupData {
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

export default function MyGroupsPage() {
  const [myGroups, setMyGroups] = useState<GroupData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [semaphoreGroups, setSemaphoreGroups] = useState<Record<string, Group>>({})

  useEffect(() => {
    fetchMyGroups()
  }, [])

  useEffect(() => {
    if (myGroups.length > 0) {
      loadSemaphoreGroups()
    }
  }, [myGroups])

  const fetchMyGroups = async () => {
    try {
      // Get all groups from database
      const { data: allGroups, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
        return
      }

      // Filter groups where user is a member (has verified and joined)
      const userGroups = allGroups?.filter(group => isUserMember(group.id)) || []
      setMyGroups(userGroups)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSemaphoreGroups = async () => {
    const loadedGroups: Record<string, Group> = {}
    for (const group of myGroups) {
      try {
        const { data: members, error } = await supabase
          .from('semaphore_members')
          .select('commitment')
          .eq('group_id', group.id)

        const semaphoreGroup = new Group()
        if (!error && members) {
          members.forEach(member => {
            semaphoreGroup.addMember(BigInt(member.commitment)) // Convert string back to BigInt
          })
        }
        loadedGroups[group.id] = semaphoreGroup
      } catch (error) {
        console.error(`Error loading Semaphore group ${group.id}:`, error)
        loadedGroups[group.id] = new Group()
      }
    }
    setSemaphoreGroups(loadedGroups)
  }

  const getMemberCount = (groupId: string): number => {
    const semaphoreGroup = semaphoreGroups[groupId]
    return semaphoreGroup ? semaphoreGroup.members.length : 0
  }

  const getRestrictionDisplay = (group: GroupData) => {
    if (group.restriction_type === 'nationality') {
      return countryNames[group.restriction_value] || group.restriction_value
    }
    return `${group.restriction_value}+ years old`
  }

  const getRestrictionIcon = (restrictionType: string) => {
    return restrictionType === 'nationality' ? Globe : Calendar
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading your groups...</div>
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
                href="/groups"
                className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                All Groups
              </Link>
              <Link
                href="/create-group"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold"
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
            <div className="flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">My Groups</h1>
            </div>
            <p className="text-xl text-gray-600">
              Groups you've created or joined
            </p>
          </div>

          {/* Groups Grid */}
          {myGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't created or joined any groups yet. Start by creating your first group or browse existing groups to join.
              </p>
              <div className="space-x-4">
                <Link
                  href="/create-group"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all duration-300 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Create Your First Group
                </Link>
                <Link
                  href="/groups"
                  className="bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Browse Groups
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group) => {
                const RestrictionIcon = getRestrictionIcon(group.restriction_type)
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                            {group.name}
                          </h3>
                          <div className="flex items-center space-x-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">Member</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {group.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <RestrictionIcon className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {group.restriction_type === 'nationality' ? 'Country' : 'Age'}: {' '}
                          <span className="font-semibold text-gray-800">
                            {getRestrictionDisplay(group)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Members: {' '}
                          <span className="font-semibold text-gray-800">
                            {getMemberCount(group.id)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Joined {new Date(group.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/groups/${group.id}`}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                      >
                        <span>Enter Group</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}