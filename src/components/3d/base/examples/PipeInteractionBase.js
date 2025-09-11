/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../BaseMepInteraction.js'
import * as THREE from 'three'

/**
 * Example PipeInteraction using base class
 * Shows how simple it is to implement different MEP types
 */
export class PipeInteractionBase extends BaseMepInteraction {
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
    
    this.pipeGeometry = pipeGeometry
  }

  // Implement abstract methods for pipe-specific behavior
  
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

  findGroupForObject(object) {
    return object // For pipes, the object itself is the group
  }

  updateObjectAppearance(object, state) {
    this.pipeGeometry.updatePipeAppearance(object, state)
  }

  getObjectData(object) {
    return object.userData.pipeData
  }

  setObjectData(object, data) {
    object.userData.pipeData = data
  }

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

  calculateTierTolerance(pipeHeight) {
    const diameterInches = pipeHeight || 2
    const diameterM = diameterInches * 0.0254
    return diameterM / 2
  }

  needsGeometryUpdate(newDimensions) {
    // Pipes need geometry update for diameter or material changes
    return !!(newDimensions.diameter || newDimensions.material || newDimensions.insulation)
  }

  recreateObjectGeometry(pipe, updatedData) {
    const pipeLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + 
                       this.snapLineManager.in2m(12)
    
    // Clear current children
    while (pipe.children.length > 0) {
      const child = pipe.children[0]
      pipe.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Create new geometry
    const newPipeGroup = this.pipeGeometry.createPipeGroup(
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
    this.pipeGeometry.updatePipeAppearance(pipe, 'selected')
  }

  createNewObject(pipeData) {
    const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
    const pipeLength = this.snapLineManager ? 
      this.snapLineManager.ft2m(rackLength) + this.snapLineManager.in2m(12) : 
      rackLength * 0.3048 + 0.3048
    
    return this.pipeGeometry.createPipeGroup(
      pipeData,
      pipeLength,
      pipeData.position
    )
  }

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

  // Backward compatibility
  get selectedPipe() {
    return this.selectedObject
  }

  set selectedPipe(pipe) {
    if (pipe) {
      this.selectObject(pipe)
    } else {
      this.deselectObject()
    }
  }
}

export default PipeInteractionBase