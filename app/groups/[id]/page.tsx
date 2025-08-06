'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Shield, ArrowLeft, Plus, ThumbsUp, ThumbsDown, Send, Users } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'

interface Group {
  id: string
  name: string
  description: string
  restriction_type: string
  restriction_value: string
  created_at: string
}

interface Proposal {
  id: string
  name: string
  description: string
  yes_votes: number
  no_votes: number
  created_at: string
}

interface Post {
  id: string
  content: string
  created_at: string
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string
  const [group, setGroup] = useState<Group | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [newProposal, setNewProposal] = useState({ name: '', description: '' })
  const [newPost, setNewPost] = useState('')
  const [showNewProposal, setShowNewProposal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchGroupData()
  }, [groupId])

  const fetchGroupData = async () => {
    
    
    try {
      // Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      // Fetch proposals
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      setGroup(groupData)
      setProposals(proposalsData || [])
      setPosts(postsData || [])
    } catch (error) {
      console.error('Error fetching group data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('proposals')
        .insert([
          {
            group_id: groupId,
            name: newProposal.name,
            description: newProposal.description,
            yes_votes: 0,
            no_votes: 0
          }
        ])

      if (!error) {
        setNewProposal({ name: '', description: '' })
        setShowNewProposal(false)
        fetchGroupData()
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
    }
  }

  const handleVote = async (proposalId: string, voteType: 'yes' | 'no') => {
   
    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) return

    try {
      const updateData = voteType === 'yes' 
        ? { yes_votes: proposal.yes_votes + 1 }
        : { no_votes: proposal.no_votes + 1 }

      const { error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', proposalId)

      if (!error) {
        fetchGroupData()
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

   

    try {
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            group_id: groupId,
            content: newPost
          }
        ])

      if (!error) {
        setNewPost('')
        fetchGroupData()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Group not found</div>
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

      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Group Header */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-xl border-l-4 border-yellow-400">
            <div className="flex items-center space-x-4 mb-4">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                <p className="text-gray-600">
                  {group.restriction_type === 'nationality' ? 'Country' : 'Age'}: {group.restriction_value}
                </p>
              </div>
            </div>
            <p className="text-gray-600">{group.description}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Proposals Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Proposals</h2>
                <button
                  onClick={() => setShowNewProposal(!showNewProposal)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Proposal</span>
                </button>
              </div>

              {showNewProposal && (
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-gray-200">
                  <form onSubmit={handleCreateProposal} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Proposal title"
                      value={newProposal.name}
                      onChange={(e) => setNewProposal({ ...newProposal, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                      required
                    />
                    <textarea
                      placeholder="Proposal description"
                      value={newProposal.description}
                      onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 resize-none transition-all duration-300"
                      rows={3}
                      required
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewProposal(false)}
                        className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-purple-400 hover:shadow-2xl transition-all duration-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{proposal.name}</h3>
                    <p className="text-gray-600 mb-4">{proposal.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleVote(proposal.id, 'yes')}
                          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{proposal.yes_votes}</span>
                        </button>
                        <button
                          onClick={() => handleVote(proposal.id, 'no')}
                          className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{proposal.no_votes}</span>
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Posts Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Posts</h2>
              
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-gray-200">
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <textarea
                    placeholder="Share something with the community..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 resize-none transition-all duration-300"
                    rows={3}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                  >
                    <Send className="h-4 w-4" />
                    <span>Post</span>
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-blue-400 hover:shadow-2xl transition-all duration-300">
                    <p className="text-gray-900 mb-2">{post.content}</p>
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
