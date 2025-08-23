/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

/**
 * ConduitEditor - Handles editing operations for conduits
 */
export class ConduitEditor {
  constructor(scene, conduitGeometry, snapLineManager) {
    this.scene = scene
    this.conduitGeometry = conduitGeometry
    this.snapLineManager = snapLineManager
    
    // Editing state
    this.editMode = false
    this.editingConduit = null
    
    // Clipboard for copy/paste
    this.clipboard = null
    
    // console.log('⚡ ConduitEditor initialized')
  }

  /**
   * Enable edit mode for a conduit
   */
  enableEditMode(conduit) {
    if (!conduit || conduit.userData.type !== 'conduit') return
    
    this.editMode = true
    this.editingConduit = conduit
    
    // Highlight the conduit being edited
    this.conduitGeometry.updateConduitAppearance(conduit, 'selected')
    
    // console.log('⚡ Edit mode enabled for conduit:', conduit.userData.conduitData)
  }

  /**
   * Disable edit mode
   */
  disableEditMode() {
    if (this.editingConduit) {
      this.conduitGeometry.updateConduitAppearance(this.editingConduit, 'normal')
    }
    
    this.editMode = false
    this.editingConduit = null
    
    // console.log('⚡ Edit mode disabled')
  }

  /**
   * Update conduit properties
   */
  updateConduitProperties(properties) {
    if (!this.editingConduit) return
    
    const conduitData = this.editingConduit.userData.conduitData
    
    // Update properties
    if (properties.diameter !== undefined) {
      conduitData.diameter = properties.diameter
    }
    if (properties.conduitType !== undefined) {
      conduitData.conduitType = properties.conduitType
    }
    if (properties.fillPercentage !== undefined) {
      conduitData.fillPercentage = properties.fillPercentage
    }
    if (properties.color !== undefined) {
      conduitData.color = properties.color
    }
    
    // Rebuild the conduit with new properties
    this.rebuildConduit(this.editingConduit)
    
    // console.log('⚡ Conduit properties updated:', conduitData)
  }

  /**
   * Rebuild conduit with updated properties
   */
  rebuildConduit(conduitGroup) {
    if (!conduitGroup) return
    
    const conduitData = conduitGroup.userData.conduitData
    const position = conduitGroup.position.clone()
    const parent = conduitGroup.parent
    
    // Calculate conduit length
    const rackLength = this.calculateRackLength()
    const conduitLength = rackLength * 12 // Convert to inches
    
    // Remove old conduit
    if (parent) {
      parent.remove(conduitGroup)
    }
    
    // Dispose of old geometry and materials
    conduitGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    })
    
    // Create new conduit with updated properties
    const newConduitGroup = this.conduitGeometry.createConduitGroup(
      conduitData,
      conduitLength,
      position
    )
    
    // Add to parent
    if (parent) {
      parent.add(newConduitGroup)
    }
    
    // Update reference
    if (this.editingConduit === conduitGroup) {
      this.editingConduit = newConduitGroup
      this.conduitGeometry.updateConduitAppearance(newConduitGroup, 'selected')
    }
    
    return newConduitGroup
  }

  /**
   * Duplicate a conduit
   */
  duplicateConduit(conduit, offset = { x: 0, y: 0, z: 0.2 }) {
    if (!conduit || conduit.userData.type !== 'conduit') return null
    
    const conduitData = { ...conduit.userData.conduitData }
    conduitData.id = `conduit_${Date.now()}`
    
    const newPosition = conduit.position.clone()
    newPosition.x += offset.x
    newPosition.y += offset.y
    newPosition.z += offset.z
    
    // Calculate conduit length
    const rackLength = this.calculateRackLength()
    const conduitLength = rackLength * 12
    
    // Create new conduit
    const newConduitGroup = this.conduitGeometry.createConduitGroup(
      conduitData,
      conduitLength,
      newPosition
    )
    
    // Add to scene
    const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
    if (conduitsGroup) {
      conduitsGroup.add(newConduitGroup)
    }
    
    // console.log('⚡ Conduit duplicated:', conduitData.id)
    return newConduitGroup
  }

  /**
   * Copy conduit to clipboard
   */
  copyConduit(conduit) {
    if (!conduit || conduit.userData.type !== 'conduit') return
    
    this.clipboard = {
      conduitData: { ...conduit.userData.conduitData },
      position: conduit.position.clone()
    }
    
    // console.log('⚡ Conduit copied to clipboard')
  }

  /**
   * Paste conduit from clipboard
   */
  pasteConduit(position) {
    if (!this.clipboard) return null
    
    const conduitData = { ...this.clipboard.conduitData }
    conduitData.id = `conduit_${Date.now()}`
    
    const pastePosition = position || this.clipboard.position.clone()
    pastePosition.z += 0.2 // Offset to avoid overlap
    
    // Calculate conduit length
    const rackLength = this.calculateRackLength()
    const conduitLength = rackLength * 12
    
    // Create new conduit
    const newConduitGroup = this.conduitGeometry.createConduitGroup(
      conduitData,
      conduitLength,
      pastePosition
    )
    
    // Add to scene
    const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
    if (conduitsGroup) {
      conduitsGroup.add(newConduitGroup)
    }
    
    // console.log('⚡ Conduit pasted:', conduitData.id)
    return newConduitGroup
  }

  /**
   * Delete a conduit
   */
  deleteConduit(conduit) {
    if (!conduit || conduit.userData.type !== 'conduit') return
    
    const parent = conduit.parent
    if (parent) {
      // Dispose of geometry and materials
      conduit.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })
      
      // Remove from parent
      parent.remove(conduit)
    }
    
    // Clear editing state if this was the editing conduit
    if (this.editingConduit === conduit) {
      this.disableEditMode()
    }
    
    // console.log('⚡ Conduit deleted')
  }

  /**
   * Move conduit to a different tier
   */
  moveToTier(conduit, tierNumber) {
    if (!conduit || conduit.userData.type !== 'conduit') return
    
    const tierPosition = this.calculateTierPosition(tierNumber)
    if (tierPosition) {
      // Adjust for conduit radius
      const conduitData = conduit.userData.conduitData
      const conduitDiameter = this.snapLineManager ? 
        this.snapLineManager.in2m(conduitData.diameter || 1) : 0.025
      const conduitRadius = conduitDiameter / 2
      
      // Set Y position so bottom sits on beam
      conduit.position.y = tierPosition.y + conduitRadius
      
      // Update conduit data
      conduitData.tier = tierNumber
      conduitData.position = {
        x: conduit.position.x,
        y: conduit.position.y,
        z: conduit.position.z
      }
      
      // console.log(`⚡ Conduit moved to Tier ${tierNumber}`)
    }
  }

  /**
   * Calculate tier position (similar to renderer)
   */
  calculateTierPosition(tierNumber) {
    try {
      if (this.snapLineManager) {
        const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
        const allHorizontalLines = snapLines.horizontal.filter(line => isFinite(line.y)).sort((a, b) => b.y - a.y)

        const tierSpaces = []
        const minTierHeight = 0.3

        const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')

        for (let i = 0; i < beamTops.length - 1; i++) {
          const bottomBeam = beamTops[i + 1]
          const topBeam = beamTops[i]
          
          if (bottomBeam && topBeam) {
            const gap = topBeam.y - bottomBeam.y
            if (gap >= minTierHeight && isFinite(gap)) {
              tierSpaces.push({
                tierIndex: tierSpaces.length + 1,
                topBeamY: topBeam.y,
                bottomBeamY: bottomBeam.y,
                centerY: (topBeam.y + bottomBeam.y) / 2,
                defaultConduitY: bottomBeam.y
              })
            }
          }
        }

        const tierSpace = tierSpaces.find(space => space.tierIndex === tierNumber)
        if (tierSpace) {
          return { y: tierSpace.defaultConduitY }
        }
      }

      const tierHeightFeet = 2
      const tierHeightMeters = tierHeightFeet * 0.3048
      return { y: (tierNumber - 1) * tierHeightMeters }
    } catch (error) {
      console.error('❌ Error calculating tier position:', error)
      return { y: (tierNumber - 1) * 0.6 }
    }
  }

  /**
   * Calculate rack length
   */
  calculateRackLength() {
    if (this.snapLineManager && this.snapLineManager.getRackLength) {
      return this.snapLineManager.getRackLength()
    }
    return 12 // Default 12 feet
  }

  /**
   * Group selected conduits
   */
  groupConduits(conduits) {
    if (!conduits || conduits.length === 0) return null
    
    const group = new THREE.Group()
    group.name = `ConduitGroup_${Date.now()}`
    group.userData = { type: 'conduitGroup' }
    
    // Calculate center position
    const center = new THREE.Vector3()
    conduits.forEach(conduit => {
      center.add(conduit.position)
    })
    center.divideScalar(conduits.length)
    group.position.copy(center)
    
    // Add conduits to group
    conduits.forEach(conduit => {
      const parent = conduit.parent
      if (parent) {
        // Adjust position relative to group
        conduit.position.sub(center)
        parent.remove(conduit)
        group.add(conduit)
      }
    })
    
    // Add group to scene
    const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
    if (conduitsGroup) {
      conduitsGroup.add(group)
    }
    
    // console.log('⚡ Conduits grouped:', group.name)
    return group
  }

  /**
   * Ungroup conduits
   */
  ungroupConduits(group) {
    if (!group || group.userData.type !== 'conduitGroup') return
    
    const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
    if (!conduitsGroup) return
    
    // Move conduits back to main group
    const conduits = [...group.children]
    conduits.forEach(conduit => {
      // Adjust position to world coordinates
      conduit.position.add(group.position)
      group.remove(conduit)
      conduitsGroup.add(conduit)
    })
    
    // Remove empty group
    conduitsGroup.remove(group)
    
    // console.log('⚡ Conduits ungrouped')
  }

  /**
   * Dispose of the editor
   */
  dispose() {
    this.disableEditMode()
    this.clipboard = null
    // console.log('⚡ ConduitEditor disposed')
  }
}