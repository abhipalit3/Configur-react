/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { getMepSelectionManager } from '../core/MepSelectionManager.js'

/**
 * CableTrayInteraction - Handles user interactions with cable trays (selection, movement, editing)
 */
export class CableTrayInteraction {
  constructor(scene, camera, renderer, orbitControls, cableTrayRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.cableTrayRenderer = cableTrayRenderer
    
    // Selection state
    this.selectedCableTray = null
    this.selectedCableTrayGroup = null
    this.hoveredCableTrayGroup = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // Measurement tracking (like ducts)
    this.cableTrayMeasurementIds = []
    
    // Setup transform controls (match duct implementation)
    this.setupTransformControls()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Register with central MEP selection manager
    this.registerWithMepManager()
    
  }

  /**
   * Setup transform controls exactly like ducts
   */
  setupTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement)
    
    this.transformControls.addEventListener('change', () => {
      if (this.selectedCableTrayGroup) {
        this.applyRealTimeSnapping()
        this.updateCableTrayPosition()
        // Update measurements during transform (like ducts do)
        this.updateCableTrayMeasurements()
      }
      this.renderer.render(this.scene, this.camera)
    })
    
    this.transformControls.addEventListener('dragging-changed', (event) => {
      // Disable orbit controls during transform (like ducts do)
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
      }
      
      // Also try the global orbit controls
      if (window.orbitControls) {
        window.orbitControls.enabled = !event.value
      }
      
      // When dragging ends, clear snap guides and save position (like ducts do)
      if (!event.value) {
        if (this.snapLineManager) {
          this.snapLineManager.clearSnapGuides()
        }
        // Save cable tray position when dragging ends
        this.saveCableTrayPosition()
      }
      
    })

    // Configure transform controls like ducts
    this.transformControls.setMode('translate')
    this.transformControls.setSpace('world')
    this.transformControls.setSize(0.8) // Same size as ducts
    this.transformControls.showX = false // Same as ducts - no X movement
    this.transformControls.showY = true
    this.transformControls.showZ = true
    
    // Add the transform controls gizmo to the scene (like ducts do)
    const gizmo = this.transformControls.getHelper()
    this.scene.add(gizmo)
  }

  /**
   * Setup event listeners for cable tray interaction
   */
  setupEventListeners() {
    this.domElement = this.renderer.domElement
    
    // Setup keyboard event handler for cable tray operations (like ducts)
    this.onKeyDown = (event) => {
      // Only handle keyboard events when a cable tray is selected
      if (!this.selectedCableTrayGroup) return
      
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (this.selectedCableTrayGroup) {
            this.deleteSelectedCableTray()
          }
          break
        case 'Escape':
          this.deselectCableTray()
          break
      }
    }
    
    document.addEventListener('keydown', this.onKeyDown)
    this.keyboardHandler = this.onKeyDown
  }
  
  /**
   * Register with central MEP selection manager
   */
  registerWithMepManager() {
    const tryRegister = () => {
      const mepManager = getMepSelectionManager()
      if (mepManager) {
        mepManager.registerHandler('cableTrays', this)
        return true
      }
      return false
    }
    
    // Try immediate registration
    if (!tryRegister()) {
      // Retry after a delay
      setTimeout(() => {
        if (!tryRegister()) {
          // Fallback to individual event handlers
          this.boundMoveHandler = this.onMouseMove.bind(this)
          this.domElement.addEventListener('mousemove', this.boundMoveHandler)
        }
      }, 400)
    }
  }

  /**
   * Handle mouse click events for cable tray selection
   */
  onMouseClick(event) {
    // console.log('🖱️ Cable tray click event received')
    
    // Only handle clicks if not dragging transform controls
    if (this.transformControls.dragging) {
      // console.log('🖱️ Click ignored - transform controls dragging')
      return
    }

    // console.log('🖱️ Processing cable tray click')
    const result = this.handleClick(event)
    
    // If we successfully selected a cable tray, prevent other handlers from running
    if (result) {
      // console.log('🖱️ Cable tray selected - preventing event propagation')
      event.stopPropagation()
      event.preventDefault()
    }
    
    return result
  }

  /**
   * Handle mouse move events for cable tray hover effects
   */
  onMouseMove(event) {
    // Only handle hover if not dragging transform controls
    if (this.transformControls.dragging) return

    try {
      // Update mouse coordinates
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update raycaster
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // Get all cable tray objects
      const cableTraysGroup = this.cableTrayRenderer.getCableTraysGroup()
      const intersects = this.raycaster.intersectObjects(cableTraysGroup.children, true)

      if (intersects.length > 0) {
        // Sort intersections by distance to get the closest one
        intersects.sort((a, b) => a.distance - b.distance)
        // Find the cable tray group that was hovered
        let cableTrayGroup = intersects[0].object
        while (cableTrayGroup && !cableTrayGroup.userData?.isCableTrayGroup) {
          cableTrayGroup = cableTrayGroup.parent
        }

        if (cableTrayGroup && cableTrayGroup.userData?.isCableTrayGroup) {
          // Only apply hover if not already selected
          if (cableTrayGroup !== this.selectedCableTrayGroup) {
            this.setHoverCableTray(cableTrayGroup)
          }
        } else {
          this.clearHoverCableTray()
        }
      } else {
        this.clearHoverCableTray()
      }
      
    } catch (error) {
      console.error('❌ Error handling cable tray hover:', error)
    }
  }

  /**
   * Handle mouse click events for cable tray selection
   */
  handleClick(event) {
    try {
      // console.log('🔌 CableTrayInteraction: handleClick called')
      // Update mouse coordinates
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update raycaster
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // Get all cable tray objects
      const cableTraysGroup = this.cableTrayRenderer.getCableTraysGroup()
      // console.log('🔌 Cable trays group children count:', cableTraysGroup.children.length)
      const intersects = this.raycaster.intersectObjects(cableTraysGroup.children, true)
      // console.log('🔌 Intersects found:', intersects.length)

      if (intersects.length > 0) {
        // Sort intersections by distance to get the closest one
        intersects.sort((a, b) => a.distance - b.distance)
        // Find the cable tray group that was clicked
        let cableTrayGroup = intersects[0].object
        while (cableTrayGroup && !cableTrayGroup.userData?.isCableTrayGroup) {
          cableTrayGroup = cableTrayGroup.parent
        }

        if (cableTrayGroup && cableTrayGroup.userData?.isCableTrayGroup) {
          this.selectCableTray(cableTrayGroup)
          return true // Indicate that a cable tray was selected
        }
      }

      // If no cable tray was clicked, deselect current selection
      this.deselectCableTray()
      return false
      
    } catch (error) {
      console.error('❌ Error handling cable tray click:', error)
      return false
    }
  }

  /**
   * Select a cable tray
   */
  selectCableTray(cableTrayGroup) {
    try {
      // Clear hover state
      this.clearHoverCableTray()
      
      // Deselect previous selection
      this.deselectCableTray()

      // Select new cable tray
      this.selectedCableTrayGroup = cableTrayGroup
      this.selectedCableTray = cableTrayGroup

      // Update appearance
      this.cableTrayRenderer.cableTrayGeometry.updateCableTrayAppearance(cableTrayGroup, 'selected')

      // Store original position (like ducts do)
      const originalPosition = cableTrayGroup.position.clone()
      
      // Ensure transform controls are in translate mode when selecting (like ducts)
      this.transformControls.setMode('translate')
      this.transformControls.attach(cableTrayGroup)
      cableTrayGroup.position.copy(originalPosition)
      
      // Force render to update display
      this.renderer.render(this.scene, this.camera)
      
      // Create measurements (like ducts do)
      this.createCableTrayMeasurements()

      // Trigger selection event
      this.triggerSelectionEvent()

    } catch (error) {
      console.error('❌ Error selecting cable tray:', error)
    }
  }

  /**
   * Deselect current cable tray
   */
  deselectCableTray() {
    if (this.selectedCableTrayGroup) {
      // Reset appearance
      this.cableTrayRenderer.cableTrayGeometry.updateCableTrayAppearance(this.selectedCableTrayGroup, 'normal')
      
      // Detach transform controls
      this.transformControls.detach()
    }

    // Clear measurements (like ducts do)
    this.clearCableTrayMeasurements()
    
    // Clear hover state too
    this.clearHoverCableTray()

    this.selectedCableTray = null
    this.selectedCableTrayGroup = null

    // Trigger deselection event
    this.triggerSelectionEvent()
  }

  /**
   * Set hover state for cable tray
   */
  setHoverCableTray(cableTrayGroup) {
    // Clear previous hover if different
    if (this.hoveredCableTrayGroup && this.hoveredCableTrayGroup !== cableTrayGroup) {
      this.clearHoverCableTray()
    }

    if (this.hoveredCableTrayGroup !== cableTrayGroup) {
      this.hoveredCableTrayGroup = cableTrayGroup
      this.cableTrayRenderer.cableTrayGeometry.updateCableTrayAppearance(cableTrayGroup, 'hover')
    }
  }

  /**
   * Clear hover state for cable tray
   */
  clearHoverCableTray() {
    if (this.hoveredCableTrayGroup) {
      this.cableTrayRenderer.cableTrayGeometry.updateCableTrayAppearance(this.hoveredCableTrayGroup, 'normal')
      this.hoveredCableTrayGroup = null
    }
  }

  /**
   * Update cable tray dimensions (recreates cable tray with new dimensions)
   */
  updateCableTrayDimensions(newDimensions) {
    if (!this.selectedCableTrayGroup) {
      console.warn('❌ No selected cable tray group for dimension update')
      return
    }
    
    try {
      // console.log('⚡ CableTrayInteraction: updateCableTrayDimensions called')
      // console.log('⚡ New dimensions received:', newDimensions)
      // console.log('⚡ Current cable tray data:', this.selectedCableTrayGroup.userData.cableTrayData)
      
      const cableTrayData = this.selectedCableTrayGroup.userData.cableTrayData
      if (!cableTrayData) {
        console.warn('❌ No cable tray data found for selected cable tray')
        return
      }

      // Update cable tray data with new dimensions
      const updatedCableTrayData = {
        ...cableTrayData,
        ...newDimensions
      }

      // Update userData
      this.selectedCableTrayGroup.userData.cableTrayData = updatedCableTrayData

      const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
      const cableTrayLength = rackLength * 12 // Convert feet to inches
      
      // If only color is changing, update material without recreating geometry
      if (newDimensions.color && Object.keys(newDimensions).length === 1) {
        // console.log('⚡ Taking color-only update path')
        // Just update the material color
        this.selectedCableTrayGroup.traverse((child) => {
          if (child.isMesh) {
            // Create new material with custom color
            const newMaterial = new THREE.MeshLambertMaterial({
              color: new THREE.Color(newDimensions.color),
              transparent: true,
              opacity: 0.8,
              side: THREE.DoubleSide
            })
            child.material = newMaterial
          }
        })
      } else {
        // console.log('⚡ Taking full geometry recreation path')
        // Store current position
        const currentPosition = this.selectedCableTrayGroup.position.clone()
        const currentRotation = this.selectedCableTrayGroup.rotation.clone()
        
        // Remove old geometry for full update
        while (this.selectedCableTrayGroup.children.length > 0) {
          const child = this.selectedCableTrayGroup.children[0]
          this.selectedCableTrayGroup.remove(child)
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        }

        // Create a completely new cable tray group with updated dimensions
        // console.log('⚡ Creating new cable tray group with trayType:', updatedCableTrayData.trayType || 'ladder')
        const newCableTrayGroup = this.cableTrayRenderer.cableTrayGeometry.createCableTrayGroup(
          updatedCableTrayData,
          cableTrayLength,
          currentPosition // Use the current position
        )

        // Copy the children from the new group to the existing selected group
        // This maintains the same approach as ducts
        while (newCableTrayGroup.children.length > 0) {
          const child = newCableTrayGroup.children[0]
          newCableTrayGroup.remove(child)
          this.selectedCableTrayGroup.add(child)
        }
        
        // Restore the rotation (cable trays have a 90-degree rotation)
        this.selectedCableTrayGroup.rotation.copy(currentRotation)
        
        // Log the children count to verify covers were added
        // console.log('🔌 Cable tray group children after update:', this.selectedCableTrayGroup.children.length)
        // console.log('🔌 Cable tray group rotation:', this.selectedCableTrayGroup.rotation)

        // Update appearance to maintain selection state
        this.cableTrayRenderer.cableTrayGeometry.updateCableTrayAppearance(this.selectedCableTrayGroup, 'selected')
        
        // Update measurements after geometry change
        this.clearCableTrayMeasurements()
        this.createCableTrayMeasurements()
        
        // IMPORTANT: Maintain selection state
        // The selectedCableTray reference might have been lost during recreation
        this.selectedCableTray = this.selectedCableTrayGroup
        
        // Ensure transform controls stay attached
        if (this.transformControls && this.selectedCableTrayGroup) {
          this.transformControls.attach(this.selectedCableTrayGroup)
        }
      }

      // console.log('⚡ Cable tray dimensions updated')
      // console.log('⚡ Selection maintained:', this.selectedCableTray !== null)
      
    } catch (error) {
      console.error('❌ Error updating cable tray dimensions:', error)
    }
  }


  /**
   * Get the currently selected cable tray
   */
  getSelectedCableTray() {
    return this.selectedCableTray
  }

  /**
   * Get the currently selected cable tray group
   */
  getSelectedCableTrayGroup() {
    return this.selectedCableTrayGroup
  }

  /**
   * Trigger selection event for UI updates
   */
  triggerSelectionEvent() {
    const event = new CustomEvent('cableTraySelectionChanged', {
      detail: {
        selectedCableTray: this.selectedCableTray,
        selectedCableTrayGroup: this.selectedCableTrayGroup
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Set snap line manager for tier positioning
   */
  setSnapLineManager(snapLineManager) {
    this.snapLineManager = snapLineManager
  }

  /**
   * Enable/disable transform controls
   */
  setTransformControlsEnabled(enabled) {
    this.transformControls.enabled = enabled
  }

  /**
   * Set transform mode (translate, rotate, scale)
   */
  setTransformMode(mode) {
    this.transformControls.setMode(mode)
  }

  /**
   * Update all cable tray tier information
   */
  updateAllCableTrayTierInfo() {
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      let updated = false
      
      // Get all cable tray groups from the scene to access their current positions
      const cableTrayGroups = []
      if (window.cableTrayRendererInstance?.cableTraysGroup) {
        const cableTraysGroup = window.cableTrayRendererInstance.cableTraysGroup
        cableTraysGroup.children.forEach(cableTrayGroup => {
          if (cableTrayGroup.userData?.cableTrayData) {
            cableTrayGroups.push(cableTrayGroup)
          }
        })
      }
      
      // Update MEP items with current tier information
      const updatedItems = storedMepItems.map(item => {
        if (item && item.type === 'cableTray') {
          // Find matching cable tray group in scene
          const matchingGroup = cableTrayGroups.find(group => {
            const groupId = group.userData.cableTrayData.id?.toString()
            const itemId = item.id?.toString()
            return groupId === itemId || groupId?.split('_')[0] === itemId?.split('_')[0]
          })
          
          if (matchingGroup) {
            const currentYPosition = matchingGroup.position.y
            const tierInfo = this.calculateCableTrayTierFromPosition(currentYPosition, item.height || 4)
            
            if (item.tier !== tierInfo.tier || item.tierName !== tierInfo.tierName) {
              // console.log(`🔌 Updating cable tray ${item.id} tier from ${item.tier} to ${tierInfo.tier}`)
              updated = true
              return {
                ...item,
                tier: tierInfo.tier,
                tierName: tierInfo.tierName,
                position: {
                  x: matchingGroup.position.x,
                  y: matchingGroup.position.y,
                  z: matchingGroup.position.z
                }
              }
            }
          }
        }
        return item
      })
      
      // Save updates if any changes were made
      if (updated) {
        localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
        
        // Update manifest
        if (window.updateMEPItemsManifest) {
          window.updateMEPItemsManifest(updatedItems)
        }
        
        // Dispatch event to update MEP panel
        window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
          detail: { updatedItems, reason: 'tier-update' }
        }))
        
        // console.log('🔌 Updated cable tray tier information')
      }
      
    } catch (error) {
      console.error('❌ Error updating all cable tray tier info:', error)
    }
  }

  /**
   * Calculate cable tray tier from Y position - same logic as ducts
   */
  calculateCableTrayTierFromPosition(yPosition, cableTrayHeightInches) {
    try {
      // Use duct system's snap line manager for tier positioning
      const snapLineManager = window.ductworkRendererInstance?.snapLineManager
      if (!snapLineManager) {
        console.warn('⚠️ No snap line manager available for tier calculation')
        return { tier: 1, tierName: 'Tier 1' }
      }

      const snapLines = snapLineManager.getSnapLinesFromRackGeometry()
      const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
      const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
      
      // Find tier spaces
      const tierSpaces = []
      const minTierHeight = 0.3 // Minimum 30cm tier height in meters
      
      for (let i = 0; i < allBeamPositions.length - 1; i++) {
        const topY = allBeamPositions[i]
        const bottomY = allBeamPositions[i + 1]
        const gap = topY - bottomY
        
        if (gap >= minTierHeight) {
          tierSpaces.push({
            tierIndex: tierSpaces.length + 1,
            top: topY,
            bottom: bottomY,
            height: gap,
            centerY: (topY + bottomY) / 2
          })
        }
      }
      
      // Calculate tolerance based on cable tray height
      const cableTrayHeightM = (cableTrayHeightInches || 4) * 0.0254
      const tolerance = cableTrayHeightM / 2
      
      // Find which tier space contains this Y position
      for (const tierSpace of tierSpaces) {
        const tierBottom = tierSpace.bottom - tolerance
        const tierTop = tierSpace.top + tolerance
        
        if (yPosition >= tierBottom && yPosition <= tierTop) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Check distance to tier centers
      for (const tierSpace of tierSpaces) {
        const distanceToCenter = Math.abs(yPosition - tierSpace.centerY)
        if (distanceToCenter <= tolerance) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // If no tier space found, check if above or below rack
      if (tierSpaces.length > 0) {
        const highestTier = tierSpaces[0] // First tier is highest
        const lowestTier = tierSpaces[tierSpaces.length - 1] // Last tier is lowest
        
        if (yPosition > highestTier.top + tolerance) {
          return { tier: null, tierName: 'Above Rack' }
        } else if (yPosition < lowestTier.bottom - tolerance) {
          return { tier: null, tierName: 'Below Rack' }
        }
      }
      
      // Fallback to tier 1
      return { tier: 1, tierName: 'Tier 1' }
      
    } catch (error) {
      console.error('❌ Error calculating cable tray tier from position:', error)
      return { tier: 1, tierName: 'Tier 1' }
    }
  }

  /**
   * Update tier information for a specific cable tray
   */
  updateCableTrayTierInfo(cableTray) {
    if (!this.snapLineManager || !cableTray || !cableTray.userData?.cableTrayData) return

    try {
      const worldPosition = new THREE.Vector3()
      cableTray.getWorldPosition(worldPosition)
      
      // Use our own tier calculation method
      const tierInfo = this.calculateCableTrayTierFromPosition(
        worldPosition.y, 
        cableTray.userData.cableTrayData.height || 4
      )
      
      if (tierInfo) {
        cableTray.userData.cableTrayData.tier = tierInfo.tier
        cableTray.userData.cableTrayData.tierName = tierInfo.tierName
      }
      
    } catch (error) {
      console.error('❌ Error updating cable tray tier info:', error)
    }
  }

  /**
   * Apply real-time snapping to rack geometry during transform (same logic as ducts)
   */
  applyRealTimeSnapping() {
    if (!this.snapLineManager || !this.selectedCableTrayGroup) return

    try {
      const snapTolerance = 0.03 // Same as ducts: 3cm snap tolerance in meters
      const cableTrayData = this.selectedCableTrayGroup.userData.cableTrayData
      const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
      
      if (!snapLines || !cableTrayData) return

      const currentPos = this.selectedCableTrayGroup.position.clone()
      
      // Convert cable tray dimensions to meters (same approach as ducts)
      const cableTrayHeight = this.snapLineManager.in2m(cableTrayData.height || 4)
      const cableTrayWidth = this.snapLineManager.in2m(cableTrayData.width || 12)
      // Cable trays typically don't have insulation, but we can add support if needed
      const totalHeight = cableTrayHeight
      const totalWidth = cableTrayWidth
      
      let snapped = false
      let posX = currentPos.x
      let posY = currentPos.y
      let posZ = currentPos.z
      
      // Y-axis snapping (same logic as ducts)
      const cableTrayBottom = posY - (totalHeight / 2)
      const cableTrayTop = posY + (totalHeight / 2)
      
      let closestYSnap = null
      let closestYDist = snapTolerance
      
      for (const line of snapLines.horizontal) {
        if (line.type === 'beam_top') {
          const dist = Math.abs(cableTrayBottom - line.y)
          if (dist < closestYDist) {
            closestYSnap = { newY: line.y + (totalHeight / 2), dist, lineY: line.y }
            closestYDist = dist
          }
        }
        
        if (line.type === 'beam_bottom') {
          const dist = Math.abs(cableTrayTop - line.y)
          if (dist < closestYDist) {
            closestYSnap = { newY: line.y - (totalHeight / 2), dist, lineY: line.y }
            closestYDist = dist
          }
        }
      }
      
      if (closestYSnap) {
        posY = closestYSnap.newY
        snapped = true
      }
      
      // Z-axis snapping (same logic as ducts)
      const cableTrayLeft = posZ - (totalWidth / 2)
      const cableTrayRight = posZ + (totalWidth / 2)
      
      let closestZSnap = null
      let closestZDist = snapTolerance
      
      for (const line of snapLines.vertical) {
        if (line.side === 'right') {
          const dist = Math.abs(cableTrayLeft - line.z)
          if (dist < closestZDist) {
            closestZSnap = { newZ: line.z + (totalWidth / 2), dist }
            closestZDist = dist
          }
        }
        
        if (line.side === 'left') {
          const dist = Math.abs(cableTrayRight - line.z)
          if (dist < closestZDist) {
            closestZSnap = { newZ: line.z - (totalWidth / 2), dist }
            closestZDist = dist
          }
        }
      }
      
      if (closestZSnap) {
        posZ = closestZSnap.newZ
        snapped = true
      }
      
      if (snapped) {
        this.selectedCableTrayGroup.position.set(posX, posY, posZ)
      }
      
    } catch (error) {
      console.error('❌ Error applying cable tray snapping:', error)
    }
  }

  /**
   * Update cable tray position in storage (called during real-time transforms)
   */
  updateCableTrayPosition() {
    if (!this.selectedCableTrayGroup) return

    try {
      const cableTrayData = this.selectedCableTrayGroup.userData?.cableTrayData
      if (!cableTrayData) return

      const newPosition = {
        x: this.selectedCableTrayGroup.position.x,
        y: this.selectedCableTrayGroup.position.y,
        z: this.selectedCableTrayGroup.position.z
      }

      // Update userData and tier info (but don't save to localStorage during real-time transform)
      cableTrayData.position = newPosition
      
      // Update tier information based on new Y position
      const tierInfo = this.calculateCableTrayTierFromPosition(newPosition.y, cableTrayData.height || 4)
      cableTrayData.tier = tierInfo.tier
      cableTrayData.tierName = tierInfo.tierName
      
    } catch (error) {
      console.error('❌ Error updating cable tray position:', error)
    }
  }

  /**
   * Save cable tray position to localStorage and manifest (called when dragging ends)
   */
  saveCableTrayPosition() {
    if (!this.selectedCableTrayGroup?.userData?.cableTrayData) return

    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const selectedCableTrayData = this.selectedCableTrayGroup.userData.cableTrayData
      
      // Calculate tier info based on current Y position
      const currentYPosition = this.selectedCableTrayGroup.position.y
      const tierInfo = this.calculateCableTrayTierFromPosition(currentYPosition, selectedCableTrayData.height || 4)
      // console.log(`🔌 Cable tray at Y=${currentYPosition} detected as ${tierInfo.tierName}`)
      
      // Handle ID matching - cable tray ID might have suffixes
      const baseId = selectedCableTrayData.id.toString().split('_')[0]
      
      const updatedItems = storedMepItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId && item.type === 'cableTray') {
          const updatedItem = { 
            ...item, 
            position: {
              x: this.selectedCableTrayGroup.position.x,
              y: this.selectedCableTrayGroup.position.y,
              z: this.selectedCableTrayGroup.position.z
            },
            tier: tierInfo.tier,
            tierName: tierInfo.tierName
          }
          return updatedItem
        }
        return item
      })
      
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      
      // Update manifest if function available
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      // Dispatch events to update MEP panel
      window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
        detail: { updatedItems, updatedCableTrayId: selectedCableTrayData.id }
      }))
      
      
    } catch (error) {
      console.error('❌ Error saving cable tray position:', error)
    }
  }

  /**
   * Create measurements for selected cable tray (same approach as ducts)
   */
  createCableTrayMeasurements() {
    if (!this.selectedCableTrayGroup) return
    
    const measurementTool = window.measurementToolInstance
    if (!measurementTool) return

    const cableTrayData = this.selectedCableTrayGroup.userData.cableTrayData
    const cableTrayPos = this.selectedCableTrayGroup.position
    
    const cableTrayWidth = this.snapLineManager.in2m(cableTrayData.width || 12)
    // Cable trays typically don't have insulation, but we'll keep the structure similar to ducts
    const totalWidth = cableTrayWidth
    
    // Get post positions from snap lines
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    
    if (!rightPost || !leftPost) return
    
    const cableTrayLeft = cableTrayPos.z - (totalWidth / 2)
    const cableTrayRight = cableTrayPos.z + (totalWidth / 2)
    
    const dimY = cableTrayPos.y
    const dimX = cableTrayPos.x
    
    this.cableTrayMeasurementIds = []
    
    // Right side measurement (from cable tray edge to right post)
    const rightP1 = new THREE.Vector3(dimX, dimY, cableTrayLeft)
    const rightP2 = new THREE.Vector3(dimX, dimY, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    const rightMeasurementId = measurementTool.measurementId
    this.cableTrayMeasurementIds.push(rightMeasurementId)
    
    // Left side measurement (from cable tray edge to left post)
    const leftP1 = new THREE.Vector3(dimX, dimY, cableTrayRight)
    const leftP2 = new THREE.Vector3(dimX, dimY, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    const leftMeasurementId = measurementTool.measurementId
    this.cableTrayMeasurementIds.push(leftMeasurementId)
  }

  /**
   * Clear cable tray measurements
   */
  clearCableTrayMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.cableTrayMeasurementIds) return
    
    this.cableTrayMeasurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    
    this.cableTrayMeasurementIds = []
  }

  /**
   * Update cable tray measurements (called during transform)
   */
  updateCableTrayMeasurements() {
    if (!this.selectedCableTrayGroup || !this.cableTrayMeasurementIds?.length) return
    
    this.clearCableTrayMeasurements()
    this.createCableTrayMeasurements()
  }

  /**
   * Delete selected cable tray
   */
  deleteSelectedCableTray() {
    if (!this.selectedCableTrayGroup) return

    // Get cable tray data for deletion from MEP storage
    const cableTrayData = this.selectedCableTrayGroup.userData.cableTrayData
    if (!cableTrayData || !cableTrayData.id) {
      console.error('❌ Cannot delete cable tray: missing cable tray data or ID')
      return
    }

    // console.log(`🔌 Deleting cable tray with ID: ${cableTrayData.id}`)

    // Remove from MEP data storage
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const updatedItems = storedMepItems.filter(item => {
        // Remove the cable tray with matching ID (handle ID suffixes)
        const itemBaseId = item.id.toString().split('_')[0]
        const cableTrayBaseId = cableTrayData.id.toString().split('_')[0]
        return !(item.type === 'cableTray' && itemBaseId === cableTrayBaseId)
      })
      
      // Save updated items to localStorage
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      // console.log(`🔌 Cable tray ${cableTrayData.id} removed from MEP data storage`)
      
      // Update manifest if function available
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      // Refresh MEP panel to reflect the deletion
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      // Dispatch events to update MEP panel
      window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
        detail: { updatedItems, deletedCableTrayId: cableTrayData.id }
      }))
      
    } catch (error) {
      console.error('❌ Error removing cable tray from MEP data:', error)
    }

    // Remove from 3D scene
    const cableTraysGroup = this.cableTrayRenderer.getCableTraysGroup()
    if (cableTraysGroup) {
      // Dispose of geometry and materials
      this.selectedCableTrayGroup.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })
      
      // Remove from scene
      cableTraysGroup.remove(this.selectedCableTrayGroup)
      // console.log(`🔌 Cable tray ${cableTrayData.id} removed from 3D scene`)
    }

    // Clear selection and measurements
    this.clearCableTrayMeasurements()
    this.transformControls.detach()
    this.selectedCableTray = null
    this.selectedCableTrayGroup = null
    
    // Trigger selection event to update UI
    this.triggerSelectionEvent()
    
    // console.log(`✅ Cable tray ${cableTrayData.id} deleted successfully`)
  }

  /**
   * Dispose of the interaction handler
   */
  dispose() {
    this.deselectCableTray()
    
    // Remove event listeners
    if (this.domElement) {
      this.domElement.removeEventListener('mousemove', this.boundMoveHandler)
    }
    
    // Remove keyboard event listener
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
    }
    
    // Clean up measurements
    this.clearCableTrayMeasurements()
    
    // Clean up transform controls like ducts do
    if (this.transformControls) {
      try {
        this.transformControls.detach()
        const gizmo = this.transformControls.getHelper()
        if (gizmo?.parent) {
          this.scene.remove(gizmo)
        }
        this.transformControls.dispose?.()
      } catch (error) {
        console.warn('Error disposing TransformControls:', error)
      }
    }
    
  }
}