/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { CableTrayGeometry } from './CableTrayGeometry'
import { getColumnSize } from '../core/utils'

/**
 * CableTrayRenderer - Manages 3D rendering of cable trays in the scene
 */
export class CableTrayRenderer {
  constructor(scene, snapLineManager = null) {
    this.scene = scene
    this.snapLineManager = snapLineManager
    this.cableTrayGeometry = new CableTrayGeometry()
    this.cableTrayInteraction = null // Will be set up in setupInteractions
    
    // Create main group for all cable trays
    this.cableTraysGroup = new THREE.Group()
    this.cableTraysGroup.name = 'CableTrays'
    this.scene.add(this.cableTraysGroup)
    
  }

  /**
   * Get the cable trays group
   */
  getCableTraysGroup() {
    return this.cableTraysGroup
  }

  /**
   * Setup cable tray interactions
   */
  setupInteractions(camera, renderer, orbitControls) {
    const { CableTrayInteraction } = require('./CableTrayInteraction')
    this.cableTrayInteraction = new CableTrayInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls,
      this.cableTrayGeometry,
      this.snapLineManager
    )
    
    // Make cable tray interaction globally accessible
    window.cableTrayInteractionInstance = this.cableTrayInteraction
    
  }

  /**
   * Update cable trays display with new MEP items
   */
  updateCableTrays(mepItems = []) {
    try {
      // Clear existing cable trays
      this.clearCableTrays()

      // Filter cable tray items
      const cableTrayItems = mepItems.filter(item => item.type === 'cableTray')
      

      // Create cable trays
      cableTrayItems.forEach((cableTrayData, index) => {
        this.createCableTray(cableTrayData, index)
      })

    } catch (error) {
      console.error('❌ Error updating cable trays:', error)
    }
    
    // Update tier information for all cable trays
    this.cableTrayInteraction.updateAllCableTrayTierInfo()
  }

  /**
   * Create a single cable tray in the 3D scene
   */
  createCableTray(cableTrayData, index = 0) {
    try {
      // Validate cable tray data
      if (!cableTrayData || typeof cableTrayData !== 'object') {
        console.error('❌ Invalid cable tray data:', cableTrayData)
        return
      }

      // Default cable tray parameters with validation
      const width = isFinite(cableTrayData.width) ? parseFloat(cableTrayData.width) : 12
      const height = isFinite(cableTrayData.height) ? parseFloat(cableTrayData.height) : 4
      const trayType = cableTrayData.trayType || 'ladder'


      // Use rack length parameter directly to match user input
      const rackLength = this.calculateRackLength()
      
      // Get column size using consistent utility function
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      const columnSize = getColumnSize(rackParams) // inches
      
      // Cable tray length equals rack length (converted to inches)
      const cableTrayLength = rackLength * 12 // Convert feet to inches

      // Calculate base position for the cable tray
      const basePosition = this.calculateCableTrayPosition(cableTrayData, index, cableTrayLength)
      
      // Create single cable tray group
      const cableTrayGroup = this.cableTrayGeometry.createCableTrayGroup(
        cableTrayData,
        cableTrayLength,
        basePosition
      )

      if (cableTrayGroup) {
        this.cableTraysGroup.add(cableTrayGroup)
      }

    } catch (error) {
      console.error('❌ Error creating cable tray:', error, cableTrayData)
    }
  }

  /**
   * Calculate cable tray position based on tier
   */
  calculateCableTrayPosition(cableTrayData, index, cableTrayLength) {
    try {
      // Default position at origin
      // Get column size to calculate X offset (same as ducts and pipes)
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      const columnSize = getColumnSize(rackParams) // inches
      const columnSizeM = columnSize * 0.0254 // convert to meters
      
      // Position cable tray offset by postSize/2 in X to align with rack (same as ducts)
      let x = columnSizeM / 2
      let y = 2.5 // Default height of 2.5 meters (higher than conduits)
      let z = index * 0.3 // Space cable trays 0.3m apart

      // If cable tray has a saved position, use it
      if (cableTrayData.position && 
          isFinite(cableTrayData.position.x) && 
          isFinite(cableTrayData.position.y) && 
          isFinite(cableTrayData.position.z)) {
        const position = new THREE.Vector3(
          cableTrayData.position.x,
          cableTrayData.position.y,
          cableTrayData.position.z
        )
        return position
      }

      // Try to get tier-based position if snap line manager is available
      if (this.snapLineManager && cableTrayData.tier) {
        try {
          // Get snap lines from rack geometry
          const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
          
          // Get beam top surfaces (where cable trays sit)
          const beamTops = snapLines.horizontal
            .filter(line => line.type === 'beam-top')
            .sort((a, b) => b.y - a.y) // Sort from top to bottom
          
          // Find the correct tier (tier 1 = topmost)
          const tierIndex = (cableTrayData.tier || 1) - 1
          if (beamTops[tierIndex]) {
            y = beamTops[tierIndex].y + 0.3 // Offset above the tier
          }
        } catch (err) {
          console.warn('Could not get tier position from snap lines:', err)
        }
      }

      return new THREE.Vector3(x, y, z)
      
    } catch (error) {
      console.error('❌ Error calculating cable tray position:', error)
      return new THREE.Vector3(0, 2.5, 0) // Default fallback
    }
  }

  /**
   * Calculate rack length from parameters or snap line manager
   */
  calculateRackLength() {
    try {
      // Try to get rack length from snap line manager first
      if (this.snapLineManager && typeof this.snapLineManager.getRackLength === 'function') {
        const rackLength = this.snapLineManager.getRackLength()
        if (isFinite(rackLength) && rackLength > 0) {
          return rackLength
        }
      }

      // Fallback to localStorage rack parameters
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      if (rackParams.length && isFinite(rackParams.length)) {
        return parseFloat(rackParams.length)
      }

      // Final fallback
      return 12 // 12 feet default
    } catch (error) {
      console.error('❌ Error calculating rack length:', error)
      return 12
    }
  }

  /**
   * Clear all cable trays from the scene
   */
  clearCableTrays() {
    // Dispose of geometries and materials
    this.cableTraysGroup.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    })

    // Clear the group
    this.cableTraysGroup.clear()
  }

  /**
   * Get cable tray by ID
   */
  getCableTrayById(id) {
    let foundCableTray = null
    
    this.cableTraysGroup.traverse((child) => {
      if (child.userData?.cableTrayData?.id === id) {
        foundCableTray = child
      }
    })
    
    return foundCableTray
  }

  /**
   * Get all cable trays in the scene
   */
  getAllCableTrays() {
    const cableTrays = []
    
    this.cableTraysGroup.traverse((child) => {
      if (child.userData?.type === 'cableTray') {
        cableTrays.push(child)
      }
    })
    
    return cableTrays
  }

  /**
   * Update cable tray color
   */
  updateCableTrayColor(cableTrayId, newColor) {
    const cableTray = this.getCableTrayById(cableTrayId)
    if (cableTray) {
      cableTray.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone()
          child.material.color.setStyle(newColor)
        }
      })
      
      // Update userData
      if (cableTray.userData?.cableTrayData) {
        cableTray.userData.cableTrayData.color = newColor
      }
      
    }
  }

  /**
   * Show/hide cable trays
   */
  setVisible(visible) {
    this.cableTraysGroup.visible = visible
  }

  /**
   * Get cable tray statistics
   */
  getStats() {
    const cableTrays = this.getAllCableTrays()
    return {
      total: cableTrays.length,
      byType: cableTrays.reduce((acc, cableTray) => {
        const type = cableTray.userData?.cableTrayData?.trayType || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
    }
  }

  /**
   * Get column depth in meters for x-axis positioning
   */
  getColumnDepth() {
    try {
      // Try to get column size from rack parameters or fallback
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      const columnSize = getColumnSize(rackParams) // inches
      
      // Convert inches to meters
      const columnDepthM = columnSize * 0.0254
      
      return columnDepthM
    } catch (error) {
      // Fallback to 3 inches (7.62 cm) in meters
      return 3 * 0.0254
    }
  }

  /**
   * Dispose of the renderer and clean up resources
   */
  dispose() {
    this.clearCableTrays()
    this.cableTrayGeometry.dispose()
    
    if (this.cableTraysGroup.parent) {
      this.cableTraysGroup.parent.remove(this.cableTraysGroup)
    }
    
  }
}