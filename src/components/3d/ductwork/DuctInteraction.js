/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../base/BaseMepInteraction.js'
import * as THREE from 'three'

/**
 * DuctInteraction - Ductwork-specific implementation using base class
 * This dramatically simplifies the ductwork interaction code
 */
export class DuctInteraction extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, ductGeometry, snapLineManager) {
    super({
      scene,
      camera,
      renderer,
      orbitControls,
      snapLineManager,
      mepType: 'duct',
      mepTypePlural: 'ductwork',
      groupName: 'DuctsGroup',
      geometryManager: ductGeometry
    })
    
    // ductGeometry is available via getter that returns this.geometryManager
  }

  // Implement abstract methods for duct-specific behavior
  
  /**
   * Find the selectable duct object from a target
   */
  findSelectableObject(target) {
    let current = target
    while (current && current.parent) {
      if (current.userData.type === 'duct') {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * Find the group containing a duct object
   */
  findGroupForObject(object) {
    return object // For ducts, the object itself is the group
  }

  /**
   * Update duct appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    this.ductGeometry.updateDuctAppearance(object, state)
  }

  /**
   * Get duct data from object
   */
  getObjectData(object) {
    return object.userData.ductData
  }

  /**
   * Set duct data on object
   */
  setObjectData(object, data) {
    object.userData.ductData = data
  }

  /**
   * Calculate duct dimensions in meters
   */
  calculateObjectDimensions(ductData) {
    if (!ductData || !this.snapLineManager) {
      return { width: 0.3, height: 0.2 }
    }

    const width = this.snapLineManager.in2m(ductData.width || 12)
    const height = this.snapLineManager.in2m(ductData.height || 8)
    const insulation = this.snapLineManager.in2m(ductData.insulation || 0)
    
    return {
      width: width + (2 * insulation),
      height: height + (2 * insulation)
    }
  }

  /**
   * Calculate tier tolerance based on duct size
   */
  calculateTierTolerance(ductHeight) {
    const heightInches = ductHeight || 8
    const heightM = heightInches * 0.0254
    return heightM / 2
  }

  /**
   * Check if geometry needs to be recreated
   */
  needsGeometryUpdate(newDimensions) {
    // Color-only changes don't need geometry update
    return !(newDimensions.color && Object.keys(newDimensions).length === 1)
  }

  /**
   * Recreate duct geometry
   */
  recreateObjectGeometry(duct, updatedData) {
    const ductLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + 
                       this.snapLineManager.in2m(12)
    const currentPosition = duct.position.clone()
    
    // Clear current children
    while (duct.children.length > 0) {
      const child = duct.children[0]
      duct.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Create new geometry
    const newDuctGroup = this.ductGeometry.createDuctGroup(
      updatedData,
      ductLength,
      new THREE.Vector3(0, 0, 0)
    )

    // Copy children to existing group
    newDuctGroup.children.forEach(child => {
      duct.add(child.clone())
    })

    // Clean up temporary group
    newDuctGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Restore appearance
    this.ductGeometry.updateDuctAppearance(duct, 'selected')
  }

  /**
   * Create a new duct object
   */
  createNewObject(ductData) {
    const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
    const ductLength = this.snapLineManager ? 
      this.snapLineManager.ft2m(rackLength) + this.snapLineManager.in2m(12) : 
      rackLength * 0.3048 + 0.3048 // fallback conversion
    
    return this.ductGeometry.createDuctGroup(
      ductData,
      ductLength,
      ductData.position
    )
  }

  /**
   * Save new duct to storage
   */
  saveNewObjectToStorage(ductData) {
    const mepItem = {
      type: 'duct',
      id: ductData.id,
      name: ductData.name || 'Duct',
      width: ductData.width || 12,
      height: ductData.height || 8,
      insulation: ductData.insulation || 0,
      tier: ductData.tier || 1,
      position: ductData.position,
      color: ductData.color
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
      console.error('Error saving duct to storage:', error)
    }
  }

  /**
   * Save duct data to storage
   */
  saveObjectDataToStorage(ductData) {
    try {
      const storedItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const baseId = ductData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        if (itemBaseId === baseId && item.type === 'duct') {
          return { ...item, ...ductData }
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
      console.error('Error saving duct data to storage:', error)
    }
  }

  // Additional duct-specific methods can be added here if needed
  
  /**
   * Get selected duct (for backward compatibility)
   */
  get selectedDuct() {
    return this.selectedObject
  }

  /**
   * Set selected duct (for backward compatibility)
   */
  set selectedDuct(duct) {
    if (duct) {
      this.selectObject(duct)
    } else {
      this.deselectObject()
    }
  }

  /**
   * Backward compatibility for getSelectedDuct method
   */
  getSelectedDuct() {
    return this.selectedObject
  }

  /**
   * Backward compatibility for updateAllDuctTierInfo method
   */
  updateAllDuctTierInfo() {
    // console.warn('updateAllDuctTierInfo is deprecated, use recalculateTierInfo on renderer instead')
    
    // Update tier info for all ducts in the scene
    const ductsGroup = this.scene.getObjectByName(this.groupName)
    if (ductsGroup) {
      ductsGroup.children.forEach(duct => {
        if (duct.userData?.type === 'duct') {
          const tierInfo = this.calculateTier(duct.position.y)
          const ductData = this.getObjectData(duct)
          if (ductData) {
            ductData.tier = tierInfo.tier
            ductData.tierName = tierInfo.tierName
            this.setObjectData(duct, ductData)
          }
        }
      })
    }
  }

  /**
   * Backward compatibility for updateDuctDimensions method
   */
  updateDuctDimensions(dimensions) {
    console.warn('updateDuctDimensions is deprecated, use updateObjectDimensions instead')
    return this.updateObjectDimensions(dimensions)
  }

  /**
   * Backward compatibility for duplicateSelectedDuct method
   */
  duplicateSelectedDuct() {
    console.warn('duplicateSelectedDuct is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  /**
   * Backward compatibility for deselectDuct method
   */
  deselectDuct() {
    // console.warn('deselectDuct is deprecated, use deselectObject instead')
    return this.deselectObject()
  }

  /**
   * Backward compatibility for selectDuct method (used by MepSelectionManager)
   */
  selectDuct(duct) {
    return this.selectObject(duct)
  }

  /**
   * Backward compatibility for findDuctGroup method (used by MepSelectionManager)
   */
  findDuctGroup(object) {
    return this.findSelectableObject(object)
  }

  /**
   * Provide access to ductGeometry for MepSelectionManager compatibility
   */
  get ductGeometry() {
    return this.geometryManager
  }
}

export default DuctInteraction