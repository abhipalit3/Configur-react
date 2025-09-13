/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { initializeStorageSystem } from './initializeStorage'
import { getProjectManifest, updateTradeRackConfiguration, updateMEPItems } from './projectManifest'
import { getTemporaryState, updateCameraState, updateUIState } from './temporaryState'

/**
 * Test suite for the new storage system
 */
export const testStorageSystem = async () => {
  console.log('🧪 Running storage system tests...')
  
  const results = {
    initialization: false,
    manifestOperations: false,
    temporaryStateOperations: false,
    dataIntegrity: false,
    errors: []
  }
  
  try {
    // Test 1: Initialization
    console.log('📝 Testing initialization...')
    const initResult = await initializeStorageSystem()
    results.initialization = initResult.success
    
    // Test 2: Manifest operations
    console.log('📝 Testing manifest operations...')
    const manifest = getProjectManifest()
    
    // Test updating a trade rack configuration
    const testConfig = {
      id: 'test_config_' + Date.now(),
      name: 'Test Configuration',
      mountType: 'ceiling',
      tierCount: 3,
      rackLength: { feet: 10, inches: 0 },
      rackWidth: { feet: 4, inches: 0 }
    }
    
    updateTradeRackConfiguration(testConfig, true)
    
    // Test updating MEP items
    const testMepItems = [
      { id: 'test_duct_1', type: 'duct', name: 'Test Duct', color: '#4A90E2' },
      { id: 'test_pipe_1', type: 'pipe', name: 'Test Pipe', color: '#27AE60' }
    ]
    
    updateMEPItems(testMepItems, 'all')
    
    // Verify data was saved
    const updatedManifest = getProjectManifest()
    results.manifestOperations = 
      updatedManifest.tradeRacks.configurations.some(c => c.id === testConfig.id) &&
      updatedManifest.mepItems.totalCount === testMepItems.length
    
    // Test 3: Temporary state operations
    console.log('📝 Testing temporary state operations...')
    const tempState = getTemporaryState()
    
    // Test camera state update
    updateCameraState({
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      zoom: 2.0
    })
    
    // Test UI state update
    updateUIState({
      activePanel: 'test',
      selectedObjects: ['obj1', 'obj2']
    })
    
    // Verify temporary state was updated
    const updatedTempState = getTemporaryState()
    results.temporaryStateOperations = 
      updatedTempState.camera.position.x === 1 &&
      updatedTempState.ui.activePanel === 'test'
    
    // Test 4: Data integrity
    console.log('📝 Testing data integrity...')
    const finalManifest = getProjectManifest()
    const finalTempState = getTemporaryState()
    
    results.dataIntegrity = 
      !!finalManifest.version &&
      !!finalTempState.version &&
      finalManifest.projectId &&
      finalTempState.sessionId
    
  } catch (error) {
    results.errors.push(error.message)
    console.error('❌ Test error:', error)
  }
  
  // Summary
  console.log('🧪 Storage system test results:', results)
  
  const allPassed = Object.keys(results)
    .filter(key => key !== 'errors')
    .every(key => results[key] === true)
  
  if (allPassed && results.errors.length === 0) {
    console.log('✅ All storage system tests passed!')
  } else {
    console.log('❌ Some storage system tests failed:', {
      passed: Object.keys(results).filter(key => key !== 'errors' && results[key] === true),
      failed: Object.keys(results).filter(key => key !== 'errors' && results[key] === false),
      errors: results.errors
    })
  }
  
  return results
}