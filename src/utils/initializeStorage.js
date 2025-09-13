/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { initializeProject } from './projectManifest'
import { initializeTemporaryState } from './temporaryState'
import { performCompleteStorageMigration } from './storageMigration'

/**
 * Initialize the complete storage system
 * This function should be called on app startup
 */
export const initializeStorageSystem = async () => {
  console.log('🚀 Initializing DPR Configur storage system...')
  
  try {
    // Step 1: Perform migration if needed
    const migrationResults = performCompleteStorageMigration()
    
    // Step 2: Initialize project manifest
    const manifest = initializeProject()
    
    // Step 3: Initialize temporary state
    const tempState = initializeTemporaryState()
    
    console.log('✅ Storage system initialized successfully:', {
      migrationCompleted: migrationResults.migrationNeeded,
      projectId: manifest.projectId,
      sessionId: tempState.sessionId,
      mepItemsCount: manifest.mepItems.totalCount,
      configurationsCount: manifest.tradeRacks.totalCount
    })
    
    return {
      success: true,
      manifest,
      tempState,
      migrationResults
    }
  } catch (error) {
    console.error('❌ Failed to initialize storage system:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get storage system status
 */
export const getStorageSystemStatus = () => {
  try {
    const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
    const tempState = JSON.parse(localStorage.getItem('temporaryState') || '{}')
    
    return {
      manifestExists: !!manifest.version,
      tempStateExists: !!tempState.version,
      manifestSize: new Blob([JSON.stringify(manifest)]).size,
      tempStateSize: new Blob([JSON.stringify(tempState)]).size,
      legacyKeysPresent: [
        'rackParameters',
        'configurMepItems', 
        'cameraState',
        'tradeRackConfigurations',
        'rackTemporaryState',
        'projectName'
      ].filter(key => localStorage.getItem(key) !== null)
    }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Clean up any legacy localStorage keys
 */
export const cleanupLegacyStorage = () => {
  const legacyKeys = [
    'rackParameters',
    'configurMepItems', 
    'cameraState',
    'tradeRackConfigurations',
    'rackTemporaryState',
    'projectName'
  ]
  
  const removedKeys = []
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key)
      removedKeys.push(key)
    }
  })
  
  console.log(`🗑️ Cleaned up ${removedKeys.length} legacy keys:`, removedKeys)
  return removedKeys
}

/**
 * Debug rack temporary state
 */
export const debugRackTemporaryState = () => {
  const tempState = JSON.parse(localStorage.getItem('temporaryState') || '{}')
  
  console.group('🔧 Rack Temporary State Debug')
  console.log('Full temporary state:', tempState)
  console.log('Rack section:', tempState.rack)
  console.log('Temporary position:', tempState.rack?.temporaryPosition)
  console.log('Is dragging:', tempState.rack?.isDragging)
  console.groupEnd()
  
  return tempState.rack
}