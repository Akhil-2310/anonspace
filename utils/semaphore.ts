import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { supabase } from '@/utils/supabase/client'

/**
 * Get a Semaphore group with all members loaded from Supabase
 * This is needed for generating anonymous proofs/signals
 */
export async function getSemaphoreGroup(groupId: string): Promise<Group | null> {
  try {
    // Load all members from Supabase
    const { data: members, error } = await supabase
      .from('semaphore_members')
      .select('commitment')
      .eq('group_id', groupId)
      .order('created_at')

    if (error) {
      console.error('Error loading Semaphore members:', error)
      return null
    }

    if (!members || members.length === 0) {
      console.log('No members found for group:', groupId)
      return null
    }

    // Create Semaphore group with all members
    const commitments = members.map(member => {
      try {
        return BigInt(member.commitment)
      } catch (error) {
        console.error('Error converting commitment to BigInt:', member.commitment, error)
        throw new Error(`Invalid commitment format: ${member.commitment}`)
      }
    })
    
    console.log('Creating Semaphore group with commitments:', commitments.map(c => c.toString()))
    const semaphoreGroup = new Group(commitments)
    
    console.log(`Loaded Semaphore group for ${groupId} with ${semaphoreGroup.members.length} members`)
    return semaphoreGroup

  } catch (error) {
    console.error('Error creating Semaphore group:', error)
    return null
  }
}

/**
 * Get user's Semaphore identity for a specific group
 * This is needed for generating proofs
 */
export function getUserSemaphoreIdentity(groupId: string): Identity | null {
  try {
    const identitySeed = localStorage.getItem(`semaphore_identity_${groupId}`)
    const storedCommitment = localStorage.getItem(`semaphore_commitment_${groupId}`)
    
    console.log(`Debug - Loading identity seed for group ${groupId}:`, identitySeed)
    console.log(`Debug - Stored commitment:`, storedCommitment)
    
    if (!identitySeed) {
      console.log('No identity seed found in localStorage')
      return null
    }

    // Recreate the identity from the stored seed
    const identity = new Identity(identitySeed)
    const currentCommitment = identity.commitment.toString()
    console.log('Debug - Loaded identity commitment:', currentCommitment)
    
    // Verify that the loaded identity matches the stored commitment
    if (storedCommitment && currentCommitment !== storedCommitment) {
      console.error('CRITICAL: Identity mismatch detected!')
      console.error('Current identity commitment:', currentCommitment)
      console.error('Stored commitment:', storedCommitment)
      
      // Clear corrupted data and force rejoin
      console.warn('Clearing corrupted identity data...')
      clearCorruptedIdentity(groupId)
      return null
    }
    
    return identity
  } catch (error) {
    console.error('Error loading user Semaphore identity:', error)
    return null
  }
}

/**
 * Check if user is a member of the group (has verified and joined)
 * This is a basic check - for voting/posting, additional verification is done
 */
export function isUserMember(groupId: string): boolean {
  const verified = localStorage.getItem(`verified_${groupId}`)
  const commitment = localStorage.getItem(`semaphore_commitment_${groupId}`)
  const identity = getUserSemaphoreIdentity(groupId)
  
  // Basic check: must have verification status, commitment, and valid identity
  return !!(verified && commitment && identity)
}

/**
 * Fix identity mismatch by regenerating identity from stored commitment
 * This can happen if localStorage gets corrupted or identity is regenerated
 */
export function fixIdentityMismatch(groupId: string): boolean {
  try {
    const storedCommitment = localStorage.getItem(`semaphore_commitment_${groupId}`)
    const identityString = localStorage.getItem(`semaphore_identity_${groupId}`)
    
    if (!storedCommitment || !identityString) {
      console.log('Cannot fix identity mismatch - missing stored data')
      return false
    }
    
    // Try to recreate identity from stored string
    const identity = new Identity(identityString)
    const currentCommitment = identity.commitment.toString()
    
    console.log('Stored commitment:', storedCommitment)
    console.log('Current identity commitment:', currentCommitment)
    
    if (currentCommitment !== storedCommitment) {
      console.error('Identity mismatch detected - stored commitment does not match current identity')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error fixing identity mismatch:', error)
    return false
  }
}

/**
 * Clear corrupted identity data and force user to rejoin
 * This is a last resort when identity data is inconsistent
 */
export function clearCorruptedIdentity(groupId: string): void {
  console.warn(`Clearing corrupted identity data for group ${groupId}`)
  localStorage.removeItem(`semaphore_identity_${groupId}`)
  localStorage.removeItem(`semaphore_commitment_${groupId}`)
  localStorage.removeItem(`verified_${groupId}`)
  
  console.log('Identity data cleared. User will need to rejoin the group.')
}

/**
 * Get the user's stored commitment for a group
 * This is used to check if user should be a member
 */
export function getUserStoredCommitment(groupId: string): string | null {
  return localStorage.getItem(`semaphore_commitment_${groupId}`)
}