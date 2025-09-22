/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { PipeGeometry } from './PipeGeometry.js'
import { PipeInteraction } from './PipeInteraction.js'
// import { getColumnSize } from '../core/utils' // Unused import
import { getProjectManifest } from '../../../utils/projectManifest'
import { getAllMEPItemsFromTemporary, updateAllMEPItemsInTemporary } from '../../../utils/temporaryState'

/**
 * PipingRenderer - Using the new base interaction class
 * This demonstrates how to use the simplified base class approach
 */
export class PipingRenderer {
  constructor(scene, camera, renderer, orbitControls, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.snapLineManager = snapLineManager

    // Initialize piping subsystems
    this.pipeGeometry = new PipeGeometry()
    this.pipeInteraction = null // Will be set up in setupInteractions

    // Create piping group
    this.pipingGroup = new THREE.Group()
    this.pipingGroup.name = 'PipingGroup'
    this.scene.add(this.pipingGroup)

    // Rack parameters for positioning
    this.rackParams = {
      tierCount: 2,
      tierHeights: [{ feet: 2, inches: 0 }, { feet: 2, inches: 0 }],
      bayCount: 4,
      bayWidth: { feet: 3, inches: 0 }
    }

    console.log('🔧 PipingRenderer initialized with base classes')
  }

  /**
   * Setup interaction controls using the new base class
   * This is much simpler now - just instantiate the base class!
   */
  setupInteractions(camera, renderer, orbitControls) {
    this.pipeInteraction = new PipeInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls, 
      this.pipeGeometry, 
      this.snapLineManager
    )
    
    // The base class handles all the complex interaction logic automatically!
    // No need for hundreds of lines of manual event handling, snapping, etc.
    console.log('✅ Piping interactions setup with base class')
  }

  /**
   * Update rack parameters
   */
  updateRackParams(rackParams) {
    this.rackParams = { ...this.rackParams, ...rackParams }
    // The snapLineManager is shared, so no need to update it here
  }

  /**
   * Get rack length from the correct sources in priority order
   */
  getRackLengthFromConfig() {
    try {
      // Priority 1: Check projectManifest for active rack configuration
      const manifest = getProjectManifest()
      const activeConfig = manifest.tradeRacks?.active
      
      console.log('🔧 PipingRenderer getRackLengthFromConfig:', {
        manifest: !!manifest,
        tradeRacks: !!manifest.tradeRacks,
        activeConfig: activeConfig,
        rackLength: activeConfig?.rackLength,
        totalLength: activeConfig?.totalLength
      })
      
      if (activeConfig?.rackLength) {
        const length = this.convertToFeet(activeConfig.rackLength)
        console.log(`🔧 Using rack length from manifest: ${length}ft`)
        return length
      } else if (activeConfig?.totalLength) {
        const length = this.convertToFeet(activeConfig.totalLength)
        console.log(`🔧 Using total length from manifest: ${length}ft`)
        return length
      }
      
      // Priority 2: Check rackParameters from localStorage - fallback for legacy support
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      console.log('🔧 rackParameters from localStorage (legacy fallback):', rackParams)
      
      if (rackParams.rackLength) {
        const length = this.convertToFeet(rackParams.rackLength)
        console.log(`🔧 Using rack length from rackParameters: ${length}ft`)
        return length
      } else if (rackParams.totalLength) {
        const length = this.convertToFeet(rackParams.totalLength)
        console.log(`🔧 Using total length from rackParameters: ${length}ft`)
        return length
      }
      
      // Priority 3: Check current rackParams object
      if (this.rackParams?.rackLength) {
        const length = this.convertToFeet(this.rackParams.rackLength)
        console.log(`🔧 Using rack length from instance rackParams: ${length}ft`)
        return length
      } else if (this.rackParams?.totalLength) {
        const length = this.convertToFeet(this.rackParams.totalLength)
        console.log(`🔧 Using total length from instance rackParams: ${length}ft`)
        return length
      }
      
      // Priority 4: Calculate from bay dimensions
      const bayCount = rackParams.bayCount || this.rackParams?.bayCount || 4
      const bayWidth = rackParams.bayWidth || this.rackParams?.bayWidth || 3
      const calculatedLength = bayCount * this.convertToFeet(bayWidth)
      
      console.log(`🔧 Pipe length calculated from bay dimensions: ${calculatedLength}ft (${bayCount} bays × ${this.convertToFeet(bayWidth)}ft)`)
      return calculatedLength
      
    } catch (error) {
      console.error('Error getting rack length for pipes:', error)
      return 12 // Default fallback
    }
  }

  /**
   * Convert various length formats to feet
   */
  convertToFeet(value) {
    if (typeof value === 'number') {
      return isFinite(value) ? value : 12
    }
    if (typeof value === 'object' && value !== null) {
      const feet = value.feet || 0
      const inches = value.inches || 0
      return feet + (inches / 12)
    }
    return 12 // Default
  }

  /**
   * Recalculate tier information for all pipes - now uses base class method
   */
  recalculateTierInfo() {
    if (!this.pipeInteraction) return
    
    // The base class provides comprehensive tier calculation automatically
    const pipesGroup = this.scene.getObjectByName('PipingGroup')
    if (pipesGroup) {
      const updatedPipeData = []
      
      pipesGroup.children.forEach(pipe => {
        if (pipe.userData.type === 'pipe') {
          const tierInfo = this.pipeInteraction.calculateTier(pipe.position.y)
          pipe.userData.pipeData.tier = tierInfo.tier
          pipe.userData.pipeData.tierName = tierInfo.tierName
          
          // Collect updated pipe data
          updatedPipeData.push(pipe.userData.pipeData)
        }
      })
      
      // Update storage for all pipes at once
      if (updatedPipeData.length > 0) {
        this.saveAllPipesTierToStorage(updatedPipeData)
      }
    }
  }

  /**
   * Update piping visualization
   */
  updatePiping(mepItems) {
    if (!Array.isArray(mepItems)) return
    
    console.log(`🔧 updatePiping called with ${mepItems.length} MEP items`)
    
    this.clearPiping()
    
    const pipeItems = mepItems.filter(item => item && item.type === 'pipe')
    console.log(`🔧 Found ${pipeItems.length} pipe items to create`)
    
    pipeItems.forEach(pipe => {
      console.log(`🔧 Creating pipe from storage:`, pipe)
      this.createPipe(pipe)
    })
  }

  /**
   * Create a single pipe
   */
  createPipe(pipeData) {
    const {
      // diameter = 2, // Not used in this method
      // pipeType = 'copper', // Not used in this method
      tier = 1,
      position = 'bottom'
    } = pipeData

    // Get pipe length directly from rack parameters/localStorage (should match rack length exactly)
    const rackLength = this.getRackLengthFromConfig()
    const pipeLength = rackLength * 0.3048 // Convert feet to meters
    
    console.log(`🔧 Creating pipe: rackLength=${rackLength}ft, pipeLength=${pipeLength}m`)

    let pipePosition
    let calculatedTierInfo = null
    
    // Check if this pipe has a saved position
    if (pipeData.position && typeof pipeData.position === 'object' && pipeData.position.x !== undefined) {
      pipePosition = new THREE.Vector3(
        pipeData.position.x,
        pipeData.position.y,
        pipeData.position.z
      )
      
      // Calculate tier info using base class method
      if (!pipeData.tierName && this.pipeInteraction) {
        calculatedTierInfo = this.pipeInteraction.calculateTier(pipeData.position.y)
      }
    } else {
      // Calculate default position within tier
      const yPos = this.calculatePipeYPosition(pipeData, tier, position)
      
      const postSizeInches = this.snapLineManager?.getPostSize() || 2
      const postSizeM = postSizeInches * 0.0254
      const xPos = postSizeM / 2
      
      pipePosition = new THREE.Vector3(xPos, yPos, 0)
      
      // Calculate tier info using base class method
      if (this.pipeInteraction) {
        calculatedTierInfo = this.pipeInteraction.calculateTier(yPos)
      }
    }
    
    // Update pipe data with tier info if calculated
    if (calculatedTierInfo && !pipeData.tierName) {
      pipeData.tier = calculatedTierInfo.tier
      pipeData.tierName = calculatedTierInfo.tierName
      
      // Save updated tier info to storage immediately
      this.savePipeTierToStorage(pipeData)
    }
    
    // Create pipe group using geometry
    const pipeGroup = this.pipeGeometry.createPipeGroup(
      pipeData,
      pipeLength,
      pipePosition
    )
    
    this.pipingGroup.add(pipeGroup)
  }

  /**
   * Save pipe tier information to storage
   */
  savePipeTierToStorage(pipeData) {
    try {
      const storedItems = getAllMEPItemsFromTemporary()
      const baseId = pipeData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId && item.type === 'pipe') {
          return {
            ...item,
            tier: pipeData.tier,
            tierName: pipeData.tierName
          }
        }
        return item
      })
      
      // Update temporary state with tier information
      updateAllMEPItemsInTemporary(updatedItems)
      
      console.log(`🔧 Saved pipe tier info to storage: ${pipeData.tierName}`)
      
    } catch (error) {
      console.error('Error saving pipe tier to storage:', error)
    }
  }

  /**
   * Save tier information for all pipes to storage (batch update)
   */
  saveAllPipesTierToStorage(pipeDataArray) {
    try {
      const storedItems = getAllMEPItemsFromTemporary()
      
      const updatedItems = storedItems.map(item => {
        if (item.type === 'pipe') {
          // Find matching pipe data
          const matchingPipeData = pipeDataArray.find(pipeData => {
            const baseId = pipeData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            return itemBaseId === baseId
          })
          
          if (matchingPipeData) {
            return {
              ...item,
              tier: matchingPipeData.tier,
              tierName: matchingPipeData.tierName
            }
          }
        }
        return item
      })
      
      // Update temporary state with tier information
      updateAllMEPItemsInTemporary(updatedItems)
      
      console.log(`🔧 Saved tier info for ${pipeDataArray.length} pipes to storage`)
      
    } catch (error) {
      console.error('Error saving pipes tier to storage:', error)
    }
  }

  /**
   * Calculate pipe Y position within tier
   */
  calculatePipeYPosition(pipeData, tier = 1, position = 'bottom') {
    // position parameter is for future use if needed
    // Get snap lines with better error handling
    let snapLines = null
    try {
      snapLines = this.snapLineManager?.getSnapLinesFromRackGeometry()
    } catch (error) {
      console.warn('⚠️ Error getting snap lines:', error)
    }
    
    if (!snapLines || !snapLines.horizontal || !Array.isArray(snapLines.horizontal)) {
      console.warn('⚠️ No snap lines found or invalid format, using fallback position')
      return 2 - (tier - 1) * 2 // Fallback
    }

    const beamTopSurfaces = snapLines.horizontal
      .filter(line => line && line.type === 'beam_top' && typeof line.y === 'number')
      .sort((a, b) => b.y - a.y)
    
    if (beamTopSurfaces.length === 0) {
      console.warn('⚠️ No beam top surfaces found, using fallback position')
      return 2 - (tier - 1) * 2
    }
    
    // Calculate pipe dimensions
    const diameter = pipeData.diameter || 2
    const insulation = pipeData.insulation || 0
    const diameterM = diameter * 0.0254
    const insulationM = insulation * 0.0254
    const totalHeight = diameterM + (2 * insulationM)
    
    // Tier mapping: similar to ducts but for circular pipes
    const tierIndex = (tier - 1) * 2 + 1
    
    if (tierIndex < beamTopSurfaces.length) {
      const tierBeamTop = beamTopSurfaces[tierIndex]
      const pipeCenterY = tierBeamTop.y + (totalHeight / 2)
      return pipeCenterY
    }
    
    // Fallback - use the lowest available beam top
    console.warn(`⚠️ Tier ${tier} not available, using lowest beam`)
    const lowestBeam = beamTopSurfaces[beamTopSurfaces.length - 1]
    return lowestBeam.y + (totalHeight / 2)
  }

  /**
   * Clear all piping - now uses base class methods
   */
  clearPiping() {
    if (this.pipeInteraction?.selectedObject) {
      this.pipeInteraction.deselectObject()
    }
    
    while (this.pipingGroup.children.length > 0) {
      const child = this.pipingGroup.children[0]
      this.pipingGroup.remove(child)
      
      // Use base class dispose method
      if (this.pipeInteraction) {
        this.pipeInteraction.disposeObject(child)
      }
    }
  }

  /**
   * Get piping group
   */
  getPipingGroup() {
    return this.pipingGroup
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.pipingGroup.visible = visible
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.pipeInteraction?.dispose()
    this.pipeGeometry?.dispose()
    
    this.clearPiping()
    this.scene.remove(this.pipingGroup)
  }

  // Backward compatibility methods
  get selectedPipe() {
    return this.pipeInteraction?.selectedObject
  }

  set selectedPipe(pipe) {
    if (this.pipeInteraction) {
      if (pipe) {
        this.pipeInteraction.selectObject(pipe)
      } else {
        this.pipeInteraction.deselectObject()
      }
    }
  }
}

export default PipingRenderer