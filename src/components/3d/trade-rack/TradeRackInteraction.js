/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { BaseMepInteraction } from '../base/BaseMepInteraction.js'
import * as THREE from 'three'
import { getProjectManifest, updateTradeRackConfiguration } from '../../../utils/projectManifest'
import { saveRackTemporaryPosition, getRackTemporaryState, updateRackTemporaryState } from '../../../utils/temporaryState'

/**
 * TradeRackInteraction - Trade rack-specific implementation using base class
 * This dramatically simplifies the trade rack interaction code
 * Note: Trade racks don't use snap lines, so snapLineManager is null
 */
export class TradeRackInteraction extends BaseMepInteraction {
  constructor(scene, camera, renderer, orbitControls) {
    super({
      scene,
      camera,
      renderer,
      orbitControls,
      snapLineManager: null, // Trade racks don't use snap lines
      mepType: 'tradeRack',
      mepTypePlural: 'tradeRacks',
      groupName: 'TradeRackGroup',
      geometryManager: null // Trade racks don't have a geometry manager like MEP items
    })
    
    // Trade rack-specific properties
    this.selectedRackGroup = null
    this.hoveredRackGroup = null
    this.originalMaterials = new Map() // Store original materials for restoration
    this.hoverMaterials = new Map() // Store hover materials for restoration
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    this.transformPivot = null // Pivot object for centering transform controls
    
    // Make this instance globally available for configuration saving
    window.tradeRackInteractionInstance = this
    
    // Add direct click listener for testing - use capture phase to run before MepSelectionManager
    this.domElement.addEventListener('click', (event) => {
      // console.log('🔧 Direct click listener called on domElement (capture phase)')
      // console.log('🔧 Event target:', event.target)
      // console.log('🔧 Event type:', event.type)
      // console.log('🔧 Event coordinates:', event.clientX, event.clientY)
      
      // Try to handle trade rack selection first
      const handled = this.testTradeRackClick(event)
      if (handled) {
        // console.log('🔧 Trade rack selection handled, stopping propagation')
        event.stopPropagation()
        event.preventDefault()
      } else {
        // console.log('🔧 Trade rack NOT handled, allowing event to continue')
      }
    }, true) // Use capture phase to run before other handlers
    
    // Also add mousedown for testing
    this.domElement.addEventListener('mousedown', (event) => {
      // console.log('🔧 MouseDown event received')
    })
    
    // Listen for transform control changes to sync rack position with pivot
    if (this.transformControls) {
      this.transformControls.addEventListener('change', () => {
        if (this.transformPivot && this.selectedObject) {
          // Calculate the delta movement of the pivot
          const pivotPos = this.transformPivot.position
          const rackPos = this.selectedObject.position
          
          // Only update Z position (depth) since we're restricting to Z-axis
          this.selectedObject.position.z = pivotPos.z
          
          // console.log('🔧 Synced rack Z position:', this.selectedObject.position.z)
        }
      })
      
      // Save TEMPORARY state when transform controls finish dragging
      this.transformControls.addEventListener('dragging-changed', (event) => {
        if (!event.value && this.selectedObject && this.selectedObject.userData?.type === 'tradeRack') {
          // Dragging has ended, save the temporary state
          this.saveRackTemporaryState()
        }
      })
    }
    
    // Debug transform controls setup
    setTimeout(() => {
      // console.log('🔧 Transform controls check:', {
      //   exists: !!this.transformControls,
      //   visible: this.transformControls?.visible,
      //   enabled: this.transformControls?.enabled,
      //   mode: this.transformControls?.getMode(),
      //   object: this.transformControls?.object?.name || 'no object attached',
      //   inScene: this.transformControls ? this.scene.children.includes(this.transformControls) : false
      // })
      
      // Debug temporary state on startup
      const tempState = TradeRackInteraction.loadRackTemporaryState()
      // console.log('🔧 Loaded temporary state on startup:', tempState)
    }, 1000)
  }

  // Implement abstract methods for trade rack-specific behavior
  
  /**
   * Find the selectable trade rack object from a target
   */
  findSelectableObject(target) {
    // First check if the target itself is the rack group
    let current = target
    while (current) {
      if (current.userData?.type === 'tradeRack') {
        return current
      }
      current = current.parent
    }
    return null
  }

  /**
   * Find the group containing a trade rack object
   */
  findGroupForObject(object) {
    // For trade racks, the object itself is typically the group
    if (object.userData.type === 'tradeRack') {
      return object
    }
    return object // Fallback to the object itself
  }

  /**
   * Update trade rack appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    if (!object) return
    
    // Trade rack appearance logic - traverse and update materials
    object.traverse((child) => {
      if (child.isMesh) {
        this.updateMeshAppearance(child, state)
      }
    })
  }

  /**
   * Update individual mesh appearance for trade rack components
   */
  updateMeshAppearance(mesh, state) {
    const originalMaterial = this.originalMaterials.get(mesh) || mesh.material

    switch (state) {
      case 'selected':
        if (!this.originalMaterials.has(mesh)) {
          this.originalMaterials.set(mesh, mesh.material.clone())
        }
        mesh.material = mesh.material.clone()
        mesh.material.color.setHex(0x4A90E2) // Blue for selected
        mesh.material.emissive.setHex(0x002244)
        break
      case 'hover':
        if (!this.originalMaterials.has(mesh)) {
          this.originalMaterials.set(mesh, mesh.material.clone())
        }
        mesh.material = mesh.material.clone()
        mesh.material.color.setHex(0x00D4FF) // Light blue for hover (same as ducts)
        mesh.material.emissive.setHex(0x002244)
        break
      case 'normal':
      default:
        if (this.originalMaterials.has(mesh)) {
          mesh.material = this.originalMaterials.get(mesh)
        }
        break
    }
  }

  /**
   * Get trade rack data from object
   */
  getObjectData(object) {
    return object.userData.configuration
  }

  /**
   * Set trade rack data on object
   */
  setObjectData(object, data) {
    object.userData.configuration = data
  }

  /**
   * Calculate trade rack dimensions in meters
   */
  calculateObjectDimensions(rackData) {
    if (!rackData) {
      return { width: 3.6576, height: 1.8288 } // 12' x 6' default
    }

    // Trade racks use bayCount and bayWidth for total width
    const bayCount = rackData.bayCount || 4
    const bayWidth = rackData.bayWidth || { feet: 3, inches: 0 }
    
    let bayWidthM
    if (typeof bayWidth === 'number') {
      bayWidthM = bayWidth * 0.3048 // feet to meters
    } else {
      bayWidthM = ((bayWidth.feet || 0) + (bayWidth.inches || 0) / 12) * 0.3048
    }
    
    const totalWidth = bayCount * bayWidthM
    
    // Calculate total height from tier heights
    const tierHeights = rackData.tierHeights || []
    let totalHeight = 0
    tierHeights.forEach(tierHeight => {
      if (typeof tierHeight === 'number') {
        totalHeight += tierHeight * 0.3048 // feet to meters
      } else {
        totalHeight += ((tierHeight.feet || 0) + (tierHeight.inches || 0) / 12) * 0.3048
      }
    })
    
    return {
      width: totalWidth,
      height: totalHeight || 1.8288 // fallback to 6 feet
    }
  }

  /**
   * Trade racks don't use tier tolerance like MEP items
   */
  calculateTierTolerance(height) {
    return 0.1 // Small default tolerance
  }

  /**
   * Trade racks don't typically need geometry updates like MEP items
   */
  needsGeometryUpdate(newDimensions) {
    // Trade racks rebuild entirely rather than updating geometry
    return !!(newDimensions.tierCount || newDimensions.bayCount || 
              newDimensions.tierHeights || newDimensions.bayWidth)
  }

  /**
   * Trade racks rebuild rather than recreating geometry
   */
  recreateObjectGeometry(rack, updatedData) {
    // Trade racks typically trigger a full rebuild through the scene
    console.warn('Trade racks require full rebuild, not geometry recreation')
  }

  /**
   * Trade racks are created differently than MEP items
   */
  createNewObject(rackData) {
    console.warn('Trade racks are created through buildRack utility, not createNewObject')
    return null
  }

  /**
   * Save trade rack configuration to storage
   */
  saveNewObjectToStorage(rackData) {
    try {
      // Trade racks might use different storage mechanism
      const manifest = getProjectManifest()
      const storedConfigs = manifest.tradeRacks.configurations || []
      storedConfigs.push({
        id: rackData.id || Date.now().toString(),
        configuration: rackData,
        position: rackData.position
      })
      updateTradeRackConfiguration(configToSave, true)
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving trade rack to storage:', error)
    }
  }

  /**
   * Save trade rack data to storage
   */
  saveObjectDataToStorage(rackData) {
    this.saveNewObjectToStorage(rackData)
  }

  /**
   * Override applyRealTimeSnapping to do nothing since trade racks don't snap
   */
  applyRealTimeSnapping() {
    // Trade racks don't use snapping
  }

  /**
   * Override tier calculation since trade racks don't use MEP tiers
   */
  calculateTier(yPosition) {
    return { tier: 1, tierName: 'Ground' }
  }

  /**
   * Override transform controls config to only allow Z-axis movement
   */
  getTransformControlsConfig() {
    return {
      showX: false,  // Lock X-axis
      showY: false,  // Lock Y-axis  
      showZ: true,   // Allow Z-axis (depth) only
      size: 1.2      // Larger gizmo for trade racks
    }
  }

  /**
   * Override handleClick to use trade rack-specific selection logic
   * Raycast against actual rack elements (beams, posts) not bounding boxes
   * Return true to indicate successful handling and prevent base class processing
   */
  handleClick(event, intersectedObject) {
    
    if (this.transformControls?.dragging) {
      return false
    }

    // Use the same logic as testTradeRackClick for consistency
    const result = this.testTradeRackClick(event)
    
    // Return true if we handled the click (selected or deselected a trade rack)
    // This prevents further processing by base classes and MepSelectionManager
    return result
  }

  /**
   * Test method to directly handle trade rack clicks (bypassing base class)
   */
  testTradeRackClick(event) {
    
    // Calculate mouse coordinates
    const rect = this.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Update camera matrices before raycasting
    this.camera.updateMatrixWorld()
    this.raycaster.setFromCamera(mouse, this.camera)

    // Find all trade rack groups and collect their actual mesh children
    const rackMeshes = []
    const rackMeshToGroup = new Map()
    
    this.scene.traverse((child) => {
      if (child.userData?.type === 'tradeRack') {
        // console.log('🔧 Found trade rack group:', child.name, child.userData)
        // console.log('🔧 Rack group position:', child.position)
        // console.log('🔧 Rack group visible:', child.visible)
        
        child.traverse((meshChild) => {
          if (meshChild.isMesh) {
            rackMeshes.push(meshChild)
            rackMeshToGroup.set(meshChild, child)
            
            // Get world position and bounding box of mesh
            const worldPos = new THREE.Vector3()
            meshChild.getWorldPosition(worldPos)
            const boundingBox = new THREE.Box3().setFromObject(meshChild)
            
            // console.log('🔧   - Added mesh:', meshChild.name || 'unnamed mesh')
            // console.log('🔧     World position:', worldPos)
            // console.log('🔧     Bounding box:', boundingBox.min, 'to', boundingBox.max)
            // console.log('🔧     Visible:', meshChild.visible)
            // console.log('🔧     Material:', meshChild.material?.type)
          }
        })
      }
    })


    if (rackMeshes.length === 0) {
      return false
    }

    // Raycast against actual rack meshes
    const intersects = this.raycaster.intersectObjects(rackMeshes, false)
    
    
    if (intersects.length === 0) {
    }

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object
      const rackGroup = rackMeshToGroup.get(intersectedMesh)

      // console.log('🔧 testTradeRackClick intersected mesh:', intersectedMesh.name || 'unnamed')
      // console.log('🔧 testTradeRackClick distance:', intersects[0].distance)
      // console.log('🔧 testTradeRackClick rack group:', rackGroup?.userData)

      if (rackGroup && rackGroup.userData?.type === 'tradeRack') {
        // console.log('🎯 DIRECT SELECTION: Trade rack found, selecting...')
        
        // Clear any existing selection first
        if (this.selectedObject) {
          // console.log('🎯 Clearing previous selection')
          this.updateObjectAppearance(this.selectedObject, 'normal')
        }
        
        // Set selection directly
        // console.log('🎯 Setting selectedObject to:', rackGroup.name)
        this.selectedObject = rackGroup
        this.updateObjectAppearance(rackGroup, 'selected')
        
        // Try to attach transform controls
        if (this.transformControls) {
          // console.log('🎯 Transform controls exist, attaching to rack')
          
          // Calculate the center of the rack's bounding box
          const box = new THREE.Box3().setFromObject(rackGroup)
          const center = box.getCenter(new THREE.Vector3())
          
          // Create a temporary pivot object at the rack's center
          const pivot = new THREE.Object3D()
          pivot.position.copy(center)
          this.scene.add(pivot)
          
          // Store the pivot for cleanup later
          if (this.transformPivot) {
            this.scene.remove(this.transformPivot)
          }
          this.transformPivot = pivot
          
          // Apply Z-axis only configuration
          const config = this.getTransformControlsConfig()
          this.transformControls.showX = config.showX
          this.transformControls.showY = config.showY  
          this.transformControls.showZ = config.showZ
          this.transformControls.size = config.size
          
          // Attach to the pivot instead of the rack directly
          this.transformControls.attach(pivot)
          this.transformControls.visible = true
          this.transformControls.enabled = true
          
          // Link the rack to move with the pivot
          pivot.userData.linkedObject = rackGroup
          
          // console.log('🎯 Transform controls at rack center:', center)
          // console.log('🎯 Transform controls configured for Z-axis only:', config)
          // console.log('🎯 Transform controls attached, visible:', this.transformControls.visible)
        } else {
          // console.log('🎯 No transform controls available!')
        }
        
        // console.log('🎯 Direct selection completed successfully')
        
        // Dispatch event to notify that a trade rack was selected
        document.dispatchEvent(new CustomEvent('tradeRackSelected', { 
          detail: { rack: rackGroup } 
        }))
        
        return true
      } else {
        // console.log('🔧 Found intersection but not a valid trade rack')
      }
    } else {
      // console.log('🔧 No intersections found - checking if we should deselect')
      
      // If we have a currently selected trade rack, deselect it
      if (this.selectedObject && this.selectedObject.userData?.type === 'tradeRack') {
        // console.log('🎯 Deselecting current trade rack:', this.selectedObject.name)
        this.updateObjectAppearance(this.selectedObject, 'normal')
        this.selectedObject = null
        
        // Hide transform controls and cleanup pivot
        if (this.transformControls) {
          this.transformControls.detach()
          this.transformControls.visible = false
          // console.log('🎯 Transform controls detached and hidden')
        }
        
        // Clean up the pivot object
        if (this.transformPivot) {
          this.scene.remove(this.transformPivot)
          this.transformPivot = null
        }
        
        // console.log('🎯 Trade rack deselected successfully')
        
        // Dispatch event to notify that trade rack was deselected
        document.dispatchEvent(new CustomEvent('tradeRackDeselected'))
        
        return true // We handled the click by deselecting
      }
    }
    
    return false
  }

  /**
   * Override handleMouseMove to use trade rack-specific hover logic
   * Hover on actual rack elements (beams, posts) not bounding boxes
   */
  handleMouseMove(event, mouse) {
    if (this.transformControls?.dragging) {
      // Call base class method for transform control handling
      super.handleMouseMove(event, mouse)
      return
    }

    // Calculate mouse coordinates
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1


    // Update camera matrices before raycasting
    this.camera.updateMatrixWorld()
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Find all trade rack groups and collect their actual mesh children
    const rackMeshes = []
    const rackMeshToGroup = new Map()
    
    this.scene.traverse((child) => {
      if (child.userData?.type === 'tradeRack') {
        child.traverse((meshChild) => {
          if (meshChild.isMesh) {
            rackMeshes.push(meshChild)
            rackMeshToGroup.set(meshChild, child)
          }
        })
      }
    })

    // Raycast against actual rack meshes
    const intersects = this.raycaster.intersectObjects(rackMeshes, false)

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object
      const rackGroup = rackMeshToGroup.get(intersectedMesh)

      if (rackGroup && rackGroup.userData?.type === 'tradeRack' && rackGroup !== this.selectedObject) {
        // Set hover on the rack group
        this.setHover(rackGroup)
      }
    } else {
      // Clear hover
      this.clearHover()
    }
  }

  /**
   * Save rack TEMPORARY state (position, clearance) - updates immediately
   * This is separate from permanent configurations
   */
  saveRackTemporaryState() {
    if (!this.selectedObject || this.selectedObject.userData?.type !== 'tradeRack') {
      return
    }
    
    const rack = this.selectedObject
    
    // Calculate current effective top clearance based on position
    const config = rack.userData.configuration || {}
    const baselineY = config.baselineY !== undefined ? config.baselineY : rack.position.y
    const currentClearanceMeters = Math.max(0, baselineY - rack.position.y)
    const currentClearanceInches = currentClearanceMeters / 0.0254 // Convert meters to inches
    const currentClearanceFeet = currentClearanceInches / 12 // Convert to feet
    
    const temporaryState = {
      position: {
        x: rack.position.x,
        y: rack.position.y,
        z: rack.position.z
      },
      topClearance: currentClearanceFeet, // Use calculated clearance
      topClearanceInches: currentClearanceInches, // Also store in inches
      timestamp: Date.now()
    }
    
    console.log('🔧 Saving rack TEMPORARY state:', temporaryState)
    
    try {
      // Save temporary state using the unified position field and calculated clearance
      const positionToSave = this.selectedObject ? this.selectedObject.position : this.selectedRackGroup?.position
      if (positionToSave) {
        updateRackTemporaryState({
          position: {
            x: positionToSave.x,
            y: positionToSave.y,
            z: positionToSave.z
          },
          topClearance: currentClearanceFeet, // Include calculated top clearance
          isDragging: false
        })
        
        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('rackTemporaryStateChanged', { 
          detail: temporaryState 
        }))
        
        console.log('🔧 Rack temporary state saved successfully with clearance:', currentClearanceFeet, 'feet')
      } else {
        console.warn('⚠️ No selected rack to save temporary state for')
      }
    } catch (error) {
      console.error('Error saving rack temporary state:', error)
    }
  }
  
  /**
   * Load rack TEMPORARY state
   */
  static loadRackTemporaryState() {
    try {
      const tempState = getRackTemporaryState()
      if (tempState && tempState.position) {
        return {
          position: tempState.position,
          isDragging: tempState.isDragging
        }
      }
    } catch (error) {
      console.error('Error loading rack temporary state:', error)
    }
    return null
  }

  /**
   * Override saveObjectPosition for trade rack-specific storage
   */
  saveObjectPosition() {
    if (!this.selectedObject || this.selectedObject.userData?.type !== 'tradeRack') {
      return
    }
    
    // Ensure selectedRackGroup is set to the same as selectedObject for rack interactions
    if (this.selectedObject && !this.selectedRackGroup) {
      this.selectedRackGroup = this.selectedObject
    }
    
    // Save to temporary state instead of MEP items storage
    console.log('🔧 Saving position after drag:', this.selectedObject.position)
    this.saveRackTemporaryState()
  }

  /**
   * Update trade rack dimensions (specifically top clearance)
   * This adjusts the rack's vertical position relative to its baseline position
   */
  updateTradeRackDimensions(newDimensions) {
    if (!this.selectedObject || this.selectedObject.userData?.type !== 'tradeRack') {
      console.warn('🔧 No trade rack selected to update')
      return
    }
    
    const rack = this.selectedObject
    const config = rack.userData.configuration || {}
    
    // Get the baseline Y position (where rack was originally built)
    const baselineY = config.baselineY !== undefined ? config.baselineY : rack.position.y
    
    // Convert clearance from inches to meters for position calculation
    const IN2M = 0.0254
    const clearanceInches = newDimensions.topClearance || 0
    const clearanceMeters = clearanceInches * IN2M
    
    // Calculate new Y position: baseline minus clearance (more clearance = further down)
    const newYPosition = baselineY - clearanceMeters
    
    // Update rack position directly
    rack.position.y = newYPosition
    
    // Update the configuration to store the baseline if not already stored
    rack.userData.configuration = {
      ...config,
      baselineY: baselineY,
      topClearance: clearanceInches / 12 // Convert back to feet for storage consistency
    }
    
    console.log('🔧 Trade rack moved to Y:', newYPosition, '(clearance:', clearanceInches, 'inches from baseline:', baselineY, ')')
    
    // Save TEMPORARY state only (not permanent configuration)
    this.saveRackTemporaryState()
    
    // If transform controls are attached, update them
    if (this.transformControls && this.transformControls.object === rack) {
      // Re-attach to update the transform controls position
      this.transformControls.attach(rack)
    }
  }

  /**
   * Get the current rack position for saving configurations
   * @returns {Object|null} Current rack position {x, y, z} or null if no rack selected
   */
  getCurrentRackPosition() {
    console.log('🔧 GET CURRENT RACK POSITION: selectedObject:', this.selectedObject?.userData?.type)
    
    if (!this.selectedObject || this.selectedObject.userData?.type !== 'tradeRack') {
      // If no rack is selected, try to find any rack in the scene
      console.log('🔧 GET CURRENT RACK POSITION: No selected rack, searching scene...')
      
      // Search for rack directly in scene children (racks are added directly to scene)
      let foundRack = null
      this.scene.traverse((child) => {
        if (child.userData?.type === 'tradeRack' && !foundRack) {
          foundRack = child
        }
      })
      
      console.log('🔧 GET CURRENT RACK POSITION: Found rack in scene:', !!foundRack)
      
      if (foundRack) {
        const position = {
          x: foundRack.position.x,
          y: foundRack.position.y,
          z: foundRack.position.z
        }
        console.log('🔧 GET CURRENT RACK POSITION: Found rack in scene, position:', position)
        return position
      }
      console.log('🔧 GET CURRENT RACK POSITION: No rack found in scene')
      return null
    }
    
    const position = {
      x: this.selectedObject.position.x,
      y: this.selectedObject.position.y,
      z: this.selectedObject.position.z
    }
    console.log('🔧 GET CURRENT RACK POSITION: Using selected rack, position:', position)
    return position
  }

  // Backward compatibility methods for existing code
  
  /**
   * Get selected trade rack (for backward compatibility)
   */
  get selectedRack() {
    return this.selectedObject
  }

  /**
   * Set selected trade rack (for backward compatibility)
   */
  set selectedRack(rack) {
    if (rack) {
      this.selectObject(rack)
    } else {
      this.deselectObject()
    }
  }

  /**
   * Backward compatibility methods
   */
  getSelectedRack() {
    return this.selectedObject
  }

  selectRack(rack) {
    return this.selectObject(rack)
  }

  deselectRack() {
    return this.deselectObject()
  }

  findRackGroup(object) {
    return this.findSelectableObject(object)
  }

  copySelectedRack() {
    console.warn('copySelectedRack is deprecated, use copySelectedObject instead')
    return this.copySelectedObject()
  }

  duplicateSelectedRack() {
    console.warn('duplicateSelectedRack is deprecated, use copySelectedObject instead') 
    return this.copySelectedObject()
  }

  updateRackDimensions(dimensions) {
    console.warn('updateRackDimensions is deprecated, trade racks require full rebuild')
    // Trade racks typically require full rebuild instead of dimension updates
  }
}

export default TradeRackInteraction