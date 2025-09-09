/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { ConduitGeometry } from './ConduitGeometry.js'
import { ConduitInteraction } from './ConduitInteraction.js'
import { getColumnSize } from '../core/utils'

/**
 * ConduitRenderer - Main class for managing 3D conduit system
 */
export class ConduitRenderer {
  constructor(scene, camera, renderer, orbitControls, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.snapLineManager = snapLineManager

    // Initialize conduit subsystems
    this.conduitGeometry = new ConduitGeometry()
    this.conduitInteraction = null // Will be set up in setupInteractions

    // Create conduits group
    this.conduitsGroup = new THREE.Group()
    this.conduitsGroup.name = 'ConduitsGroup'
    this.scene.add(this.conduitsGroup)

    // Rack parameters for positioning
    this.rackParams = {
      tierCount: 2,
      tierHeights: [{ feet: 2, inches: 0 }, { feet: 2, inches: 0 }],
      bayCount: 4,
      bayWidth: { feet: 3, inches: 0 }
    }

    // console.log('⚡ ConduitRenderer initialized')
  }

  /**
   * Setup interaction controls
   */
  setupInteractions(camera, renderer, orbitControls) {
    this.conduitInteraction = new ConduitInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls, 
      this.conduitGeometry, 
      this.snapLineManager
    )
  }

  /**
   * Update conduits display with new MEP items
   */
  updateConduits(mepItems = []) {
    try {
      // Clear existing conduits
      this.clearConduits()

      // Filter conduit items
      const conduitItems = mepItems.filter(item => item.type === 'conduit')
      
      // console.log('⚡ Updating conduits display with', conduitItems.length, 'conduits')

      // Create conduits
      conduitItems.forEach((conduitData, index) => {
        this.createConduit(conduitData, index)
      })

      // Update tier information for all conduits
      setTimeout(() => {
        if (this.conduitInteraction) {
          this.conduitInteraction.updateAllConduitTierInfo()
        }
      }, 100)

    } catch (error) {
      console.error('❌ Error updating conduits:', error)
    }
  }

  /**
   * Create a single conduit in the 3D scene (new unified approach)
   */
  createConduit(conduitData, index = 0) {
    try {
      // Validate conduit data
      if (!conduitData || typeof conduitData !== 'object') {
        // console.error('❌ Invalid conduit data:', conduitData)
        return
      }

      // Default conduit parameters with validation
      const diameter = isFinite(conduitData.diameter) ? parseFloat(conduitData.diameter) : 1
      const spacing = isFinite(conduitData.spacing) ? parseFloat(conduitData.spacing) : 4
      const count = isFinite(conduitData.count) ? parseInt(conduitData.count) : 1
      const conduitType = conduitData.conduitType || 'emt'
      const fillPercentage = isFinite(conduitData.fillPercentage) ? parseFloat(conduitData.fillPercentage) : 0

      // console.log('⚡ Creating conduit group:', { diameter, spacing, count, conduitType, fillPercentage })

      // Use rack length parameter directly to match user input
      const rackLength = this.calculateRackLength()
      const conduitLength = rackLength * 12 // Convert feet to inches

      // Calculate base position for the group
      const basePosition = this.calculateConduitPosition(conduitData, 0, spacing)
      
      // Create unified multi-conduit group
      const multiConduitGroup = this.conduitGeometry.createMultiConduitGroup(
        conduitData,
        conduitLength,
        basePosition
      )

      if (multiConduitGroup && multiConduitGroup.children.length > 0) {
        this.conduitsGroup.add(multiConduitGroup)
        // console.log('✅ Multi-conduit group created:', conduitData.id, `with ${count} conduits`)
      } else {
        console.warn('⚠️ Failed to create multi-conduit group for:', conduitData.id)
      }

    } catch (error) {
      console.error('❌ Error creating conduit:', error, conduitData)
    }
  }

  /**
   * Calculate conduit position based on tier and spacing
   */
  calculateConduitPosition(conduitData, conduitIndex, spacing) {
    try {
      // Default position at origin
      let x = 0
      let y = 1 // Default height of 1 meter
      let z = conduitIndex * (spacing * 0.0254) // Convert spacing from inches to meters

      // Check for saved individual position in groupPositions first
      const parentConduitData = conduitData.parentData || conduitData
      if (parentConduitData.groupPositions && parentConduitData.groupPositions.length > 0) {
        const savedPosition = parentConduitData.groupPositions.find(pos => pos.id === conduitData.id)
        if (savedPosition && savedPosition.position &&
            isFinite(savedPosition.position.x) && 
            isFinite(savedPosition.position.y) && 
            isFinite(savedPosition.position.z)) {
          // console.log(`⚡ Using saved individual position for conduit ${conduitData.id}:`, savedPosition.position)
          return new THREE.Vector3(
            savedPosition.position.x,
            savedPosition.position.y,
            savedPosition.position.z
          )
        }
      }

      // If conduit has a saved position, use it
      if (conduitData.position && 
          isFinite(conduitData.position.x) && 
          isFinite(conduitData.position.y) && 
          isFinite(conduitData.position.z)) {
        // For multi-conduit groups, offset from the base position
        const basePosition = new THREE.Vector3(
          conduitData.position.x,
          conduitData.position.y,
          conduitData.position.z
        )
        
        // Add spacing offset for subsequent conduits
        basePosition.z += conduitIndex * (spacing * 0.0254)
        
        return basePosition
      }

      // Calculate tier-based position
      const tier = conduitData.tier || 1
      const tierPosition = this.calculateTierPosition(tier)
      
      if (tierPosition && isFinite(tierPosition.y)) {
        y = tierPosition.y
        
        // Adjust for conduit diameter
        const conduitDiameter = this.snapLineManager ? this.snapLineManager.in2m(conduitData.diameter || 1) : 0.025
        const conduitRadius = conduitDiameter / 2
        
        // Position conduit center so bottom sits on beam
        y = y + conduitRadius
      }

      // Offset conduits by half column depth from rack center
      const columnDepth = this.getColumnDepth()
      x = columnDepth / 2 // Offset by half column depth along rack length
      z = z - (this.getRackWidth() / 2) + 0.2 // Position along rack width with offset

      return new THREE.Vector3(x, y, z)
    } catch (error) {
      // console.error('❌ Error calculating conduit position:', error)
      return new THREE.Vector3(0, 1, conduitIndex * 0.1) // Fallback position
    }
  }

  /**
   * Calculate Y position for a given tier
   */
  calculateTierPosition(tierNumber) {
    try {
      // Use snap line manager to get tier positions from actual geometry
      if (this.snapLineManager) {
        const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
        const allHorizontalLines = snapLines.horizontal.filter(line => isFinite(line.y)).sort((a, b) => b.y - a.y)

        // Find tier spaces by analyzing beam positions
        const tierSpaces = []
        const minTierHeight = 0.3

        // Group lines by type
        const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')

        // Create tier spaces from beam pairs
        for (let i = 0; i < beamTops.length - 1; i++) {
          const bottomBeam = beamTops[i + 1] // Lower beam top
          const topBeam = beamTops[i] // Upper beam top
          
          if (bottomBeam && topBeam) {
            const gap = topBeam.y - bottomBeam.y
            if (gap >= minTierHeight && isFinite(gap)) {
              tierSpaces.push({
                tierIndex: tierSpaces.length + 1,
                topBeamY: topBeam.y,
                bottomBeamY: bottomBeam.y,
                centerY: (topBeam.y + bottomBeam.y) / 2,
                // Position conduits on bottom beam
                defaultConduitY: bottomBeam.y
              })
            }
          }
        }

        // Find the requested tier and position conduit on its bottom beam
        const tierSpace = tierSpaces.find(space => space.tierIndex === tierNumber)
        if (tierSpace) {
          return { y: tierSpace.defaultConduitY }
        }
      }

      // Fallback calculation - position on estimated beam
      const tierHeightFeet = 2 // Default tier height
      const tierHeightMeters = tierHeightFeet * 0.3048
      return { y: (tierNumber - 1) * tierHeightMeters } // Subtract 1 to start at ground level
    } catch (error) {
      // console.error('❌ Error calculating tier position:', error)
      return { y: (tierNumber - 1) * 0.6 } // Fallback
    }
  }

  /**
   * Calculate rack length from parameters
   */
  calculateRackLength() {
    try {
      // First try to get from snapLineManager if available (more accurate)
      if (this.snapLineManager && this.snapLineManager.getRackLength) {
        return this.snapLineManager.getRackLength()
      }
      
      // Fallback to rack parameters
      const bayCount = this.rackParams.bayCount || 4
      const bayWidth = this.rackParams.bayWidth || { feet: 3, inches: 0 }
      
      let bayWidthFeet
      if (typeof bayWidth === 'number') {
        bayWidthFeet = bayWidth
      } else {
        bayWidthFeet = (bayWidth.feet || 0) + (bayWidth.inches || 0) / 12
      }
      
      return bayCount * bayWidthFeet
    } catch (error) {
      // console.error('❌ Error calculating rack length:', error)
      return 12 // Fallback 12 feet
    }
  }

  /**
   * Get rack width in meters
   */
  getRackWidth() {
    try {
      // Default rack width is typically 4 feet
      return 4 * 0.3048 // Convert feet to meters
    } catch (error) {
      return 1.2 // Fallback 1.2 meters
    }
  }

  /**
   * Get column depth in meters for x-axis positioning
   */
  getColumnDepth() {
    try {
      // Get column size using consistent utility function
      const columnSize = getColumnSize(this.rackParams) // inches
      
      // Convert inches to meters
      const columnDepthM = columnSize * 0.0254
      
      return columnDepthM
    } catch (error) {
      // Fallback to 3 inches (7.62 cm) in meters
      return 3 * 0.0254
    }
  }

  /**
   * Update rack parameters
   */
  updateRackParams(params) {
    this.rackParams = { ...this.rackParams, ...params }
    // console.log('⚡ Conduit rack parameters updated:', this.rackParams)
  }

  /**
   * Clear all conduits from the scene
   */
  clearConduits() {
    try {
      // Clear the conduits group
      while (this.conduitsGroup.children.length > 0) {
        const conduit = this.conduitsGroup.children[0]
        this.conduitsGroup.remove(conduit)
        
        // Dispose of geometries and materials
        conduit.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        })
      }
      
      // Deselect any selected conduit
      if (this.conduitInteraction) {
        this.conduitInteraction.deselectConduit()
      }
      
      // console.log('⚡ Conduits cleared')
    } catch (error) {
      console.error('❌ Error clearing conduits:', error)
    }
  }

  /**
   * Get the conduits group
   */
  getConduitsGroup() {
    return this.conduitsGroup
  }

  /**
   * Recalculate tier info for all conduits
   */
  recalculateTierInfo() {
    if (this.conduitInteraction) {
      this.conduitInteraction.updateAllConduitTierInfo()
    }
  }

  /**
   * Dispose of the conduit renderer
   */
  dispose() {
    try {
      this.clearConduits()
      
      if (this.conduitsGroup) {
        this.scene.remove(this.conduitsGroup)
      }
      
      if (this.conduitInteraction) {
        this.conduitInteraction.dispose()
      }
      
      // console.log('⚡ ConduitRenderer disposed')
    } catch (error) {
      console.error('❌ Error disposing conduit renderer:', error)
    }
  }
}