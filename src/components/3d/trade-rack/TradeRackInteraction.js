/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { getMepSelectionManager } from '../core/MepSelectionManager.js'
import { hasUnsavedMepChanges } from '../utils/mepTemporaryState.js'
import { addRackPositionChange, addRackParameterChange } from '../../../utils/projectManifest.js'

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
    
    // Make MEP checking functions globally available
    window.hasUnsavedMepChanges = hasUnsavedMepChanges
    
    // Add global debug helper for app MEP state
    const updateAppMepCount = () => {
      try {
        const mepItems = localStorage.getItem('configurMepItems')
        window.appMepItemsCount = mepItems ? JSON.parse(mepItems).length : 0
      } catch (e) {
        window.appMepItemsCount = 'error'
      }
    }
    updateAppMepCount()
    setInterval(updateAppMepCount, 3000) // Update every 3 seconds
    
    // Ensure no rack is selected on initialization (user should manually select)
    this.selectedRack = null
    console.log('🎯 TradeRackInteraction initialized - no rack selected')
    
    // Add debugging functions to global scope for testing
    window.debugTempState = {
      check: () => {
        const tempState = localStorage.getItem('configurTempRackState')
        const rackParams = localStorage.getItem('rackParameters')
        console.log('🔍 Debug Temp State:')
        console.log('  configurTempRackState:', tempState ? JSON.parse(tempState) : 'null')
        console.log('  rackParameters:', rackParams ? JSON.parse(rackParams) : 'null')
        console.log('  hasUnsavedChanges:', TradeRackInteraction.hasUnsavedChanges())
      },
      clear: () => {
        TradeRackInteraction.clearTemporaryState()
        console.log('✅ Temporary state cleared')
      },
      save: (name) => {
        const success = TradeRackInteraction.saveTemporaryStateToPermanent(name || 'Debug Save')
        console.log(success ? '✅ Temporary state saved' : '❌ Save failed')
      },
      checkSnapPoints: () => {
        const measurementTool = window.measurementToolInstance
        console.log('🎯 Snap Points Debug:')
        console.log('  measurementTool exists:', !!measurementTool)
        console.log('  snapPoints count:', measurementTool?.snapPoints?.length || 0)
        console.log('  selectedRack:', window.tradeRackInteractionInstance?.selectedRack?.userData?.rackId || 'none')
        if (measurementTool?.snapPoints) {
          const rackSnapPoints = measurementTool.snapPoints.filter(sp => sp.rackId)
          console.log('  rack snap points:', rackSnapPoints.length)
          const rackIds = [...new Set(rackSnapPoints.map(sp => sp.rackId))]
          console.log('  unique rack IDs in snap points:', rackIds)
        }
      },
      refreshSelection: () => {
        if (window.tradeRackInteractionInstance) {
          const instance = window.tradeRackInteractionInstance
          const currentRackId = instance.selectedRack?.userData?.rackId
          if (currentRackId) {
            console.log('🔄 Refreshing selection for rack:', currentRackId)
            instance.findAndSelectRackById(currentRackId)
            instance.updateRackSnapPoints()
          }
        }
      },
      checkMep: () => {
        const mepItems = localStorage.getItem('configurMepItems')
        const tempState = localStorage.getItem('configurTempRackState')
        const savedConfigs = localStorage.getItem('tradeRackConfigurations')
        console.log('🔧 MEP System Debug:')
        console.log('  MEP Items in localStorage:', mepItems ? JSON.parse(mepItems).length : 0)
        console.log('  MEP Items in temp state:', tempState ? (JSON.parse(tempState).mepItems?.length || 0) : 0)
        console.log('  Has unsaved MEP changes:', window.hasUnsavedMepChanges?.() || 'function not available')
        if (tempState) {
          const parsed = JSON.parse(tempState)
          console.log('  Temp state last modified:', parsed.lastModified)
        }
        if (savedConfigs) {
          const configs = JSON.parse(savedConfigs)
          console.log('  Saved configurations:', configs.length)
          configs.forEach((config, i) => {
            console.log(`    Config ${i}: "${config.name}" - MEP items: ${config.mepItems?.length || 0}`)
          })
        }
        
        // Also check what the app currently has
        console.log('  Current app MEP state:', window.appMepItemsCount || 'unknown')
      },
      saveMepWithRack: (name) => {
        const success = TradeRackInteraction.saveTemporaryStateToPermanent(name || 'Debug MEP+Rack Save')
        console.log(success ? '✅ MEP+Rack temporary state saved' : '❌ MEP+Rack save failed')
      },
      testParameterTracking: (paramName, oldVal, newVal) => {
        TradeRackInteraction.trackParameterChange(paramName || 'tierCount', oldVal || 2, newVal || 3, 'test_rack_id')
        console.log('✅ Parameter change tracked')
      },
      testPositionTracking: () => {
        const oldPos = { x: 0, y: 0, z: 0 }
        const newPos = { x: 1, y: 0, z: 2 }
        const manifest = window.addRackPositionChange?.(oldPos, newPos, 'test_rack_id')
        console.log('✅ Position change tracked:', manifest ? 'success' : 'failed')
      },
      viewHistory: (limit = 20) => {
        try {
          const manifest = localStorage.getItem('projectManifest')
          const parsed = JSON.parse(manifest)
          console.log(`📊 Change History (showing ${limit} most recent):`)
          console.log('Total changes tracked:', parsed.changeHistory?.length || 0)
          console.log('─'.repeat(80))
          parsed.changeHistory?.slice(0, limit).forEach((change, i) => {
            const time = change.timestamp.split('T')[1].split('.')[0]
            const date = change.timestamp.split('T')[0]
            console.log(`${String(i+1).padStart(2)}. [${date} ${time}] ${change.title}`)
            console.log(`    Component: ${change.component} | Action: ${change.action}`)
            if (change.details.rackId) console.log(`    Rack ID: ${change.details.rackId}`)
            if (change.details.itemId) console.log(`    Item ID: ${change.details.itemId}`)
            console.log('')
          })
        } catch (error) {
          console.error('Error viewing history:', error)
        }
      }
    }
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

  selectRack(rackGroup, reason = 'user_click') {
    console.log('🎯 selectRack called:', {
      rackId: rackGroup?.userData?.rackId,
      reason,
      wasSelected: !!this.selectedRack
    })
    
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

    // Store old position for change tracking
    const oldPosition = rackConfig.position ? { ...rackConfig.position } : null
    
    // Update the rack configuration with new position
    const newPosition = {
      x: this.selectedRack.position.x,
      y: this.selectedRack.position.y,
      z: this.selectedRack.position.z
    }
    rackConfig.position = newPosition

    // Update the userData
    this.selectedRack.userData.configuration = rackConfig

    // Track position change in project manifest
    if (oldPosition) {
      addRackPositionChange(oldPosition, newPosition, this.selectedRack.userData.rackId)
    }

    // Update snap points for the moved rack
    this.updateRackSnapPoints()

    // Save to temporary state (this persists across refreshes but doesn't overwrite saved configs)
    this.saveToTemporaryState(rackConfig)

    // Dispatch update event
    window.dispatchEvent(new CustomEvent('tradeRackUpdated', {
      detail: { 
        rackId: this.selectedRack.userData.rackId,
        position: rackConfig.position,
        configuration: rackConfig
      }
    }))

    console.log('💾 Trade rack position saved to temporary state:', rackConfig.position)
  }

  /**
   * Save rack configuration to temporary state storage
   * This persists across page refreshes but doesn't overwrite saved configurations
   */
  saveToTemporaryState(rackConfig) {
    try {
      // Get current MEP items to include in temporary state
      const currentMepItems = this.getCurrentMepItems()
      
      // Save to temporary state key with timestamp
      const tempState = {
        ...rackConfig,
        mepItems: currentMepItems,
        lastModified: new Date().toISOString(),
        isTemporary: true
      }
      
      localStorage.setItem('configurTempRackState', JSON.stringify(tempState))
      
      // Also update the main rack parameters to ensure consistency
      localStorage.setItem('rackParameters', JSON.stringify(rackConfig))
      
      console.log('💾 Saved to temporary rack state with', currentMepItems?.length || 0, 'MEP items')
    } catch (error) {
      console.warn('⚠️ Could not save to temporary rack state:', error)
    }
  }
  
  /**
   * Get current MEP items from localStorage
   */
  getCurrentMepItems() {
    try {
      const mepItems = localStorage.getItem('configurMepItems')
      return mepItems ? JSON.parse(mepItems) : []
    } catch (error) {
      console.warn('⚠️ Could not get current MEP items:', error)
      return []
    }
  }

  /**
   * Load rack configuration - prioritizes temporary state over saved configurations
   * This is called when the scene initializes to restore the user's working state
   * Also restores MEP items associated with the configuration
   */
  static loadRackConfiguration() {
    try {
      // First check for temporary state
      const tempState = localStorage.getItem('configurTempRackState')
      if (tempState) {
        const parsedTempState = JSON.parse(tempState)
        console.log('🔄 Loading from temporary rack state with', parsedTempState.mepItems?.length || 0, 'MEP items')
        
        // Restore MEP items if they exist in temp state
        if (parsedTempState.mepItems) {
          localStorage.setItem('configurMepItems', JSON.stringify(parsedTempState.mepItems))
        }
        
        return parsedTempState
      }
      
      // Fallback to regular rack parameters
      const rackParams = localStorage.getItem('rackParameters')
      if (rackParams) {
        console.log('🔄 Loading from rack parameters')
        return JSON.parse(rackParams)
      }
      
      // Final fallback to saved configurations (active configuration)
      const savedConfigs = localStorage.getItem('tradeRackConfigurations')
      if (savedConfigs) {
        const configs = JSON.parse(savedConfigs)
        const manifest = localStorage.getItem('projectManifest')
        if (manifest) {
          const parsedManifest = JSON.parse(manifest)
          const activeConfigId = parsedManifest.tradeRacks?.activeConfigurationId
          if (activeConfigId) {
            const activeConfig = configs.find(config => config.id === activeConfigId)
            if (activeConfig) {
              console.log('🔄 Loading from active saved configuration with', activeConfig.mepItems?.length || 0, 'MEP items')
              
              // Restore MEP items if they exist in saved config
              if (activeConfig.mepItems) {
                localStorage.setItem('configurMepItems', JSON.stringify(activeConfig.mepItems))
              }
              
              return activeConfig
            }
          }
        }
        
        // If no active config, use the most recent one
        if (configs.length > 0) {
          const mostRecent = configs.sort((a, b) => 
            new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt)
          )[0]
          console.log('🔄 Loading from most recent saved configuration with', mostRecent.mepItems?.length || 0, 'MEP items')
          
          // Restore MEP items if they exist
          if (mostRecent.mepItems) {
            localStorage.setItem('configurMepItems', JSON.stringify(mostRecent.mepItems))
          }
          
          return mostRecent
        }
      }
      
      console.log('🔄 No saved configurations found, using defaults')
      return null
    } catch (error) {
      console.warn('⚠️ Error loading rack configuration:', error)
      return null
    }
  }

  /**
   * Save current temporary state to a permanent saved configuration
   * This is called when user explicitly saves their configuration
   * Includes both rack parameters and MEP items
   */
  static saveTemporaryStateToPermanent(configurationName) {
    try {
      const tempState = localStorage.getItem('configurTempRackState')
      if (!tempState) {
        console.warn('⚠️ No temporary state to save')
        return false
      }
      
      const parsedTempState = JSON.parse(tempState)
      
      // Create new saved configuration with current MEP items
      const savedConfig = {
        ...parsedTempState,
        id: Date.now(),
        name: configurationName.trim(),
        savedAt: new Date().toISOString(),
        isTemporary: false, // Mark as saved
        // MEP items are already included from temp state, but ensure we have latest
        mepItems: parsedTempState.mepItems || []
      }
      
      // Add to saved configurations
      const existingConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
      existingConfigs.push(savedConfig)
      localStorage.setItem('tradeRackConfigurations', JSON.stringify(existingConfigs))
      
      // Update project manifest to set this as active
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{"tradeRacks": {}}')
      if (!manifest.tradeRacks) manifest.tradeRacks = {}
      manifest.tradeRacks.activeConfigurationId = savedConfig.id
      localStorage.setItem('projectManifest', JSON.stringify(manifest))
      
      // Clear temporary state since it's now saved
      localStorage.removeItem('configurTempRackState')
      
      console.log('💾 Saved temporary state as permanent configuration:', configurationName, 'with', savedConfig.mepItems?.length || 0, 'MEP items')
      return true
    } catch (error) {
      console.error('❌ Error saving temporary state to permanent:', error)
      return false
    }
  }

  /**
   * Update an existing saved configuration with current temporary state
   * Includes both rack parameters and MEP items
   */
  static updateSavedConfiguration(configId) {
    try {
      const tempState = localStorage.getItem('configurTempRackState')
      if (!tempState) {
        console.warn('⚠️ No temporary state to update with')
        return false
      }
      
      const parsedTempState = JSON.parse(tempState)
      
      // Update existing configuration
      const existingConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
      const updatedConfigs = existingConfigs.map(config => {
        if (config.id === configId) {
          return {
            ...config,
            ...parsedTempState,
            updatedAt: new Date().toISOString(),
            isTemporary: false,
            // Ensure MEP items are included
            mepItems: parsedTempState.mepItems || []
          }
        }
        return config
      })
      
      localStorage.setItem('tradeRackConfigurations', JSON.stringify(updatedConfigs))
      
      // Clear temporary state since it's now saved
      localStorage.removeItem('configurTempRackState')
      
      console.log('💾 Updated saved configuration with temporary state and', parsedTempState.mepItems?.length || 0, 'MEP items')
      return true
    } catch (error) {
      console.error('❌ Error updating saved configuration:', error)
      return false
    }
  }
  
  /**
   * Check if there are unsaved changes in temporary state
   */
  static hasUnsavedChanges() {
    try {
      const tempState = localStorage.getItem('configurTempRackState')
      return !!tempState
    } catch (error) {
      console.warn('⚠️ Error checking for unsaved changes:', error)
      return false
    }
  }
  
  /**
   * Load a saved configuration into temporary state (for editing)
   * This allows users to work with configurations without immediately overwriting them
   * Also loads associated MEP items
   */
  static loadConfigurationToTempState(configuration) {
    try {
      // Mark as temporary and add timestamp
      const tempState = {
        ...configuration,
        lastModified: new Date().toISOString(),
        isTemporary: true,
        // Ensure MEP items are preserved
        mepItems: configuration.mepItems || []
      }
      
      localStorage.setItem('configurTempRackState', JSON.stringify(tempState))
      localStorage.setItem('rackParameters', JSON.stringify(configuration))
      
      // Load MEP items associated with this configuration
      if (configuration.mepItems) {
        localStorage.setItem('configurMepItems', JSON.stringify(configuration.mepItems))
      }
      
      console.log('🔄 Loaded configuration to temporary state for editing with', configuration.mepItems?.length || 0, 'MEP items')
      return true
    } catch (error) {
      console.error('❌ Error loading configuration to temporary state:', error)
      return false
    }
  }
  
  /**
   * Clear temporary state (discard unsaved changes)
   */
  static clearTemporaryState() {
    try {
      localStorage.removeItem('configurTempRackState')
      console.log('🖭 Cleared temporary rack state')
      return true
    } catch (error) {
      console.error('❌ Error clearing temporary state:', error)
      return false
    }
  }
  
  /**
   * Save current rack configuration to temporary state
   * This is called whenever the user makes any changes (position, size, tier changes, etc.)
   */
  saveCurrentConfigurationToTempState() {
    if (!this.selectedRack) return
    
    const rackConfig = this.selectedRack.userData.configuration
    if (!rackConfig) return
    
    this.saveToTemporaryState(rackConfig)
  }

  /**
   * Track rack parameter change and save to temporary state
   * This should be called whenever rack parameters (tierCount, tierHeights, bayCount, etc.) are changed
   */
  static trackParameterChange(parameterName, oldValue, newValue, rackId = null) {
    try {
      // Add to change history
      addRackParameterChange(parameterName, oldValue, newValue, rackId)
      
      console.log(`📊 Tracked rack parameter change: ${parameterName}`, {
        from: oldValue,
        to: newValue,
        rackId: rackId
      })
    } catch (error) {
      console.warn('⚠️ Could not track parameter change:', error)
    }
  }

  /**
   * Update rack parameters and track changes
   * This method should be used instead of directly modifying rack parameters
   */
  static updateRackParameters(newParams, rackId = null) {
    try {
      // Get current parameters for comparison
      const currentParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      
      // Track changes for each parameter
      for (const [key, newValue] of Object.entries(newParams)) {
        const oldValue = currentParams[key]
        if (oldValue !== newValue && oldValue !== undefined) {
          TradeRackInteraction.trackParameterChange(key, oldValue, newValue, rackId)
        }
      }
      
      // Update the parameters
      const updatedParams = { ...currentParams, ...newParams }
      localStorage.setItem('rackParameters', JSON.stringify(updatedParams))
      
      // Update temporary state with new parameters
      const tempState = localStorage.getItem('configurTempRackState')
      if (tempState) {
        const parsedTempState = JSON.parse(tempState)
        const updatedTempState = {
          ...parsedTempState,
          ...newParams,
          lastModified: new Date().toISOString()
        }
        localStorage.setItem('configurTempRackState', JSON.stringify(updatedTempState))
      }
      
      console.log('📝 Updated rack parameters with change tracking:', Object.keys(newParams))
      return true
    } catch (error) {
      console.error('❌ Error updating rack parameters:', error)
      return false
    }
  }

  /**
   * Update snap points for the rack after it has been moved
   * This recalculates all snap points based on the rack's new position
   */
  updateRackSnapPoints() {
    if (!this.selectedRack) {
      console.warn('⚠️ No selected rack for snap point update')
      return
    }

    // Check if the selected rack is still in the scene (might have been deleted during rebuild)
    if (!this.selectedRack.parent) {
      console.warn('⚠️ Selected rack is no longer in the scene, cannot update snap points')
      // Try to find the rack by ID in the current scene
      this.findAndSelectRackById(this.selectedRack.userData.rackId)
      if (!this.selectedRack || !this.selectedRack.parent) {
        return
      }
    }

    // Always get fresh reference to measurement tool (it may have been recreated during scene rebuild)
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !measurementTool.snapPoints) {
      console.warn('⚠️ Measurement tool or snap points not available for update')
      return
    }
    
    console.log('🎯 Updating snap points for rack:', this.selectedRack.userData.rackId, 'snapPoints count:', measurementTool.snapPoints.length)

    // Import the snap point extraction function
    import('../core/extractGeometrySnapPoints.js').then(({ extractSnapPoints }) => {
      // Get the rack's current transformation matrix
      const rackMatrix = this.selectedRack.matrixWorld.clone()
      
      // Find all snap points that belong to this rack (they were added when rack was created)
      // We'll identify them by checking if they're within the rack's bounding box before transform
      const rackBounds = new THREE.Box3().setFromObject(this.selectedRack)
      
      // Filter out old rack snap points and collect non-rack snap points
      const nonRackSnapPoints = []
      const snapPointsToUpdate = []
      
      measurementTool.snapPoints.forEach(snapPoint => {
        if (snapPoint.rackId === this.selectedRack.userData.rackId) {
          // This is a rack snap point that needs updating
          snapPointsToUpdate.push(snapPoint)
        } else if (snapPoint.point) {
          // Check if this point is within the rack bounds (might be an old rack point without ID)
          const point = snapPoint.point
          if (!rackBounds.containsPoint(point)) {
            // This is not a rack snap point, keep it
            nonRackSnapPoints.push(snapPoint)
          }
        } else if (snapPoint.start && snapPoint.end) {
          // Edge snap point - check if either end is in rack bounds
          if (!rackBounds.containsPoint(snapPoint.start) && !rackBounds.containsPoint(snapPoint.end)) {
            nonRackSnapPoints.push(snapPoint)
          }
        } else {
          // Unknown snap point type, keep it
          nonRackSnapPoints.push(snapPoint)
        }
      })
      
      // Clear the snap points array and add back non-rack points
      measurementTool.snapPoints.length = 0
      measurementTool.snapPoints.push(...nonRackSnapPoints)
      
      // Now regenerate snap points for all rack components with new positions
      const newRackSnapPoints = []
      
      this.selectedRack.traverse((child) => {
        if (child.isMesh && child.geometry) {
          // Update the child's world matrix to ensure it's current
          child.updateMatrixWorld(true)
          
          // Extract snap points from this mesh
          const { corners, edges } = extractSnapPoints(child.geometry, child.matrixWorld)
          
          // Add corners as vertex snap points with rack ID
          corners.forEach(point => {
            newRackSnapPoints.push({ 
              point: point, 
              type: 'vertex',
              rackId: this.selectedRack.userData.rackId
            })
          })
          
          // Add edges as edge snap points with rack ID
          edges.forEach(edge => {
            if (edge.start && edge.end) {
              newRackSnapPoints.push({ 
                start: edge.start, 
                end: edge.end, 
                type: 'edge',
                rackId: this.selectedRack.userData.rackId
              })
            } else {
              // Single point edge
              newRackSnapPoints.push({ 
                point: edge, 
                type: 'edge',
                rackId: this.selectedRack.userData.rackId
              })
            }
          })
        }
      })
      
      // Add the new rack snap points to the measurement tool
      measurementTool.snapPoints.push(...newRackSnapPoints)
      
      console.log(`🎯 Updated ${newRackSnapPoints.length} snap points for moved trade rack`)
    }).catch(error => {
      console.error('❌ Error updating rack snap points:', error)
    })
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
  
  findAndSelectRackById(rackId) {
    // Helper method to find and reselect a rack by ID after scene rebuild
    if (!rackId) return
    
    let targetRack = null
    this.scene.traverse((child) => {
      if (child.userData.type === 'tradeRack' && 
          child.userData.rackId === rackId) {
        targetRack = child
      }
    })

    if (targetRack) {
      console.log('🔄 Re-selecting rack after scene rebuild:', rackId)
      this.selectedRack = targetRack
      this.applySelectionFeedback(targetRack)
      return true
    } else {
      console.warn('⚠️ Could not find rack with ID:', rackId)
      return false
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