/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../base/BaseMepInteraction.js'
import * as THREE from 'three'
import { getProjectManifest } from '../../../utils/projectManifest'
import { getAllMEPItemsFromTemporary, updateAllMEPItemsInTemporary } from '../../../utils/temporaryState'

/**
 * ConduitInteraction - Conduit-specific implementation using base class
 * This dramatically simplifies the conduit interaction code
 */
export class ConduitInteraction extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls, conduitGeometry, snapLineManager) {
    super({
      scene,
      camera,
      renderer,
      orbitControls,
      snapLineManager,
      mepType: 'conduit',
      mepTypePlural: 'conduits',
      groupName: 'ConduitsGroup',
      geometryManager: conduitGeometry
    })
    
    // Conduit-specific properties
    this.selectedConduitGroup = [] // Array of related conduits that move together
    this.groupRelativePositions = [] // Store relative positions for group movement
    this.hoveredGroup = null // Track the hovered multi-conduit group
    
    // conduitGeometry is available via getter that returns this.geometryManager
  }

  // Implement abstract methods for conduit-specific behavior
  
  /**
   * Find the selectable conduit object from a target
   */
  findSelectableObject(target) {
    let current = target
    
    // First check if the target itself is a multi-conduit group
    if (current.userData?.type === 'multiConduit' && current.userData?.isConduitGroup) {
      return current
    }
    
    // Traverse up to find the multi-conduit group
    while (current && current.parent) {
      if (current.userData?.type === 'multiConduit' && current.userData?.isConduitGroup) {
        return current
      }
      current = current.parent
    }
    
    // If no multi-conduit group found, return null
    return null
  }

  /**
   * Find the group containing a conduit object
   */
  findGroupForObject(object) {
    // For conduits, the multi-conduit group is the selectable unit
    if (object.userData?.type === 'multiConduit' && object.userData?.isConduitGroup) {
      return object
    }
    
    // If it's a child of a multi-conduit group, return the group
    let current = object.parent
    while (current) {
      if (current.userData?.type === 'multiConduit' && current.userData?.isConduitGroup) {
        return current
      }
      current = current.parent
    }
    
    return object // Fallback to the object itself
  }

  /**
   * Update conduit appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    if (!object) return
    
    // For multi-conduit groups, update each child conduit mesh
    if (object.userData?.type === 'multiConduit' && object.userData?.isConduitGroup) {
      this.updateGroupAppearance(object, state)
    } else {
      // Single conduit or individual mesh
      if (this.geometryManager.updateConduitAppearance) {
        this.geometryManager.updateConduitAppearance(object, state)
      }
    }
  }

  /**
   * Update appearance of all conduits in a multi-conduit group
   */
  updateGroupAppearance(multiConduitGroup, appearance) {
    if (!multiConduitGroup || !multiConduitGroup.children) return
    
    multiConduitGroup.children.forEach(conduitMesh => {
      if (conduitMesh.userData?.type === 'conduit') {
        this.geometryManager.updateConduitAppearance(conduitMesh, appearance)
      }
    })
  }

  /**
   * Get conduit data from object
   */
  getObjectData(object) {
    return object.userData.conduitData
  }

  /**
   * Set conduit data on object
   */
  setObjectData(object, data) {
    object.userData.conduitData = data
  }

  /**
   * Calculate conduit dimensions in meters
   */
  calculateObjectDimensions(conduitData) {
    if (!conduitData || !this.snapLineManager) {
      return { width: 0.05, height: 0.05 }
    }

    const diameter = this.snapLineManager.in2m(conduitData.diameter || 1)
    const count = conduitData.count || 1
    const spacing = this.snapLineManager.in2m(conduitData.spacing || 4)
    
    // Calculate total width for multiple conduits
    const totalWidth = count > 1 ? (count - 1) * spacing + diameter : diameter
    
    return {
      width: totalWidth,
      height: diameter
    }
  }

  /**
   * Calculate tier tolerance based on conduit size
   */
  calculateTierTolerance(conduitHeight) {
    const diameterInches = conduitHeight || 1
    const diameterM = diameterInches * 0.0254
    return diameterM / 2
  }

  /**
   * Check if geometry needs to be recreated
   */
  needsGeometryUpdate(newDimensions) {
    // Conduits need geometry update for diameter, type, count, or spacing changes
    return !!(newDimensions.diameter || newDimensions.conduitType || 
              newDimensions.count || newDimensions.spacing)
  }

  /**
   * Recreate conduit geometry
   */
  recreateObjectGeometry(conduit, updatedData) {
    const conduitLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + 
                         this.snapLineManager.in2m(12)
    
    // Clear current children
    while (conduit.children.length > 0) {
      const child = conduit.children[0]
      conduit.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Create new geometry
    const newConduitGroup = this.geometryManager.createConduitGroup(
      updatedData,
      conduitLength,
      new THREE.Vector3(0, 0, 0)
    )

    // Copy children to existing group
    newConduitGroup.children.forEach(child => {
      conduit.add(child.clone())
    })

    // Clean up temporary group
    newConduitGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Restore appearance
    this.updateObjectAppearance(conduit, 'selected')
  }

  /**
   * Create a new conduit object
   */
  createNewObject(conduitData) {
    const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
    const conduitLength = this.snapLineManager ? 
      this.snapLineManager.ft2m(rackLength) + this.snapLineManager.in2m(12) : 
      rackLength * 0.3048 + 0.3048
    
    return this.geometryManager.createConduitGroup(
      conduitData,
      conduitLength,
      conduitData.position
    )
  }

  /**
   * Save new conduit to storage
   */
  saveNewObjectToStorage(conduitData) {
    const mepItem = {
      type: 'conduit',
      id: conduitData.id,
      name: conduitData.name || 'Conduit',
      diameter: conduitData.diameter || 1,
      conduitType: conduitData.conduitType || 'EMT',
      count: conduitData.count || 1,
      spacing: conduitData.spacing || 4,
      tier: conduitData.tier || 1,
      position: conduitData.position,
      color: conduitData.color
    }
    
    try {
      // Get current MEP items from manifest
      const manifest = getProjectManifest()
      const currentItems = [
        // Use temporary state instead of legacy manifest
        ...getAllMEPItemsFromTemporary()
      ]
      
      const updatedItems = [...currentItems, mepItem]
      // Update temporary state (primary storage)
      updateAllMEPItemsInTemporary(updatedItems)
      
      // Legacy support - also update localStorage for components that still use it
      
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving conduit to storage:', error)
    }
  }

  /**
   * Save conduit data to storage
   */
  saveObjectDataToStorage(conduitData) {
    try {
      // Get current MEP items from manifest
      const manifest = getProjectManifest()
      const currentItems = [
        // Use temporary state instead of legacy manifest
        ...getAllMEPItemsFromTemporary()
      ]
      
      const baseId = conduitData.id.toString().split('_')[0]
      
      const updatedItems = currentItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        if (itemBaseId === baseId && item.type === 'conduit') {
          return { ...item, ...conduitData }
        }
        return item
      })
      
      // Update temporary state (primary storage)
      updateAllMEPItemsInTemporary(updatedItems)
      
      // Legacy support - also update localStorage for components that still use it
      
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving conduit data to storage:', error)
    }
  }

  // Backward compatibility methods for MepSelectionManager and existing code
  
  /**
   * Get selected conduit (for backward compatibility)
   */
  get selectedConduit() {
    return this.selectedObject
  }

  /**
   * Set selected conduit (for backward compatibility)
   */
  set selectedConduit(conduit) {
    if (conduit) {
      this.selectObject(conduit)
    } else {
      this.deselectObject()
    }
  }

  /**
   * Backward compatibility methods
   */
  getSelectedConduit() {
    return this.selectedObject
  }

  selectConduit(conduit) {
    return this.selectObject(conduit)
  }

  deselectConduit() {
    return this.deselectObject()
  }

  findConduitGroup(object) {
    return this.findSelectableObject(object)
  }

  updateAllConduitTierInfo() {
    // console.warn('updateAllConduitTierInfo is deprecated, use recalculateTierInfo on renderer instead')
    
    // Update tier info for all conduits in the scene
    const conduitsGroup = this.scene.getObjectByName(this.groupName)
    if (conduitsGroup) {
      conduitsGroup.children.forEach(conduit => {
        if (conduit.userData?.type === 'conduit' || conduit.userData?.type === 'multiConduit') {
          const tierInfo = this.calculateTier(conduit.position.y)
          const conduitData = this.getObjectData(conduit)
          if (conduitData) {
            conduitData.tier = tierInfo.tier
            conduitData.tierName = tierInfo.tierName
            this.setObjectData(conduit, conduitData)
          }
        }
      })
    }
  }

  updateConduitDimensions(dimensions) {
    console.warn('updateConduitDimensions is deprecated, use updateObjectDimensions instead')
    return this.updateObjectDimensions(dimensions)
  }

  duplicateSelectedConduit() {
    console.warn('duplicateSelectedConduit is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  copySelectedConduit() {
    console.warn('copySelectedConduit is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  /**
   * Provide access to conduitGeometry for MepSelectionManager compatibility
   */
  get conduitGeometry() {
    return this.geometryManager
  }

  /**
   * Apply real-time snapping for conduit groups - override base class
   */
  applyRealTimeSnapping() {
    if (!this.selectedObject || !this.snapLineManager) return
    
    const snapTolerance = 0.03 // ~1.2 inches
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    if (!snapLines) return
    
    // Use actual bounding box for multi-conduit groups instead of calculated dimensions
    const groupBoundingBox = new THREE.Box3().setFromObject(this.selectedObject)
    const currentPos = this.selectedObject.position.clone()
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping (vertical positioning in tiers) - use actual group bounds
    const groupBottom = groupBoundingBox.min.y
    const groupTop = groupBoundingBox.max.y
    
    let closestYSnap = null
    let closestYDist = snapTolerance
    
    for (const line of snapLines.horizontal) {
      if (line.type === 'beam_top') {
        // Snap group bottom to beam top
        const dist = Math.abs(groupBottom - line.y)
        if (dist < closestYDist) {
          const offset = line.y - groupBottom
          closestYSnap = { newY: currentPos.y + offset, dist, lineY: line.y }
          closestYDist = dist
        }
      }
      
      if (line.type === 'beam_bottom') {
        // Snap group top to beam bottom  
        const dist = Math.abs(groupTop - line.y)
        if (dist < closestYDist) {
          const offset = line.y - groupTop
          closestYSnap = { newY: currentPos.y + offset, dist, lineY: line.y }
          closestYDist = dist
        }
      }
    }
    
    if (closestYSnap) {
      posY = closestYSnap.newY
      snapped = true
    }
    
    // Z-axis snapping - use actual group bounds
    const groupFront = groupBoundingBox.max.z
    const groupBack = groupBoundingBox.min.z
    
    let closestZSnap = null
    let closestZDist = snapTolerance
    
    for (const line of snapLines.vertical) {
      if (line.side === 'left') {
        // Snap group front to left post
        const dist = Math.abs(groupFront - line.z)
        if (dist < closestZDist) {
          const offset = line.z - groupFront
          closestZSnap = { newZ: currentPos.z + offset, dist, lineZ: line.z }
          closestZDist = dist
        }
      }
      
      if (line.side === 'right') {
        // Snap group back to right post
        const dist = Math.abs(groupBack - line.z)
        if (dist < closestZDist) {
          const offset = line.z - groupBack
          closestZSnap = { newZ: currentPos.z + offset, dist, lineZ: line.z }
          closestZDist = dist
        }
      }
    }
    
    if (closestZSnap) {
      posZ = closestZSnap.newZ
      snapped = true
    }
    
    // Apply the snapped position to the entire group
    if (snapped) {
      this.selectedObject.position.set(posX, posY, posZ)
      
      // Update the stored bounding box
      this.selectedObject.userData.boundingBox = new THREE.Box3().setFromObject(this.selectedObject)
    }
  }

  /**
   * Provide method access for MepSelectionManager compatibility
   */
  updateGroupAppearanceMethod(group, appearance) {
    return this.updateGroupAppearance(group, appearance)
  }
}

export default ConduitInteraction