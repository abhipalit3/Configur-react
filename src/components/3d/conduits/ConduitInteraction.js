/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { getMepSelectionManager } from '../core/MepSelectionManager.js'
import {
  setupTransformControls,
  setupRaycaster,
  updateMouseCoordinates,
  createMepKeyboardHandler,
  registerWithMepManager
} from '../utils/common3dHelpers.js'
import { createMepEventHandler } from '../utils/mepEventHandler.js'

/**
 * ConduitInteraction - Handles user interactions with conduits
 */
export class ConduitInteraction {
  constructor(scene, camera, renderer, orbitControls, conduitGeometry, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.conduitGeometry = conduitGeometry
    this.snapLineManager = snapLineManager

    // Transform controls setup using centralized helper
    this.setupTransformControls()
    
    // console.log('⚡ Transform controls initialized:', this.transformControls)
    // console.log('⚡ Transform controls gizmo added to scene:', gizmo)
    // console.log('⚡ Scene children count:', this.scene.children.length)

    // Raycaster for mouse interaction
    this.raycaster = setupRaycaster(camera)
    this.mouse = new THREE.Vector2()

    // Selected conduit tracking
    this.selectedConduit = null
    this.selectedConduitGroup = [] // Array of related conduits that move together
    this.groupRelativePositions = [] // Store relative positions for group movement
    this.hoveredConduit = null
    this.hoveredGroup = null // Track the hovered multi-conduit group
    
    // Measurement tracking
    this.conduitMeasurementIds = []

    // Setup centralized event handler
    this.setupCentralizedEventHandler()
    
    // Register with central MEP selection manager
    this.registerWithMepManager()

    // Transform controls event handlers are setup in setupTransformControls()

    // console.log('⚡ ConduitInteraction initialized')
  }
  
  setupTransformControls() {
    const onTransformChange = () => {
      if (this.selectedConduit && this.selectedConduitGroup && this.selectedConduitGroup.parent) {
        this.onTransformChange()
      } else if (this.transformControls.object && !this.transformControls.object.parent) {
        // If the object is no longer in the scene, detach it
        this.transformControls.detach()
      }
    }
    
    const onDragEnd = () => {
      // Clear snap guides when dragging ends
      if (this.snapLineManager?.clearSnapGuides) {
        this.snapLineManager.clearSnapGuides()
      }
      this.saveConduitPosition()
    }
    
    this.transformControls = setupTransformControls(
      this.camera,
      this.renderer.domElement, 
      this.scene,
      this.orbitControls,
      {
        onChange: onTransformChange,
        onDragEnd: onDragEnd,
        showX: false, // Lock X-axis
        showY: true,  // Allow Y-axis (vertical)
        showZ: true,  // Allow Z-axis (depth)
        size: 0.8
      }
    )
    
    this.transformControls.enabled = false
    this.transformControls.visible = false
  }

  /**
   * Setup centralized event handler
   */
  setupCentralizedEventHandler() {
    // Create centralized event handler for conduit interactions
    this.eventHandler = createMepEventHandler('conduit', this.scene, this.camera, this.renderer, this.orbitControls, {
      callbacks: {
        onSelect: (object) => this.selectConduit(object),
        onDeselect: (object) => this.deselectConduit(),
        onClick: (event, object) => this.handleClick(event, object),
        onMouseMove: (event, mouse) => this.handleMouseMove(event, mouse),
        onDelete: () => this.deleteSelectedConduit(),
        onCopy: () => this.copySelectedConduit(),
        onPaste: () => this.pasteConduit(),
        onEscape: () => this.deselectConduit(),
        onKeyDown: (event, selectedObject) => this.handleTransformKeys?.(event)
      },
      config: {
        targetGroupName: 'ConduitsGroup',
        objectType: 'conduit',
        selectionAttribute: 'userData.type'
      }
    })
  }
  
  /**
   * Register with central MEP selection manager
   */
  registerWithMepManager() {
    const fallbackSetup = () => {
      // Fallback: use individual event listeners if central manager unavailable
      this.renderer.domElement.addEventListener('click', this.handleClick.bind(this))
      this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this))
    }
    
    registerWithMepManager('conduits', this, fallbackSetup)
  }

  /**
   * Centralized mouse move handler (called by MepEventHandler)
   */
  handleMouseMove(event, mouse) {
    if (this.transformControls?.dragging) {
      // Still handle transform-specific mouse move logic
      updateMouseCoordinates(event, this.renderer.domElement, this.mouse)
    }
    // Hover effects are handled by MepEventHandler
  }

  /**
   * Centralized click handler (called by MepEventHandler)
   */
  handleClick(event, intersectedObject) {
    if (this.transformControls?.dragging) return
    
    // Selection is handled by the event handler, we just need to handle additional click logic
    if (intersectedObject) {
      console.log('⚡ Conduit clicked:', intersectedObject.userData?.conduitData?.id || 'unknown')
    }
  }

  /**
   * Handle transform control keyboard shortcuts
   */
  handleTransformKeys(event) {
    if (!this.transformControls) return
    
    switch (event.key) {
      case 'w':
      case 'W':
        this.transformControls.setMode('translate')
        break
      case 'e':
      case 'E':
        this.transformControls.setMode('rotate')
        break
      case 'r':
      case 'R':
        this.transformControls.setMode('scale')
        break
    }
  }

  /**
   * Select a conduit and its entire group
   */
  selectConduit(target) {
    // Deselect previous selection
    if (this.selectedConduitGroup) {
      this.updateGroupAppearance(this.selectedConduitGroup, 'normal')
    }

    // Determine if we clicked on a multi-conduit group or individual conduit
    let multiConduitGroup = null
    
    if (target.userData?.type === 'multiConduit') {
      // Clicked directly on the group
      multiConduitGroup = target
    } else if (target.userData?.type === 'conduit') {
      // Clicked on an individual conduit - find its parent group
      multiConduitGroup = target.parent
      while (multiConduitGroup && multiConduitGroup.userData?.type !== 'multiConduit') {
        multiConduitGroup = multiConduitGroup.parent
      }
    }

    if (!multiConduitGroup || !multiConduitGroup.userData?.isConduitGroup) {
      console.warn('⚠️ Could not find multi-conduit group for selection')
      return
    }

    // Select the multi-conduit group
    this.selectedConduitGroup = multiConduitGroup
    this.selectedConduit = multiConduitGroup // For compatibility with existing code
    
    // Update visual appearance
    this.updateGroupAppearance(multiConduitGroup, 'selected')
    
    // Update event handler's selected object reference
    if (this.eventHandler) {
      this.eventHandler.selectedObject = multiConduitGroup
    }

    // console.log(`⚡ Selected multi-conduit group: ${multiConduitGroup.children.length} conduits`)
    // console.log('⚡ Group bounding box:', multiConduitGroup.userData.boundingBox)

    // Reset position tracking
    this.lastSelectedConduitPosition = null

    // Attach transform controls to the group
    // console.log('⚡ Attaching transform controls to group:', multiConduitGroup.name)
    // console.log('⚡ Group position:', multiConduitGroup.position)
    
    // Only attach if the conduit group is in the scene
    if (multiConduitGroup.parent) {
      this.transformControls.attach(multiConduitGroup)
      this.transformControls.enabled = true
      this.transformControls.visible = true
    } else {
      console.warn('Conduit group is not in the scene, cannot attach transform controls')
    }
    this.transformControls.setMode('translate')
    this.transformControls.setSize(0.8)
    
    // Check if transform controls are in scene
    const controlsInScene = this.scene.children.includes(this.transformControls)
    // console.log('⚡ Transform controls in scene:', controlsInScene)
    
    // Try to make gizmo more visible
    setTimeout(() => {
      this.transformControls.visible = true
      this.transformControls.enabled = true
      // console.log('⚡ Transform controls after timeout - visible:', this.transformControls.visible)
    }, 100)
    
    // Log selection info
    // console.log('⚡ Multi-conduit group selected:', multiConduitGroup.userData.conduitData)
    // console.log('⚡ Transform controls enabled:', this.transformControls.enabled)
    // console.log('⚡ Transform controls visible:', this.transformControls.visible)
    // console.log('⚡ Transform controls object:', this.transformControls.object)
    // console.log('⚡ Transform controls position:', this.transformControls.position)
    // console.log('⚡ Transform controls children:', this.transformControls.children ? this.transformControls.children.length : 'undefined')
    
    // Create measurement lines
    this.createConduitMeasurements()
    
    // Display conduit info
    this.displayConduitInfo(multiConduitGroup)
  }

  /**
   * Update appearance of all conduits in a multi-conduit group
   */
  updateGroupAppearance(multiConduitGroup, appearance) {
    if (!multiConduitGroup || !multiConduitGroup.children) return
    
    multiConduitGroup.children.forEach(conduitMesh => {
      if (conduitMesh.userData?.type === 'conduit') {
        this.conduitGeometry.updateConduitAppearance(conduitMesh, appearance)
      }
    })
  }

  /**
   * Deselect current conduit group
   */
  deselectConduit() {
    // Deselect the multi-conduit group
    if (this.selectedConduitGroup) {
      this.updateGroupAppearance(this.selectedConduitGroup, 'normal')
      this.selectedConduitGroup = null
    }
    
    if (this.selectedConduit) {
      this.selectedConduit = null
      
      // Update event handler's selected object reference
      if (this.eventHandler) {
        this.eventHandler.selectedObject = null
      }
    }

    // Clear measurement lines
    this.clearConduitMeasurements()
    
    // Detach transform controls
    this.transformControls.detach()
    this.transformControls.enabled = false

    // Clear info display
    this.clearInfoDisplay()
  }

  // Keyboard events are now handled by MepEventHandler - removed this method

  /**
   * Delete selected conduit
   */
  deleteSelectedConduit() {
    if (!this.selectedConduitGroup) return

    // Get conduit data for deletion from MEP storage
    const conduitData = this.selectedConduitGroup.userData.conduitData
    if (!conduitData || !conduitData.id) {
      // console.error('❌ Cannot delete conduit: missing conduit data or ID')
      return
    }

    // console.log(`⚡ Deleting conduit group with ID: ${conduitData.id}`)

    // Remove from MEP data storage
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const updatedItems = storedMepItems.filter(item => {
        // Remove the conduit with matching ID
        return !(item.type === 'conduit' && item.id === conduitData.id)
      })
      
      // Save updated items to localStorage
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      // console.log(`⚡ Conduit ${conduitData.id} removed from MEP data storage`)
      
      // Update manifest if function available
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      // Refresh MEP panel to reflect the deletion
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      // Dispatch events to update MEP panel
      window.dispatchEvent(new Event('mepItemsUpdated'))
      
    } catch (error) {
      console.error('❌ Error removing conduit from MEP data:', error)
    }

    // Remove from 3D scene
    const conduitGroup = this.scene.getObjectByName('ConduitsGroup')
    if (conduitGroup) {
      // Dispose of geometry and materials
      this.selectedConduitGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })

      // Remove from scene
      conduitGroup.remove(this.selectedConduitGroup)
      // console.log('⚡ Multi-conduit group deleted from scene')
    }

    // Deselect
    this.deselectConduit()
  }

  /**
   * Copy selected conduit
   */
  copySelectedConduit() {
    if (!this.selectedConduitGroup) return
    
    this.copiedConduitData = {
      ...this.selectedConduitGroup.userData.conduitData,
      position: {
        x: this.selectedConduitGroup.position.x,
        y: this.selectedConduitGroup.position.y,
        z: this.selectedConduitGroup.position.z + 0.2 // Offset for paste
      }
    }
    
    // console.log('⚡ Conduit group copied')
  }

  /**
   * Paste conduit
   */
  pasteConduit() {
    if (!this.copiedConduitData) return

    // Create new conduit with copied data
    const newConduitData = {
      ...this.copiedConduitData,
      id: `conduit_${Date.now()}`
    }

    // This would need to be connected to the main renderer
    // console.log('⚡ Paste conduit:', newConduitData)
  }

  /**
   * Display conduit information
   */
  displayConduitInfo(multiConduitGroup) {
    if (!multiConduitGroup || !multiConduitGroup.userData.conduitData) return

    const data = multiConduitGroup.userData.conduitData
    const count = multiConduitGroup.children.length
    const info = `
      Multi-Conduit Group: ${count} conduits
      Conduit Type: ${data.conduitType || 'EMT'}
      Diameter: ${data.diameter || 1}"
      Spacing: ${data.spacing || 4}"
      Fill: ${data.fillPercentage || 0}%
      Tier: ${data.tier || 1}
      Position: (${multiConduitGroup.position.x.toFixed(2)}, ${multiConduitGroup.position.y.toFixed(2)}, ${multiConduitGroup.position.z.toFixed(2)})
    `

    // This would update a UI element to display the info
    // console.log('⚡ Multi-Conduit Group Info:', info)
  }

  /**
   * Clear info display
   */
  clearInfoDisplay() {
    // This would clear the UI element
    // console.log('⚡ Info display cleared')
  }

  /**
   * Update conduit tier information based on position
   */
  updateConduitTierInfo(conduit) {
    if (!conduit) return

    try {
      const yPosition = conduit.position.y
      const tierInfo = this.calculateConduitTier(yPosition)
      
      // Update conduit userData
      if (conduit.userData.conduitData) {
        conduit.userData.conduitData.tier = tierInfo.tier
        conduit.userData.conduitData.tierName = tierInfo.tierName
      }

      // console.log('⚡ Conduit tier updated:', tierInfo)
    } catch (error) {
      console.error('❌ Error updating conduit tier info:', error)
    }
  }

  /**
   * Calculate which tier a conduit is in based on its Y position using snap line geometry
   * Uses the same logic as ducts for consistency
   */
  calculateConduitTier(yPosition) {
    try {
      // Validate yPosition input
      if (!isFinite(yPosition)) {
        // console.warn('❌ Invalid yPosition for tier calculation:', yPosition)
        return { tier: null, tierName: 'No Tier' }
      }

      // Use snap line manager to get rack geometry lines if available
      if (this.snapLineManager && this.snapLineManager.getSnapLinesFromRackGeometry) {
        const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
        
        // Use the same tier space detection logic as DuctInteraction
        const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
        const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
        
        // Find tier spaces
        const tierSpaces = []
        const minTierHeight = 0.3 // Minimum 30cm tier height in meters
        
        for (let i = 0; i < allBeamPositions.length - 1; i++) {
          const topY = allBeamPositions[i]
          const bottomY = allBeamPositions[i + 1]
          
          // Validate beam positions
          if (!isFinite(topY) || !isFinite(bottomY)) {
            // console.warn('❌ Invalid beam position:', { topY, bottomY })
            continue
          }
          
          const gap = topY - bottomY
          
          if (gap >= minTierHeight && isFinite(gap)) {
            tierSpaces.push({
              tierIndex: tierSpaces.length + 1,
              top: topY,
              bottom: bottomY,
              height: gap,
              centerY: isFinite(topY + bottomY) ? (topY + bottomY) / 2 : topY
            })
          }
        }
        
        // Find which tier space the conduit Y position falls into
        const tolerance = 0.05 // 5cm tolerance for conduits (smaller than ducts)
        
        for (const tierSpace of tierSpaces) {
          // Check if conduit position is within the tier space bounds + tolerance
          const tierBottom = tierSpace.bottom - tolerance
          const tierTop = tierSpace.top + tolerance
          
          if (yPosition >= tierBottom && yPosition <= tierTop) {
            return {
              tier: tierSpace.tierIndex,
              tierName: `Tier ${tierSpace.tierIndex}`
            }
          }
        }
        
        // Check if conduit is close to any tier space (within tolerance)
        for (const tierSpace of tierSpaces) {
          const distanceToCenter = Math.abs(yPosition - tierSpace.centerY)
          if (distanceToCenter <= tolerance) {
            return {
              tier: tierSpace.tierIndex,
              tierName: `Tier ${tierSpace.tierIndex}`
            }
          }
        }
        
        // Conduit is not within any tier tolerance
        if (tierSpaces.length > 0) {
          const topTier = tierSpaces[0]
          const bottomTier = tierSpaces[tierSpaces.length - 1]
          
          if (yPosition > topTier.top + tolerance) {
            return { tier: null, tierName: 'Above Rack' }
          } else if (yPosition < bottomTier.bottom - tolerance) {
            return { tier: null, tierName: 'Below Rack' }
          }
        }
        
        return { tier: null, tierName: 'No Tier' }
      }

      // Fallback calculation if snap lines are not available
      const estimatedTierHeight = 0.6096 // 2 feet in meters
      const tierNumber = Math.max(1, Math.floor(yPosition / estimatedTierHeight) + 1)
      
      return {
        tier: tierNumber,
        tierName: `Tier ${tierNumber} (Estimated)`,
        upperBeamY: null,
        lowerBeamY: null
      }
      
    } catch (error) {
      // console.error('❌ Error calculating conduit tier:', error)
      return { tier: null, tierName: 'Error' }
    }
  }

  /**
   * Handle transform changes during dragging - move entire group together
   */
  onTransformChange() {
    if (this.selectedConduitGroup) {
      this.updateSnapGuides()
      
      // Apply snapping to the group (if dragging)
      if (this.transformControls.dragging) {
        this.applyRealTimeSnapping()
        this.updateConduitMeasurements()
      }
      
      // Update group's userData with new position
      if (this.selectedConduitGroup.userData?.conduitData) {
        this.selectedConduitGroup.userData.conduitData.position = {
          x: this.selectedConduitGroup.position.x,
          y: this.selectedConduitGroup.position.y,
          z: this.selectedConduitGroup.position.z
        }
      }
      
      // Update tier information for the group
      this.updateConduitTierInfo(this.selectedConduitGroup)
    }
  }
  
  /**
   * Update snap guides (placeholder for future implementation)
   */
  updateSnapGuides() {
    if (!this.selectedConduit || !this.snapLineManager) return
    // Conduits use the same snap lines as pipes and ducts
  }
  
  /**
   * Apply real-time snapping during conduit transformation
   */
  applyRealTimeSnapping() {
    if (!this.selectedConduitGroup || !this.snapLineManager) return
    
    const snapTolerance = 0.03 // Same as ducts - about 1.2 inches
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    
    // Use group's bounding box for snapping calculations
    const groupBoundingBox = new THREE.Box3().setFromObject(this.selectedConduitGroup)
    const currentPos = this.selectedConduitGroup.position.clone()
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping (vertical positioning in tiers) - use group bounds
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
    
    // Z-axis snapping - use group bounds
    const groupLeft = groupBoundingBox.min.z
    const groupRight = groupBoundingBox.max.z
    
    let closestZSnap = null
    let closestZDist = snapTolerance
    
    for (const line of snapLines.vertical) {
      if (line.side === 'right') {
        // Snap group left edge to right post
        const dist = Math.abs(groupLeft - line.z)
        if (dist < closestZDist) {
          const offset = line.z - groupLeft
          closestZSnap = { newZ: currentPos.z + offset, dist }
          closestZDist = dist
        }
      }
      
      if (line.side === 'left') {
        // Snap group right edge to left post
        const dist = Math.abs(groupRight - line.z)
        if (dist < closestZDist) {
          const offset = line.z - groupRight
          closestZSnap = { newZ: currentPos.z + offset, dist }
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
      this.selectedConduitGroup.position.set(posX, posY, posZ)
      // Update the group's bounding box
      this.selectedConduitGroup.userData.boundingBox = new THREE.Box3().setFromObject(this.selectedConduitGroup)
      // console.log(`⚡ Applied snap to conduit group: Y=${posY.toFixed(3)}, Z=${posZ.toFixed(3)}`)
    }
  }
  
  /**
   * Save conduit group positions after transform
   */
  saveConduitPosition() {
    if (!this.selectedConduitGroup) return
    
    // Update position in userData for the group and all individual conduits
    if (this.selectedConduitGroup.userData?.conduitData) {
      this.selectedConduitGroup.userData.conduitData.position = {
        x: this.selectedConduitGroup.position.x,
        y: this.selectedConduitGroup.position.y,
        z: this.selectedConduitGroup.position.z
      }
    }
    
    // Update individual conduit positions relative to group
    this.selectedConduitGroup.children.forEach(conduitMesh => {
      if (conduitMesh.userData?.conduitData) {
        conduitMesh.userData.conduitData.position = {
          x: conduitMesh.position.x + this.selectedConduitGroup.position.x,
          y: conduitMesh.position.y + this.selectedConduitGroup.position.y,
          z: conduitMesh.position.z + this.selectedConduitGroup.position.z
        }
      }
    })
    
    // Save to localStorage and update manifest (like pipes and ducts)
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const selectedConduitData = this.selectedConduitGroup.userData.conduitData
      
      // Calculate which tier the group is in
      const tierInfo = this.calculateConduitTier(this.selectedConduitGroup.position.y)
      
      // Handle ID matching - selectedConduitData.id is the base ID
      const baseId = selectedConduitData.id.toString().split('_')[0]
      
      // For multi-conduit groups, save all individual positions
      const groupPositions = this.selectedConduitGroup.children.map(conduitMesh => ({
        id: conduitMesh.userData.conduitData.id,
        position: {
          x: conduitMesh.position.x + this.selectedConduitGroup.position.x,
          y: conduitMesh.position.y + this.selectedConduitGroup.position.y,
          z: conduitMesh.position.z + this.selectedConduitGroup.position.z
        }
      }))
      
      const updatedItems = storedMepItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId && item.type === 'conduit') {
          return { 
            ...item, 
            position: {
              x: this.selectedConduitGroup.position.x,
              y: this.selectedConduitGroup.position.y,
              z: this.selectedConduitGroup.position.z
            },
            tier: tierInfo.tier,
            tierName: tierInfo.tierName,
            // Store individual conduit positions for multi-conduit groups
            groupPositions: this.selectedConduitGroup.children.length > 1 ? groupPositions : undefined
          }
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
        detail: { updatedItems, updatedConduitId: selectedConduitData.id }
      }))
      
      // console.log('⚡ Conduit position and tier saved:', {
      //   position: this.selectedConduit.userData.conduitData.position,
      //   tier: tierInfo
      // })
      
    } catch (error) {
      console.error('❌ Error saving conduit position:', error)
    }
  }

  /**
   * Update all conduits' tier information
   */
  updateAllConduitTierInfo() {
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      let updated = false
      
      // Get all conduit groups from the scene to access their current positions
      const conduitGroups = []
      const conduitGroup = this.scene.getObjectByName('ConduitsGroup')
      if (conduitGroup) {
        conduitGroup.children.forEach(conduit => {
          if (conduit.userData?.conduitData) {
            conduitGroups.push(conduit)
          }
        })
      }
      
      const updatedItems = storedMepItems.map(item => {
        if (item.type === 'conduit') {
          // Find the corresponding 3D conduit group
          const baseId = item.id.toString().split('_')[0]
          const conduit = conduitGroups.find(group => {
            const groupBaseId = group.userData.conduitData.id.toString().split('_')[0]
            return groupBaseId === baseId || group.userData.conduitData.id === item.id
          })
          
          if (conduit) {
            // Calculate tier info based on current 3D position
            const currentYPosition = conduit.position.y
            const tierInfo = this.calculateConduitTier(currentYPosition)
            
            // Update conduit userData
            conduit.userData.conduitData.tier = tierInfo.tier
            conduit.userData.conduitData.tierName = tierInfo.tierName
            
            if (item.tier !== tierInfo.tier || item.tierName !== tierInfo.tierName) {
              updated = true
              return {
                ...item,
                tier: tierInfo.tier,
                tierName: tierInfo.tierName,
                position: {
                  x: conduit.position.x,
                  y: conduit.position.y,
                  z: conduit.position.z
                }
              }
            }
          }
        }
        return item
      })
      
      if (updated) {
        localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
        
        // Update manifest if function available
        if (window.updateMEPItemsManifest) {
          window.updateMEPItemsManifest(updatedItems)
        }
        
        // Dispatch events to update MEP panel
        window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
          detail: { updatedItems }
        }))
        
        // console.log('📊 Updated tier information for all conduits')
      }
    } catch (error) {
      console.error('Error updating all conduit tier info:', error)
    }
  }

  /**
   * Create conduit measurements (left and right dimensions)
   */
  createConduitMeasurements() {
    if (!this.selectedConduitGroup) return
    
    const measurementTool = window.measurementToolInstance
    if (!measurementTool) return

    // Use group bounding box for measurements
    const groupBoundingBox = new THREE.Box3().setFromObject(this.selectedConduitGroup)
    const groupPos = this.selectedConduitGroup.position
    
    // Get post positions from snap lines
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    
    if (!rightPost || !leftPost) return
    
    // Use group bounds instead of individual conduit
    const groupLeft = groupBoundingBox.min.z
    const groupRight = groupBoundingBox.max.z
    
    const dimY = groupPos.y
    const dimX = groupPos.x
    
    this.conduitMeasurementIds = []
    
    // Right side measurement (from left edge of group to right post)
    const rightP1 = new THREE.Vector3(dimX, dimY, groupLeft)
    const rightP2 = new THREE.Vector3(dimX, dimY, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    const rightMeasurementId = measurementTool.measurementId
    this.conduitMeasurementIds.push(rightMeasurementId)
    
    // Left side measurement (from right edge of group to left post)
    const leftP1 = new THREE.Vector3(dimX, dimY, groupRight)
    const leftP2 = new THREE.Vector3(dimX, dimY, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    const leftMeasurementId = measurementTool.measurementId
    this.conduitMeasurementIds.push(leftMeasurementId)
  }

  /**
   * Clear conduit measurements
   */
  clearConduitMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.conduitMeasurementIds) return
    
    this.conduitMeasurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    this.conduitMeasurementIds = []
  }

  /**
   * Update conduit measurements during transformation
   */
  updateConduitMeasurements() {
    if (!this.selectedConduit || !this.conduitMeasurementIds?.length) return
    
    this.clearConduitMeasurements()
    this.createConduitMeasurements()
  }

  /**
   * Get the currently selected conduit
   */
  getSelectedConduit() {
    return this.selectedConduit
  }

  /**
   * Find all conduits that belong to the same group (same base ID)
   */
  findConduitGroup(targetConduit) {
    if (!targetConduit?.userData?.conduitData?.id) return [targetConduit]

    const targetId = targetConduit.userData.conduitData.id.toString()
    const baseId = targetId.split('_')[0] // Get base ID before the _0, _1 suffix

    const conduitGroup = []
    const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
    
    if (conduitsGroup) {
      conduitsGroup.children.forEach(conduit => {
        if (conduit.userData?.conduitData?.id) {
          const conduitId = conduit.userData.conduitData.id.toString()
          const conduitBaseId = conduitId.split('_')[0]
          
          if (conduitBaseId === baseId) {
            conduitGroup.push(conduit)
          }
        }
      })
    }

    // Sort by index to maintain consistent ordering
    conduitGroup.sort((a, b) => {
      const aIndex = parseInt(a.userData.conduitData.id.toString().split('_').pop()) || 0
      const bIndex = parseInt(b.userData.conduitData.id.toString().split('_').pop()) || 0
      return aIndex - bIndex
    })

    return conduitGroup.length > 0 ? conduitGroup : [targetConduit]
  }

  /**
   * Update conduit group dimensions (recreates all conduits with new dimensions)
   */
  updateConduitDimensions(newDimensions) {
    if (!this.selectedConduitGroup || !this.selectedConduitGroup.children.length) return
    
    try {
      // console.log(`⚡ Updating dimensions for ${this.selectedConduitGroup.children.length} conduits in group`)
      // console.log('⚡ New dimensions received:', newDimensions)
      
      // Check if count or spacing has changed - if so, we need to recreate the entire group
      const currentCount = this.selectedConduitGroup.children.length
      const newCount = newDimensions.count || currentCount
      const currentSpacing = this.selectedConduitGroup.userData.conduitData.spacing || 4
      const newSpacing = newDimensions.spacing || currentSpacing
      
      // console.log(`⚡ Count comparison: current=${currentCount}, new=${newCount}`)
      // console.log(`⚡ Spacing comparison: current=${currentSpacing}, new=${newSpacing}`)
      
      if (newCount !== currentCount || newSpacing !== currentSpacing) {
        // console.log(`⚡ Count or spacing changed (count: ${currentCount} -> ${newCount}, spacing: ${currentSpacing} -> ${newSpacing}), recreating conduit group`)
        
        // Get the group conduit data
        const groupConduitData = this.selectedConduitGroup.userData.conduitData
        // Ensure id is a string before splitting
        const conduitId = groupConduitData.id || ''
        const baseId = typeof conduitId === 'string' ? conduitId.split('_')[0] : conduitId.toString()
        
        // Store the position of the group
        const groupPosition = this.selectedConduitGroup.position.clone()
        
        // Remove the group from scene
        if (this.selectedConduitGroup.parent) {
          this.selectedConduitGroup.parent.remove(this.selectedConduitGroup)
        }
        // Dispose geometry and materials
        this.selectedConduitGroup.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        })
        
        // Clear current selection
        this.selectedConduitGroup = null
        this.deselectConduit()
        
        // Create updated conduit data for the new group
        const updatedConduitData = {
          ...groupConduitData,
          ...newDimensions,
          count: newCount,
          position: {
            x: groupPosition.x,
            y: groupPosition.y,
            z: groupPosition.z
          },
          color: newDimensions.color || groupConduitData.color // Preserve color
        }
        
        // Note: Skip flag is already set in ThreeScene onSave to prevent double recreation
        
        // Use the conduit renderer to create the new group
        if (window.conduitRendererInstance) {
          const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
          const conduitLength = rackLength * 12 // Convert feet to inches
          
          // Create new multi-conduit group with updated dimensions
          const newMultiConduitGroup = this.conduitGeometry.createMultiConduitGroup(
            updatedConduitData,
            conduitLength,
            groupPosition
          )
          
          if (newMultiConduitGroup && newMultiConduitGroup.children.length > 0) {
            window.conduitRendererInstance.conduitsGroup.add(newMultiConduitGroup)
            // console.log('✅ Multi-conduit group recreated with', newCount, 'conduits')
            
            // Select the new group
            setTimeout(() => {
              this.selectConduit(newMultiConduitGroup)
            }, 100)
          }
        }
        
        return
      }
      
      // If count hasn't changed, just update dimensions of existing conduits
      const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
      const conduitLength = rackLength * 12 + 12 // Convert feet to inches + 12" extension

      // Update all conduits in the group
      this.selectedConduitGroup.children.forEach(conduit => {
        const conduitData = conduit.userData.conduitData
        if (!conduitData) {
          // console.warn('❌ No conduit data found for conduit:', conduit.name)
          return
        }

        // Update conduit data with new dimensions (exclude count from updates)
        const updatedConduitData = {
          ...conduitData,
          ...newDimensions
        }
        delete updatedConduitData.count // Remove count as it's not a conduit property

        // Update userData
        conduit.userData.conduitData = updatedConduitData

        // Store current position
        const currentPosition = conduit.position.clone()
        
        // If only color is changing, update material without recreating geometry
        if (newDimensions.color && Object.keys(newDimensions).length === 1) {
          // Just update the material color
          conduit.traverse((child) => {
            if (child.isMesh) {
              // Create new material with custom color
              const newMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color(newDimensions.color),
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
              })
              child.material = newMaterial
            }
          })
        } else {
          // Remove old geometry for full update
          while (conduit.children.length > 0) {
            const child = conduit.children[0]
            conduit.remove(child)
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (child.material.map) child.material.map.dispose()
              child.material.dispose()
            }
          }

          // Create new geometry with updated dimensions
          const newGeometry = this.conduitGeometry.createConduitGeometry(
            updatedConduitData.diameter || 1,
            conduitLength,
            updatedConduitData.conduitType || 'EMT'
          )

          // Apply materials
          let material
          if (updatedConduitData.color) {
            // Use custom color if specified
            material = new THREE.MeshLambertMaterial({
              color: new THREE.Color(updatedConduitData.color),
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide
            })
          } else {
            // Use default material for conduit type
            const materials = this.conduitGeometry.materials
            const materialKey = updatedConduitData.conduitType?.toLowerCase() || 'emt'
            material = materials[materialKey] || materials.emt
          }

          // Create new mesh
          const newMesh = new THREE.Mesh(newGeometry, material)
          conduit.add(newMesh)

          // Update appearance to maintain selection state
          this.conduitGeometry.updateConduitAppearance(conduit, 'selected')
        }

        // Update tier information
        this.updateConduitTierInfo(conduit)
      })

      // Refresh measurements for the primary conduit
      this.updateConduitMeasurements()

      // console.log('⚡ Conduit group dimensions updated for', this.selectedConduitGroup.children.length, 'conduits')
      
    } catch (error) {
      console.error('❌ Error updating conduit group dimensions:', error)
    }
  }

  /**
   * Dispose of interaction controls
   */
  dispose() {
    // Dispose of centralized event handler
    if (this.eventHandler) {
      this.eventHandler.dispose()
      this.eventHandler = null
    }
    
    // Clear measurements
    this.clearConduitMeasurements()
    
    // Fallback cleanup for individual event listeners
    if (this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('click', this.handleClick)
      this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove)
    }

    // Dispose transform controls
    if (this.transformControls) {
      this.transformControls.detach()
      this.scene.remove(this.transformControls)
      this.transformControls.dispose()
    }

    // console.log('⚡ ConduitInteraction disposed')
  }
}