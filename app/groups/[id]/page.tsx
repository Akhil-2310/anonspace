'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Shield, ArrowLeft, Plus, ThumbsUp, ThumbsDown, Send, Users, QrCode, CheckCircle } from 'lucide-react'
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
import { getSemaphoreGroup, getUserSemaphoreIdentity, isUserMember, fixIdentityMismatch, clearCorruptedIdentity, getUserStoredCommitment } from '@/utils/semaphore'
import { generateProof, verifyProof } from "@semaphore-protocol/proof"

interface GroupData {
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
  anonymous_yes_votes?: number
  anonymous_no_votes?: number
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
  const [group, setGroup] = useState<GroupData | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [newProposal, setNewProposal] = useState({ name: '', description: '' })
  const [newPost, setNewPost] = useState('')
  const [showNewProposal, setShowNewProposal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Join group verification states
  const [isJoining, setIsJoining] = useState(false)
  const [joinStep, setJoinStep] = useState<'check' | 'verify' | 'success'>('check')
  const [isMember, setIsMember] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState("")
  const [userId] = useState(() => uuidv4())
  const [memberCount, setMemberCount] = useState(0)
  
  // Proof generation state
  const [isGeneratingProof, setIsGeneratingProof] = useState(false)

  useEffect(() => {
    fetchGroupData()
    checkMembershipStatus()
    fetchMemberCount()

  }, [groupId])

  const checkMembershipStatus = async () => {
    // Check if user is already verified for this group locally
    const verified = localStorage.getItem(`verified_${groupId}`)
    const commitment = localStorage.getItem(`semaphore_commitment_${groupId}`)
    
    if (verified && commitment) {
      setIsVerified(true)
      
      // Check if they're actually a member in Supabase (in case of data sync issues)
      try {
        const { data, error } = await supabase
          .from('semaphore_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('commitment', commitment)
          .single()
        
        setIsMember(!!data && !error)
      } catch (error) {
        console.error('Error checking membership:', error)
        setIsMember(false)
      }
    }
  }

  const handleJoinGroup = async () => {
    setIsJoining(true)
    
    if (!isVerified) {
      // User needs to verify first
      setJoinStep('verify')
      await initializeSelfApp()
    } else {
      // User is already verified and member
      setJoinStep('success')
    }
    
    setIsJoining(false)
  }

  const initializeSelfApp = async () => {
    if (!group) return
    
    try {
      const getMinimumAgeFromValue = (ageValue: string): number => {
        const age = parseInt(ageValue)
        return age >= 5 ? age : 5
      }

      const app = new SelfAppBuilder({
        version: 2,
        appName: "AnonSpace",
        scope: "anonspace",
        endpoint: "https://524bf20dd866.ngrok-free.app/api/verify-self",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "uuid",
        userDefinedData: `Join group: ${group.name} (${group.restriction_type}: ${group.restriction_value})`,
        devMode: true,
        disclosures: {
          // Only disclose what's needed for this group's restriction
          ...(group.restriction_type === 'age' && { 
            minimumAge: getMinimumAgeFromValue(group.restriction_value) 
          }),
          ...(group.restriction_type === 'nationality' && { nationality: true }),
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

  const handleSuccessfulJoinVerification = async () => {
    try {
      console.log("Self Protocol verification successful for joining!")
      
      // Generate Semaphore identity for this group using a simple seed
      const identitySeed = `${groupId}_${userId}`
      const semaphoreIdentity = new Identity(identitySeed)
      
      // Store the seed to recreate the same identity later
      const identityKey = `semaphore_identity_${groupId}`
      localStorage.setItem(identityKey, identitySeed)
      
      // Store the commitment (safe to be public)
      const commitment = semaphoreIdentity.commitment.toString()
      console.log('Generated Semaphore commitment for joining:', commitment)
      
      // Store new member's commitment in Supabase
      const { error: insertError } = await supabase
        .from('semaphore_members')
        .insert([{
          group_id: groupId,
          commitment: commitment
        }])
      
      if (insertError && !insertError.message.includes('duplicate')) {
        throw new Error(`Failed to add member: ${insertError.message}`)
      }
      
      // Store verification status and commitment - this makes them a member
      localStorage.setItem(`verified_${groupId}`, 'true')
      localStorage.setItem(`semaphore_commitment_${groupId}`, commitment)
      
      setIsVerified(true)
      setIsMember(true)
      setJoinStep('success')
      
      // Update member count
      fetchMemberCount()
    } catch (error) {
      console.error('Error during join verification:', error)
      alert('Failed to join group. Please try again.')
      setJoinStep('check')
    }
  }

  const handleJoinVerificationError = () => {
    console.error("Self Protocol verification failed for joining")
    alert('Identity verification failed. Please try again.')
    setJoinStep('check')
  }



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

      // Fetch anonymous posts
      const { data: postsData } = await supabase
        .from('anonymous_posts')
        .select('id, content, created_at')
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

  const fetchMemberCount = async () => {
    try {
      const { data: members, error } = await supabase
        .from('semaphore_members')
        .select('commitment')
        .eq('group_id', groupId)

      if (!error && members) {
        setMemberCount(members.length)
      }
    } catch (error) {
      console.error('Error fetching member count:', error)
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

    setIsGeneratingProof(true)

    try {
      // Get the Semaphore group with all members
      const semaphoreGroup = await getSemaphoreGroup(groupId)
      if (!semaphoreGroup) {
        throw new Error('Could not load Semaphore group')
      }

      // Get user's identity for this group
      const identity = getUserSemaphoreIdentity(groupId)
      if (!identity) {
        throw new Error('User identity not found - please verify first')
      }

      // Check if user is actually a member
      console.log('Debug - User commitment:', identity.commitment.toString())
      console.log('Debug - Group members:', semaphoreGroup.members.map(m => m.toString()))
      
      // Also check what's stored in localStorage for debugging
      const storedCommitment = localStorage.getItem(`semaphore_commitment_${groupId}`)
      console.log('Debug - Stored commitment in localStorage:', storedCommitment)
      
      const userCommitmentString = identity.commitment.toString()
      const isMember = semaphoreGroup.members.some(member => member.toString() === userCommitmentString)
      
      if (!isMember) {
        console.error('User commitment not found in group members')
        console.error('User commitment:', userCommitmentString)
        console.error('Stored commitment:', storedCommitment)
        console.error('Group members:', semaphoreGroup.members.map(m => m.toString()))
        
        // Try to diagnose and fix the identity mismatch
        fixIdentityMismatch(groupId)
        
        // Check if the stored commitment matches any group member
        if (storedCommitment && semaphoreGroup.members.some(member => member.toString() === storedCommitment)) {
          // The stored commitment is valid but current identity is wrong
          console.warn('Stored commitment is valid but current identity is corrupted')
          clearCorruptedIdentity(groupId)
          throw new Error(`Identity corruption detected. Your identity data has been cleared. Please refresh the page and rejoin the group to verify again.`)
        } else if (storedCommitment) {
          // The stored commitment doesn't match any group member
          console.warn('Stored commitment is not found in group members - clearing corrupted data')
          clearCorruptedIdentity(groupId)
          throw new Error(`Your membership data is corrupted (stored commitment not found in group). Data has been cleared. Please refresh the page and join the group.`)
        } else {
          // No stored commitment at all
          throw new Error(`You are not a verified member of this group. Please join the group first.`)
        }
      }

      console.log(`Generating anonymous ${voteType} vote proof...`)

      // Create scope specific to this proposal to prevent cross-proposal voting
      const scopeString = `${semaphoreGroup.root.toString()}_proposal_${proposalId}`
      // Use a simple hash to create a manageable BigInt scope
      let hash = 0
      for (let i = 0; i < scopeString.length; i++) {
        const char = scopeString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      const scope = BigInt(Math.abs(hash))
      
      // Hash the vote message for privacy
      const voteMessage = `vote_${voteType}_${proposalId}`
      // Use a simple hash to create a manageable BigInt message
      let messageHashValue = 0
      for (let i = 0; i < voteMessage.length; i++) {
        const char = voteMessage.charCodeAt(i)
        messageHashValue = ((messageHashValue << 5) - messageHashValue) + char
        messageHashValue = messageHashValue & messageHashValue // Convert to 32-bit integer
      }
      const messageHash = BigInt(Math.abs(messageHashValue))

      const proof = await generateProof(identity, semaphoreGroup, messageHash, scope)
      
      console.log('Vote proof generated successfully:', proof)
      
      // Verify the proof before storing it
      const isValidProof = await verifyProof(proof)
      if (!isValidProof) {
        throw new Error('Generated proof is invalid - verification failed')
      }
      console.log('Vote proof verified successfully ✅')

      // Store the anonymous vote
      const { error: voteError } = await supabase
        .from('anonymous_votes')
        .insert([{
          proposal_id: proposalId,
          group_id: groupId,
          vote_type: voteType,
          proof: proof,
          nullifier_hash: proof.nullifier,
          scope: scopeString,
          verified: true
        }])

      if (voteError) {
        if (voteError.message.includes('duplicate') || voteError.message.includes('nullifier_hash')) {
          throw new Error('You have already voted on this proposal anonymously.')
        }
        throw voteError
      }

      // Update the proposal vote counts
      const updateField = voteType === 'yes' ? 'anonymous_yes_votes' : 'anonymous_no_votes'
      const currentCount = voteType === 'yes' ? (proposal.anonymous_yes_votes || 0) : (proposal.anonymous_no_votes || 0)
      
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ [updateField]: currentCount + 1 })
        .eq('id', proposalId)

      if (updateError) {
        throw updateError
      }

      console.log(`Anonymous ${voteType} vote recorded successfully`)
      
      // Refresh data to show updated counts
      await fetchGroupData()

      alert(`Anonymous ${voteType} vote submitted successfully! 🎉`)

    } catch (error) {
      console.error('Error voting:', error)
      alert(`Failed to vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingProof(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setIsGeneratingProof(true)

    try {
      // Get the Semaphore group with all members
      const semaphoreGroup = await getSemaphoreGroup(groupId)
      if (!semaphoreGroup) {
        throw new Error('Could not load Semaphore group')
      }

      // Get user's identity for this group
      const identity = getUserSemaphoreIdentity(groupId)
      if (!identity) {
        throw new Error('User identity not found - please verify first')
      }

      // Check if user is actually a member
      const userCommitmentString = identity.commitment.toString()
      const isMember = semaphoreGroup.members.some(member => member.toString() === userCommitmentString)
      
      if (!isMember) {
        console.error('User commitment not found in group members for posting')
        console.error('User commitment:', userCommitmentString)
        console.error('Group members:', semaphoreGroup.members.map(m => m.toString()))
        throw new Error('You are not a verified member of this group')
      }

      console.log('Generating anonymous post proof...')

      // Create scope for posts in this group
      const scopeString = `${semaphoreGroup.root.toString()}_posts_${groupId}`
      // Use a simple hash to create a manageable BigInt scope
      let hash = 0
      for (let i = 0; i < scopeString.length; i++) {
        const char = scopeString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      const scope = BigInt(Math.abs(hash))
      
      // Hash the post content for privacy
      const contentHash = Array.from(new TextEncoder().encode(newPost))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      // Use a simple hash to create a manageable BigInt message
      let messageHashValue = 0
      for (let i = 0; i < newPost.length; i++) {
        const char = newPost.charCodeAt(i)
        messageHashValue = ((messageHashValue << 5) - messageHashValue) + char
        messageHashValue = messageHashValue & messageHashValue // Convert to 32-bit integer
      }
      const messageHash = BigInt(Math.abs(messageHashValue))

      const proof = await generateProof(identity, semaphoreGroup, messageHash, scope)
      
      console.log('Post proof generated successfully:', proof)
      
      // Verify the proof before storing it
      const isValidProof = await verifyProof(proof)
      if (!isValidProof) {
        throw new Error('Generated proof is invalid - verification failed')
      }
      console.log('Post proof verified successfully ✅')

      // Store the anonymous post
      const { error } = await supabase
        .from('anonymous_posts')
        .insert([{
          group_id: groupId,
          content: newPost, // Store actual content for display
          content_hash: contentHash, // Also store hash for verification
          proof: proof,
          nullifier_hash: proof.nullifier,
          scope: scopeString,
          verified: true
        }])

      if (error) {
        throw error
      }

      console.log('Anonymous post recorded successfully')
      
      setNewPost('')
      await fetchGroupData()

      alert('Anonymous post submitted successfully! 🎉')

    } catch (error) {
      console.error('Error creating post:', error)
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingProof(false)
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
                <p className="text-gray-500 text-sm flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
            <p className="text-gray-600">{group.description}</p>
            
            {/* Member Status - Show if user is verified and member */}
            {isUserMember(groupId) && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-green-700 font-semibold">✅ You are a verified member</p>
                    <p className="text-green-600 text-sm">You can vote anonymously on proposals and post anonymously using zero-knowledge proofs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Join Group Flow - Show if user is not a member */}
            {!isUserMember(groupId) && (
              <div className="mt-6">
                {joinStep === 'check' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-700 font-semibold">Join this group</p>
                        <p className="text-blue-600 text-sm">Verify your identity to participate anonymously</p>
                      </div>
                      <button
                        onClick={handleJoinGroup}
                        disabled={isJoining}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {isJoining ? 'Processing...' : 'Join Group'}
                      </button>
                    </div>
                  </div>
                )}

                {joinStep === 'verify' && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Identity</h3>
                      <p className="text-gray-600 mb-6">
                        Scan this QR code with your Self Protocol app to verify you meet the group requirements
                      </p>
                      
                      <div className="bg-yellow-50 p-4 rounded-xl inline-block mb-6 border-2 border-yellow-200">
                        {selfApp ? (
                          <SelfQRcodeWrapper
                            selfApp={selfApp}
                            onSuccess={handleSuccessfulJoinVerification}
                            onError={handleJoinVerificationError}
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center">
                            <div className="text-gray-500">Loading QR Code...</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">
                          Don't have the Self Protocol app? Download it from your app store.
                        </p>
                        {universalLink && (
                          <div className="text-xs text-gray-400">
                            <a href={universalLink} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
                              Open Self App
                            </a>
                          </div>
                        )}
                        <button
                          onClick={() => setJoinStep('check')}
                          className="text-gray-600 hover:text-gray-700 transition-colors font-medium text-sm"
                        >
                          ← Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {joinStep === 'success' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Group!</h3>
                      <p className="text-green-600 mb-4">
                        You've successfully joined and can now participate anonymously.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Proposals Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Proposals</h2>
                {isUserMember(groupId) ? (
                  <button
                    onClick={() => setShowNewProposal(!showNewProposal)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Proposal</span>
                  </button>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Join the group to create proposals
                  </div>
                )}
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
                        {isUserMember(groupId) ? (
                          <div className="space-y-3">
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleVote(proposal.id, 'yes')}
                                disabled={isGeneratingProof}
                                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{(proposal.anonymous_yes_votes || 0)}</span>
                                {isGeneratingProof && <span className="text-xs">🔄</span>}
                              </button>
                              <button
                                onClick={() => handleVote(proposal.id, 'no')}
                                disabled={isGeneratingProof}
                                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span>{(proposal.anonymous_no_votes || 0)}</span>
                                {isGeneratingProof && <span className="text-xs">🔄</span>}
                              </button>
                            </div>
                            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg">
                              🔐 <strong>Anonymous Voting:</strong> Your vote is cryptographically anonymous using zero-knowledge proofs
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-xl">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{(proposal.anonymous_yes_votes || 0)}</span>
                              </div>
                              <div className="flex items-center space-x-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-xl">
                                <ThumbsDown className="h-4 w-4" />
                                <span>{(proposal.anonymous_no_votes || 0)}</span>
                              </div>
                            </div>
                            <span className="text-gray-500 text-sm">
                              Join the group to vote anonymously
                            </span>
                          </div>
                        )}
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
              
              {isUserMember(groupId) ? (
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-gray-200">
                  <div className="mb-4 text-xs text-purple-600 bg-purple-50 p-3 rounded-lg">
                    🔐 <strong>Anonymous Posts:</strong> Your posts will be submitted anonymously using zero-knowledge proofs. Content is hashed for privacy.
                  </div>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <textarea
                      placeholder="Share something anonymously with the community..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 resize-none transition-all duration-300"
                      rows={3}
                      required
                      disabled={isGeneratingProof}
                    />
                    <button
                      type="submit"
                      disabled={isGeneratingProof}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isGeneratingProof ? 'Generating Proof...' : 'Post Anonymously'}</span>
                      {isGeneratingProof && <span className="text-xs">🔄</span>}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200 text-center">
                  <p className="text-gray-500">Join the group to share posts with the community</p>
                </div>
              )}

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
