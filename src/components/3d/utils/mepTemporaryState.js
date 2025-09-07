/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Utility functions for MEP temporary state management
 * Works with the rack configuration temporary state system
 */

/**
 * Save MEP items to temporary state (works with rack temporary state system)
 * This ensures MEP changes persist across page refreshes until explicitly saved
 */
export function saveMepItemsToTemporaryState(mepItems, source = 'mep') {
  try {
    // Get current rack parameters
    const rackParams = localStorage.getItem('rackParameters')
    if (!rackParams) {
      console.warn('⚠️ No rack parameters found for temporary state')
      return
    }
    
    const parsedRackParams = JSON.parse(rackParams)
    
    // Update temporary state with current MEP items
    const tempState = {
      ...parsedRackParams,
      mepItems: mepItems,
      lastModified: new Date().toISOString(),
      isTemporary: true
    }
    
    localStorage.setItem('configurTempRackState', JSON.stringify(tempState))
    console.log(`💾 Saved MEP items to temporary state (${source})`)
  } catch (error) {
    console.warn('⚠️ Could not save MEP items to temporary state:', error)
  }
}

/**
 * Check if there are unsaved MEP changes
 */
export function hasUnsavedMepChanges() {
  try {
    const tempState = localStorage.getItem('configurTempRackState')
    if (!tempState) return false
    
    const parsedTempState = JSON.parse(tempState)
    return !!(parsedTempState.isTemporary && parsedTempState.mepItems)
  } catch (error) {
    console.warn('⚠️ Error checking for unsaved MEP changes:', error)
    return false
  }
}

/**
 * Get MEP items from temporary state
 */
export function getMepItemsFromTemporaryState() {
  try {
    const tempState = localStorage.getItem('configurTempRackState')
    if (!tempState) return null
    
    const parsedTempState = JSON.parse(tempState)
    return parsedTempState.mepItems || null
  } catch (error) {
    console.warn('⚠️ Error getting MEP items from temporary state:', error)
    return null
  }
}