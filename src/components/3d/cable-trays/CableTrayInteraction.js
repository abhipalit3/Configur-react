/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../base/BaseMepInteraction.js'
import * as THREE from 'three'

/**
 * CableTrayInteraction - Cable tray-specific implementation using base class
 * This dramatically simplifies the cable tray interaction code
 */
export class CableTrayInteraction extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, cableTrayGeometry, snapLineManager) {
    super({
      scene,
      camera,
      renderer,
      orbitControls,
      snapLineManager,
      mepType: 'cableTray',
      mepTypePlural: 'cableTrays',
      groupName: 'CableTraysGroup',
      geometryManager: cableTrayGeometry
    })
    
    // Cable tray-specific properties
    this.selectedCableTrayGroup = [] // Array for group movement if needed
    this.groupRelativePositions = [] // Store relative positions for group movement
    this.hoveredGroup = null // Track the hovered cable tray group
    
    // cableTrayGeometry is available via getter that returns this.geometryManager
  }

  // Implement abstract methods for cable tray-specific behavior
  
  /**
   * Find the selectable cable tray object from a target
   */
  findSelectableObject(target) {
    let current = target
    while (current && current.parent) {
      if (current.userData.type === 'cableTray') {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * Find the group containing a cable tray object
   */
  findGroupForObject(object) {
    // For cable trays, the object itself is typically the group
    if (object.userData.type === 'cableTray') {
      return object
    }
    return object // Fallback to the object itself
  }

  /**
   * Update cable tray appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    // Use the cable tray geometry's update method
    if (this.geometryManager.updateCableTrayAppearance) {
      this.geometryManager.updateCableTrayAppearance(object, state)
    }
  }

  /**
   * Get cable tray data from object
   */
  getObjectData(object) {
    return object.userData.cableTrayData
  }

  /**
   * Set cable tray data on object
   */
  setObjectData(object, data) {
    object.userData.cableTrayData = data
  }

  /**
   * Calculate cable tray dimensions in meters
   */
  calculateObjectDimensions(cableTrayData) {
    if (!cableTrayData || !this.snapLineManager) {
      return { width: 0.3048, height: 0.1016 } // 12" x 4" default
    }

    const width = this.snapLineManager.in2m(cableTrayData.width || 12)
    const height = this.snapLineManager.in2m(cableTrayData.height || 4)
    
    return {
      width: width,
      height: height
    }
  }

  /**
   * Calculate tier tolerance based on cable tray size
   */
  calculateTierTolerance(cableTrayHeight) {
    const heightInches = cableTrayHeight || 4
    const heightM = heightInches * 0.0254
    return heightM / 2
  }

  /**
   * Check if geometry needs to be recreated
   */
  needsGeometryUpdate(newDimensions) {
    // Cable trays need geometry update for width, height, or type changes
    return !!(newDimensions.width || newDimensions.height || newDimensions.trayType)
  }

  /**
   * Recreate cable tray geometry
   */
  recreateObjectGeometry(cableTray, updatedData) {
    const cableTrayLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + 
                           this.snapLineManager.in2m(12)
    
    // Clear current children
    while (cableTray.children.length > 0) {
      const child = cableTray.children[0]
      cableTray.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Create new geometry
    const newCableTrayGroup = this.geometryManager.createCableTrayGroup(
      updatedData,
      cableTrayLength,
      new THREE.Vector3(0, 0, 0)
    )

    // Copy children to existing group
    newCableTrayGroup.children.forEach(child => {
      cableTray.add(child.clone())
    })

    // Clean up temporary group
    newCableTrayGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Restore appearance
    this.updateObjectAppearance(cableTray, 'selected')
  }

  /**
   * Create a new cable tray object
   */
  createNewObject(cableTrayData) {
    const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
    const cableTrayLength = this.snapLineManager ? 
      this.snapLineManager.ft2m(rackLength) + this.snapLineManager.in2m(12) : 
      rackLength * 0.3048 + 0.3048
    
    return this.geometryManager.createCableTrayGroup(
      cableTrayData,
      cableTrayLength,
      cableTrayData.position
    )
  }

  /**
   * Save new cable tray to storage
   */
  saveNewObjectToStorage(cableTrayData) {
    const mepItem = {
      type: 'cableTray',
      id: cableTrayData.id,
      name: cableTrayData.name || 'Cable Tray',
      width: cableTrayData.width || 12,
      height: cableTrayData.height || 4,
      trayType: cableTrayData.trayType || 'ladder',
      tier: cableTrayData.tier || 1,
      position: cableTrayData.position,
      color: cableTrayData.color
    }
    
    try {
      const storedItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      storedItems.push(mepItem)
      localStorage.setItem('configurMepItems', JSON.stringify(storedItems))
      
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(storedItems)
      }
      
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving cable tray to storage:', error)
    }
  }

  /**
   * Save cable tray data to storage
   */
  saveObjectDataToStorage(cableTrayData) {
    try {
      const storedItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const baseId = cableTrayData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        if (itemBaseId === baseId && item.type === 'cableTray') {
          return { ...item, ...cableTrayData }
        }
        return item
      })
      
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving cable tray data to storage:', error)
    }
  }

  // Backward compatibility methods for MepSelectionManager and existing code
  
  /**
   * Get selected cable tray (for backward compatibility)
   */
  get selectedCableTray() {
    return this.selectedObject
  }

  /**
   * Set selected cable tray (for backward compatibility)
   */
  set selectedCableTray(cableTray) {
    if (cableTray) {
      this.selectObject(cableTray)
    } else {
      this.deselectObject()
    }
  }

  /**
   * Backward compatibility methods
   */
  getSelectedCableTray() {
    return this.selectedObject
  }

  selectCableTray(cableTray) {
    return this.selectObject(cableTray)
  }

  deselectCableTray() {
    return this.deselectObject()
  }

  findCableTrayGroup(object) {
    return this.findSelectableObject(object)
  }

  updateAllCableTrayTierInfo() {
    // console.warn('updateAllCableTrayTierInfo is deprecated, use recalculateTierInfo on renderer instead')
    
    // Update tier info for all cable trays in the scene
    const cableTraysGroup = this.scene.getObjectByName(this.groupName)
    if (cableTraysGroup) {
      cableTraysGroup.children.forEach(cableTray => {
        if (cableTray.userData?.type === 'cableTray') {
          const tierInfo = this.calculateTier(cableTray.position.y)
          const cableTrayData = this.getObjectData(cableTray)
          if (cableTrayData) {
            cableTrayData.tier = tierInfo.tier
            cableTrayData.tierName = tierInfo.tierName
            this.setObjectData(cableTray, cableTrayData)
          }
        }
      })
    }
  }

  updateCableTrayDimensions(dimensions) {
    console.warn('updateCableTrayDimensions is deprecated, use updateObjectDimensions instead')
    return this.updateObjectDimensions(dimensions)
  }

  duplicateSelectedCableTray() {
    console.warn('duplicateSelectedCableTray is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  copySelectedCableTray() {
    console.warn('copySelectedCableTray is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  /**
   * Provide access to cableTrayGeometry for MepSelectionManager compatibility
   */
  get cableTrayGeometry() {
    return this.geometryManager
  }
}

export default CableTrayInteraction