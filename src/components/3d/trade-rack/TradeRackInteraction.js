/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { getMepSelectionManager } from '../core/MepSelectionManager.js'

/**
 * TradeRackInteraction - Handles mouse interactions and selection for trade racks
 */
export class TradeRackInteraction {
  constructor(scene, camera, renderer, orbitControls) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    
    this.selectedRack = null
    this.hoveredRack = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    this.originalMaterials = new Map() // Store original materials for restoration
    this.hoverMaterials = new Map() // Store hover materials for restoration
    
    // Transform controls for moving trade racks
    this.transformControls = null
    
    this.setupEventListeners()
    this.setupTransformControls()
    
    // Register with central MEP selection manager (with delay to ensure it's initialized)
    this.registerWithMepManager()
    
    // Make this instance globally available for configuration saving
    window.tradeRackInteractionInstance = this
  }

  setupEventListeners() {
    // Note: Click handling is now managed by MepSelectionManager
    // No individual event listeners needed for trade racks
  }

  setupTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.domElement)

    // Event listeners for transform changes
    this.transformControls.addEventListener('change', () => {
      if (this.selectedRack && this.selectedRack.parent) {
        this.onTransformChange()
      } else if (this.transformControls.object && !this.transformControls.object.parent) {
        // If the object is no longer in the scene, detach it
        this.transformControls.detach()
      }
    })

    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
      }
      
      if (!event.value) {
        // Save position when dragging ends
        this.saveRackPosition()
      }
    })

    // Configure for Z-axis only movement (left-right, not up-down)
    this.transformControls.setMode('translate')
    this.transformControls.setSpace('world')
    this.transformControls.setSize(0.8)
    this.transformControls.showX = false  // Lock X-axis (rack length direction)
    this.transformControls.showY = false  // Lock Y-axis (vertical direction)  
    this.transformControls.showZ = true   // Allow Z-axis (rack depth positioning)
    
    const gizmo = this.transformControls.getHelper()
    this.scene.add(gizmo)
  }

  registerWithMepManager() {
    // Use setTimeout to ensure MepSelectionManager is initialized
    setTimeout(() => {
      const mepManager = getMepSelectionManager()
      if (mepManager) {
        // Register trade rack handler with MepSelectionManager (register the entire instance)
        mepManager.registerHandler('tradeRack', this)
        console.log('✅ Trade rack registered with MepSelectionManager')
      } else {
        console.warn('⚠️ MepSelectionManager not available, trade rack will function independently')
      }
    }, 100)
  }

  /**
   * Check if measurement tool is currently active
   */
  isMeasurementToolActive() {
    return window.measurementToolInstance && window.measurementToolInstance.active
  }

  handleMouseClick(event) {
    // Don't process if measurement tool is active
    if (this.isMeasurementToolActive()) {
      return
    }

    // Calculate mouse position in normalized device coordinates
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Set up raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Find trade rack objects in the scene
    const tradeRackObjects = []
    this.scene.traverse((child) => {
      if (child.userData.type === 'tradeRack' && child.userData.selectable) {
        tradeRackObjects.push(child)
      }
    })

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(tradeRackObjects, true)

    if (intersects.length > 0) {
      // Find the trade rack group (parent of intersected mesh)
      let rackGroup = intersects[0].object
      while (rackGroup && rackGroup.userData.type !== 'tradeRack') {
        rackGroup = rackGroup.parent
      }

      if (rackGroup && rackGroup.userData.type === 'tradeRack') {
        this.selectRack(rackGroup)
        
        // Notify any listeners about the selection
        this.notifyRackSelected(rackGroup)
      }
    } else {
      // Clicked on empty space - deselect
      this.deselectRack()
    }
  }

  selectRack(rackGroup) {
    // Deselect current rack first
    if (this.selectedRack && this.selectedRack !== rackGroup) {
      this.deselectRack()
    }

    // Don't reselect the same rack
    if (this.selectedRack === rackGroup) return

    // Clear hover state if this rack is currently hovered
    if (this.hoveredRack === rackGroup) {
      this.clearHoverRack()
    }

    this.selectedRack = rackGroup

    // Update the handler reference in MepSelectionManager
    const mepManager = getMepSelectionManager()
    if (mepManager && mepManager.mepHandlers.tradeRack) {
      mepManager.mepHandlers.tradeRack.selectedRack = rackGroup
    }

    // Apply selection visual feedback
    this.applySelectionFeedback(rackGroup)

    // Calculate rack center for gizmo positioning
    const rackCenter = this.calculateRackCenter(rackGroup)

    // Store original position for potential restoration
    const originalPosition = rackGroup.position.clone()

    // Attach transform controls at rack center
    this.transformControls.setMode('translate')
    this.transformControls.attach(rackGroup)
    rackGroup.position.copy(originalPosition)
    
    // Position the gizmo at the rack center
    this.positionGizmoAtCenter(rackGroup, rackCenter)

    console.log('🎯 Trade rack selected:', rackGroup.userData)
  }

  deselectRack() {
    if (!this.selectedRack) return

    // Remove selection visual feedback
    this.removeSelectionFeedback(this.selectedRack)

    // Detach transform controls
    this.transformControls.detach()

    // Clean up gizmo anchor
    if (this.gizmoAnchor) {
      this.scene.remove(this.gizmoAnchor)
      this.gizmoAnchor = null
    }

    console.log('❌ Trade rack deselected')
    this.selectedRack = null

    // Update the handler reference in MepSelectionManager
    const mepManager = getMepSelectionManager()
    if (mepManager && mepManager.mepHandlers.tradeRack) {
      mepManager.mepHandlers.tradeRack.selectedRack = null
    }

    // Notify any listeners about the deselection
    this.notifyRackDeselected()
  }

  applySelectionFeedback(rackGroup) {
    // Store original materials before modifying
    rackGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        // Store original material if not already stored
        if (!this.originalMaterials.has(child.id)) {
          this.originalMaterials.set(child.id, child.material.clone())
        }

        // Create selection material - consistent with MEP systems
        const selectionMaterial = this.originalMaterials.get(child.id).clone()
        
        // Use MEP selection color (blue)
        if (selectionMaterial.color) {
          selectionMaterial.color.set(0x4A90E2) // Blue when selected
          selectionMaterial.transparent = true
          selectionMaterial.opacity = 0.9
        }

        child.material = selectionMaterial
      }
    })
  }

  removeSelectionFeedback(rackGroup) {
    // Restore original materials
    rackGroup.traverse((child) => {
      if (child.isMesh && this.originalMaterials.has(child.id)) {
        child.material = this.originalMaterials.get(child.id)
        this.originalMaterials.delete(child.id)
      }
    })
  }

  setHoverRack(rackGroup) {
    // Don't hover if this rack is already selected
    if (this.selectedRack === rackGroup) return
    
    // Clear current hover if different rack
    if (this.hoveredRack && this.hoveredRack !== rackGroup) {
      this.clearHoverRack()
    }
    
    // Don't re-hover the same rack
    if (this.hoveredRack === rackGroup) return
    
    this.hoveredRack = rackGroup
    this.applyHoverFeedback(rackGroup)
  }

  clearHoverRack() {
    if (!this.hoveredRack) return
    
    this.removeHoverFeedback(this.hoveredRack)
    this.hoveredRack = null
  }

  applyHoverFeedback(rackGroup) {
    // Store original materials before modifying
    rackGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        // Store original material if not already stored
        if (!this.originalMaterials.has(child.id)) {
          this.originalMaterials.set(child.id, child.material.clone())
        }

        // Create hover material - consistent with MEP systems
        const hoverMaterial = this.originalMaterials.get(child.id).clone()
        
        // Use MEP hover color (light blue)
        if (hoverMaterial.color) {
          hoverMaterial.color.set(0x00D4FF) // Light blue when hovered
          hoverMaterial.transparent = true
          hoverMaterial.opacity = 0.8
        }

        child.material = hoverMaterial
      }
    })
  }

  removeHoverFeedback(rackGroup) {
    // Restore original materials
    rackGroup.traverse((child) => {
      if (child.isMesh && this.originalMaterials.has(child.id)) {
        child.material = this.originalMaterials.get(child.id)
        // Don't delete the original material - keep it for selection/deselection
      }
    })
  }

  onTransformChange() {
    if (!this.selectedRack) return

    // If using gizmo anchor, apply movement to the actual rack
    if (this.gizmoAnchor && this.gizmoAnchor.userData.targetRack) {
      const targetRack = this.gizmoAnchor.userData.targetRack
      
      // Only apply Z-axis movement from gizmo to rack
      targetRack.position.z = this.gizmoAnchor.position.z
      
      // Apply constraints to the actual rack position
      this.applyZAxisConstraintsToRack(targetRack)
      
      // Sync gizmo position with constrained rack position
      this.gizmoAnchor.position.z = targetRack.position.z
    } else {
      // Fallback to original method if no gizmo anchor
      this.applyZAxisConstraints()
    }

    // Update any measurements or visual guides
    this.updateTransformVisuals()
  }

  applyZAxisConstraints() {
    if (!this.selectedRack) return
    this.applyZAxisConstraintsToRack(this.selectedRack)
  }

  applyZAxisConstraintsToRack(rackGroup) {
    if (!rackGroup) return

    // Get the rack configuration to determine depth constraints
    const rackConfig = rackGroup.userData.configuration
    if (!rackConfig) return

    const rackDepth = rackConfig.depth || 4 // Default 4 feet
    const rackHalfDepth = rackDepth / 2

    // Constrain Z position to reasonable bounds within rack structure
    // This prevents the rack from moving outside the structural bounds
    const minZ = -rackHalfDepth * 2
    const maxZ = rackHalfDepth * 2

    if (rackGroup.position.z < minZ) {
      rackGroup.position.z = minZ
    }
    if (rackGroup.position.z > maxZ) {
      rackGroup.position.z = maxZ
    }
  }

  updateTransformVisuals() {
    // Update any visual guides or measurements during transform
    // This can be extended to show measurements to rack boundaries
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  saveRackPosition() {
    if (!this.selectedRack) return

    // Save the new rack position to localStorage and update configuration
    const rackConfig = this.selectedRack.userData.configuration
    if (!rackConfig) return

    // Update the rack configuration with new position
    rackConfig.position = {
      x: this.selectedRack.position.x,
      y: this.selectedRack.position.y,
      z: this.selectedRack.position.z
    }

    // Update the userData
    this.selectedRack.userData.configuration = rackConfig

    // Save to localStorage if trade rack storage exists
    try {
      const storedRacks = JSON.parse(localStorage.getItem('configurTradeRacks') || '[]')
      const updatedRacks = storedRacks.map(rack => {
        if (rack.id === rackConfig.id || rack.rackId === this.selectedRack.userData.rackId) {
          return { ...rack, ...rackConfig }
        }
        return rack
      })

      localStorage.setItem('configurTradeRacks', JSON.stringify(updatedRacks))

      // Dispatch update event
      window.dispatchEvent(new CustomEvent('tradeRackUpdated', {
        detail: { 
          rackId: this.selectedRack.userData.rackId,
          position: rackConfig.position,
          configuration: rackConfig
        }
      }))

      console.log('💾 Trade rack position saved:', rackConfig.position)
    } catch (error) {
      console.warn('⚠️ Could not save trade rack position:', error)
    }
  }

  calculateRackCenter(rackGroup) {
    if (!rackGroup) return new THREE.Vector3()

    // Calculate the bounding box of the entire rack
    const box = new THREE.Box3().setFromObject(rackGroup)
    const center = box.getCenter(new THREE.Vector3())

    return center
  }

  positionGizmoAtCenter(rackGroup, rackCenter) {
    if (!this.transformControls || !rackGroup) return

    // Get rack configuration for height calculation
    const rackConfig = rackGroup.userData.configuration
    if (!rackConfig) return

    // Calculate the center height based on rack configuration
    let centerHeight = 0
    
    if (rackConfig.tierHeights && rackConfig.tierHeights.length > 0) {
      // Sum all tier heights and divide by 2 to get center
      const totalHeight = rackConfig.tierHeights.reduce((sum, tier) => {
        const tierHeightFeet = (tier.feet || 0) + (tier.inches || 0) / 12
        return sum + tierHeightFeet
      }, 0)
      centerHeight = totalHeight / 2
    } else {
      // Fallback: use bounding box center
      centerHeight = rackCenter.y
    }

    // Create a temporary group to hold the transform controls at the correct position
    if (!this.gizmoAnchor) {
      this.gizmoAnchor = new THREE.Group()
      this.scene.add(this.gizmoAnchor)
    }

    // Position the anchor at the rack center
    this.gizmoAnchor.position.copy(rackGroup.position)
    this.gizmoAnchor.position.y += centerHeight

    // Detach from rack and attach to anchor
    this.transformControls.detach()
    this.transformControls.attach(this.gizmoAnchor)

    // Store reference to the actual rack for movement
    this.gizmoAnchor.userData.targetRack = rackGroup
  }


  notifyRackSelected(rackGroup) {
    // Dispatch custom event for UI components to listen to
    const event = new CustomEvent('tradeRackSelected', {
      detail: {
        rack: rackGroup,
        configuration: rackGroup.userData.configuration,
        rackId: rackGroup.userData.rackId
      }
    })
    document.dispatchEvent(event)
  }

  notifyRackDeselected() {
    // Dispatch custom event for UI components to listen to
    const event = new CustomEvent('tradeRackDeselected')
    document.dispatchEvent(event)
  }

  // Methods expected by MepSelectionManager
  selectObject(rackGroup) {
    this.selectRack(rackGroup)
  }
  
  deselectAll() {
    this.deselectRack()
  }
  
  setHover(rackGroup) {
    this.setHoverRack(rackGroup)
  }
  
  clearHover() {
    this.clearHoverRack()
  }

  // Public methods for external control
  getSelectedRack() {
    return this.selectedRack
  }

  getCurrentRackPosition() {
    // If a rack is selected, return its position
    if (this.selectedRack) {
      return {
        x: this.selectedRack.position.x,
        y: this.selectedRack.position.y,
        z: this.selectedRack.position.z
      }
    }

    // Otherwise, find any trade rack in the scene and return its position
    let foundRack = null
    this.scene.traverse((child) => {
      if (child.userData && child.userData.type === 'tradeRack' && !foundRack) {
        foundRack = child
      }
    })

    if (foundRack) {
      return {
        x: foundRack.position.x,
        y: foundRack.position.y,
        z: foundRack.position.z
      }
    }

    return null
  }

  forceSelectRack(rackId) {
    // Find rack by ID and select it
    let targetRack = null
    this.scene.traverse((child) => {
      if (child.userData.type === 'tradeRack' && 
          child.userData.rackId === rackId) {
        targetRack = child
      }
    })

    if (targetRack) {
      this.selectRack(targetRack)
    }
  }

  dispose() {
    // Clean up - no individual event listeners to remove since MepSelectionManager handles clicks

    // Clear selection
    this.deselectRack()

    // Clean up transform controls
    if (this.transformControls) {
      this.transformControls.detach()
      this.scene.remove(this.transformControls.getHelper())
      this.transformControls.dispose()
      this.transformControls = null
    }

    // Clean up gizmo anchor
    if (this.gizmoAnchor) {
      this.scene.remove(this.gizmoAnchor)
      this.gizmoAnchor = null
    }

    // Clear stored materials
    this.originalMaterials.clear()

    // Unregister from MEP selection manager
    const mepManager = getMepSelectionManager()
    if (mepManager && mepManager.mepHandlers) {
      mepManager.mepHandlers.tradeRack = null
    }

    // Clean up global reference
    if (window.tradeRackInteractionInstance === this) {
      window.tradeRackInteractionInstance = null
    }
  }
}