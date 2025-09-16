/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { RackSnapLineManager, DuctGeometry } from '../ductwork'
import { DuctInteraction } from './DuctInteraction.js'
// import { getProjectManifest } from '../../../utils/projectManifest' // Unused import
import { getAllMEPItemsFromTemporary, updateAllMEPItemsInTemporary } from '../../../utils/temporaryState'

/**
 * DuctworkRenderer - Using the new base interaction class
 * This demonstrates how to use the simplified base class approach
 */
export class DuctworkRenderer {
  constructor(scene, rackParams = {}) {
    this.scene = scene
    this.rackParams = rackParams
    
    // Create main ductwork group
    this.ductworkGroup = new THREE.Group()
    this.ductworkGroup.name = 'DuctworkGroup'
    this.scene.add(this.ductworkGroup)
    
    // Initialize modular components
    try {
      this.snapLineManager = new RackSnapLineManager(scene, rackParams)
      this.ductGeometry = new DuctGeometry()
      this.ductInteraction = null // Will be set up in setupInteractions
    } catch (error) {
      console.error('🏭 Error initializing modular components:', error)
      throw error
    }
    
    // Create initial persistent snap lines
    setTimeout(() => {
      try {
        this.snapLineManager.createPersistentSnapLines()
      } catch (error) {
        console.error('🏭 Error creating persistent snap lines:', error)
      }
    }, 100)
  }

  /**
   * Setup interaction controls using the new base class
   * This is much simpler now - just instantiate the base class!
   */
  setupInteractions(camera, renderer, orbitControls) {
    this.ductInteraction = new DuctInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls, 
      this.ductGeometry, 
      this.snapLineManager
    )
    
    // The base class handles all the complex interaction logic automatically!
    // No need for hundreds of lines of manual event handling, snapping, etc.
  }

  /**
   * Update rack parameters
   */
  updateRackParams(rackParams) {
    this.rackParams = { ...this.rackParams, ...rackParams }
    this.snapLineManager.updateRackParams(this.rackParams)
    this.refreshDuctwork()
  }

  /**
   * Recalculate tier information for all ducts - now uses base class method
   */
  recalculateTierInfo() {
    if (!this.ductInteraction) return
    
    // The base class provides comprehensive tier calculation automatically
    const ductsGroup = this.scene.getObjectByName('DuctsGroup')
    if (ductsGroup) {
      const updatedDuctData = []
      
      ductsGroup.children.forEach(duct => {
        if (duct.userData.type === 'duct') {
          const tierInfo = this.ductInteraction.calculateTier(duct.position.y)
          duct.userData.ductData.tier = tierInfo.tier
          duct.userData.ductData.tierName = tierInfo.tierName
          
          // Collect updated duct data
          updatedDuctData.push(duct.userData.ductData)
        }
      })
      
      // Update storage for all ducts at once
      if (updatedDuctData.length > 0) {
        this.saveAllDuctsTierToStorage(updatedDuctData)
      }
    }
  }

  /**
   * Refresh all ductwork
   */
  refreshDuctwork() {
    try {
      // Use temporary state instead of legacy manifest
      const allMepItems = getAllMEPItemsFromTemporary()
      const ductItems = allMepItems.filter(item => item && item.type === 'duct')
      
      if (ductItems.length > 0) {
        this.updateDuctwork(ductItems)
      }
    } catch (error) {
      console.error('🏭 Error refreshing ductwork:', error)
    }
  }

  /**
   * Update ductwork visualization
   */
  updateDuctwork(mepItems) {
    if (!Array.isArray(mepItems)) return
    
    this.clearDuctwork()
    
    const ductItems = mepItems.filter(item => item && item.type === 'duct')
    
    ductItems.forEach(duct => {
      this.createDuct(duct)
    })
  }

  /**
   * Create a single duct - same logic but cleaner
   */
  createDuct(ductData) {
    const {
      // width = 12, // Not used directly in this method (used in ductData)
      // height = 8, // Not used directly in this method (used in ductData)
      tier = 1
      // position = 'bottom' // Not used in this method
    } = ductData

    // Get duct length from snapLineManager
    const ductLength = this.snapLineManager.getAvailableDuctLength()
    
    let ductPosition
    let calculatedTierInfo = null
    
    // Check if this duct has a saved position
    if (ductData.position && typeof ductData.position === 'object' && ductData.position.x !== undefined) {
      ductPosition = new THREE.Vector3(
        ductData.position.x,
        ductData.position.y,
        ductData.position.z
      )
      
      // Calculate tier info using base class method
      if (!ductData.tierName && this.ductInteraction) {
        calculatedTierInfo = this.ductInteraction.calculateTier(ductData.position.y)
      }
    } else {
      // Calculate default position within tier
      const yPos = this.calculateDuctYPosition(ductData, tier, position)
      
      const postSizeInches = this.snapLineManager.getPostSize()
      const postSizeM = this.snapLineManager.in2m(postSizeInches)
      const xPos = postSizeM / 2
      
      ductPosition = new THREE.Vector3(xPos, yPos, 0)
      
      // Calculate tier info using base class method
      if (this.ductInteraction) {
        calculatedTierInfo = this.ductInteraction.calculateTier(yPos)
      }
    }
    
    // Update duct data with tier info if calculated
    if (calculatedTierInfo && !ductData.tierName) {
      ductData.tier = calculatedTierInfo.tier
      ductData.tierName = calculatedTierInfo.tierName
      
      // Save updated tier info to storage immediately
      this.saveDuctTierToStorage(ductData)
    }
    
    // Create duct group using modular geometry
    const ductGroup = this.ductGeometry.createDuctGroup(
      ductData,
      ductLength,
      ductPosition
    )
    
    this.ductworkGroup.add(ductGroup)
  }

  /**
   * Calculate duct Y position within tier - unchanged logic
   */
  calculateDuctYPosition(ductData, tier = 1, position = 'bottom') {
    // position parameter is for future use if needed
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
    
    const heightM = this.snapLineManager.in2m(ductData.height || 8)
    const insulationM = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalHeight = heightM + (2 * insulationM)
    
    const tierIndex = (tier - 1) * 2 + 1
    
    if (tierIndex < beamTopSurfaces.length) {
      const tierBeamTop = beamTopSurfaces[tierIndex]
      const ductCenterY = tierBeamTop.y + (totalHeight / 2)
      return ductCenterY
    }
    
    console.warn(`⚠️ Tier ${tier} not available, using lowest beam`)
    const lowestBeam = beamTopSurfaces[beamTopSurfaces.length - 1]
    return lowestBeam.y + (totalHeight / 2)
  }

  /**
   * Save duct tier information to storage
   */
  saveDuctTierToStorage(ductData) {
    try {
      const storedItems = getAllMEPItemsFromTemporary()
      const baseId = ductData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId && item.type === 'duct') {
          return {
            ...item,
            tier: ductData.tier,
            tierName: ductData.tierName
          }
        }
        return item
      })
      
      // Update temporary state with tier information
      updateAllMEPItemsInTemporary(updatedItems)
      
      console.log(`🔧 Saved duct tier info to storage: ${ductData.tierName}`)
      
    } catch (error) {
      console.error('Error saving duct tier to storage:', error)
    }
  }

  /**
   * Save tier information for all ducts to storage (batch update)
   */
  saveAllDuctsTierToStorage(ductDataArray) {
    try {
      const storedItems = getAllMEPItemsFromTemporary()
      
      const updatedItems = storedItems.map(item => {
        if (item.type === 'duct') {
          // Find matching duct data
          const matchingDuctData = ductDataArray.find(ductData => {
            const baseId = ductData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            return itemBaseId === baseId
          })
          
          if (matchingDuctData) {
            return {
              ...item,
              tier: matchingDuctData.tier,
              tierName: matchingDuctData.tierName
            }
          }
        }
        return item
      })
      
      // Update temporary state with tier information
      updateAllMEPItemsInTemporary(updatedItems)
      
      console.log(`🔧 Saved tier info for ${ductDataArray.length} ducts to storage`)
      
    } catch (error) {
      console.error('Error saving ducts tier to storage:', error)
    }
  }

  /**
   * Clear all ductwork - now uses base class methods
   */
  clearDuctwork() {
    if (this.ductInteraction?.selectedObject) {
      this.ductInteraction.deselectObject()
    }
    
    while (this.ductworkGroup.children.length > 0) {
      const child = this.ductworkGroup.children[0]
      this.ductworkGroup.remove(child)
      
      // Use base class dispose method
      if (this.ductInteraction) {
        this.ductInteraction.disposeObject(child)
      }
    }
  }

  /**
   * Get column depth in meters for x-axis positioning
   */
  getColumnDepth() {
    try {
      const columnSize = this.rackParams.postSize || this.rackParams.columnSize || 3
      const columnDepthM = columnSize * 0.0254
      return columnDepthM
    } catch (error) {
      return 3 * 0.0254
    }
  }

  /**
   * Get ductwork group
   */
  getDuctworkGroup() {
    return this.ductworkGroup
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.ductworkGroup.visible = visible
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.ductInteraction?.dispose()
    this.snapLineManager.dispose()
    this.ductGeometry.dispose()
    
    this.clearDuctwork()
    this.scene.remove(this.ductworkGroup)
  }

  // Backward compatibility methods
  get selectedDuct() {
    return this.ductInteraction?.selectedObject
  }

  set selectedDuct(duct) {
    if (this.ductInteraction) {
      if (duct) {
        this.ductInteraction.selectObject(duct)
      } else {
        this.ductInteraction.deselectObject()
      }
    }
  }
}

export default DuctworkRenderer