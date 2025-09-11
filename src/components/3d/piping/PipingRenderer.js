/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { PipeGeometry } from './PipeGeometry.js'
import { PipeInteraction } from './PipeInteraction.js'
import { getColumnSize } from '../core/utils'

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
   * Recalculate tier information for all pipes - now uses base class method
   */
  recalculateTierInfo() {
    if (!this.pipeInteraction) return
    
    // The base class provides comprehensive tier calculation automatically
    const pipesGroup = this.scene.getObjectByName('PipingGroup')
    if (pipesGroup) {
      pipesGroup.children.forEach(pipe => {
        if (pipe.userData.type === 'pipe') {
          const tierInfo = this.pipeInteraction.calculateTier(pipe.position.y)
          pipe.userData.pipeData.tier = tierInfo.tier
          pipe.userData.pipeData.tierName = tierInfo.tierName
        }
      })
      
      // Update storage
      this.pipeInteraction.saveObjectPosition()
    }
  }

  /**
   * Update piping visualization
   */
  updatePiping(mepItems) {
    if (!Array.isArray(mepItems)) return
    
    this.clearPiping()
    
    const pipeItems = mepItems.filter(item => item && item.type === 'pipe')
    
    pipeItems.forEach(pipe => {
      this.createPipe(pipe)
    })
  }

  /**
   * Create a single pipe
   */
  createPipe(pipeData) {
    const {
      diameter = 2,
      pipeType = 'copper',
      tier = 1,
      position = 'bottom'
    } = pipeData

    // Get pipe length from snapLineManager
    const pipeLength = this.snapLineManager?.getAvailableDuctLength() || 
                      this.snapLineManager?.ft2m(this.snapLineManager?.getRackLength() || 12) || 
                      12 * 0.3048

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
      
      // Update in localStorage
      try {
        const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
        const updatedItems = storedMepItems.map(item => {
          if (item.id === pipeData.id) {
            return { ...item, tier: calculatedTierInfo.tier, tierName: calculatedTierInfo.tierName }
          }
          return item
        })
        localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      } catch (error) {
        console.error('Error updating tier info:', error)
      }
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
   * Calculate pipe Y position within tier
   */
  calculatePipeYPosition(pipeData, tier = 1, position = 'bottom') {
    const snapLines = this.snapLineManager?.getSnapLinesFromRackGeometry()
    
    if (!snapLines?.horizontal) {
      console.warn('⚠️ No snap lines found, using fallback position')
      return 2 - (tier - 1) * 2 // Fallback
    }

    const beamTopSurfaces = snapLines.horizontal
      .filter(line => line.type === 'beam_top')
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