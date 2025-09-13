/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../base/BaseMepInteraction.js'
import * as THREE from 'three'

/**
 * PipeInteraction - Piping-specific implementation using base class
 * This dramatically simplifies the piping interaction code
 */
export class PipeInteraction extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, pipeGeometry, snapLineManager) {
    super({
      scene,
      camera,
      renderer,
      orbitControls,
      snapLineManager,
      mepType: 'pipe',
      mepTypePlural: 'piping',
      groupName: 'PipingGroup',
      geometryManager: pipeGeometry
    })
    
    // pipeGeometry is available via getter that returns this.geometryManager
  }

  // Implement abstract methods for pipe-specific behavior
  
  /**
   * Find the selectable pipe object from a target
   */
  findSelectableObject(target) {
    let current = target
    while (current && current.parent) {
      if (current.userData.type === 'pipe') {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * Find the group containing a pipe object
   */
  findGroupForObject(object) {
    return object // For pipes, the object itself is the group
  }

  /**
   * Update pipe appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    this.geometryManager.updatePipeAppearance(object, state)
  }

  /**
   * Get pipe data from object
   */
  getObjectData(object) {
    return object.userData.pipeData
  }

  /**
   * Set pipe data on object
   */
  setObjectData(object, data) {
    object.userData.pipeData = data
  }

  /**
   * Calculate pipe dimensions in meters
   */
  calculateObjectDimensions(pipeData) {
    if (!pipeData || !this.snapLineManager) {
      return { width: 0.1, height: 0.1 }
    }

    const diameter = this.snapLineManager.in2m(pipeData.diameter || 2)
    const insulation = this.snapLineManager.in2m(pipeData.insulation || 0)
    
    const totalDiameter = diameter + (2 * insulation)
    
    return {
      width: totalDiameter,
      height: totalDiameter
    }
  }

  /**
   * Calculate tier tolerance based on pipe size
   */
  calculateTierTolerance(pipeHeight) {
    const diameterInches = pipeHeight || 2
    const diameterM = diameterInches * 0.0254
    return diameterM / 2
  }

  /**
   * Check if geometry needs to be recreated
   */
  needsGeometryUpdate(newDimensions) {
    // Pipes need geometry update for diameter, material, or insulation changes
    return !!(newDimensions.diameter || newDimensions.material || newDimensions.insulation)
  }

  /**
   * Recreate pipe geometry
   */
  recreateObjectGeometry(pipe, updatedData) {
    const rackLength = this.getRackLengthFromConfig()
    const pipeLength = rackLength * 0.3048 // Convert feet to meters
    
    // Clear current children
    while (pipe.children.length > 0) {
      const child = pipe.children[0]
      pipe.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Create new geometry
    const newPipeGroup = this.geometryManager.createPipeGroup(
      updatedData,
      pipeLength,
      new THREE.Vector3(0, 0, 0)
    )

    // Copy children to existing group
    newPipeGroup.children.forEach(child => {
      pipe.add(child.clone())
    })

    // Clean up temporary group
    newPipeGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Restore appearance
    this.geometryManager.updatePipeAppearance(pipe, 'selected')
  }

  /**
   * Create a new pipe object
   */
  createNewObject(pipeData) {
    const rackLength = this.getRackLengthFromConfig()
    const pipeLength = rackLength * 0.3048 // Convert feet to meters
    
    return this.geometryManager.createPipeGroup(
      pipeData,
      pipeLength,
      pipeData.position
    )
  }

  /**
   * Save new pipe to storage
   */
  saveNewObjectToStorage(pipeData) {
    const mepItem = {
      type: 'pipe',
      id: pipeData.id,
      name: pipeData.name || 'Pipe',
      diameter: pipeData.diameter || 2,
      material: pipeData.material || 'steel',
      insulation: pipeData.insulation || 0,
      tier: pipeData.tier || 1,
      position: pipeData.position,
      color: pipeData.color
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
      console.error('Error saving pipe to storage:', error)
    }
  }

  /**
   * Save pipe data to storage
   */
  saveObjectDataToStorage(pipeData) {
    try {
      const storedItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const baseId = pipeData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        if (itemBaseId === baseId && item.type === 'pipe') {
          return { ...item, ...pipeData }
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
      console.error('Error saving pipe data to storage:', error)
    }
  }

  // Backward compatibility methods for MepSelectionManager and existing code
  
  /**
   * Get selected pipe (for backward compatibility)
   */
  get selectedPipe() {
    return this.selectedObject
  }

  /**
   * Set selected pipe (for backward compatibility)
   */
  set selectedPipe(pipe) {
    if (pipe) {
      this.selectObject(pipe)
    } else {
      this.deselectObject()
    }
  }

  /**
   * Backward compatibility methods
   */
  getSelectedPipe() {
    return this.selectedObject
  }

  selectPipe(pipe) {
    return this.selectObject(pipe)
  }

  deselectPipe() {
    return this.deselectObject()
  }

  findPipeGroup(object) {
    return this.findSelectableObject(object)
  }

  updateAllPipeTierInfo() {
    // console.warn('updateAllPipeTierInfo is deprecated, use recalculateTierInfo on renderer instead')
    
    // Update tier info for all pipes in the scene
    const pipesGroup = this.scene.getObjectByName(this.groupName)
    if (pipesGroup) {
      pipesGroup.children.forEach(pipe => {
        if (pipe.userData?.type === 'pipe') {
          const tierInfo = this.calculateTier(pipe.position.y)
          const pipeData = this.getObjectData(pipe)
          if (pipeData) {
            pipeData.tier = tierInfo.tier
            pipeData.tierName = tierInfo.tierName
            this.setObjectData(pipe, pipeData)
          }
        }
      })
    }
  }

  updatePipeDimensions(dimensions) {
    console.warn('updatePipeDimensions is deprecated, use updateObjectDimensions instead')
    return this.updateObjectDimensions(dimensions)
  }

  duplicateSelectedPipe() {
    console.warn('duplicateSelectedPipe is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  /**
   * Get rack length from the correct sources in priority order
   */
  getRackLengthFromConfig() {
    try {
      // Priority 1: Check projectManifest for active rack configuration
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const activeConfig = manifest.tradeRacks?.active
      
      if (activeConfig?.rackLength) {
        return this.convertToFeet(activeConfig.rackLength)
      } else if (activeConfig?.totalLength) {
        return this.convertToFeet(activeConfig.totalLength)
      }
      
      // Priority 2: Check rackParameters from localStorage
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      if (rackParams.rackLength) {
        return this.convertToFeet(rackParams.rackLength)
      } else if (rackParams.totalLength) {
        return this.convertToFeet(rackParams.totalLength)
      }
      
      // Priority 3: Calculate from bay dimensions
      const bayCount = rackParams.bayCount || 4
      const bayWidth = rackParams.bayWidth || 3
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
   * Provide access to pipeGeometry for MepSelectionManager compatibility
   */
  get pipeGeometry() {
    return this.geometryManager
  }
}

export default PipeInteraction