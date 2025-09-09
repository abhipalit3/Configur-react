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
 * PipeInteraction - Handles mouse interactions and transform controls for pipes
 */
export class PipeInteraction {
  constructor(scene, camera, renderer, orbitControls, pipeGeometry, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.pipeGeometry = pipeGeometry
    this.snapLineManager = snapLineManager
    
    this.selectedPipe = null
    this.transformControls = null
    this.raycaster = setupRaycaster(camera)
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    this.pipeMeasurementIds = []
    
    this.setupTransformControls()
    this.setupCentralizedEventHandler()
    
    // Register with central MEP selection manager
    this.registerWithMepManager()
  }

  setupTransformControls() {
    const onTransformChange = () => {
      if (this.selectedPipe && this.selectedPipe.parent) {
        this.onTransformChange()
      } else if (this.transformControls.object && !this.transformControls.object.parent) {
        // If the object is no longer in the scene, detach it
        this.transformControls.detach()
      }
    }
    
    const onDragEnd = () => {
      if (this.snapLineManager?.clearSnapGuides) {
        this.snapLineManager.clearSnapGuides()
      }
      this.savePipePosition()
      // Update measurements after transform ends
      this.updatePipeMeasurements()
    }
    
    this.transformControls = setupTransformControls(
      this.camera,
      this.domElement, 
      this.scene,
      this.orbitControls,
      {
        onChange: onTransformChange,
        onDragEnd: onDragEnd,
        showX: false,
        showY: true,
        showZ: true,
        size: 0.8
      }
    )
  }

  setupCentralizedEventHandler() {
    // Create centralized event handler for pipe interactions
    this.eventHandler = createMepEventHandler('pipe', this.scene, this.camera, this.renderer, this.orbitControls, {
      callbacks: {
        onSelect: (object) => this.selectPipe(object),
        onDeselect: (object) => this.deselectPipe(),
        onClick: (event, object) => this.handleClick(event, object),
        onMouseMove: (event, mouse) => this.handleMouseMove(event, mouse),
        onDelete: () => this.deleteSelectedPipe(),
        onDuplicate: () => this.duplicateSelectedPipe?.(),
        onEscape: () => this.deselectPipe(),
        onKeyDown: (event, selectedObject) => this.handleTransformKeys?.(event)
      },
      config: {
        targetGroupName: 'PipingGroup',
        objectType: 'pipe',
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
      this.domElement.addEventListener('click', this.handleClick.bind(this))
      this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this))
    }
    
    registerWithMepManager('piping', this, fallbackSetup)
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
   * Centralized click handler (called by MepEventHandler)
   */
  handleClick(event, intersectedObject) {
    if (this.transformControls?.dragging) return
    
    // Selection is handled by the event handler, we just need to handle additional click logic
    if (intersectedObject) {
      console.log('🔧 Pipe clicked:', intersectedObject.userData?.pipeData?.id || 'unknown')
    }
  }

  /**
   * Centralized mouse move handler (called by MepEventHandler)
   */
  handleMouseMove(event, mouse) {
    if (this.transformControls?.dragging) {
      // Still handle transform-specific mouse move logic
      this.updateMousePosition(event)
    }
    // Hover effects are handled by MepEventHandler
  }

  updateMousePosition(event) {
    updateMouseCoordinates(event, this.domElement, this.mouse)
  }

  // Hover handling is now done by MepEventHandler - removed this method

  findPipeGroup(object) {
    let current = object
    while (current) {
      if (current.userData && current.userData.type === 'pipe') {
        return current
      }
      current = current.parent
    }
    return null
  }

  selectPipe(pipeGroup) {
    // Deselect previous pipe
    if (this.selectedPipe) {
      this.deselectPipe()
    }

    this.selectedPipe = pipeGroup
    
    // Update appearance to selected state
    this.pipeGeometry.updatePipeAppearance(pipeGroup, 'selected')
    
    // Update event handler's selected object reference
    if (this.eventHandler) {
      this.eventHandler.selectedObject = pipeGroup
    }

    // Attach transform controls
    this.transformControls.attach(pipeGroup)

    // Calculate and update tier information
    this.updatePipeTierInfo()

    // Create measurement lines
    this.createPipeMeasurements()

    const pipeData = pipeGroup.userData.pipeData
    // console.log('🔧 Pipe selected:', pipeData)
  }

  deselectPipe() {
    if (this.selectedPipe) {
      // Reset appearance to normal
      this.pipeGeometry.updatePipeAppearance(this.selectedPipe, 'normal')
      this.selectedPipe = null
      
      // Update event handler's selected object reference
      if (this.eventHandler) {
        this.eventHandler.selectedObject = null
      }
    }

    // Clear measurement lines
    this.clearPipeMeasurements()

    // Detach transform controls
    this.transformControls.detach()
  }

  onTransformChange() {
    if (this.selectedPipe) {
      this.updateSnapGuides()
      if (this.transformControls.dragging) {
        this.applyRealTimeSnapping()
        this.updatePipeMeasurements()
      }
    }
  }

  updateSnapGuides() {
    // Note: SnapLineManager doesn't have updateSnapGuides method
    // Pipes use the same snap lines as ducts, so we don't need dynamic updates
    // Just ensure snap guides are cleared when transform completes
    if (!this.selectedPipe || !this.snapLineManager) return
  }

  /**
   * Apply real-time snapping during pipe transformation
   */
  applyRealTimeSnapping() {
    if (!this.selectedPipe || !this.snapLineManager) return
    
    const snapTolerance = 0.03 // Same as ducts - about 1.2 inches
    const pipeData = this.selectedPipe.userData.pipeData
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    
    const currentPos = this.selectedPipe.position.clone()
    const pipeDiameter = this.snapLineManager.in2m(pipeData.diameter || 2)
    const insulation = this.snapLineManager.in2m(pipeData.insulation || 0)
    const totalDiameter = pipeDiameter + (2 * insulation)
    const pipeRadius = totalDiameter / 2
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping (vertical positioning in tiers)
    const pipeBottom = posY - pipeRadius
    const pipeTop = posY + pipeRadius
    
    let closestYSnap = null
    let closestYDist = snapTolerance
    
    for (const line of snapLines.horizontal) {
      if (line.type === 'beam_top') {
        // Snap pipe bottom to beam top
        const dist = Math.abs(pipeBottom - line.y)
        if (dist < closestYDist) {
          closestYSnap = { newY: line.y + pipeRadius, dist, lineY: line.y }
          closestYDist = dist
        }
      }
      
      if (line.type === 'beam_bottom') {
        // Snap pipe top to beam bottom
        const dist = Math.abs(pipeTop - line.y)
        if (dist < closestYDist) {
          closestYSnap = { newY: line.y - pipeRadius, dist, lineY: line.y }
          closestYDist = dist
        }
      }
    }
    
    if (closestYSnap) {
      posY = closestYSnap.newY
      snapped = true
    }
    
    // Z-axis snapping (position within rack depth)
    const pipeLeft = posZ - pipeRadius
    const pipeRight = posZ + pipeRadius
    
    let closestZSnap = null
    let closestZDist = snapTolerance
    
    for (const line of snapLines.vertical) {
      if (line.side === 'right') {
        // Snap pipe left edge to right post
        const dist = Math.abs(pipeLeft - line.z)
        if (dist < closestZDist) {
          closestZSnap = { newZ: line.z + pipeRadius, dist }
          closestZDist = dist
        }
      }
      
      if (line.side === 'left') {
        // Snap pipe right edge to left post
        const dist = Math.abs(pipeRight - line.z)
        if (dist < closestZDist) {
          closestZSnap = { newZ: line.z - pipeRadius, dist }
          closestZDist = dist
        }
      }
    }
    
    if (closestZSnap) {
      posZ = closestZSnap.newZ
      snapped = true
    }
    
    // Apply the snapped position
    if (snapped) {
      this.selectedPipe.position.set(posX, posY, posZ)
    }
  }

  /**
   * Update pipe measurements during transformation
   */
  updatePipeMeasurements() {
    if (!this.selectedPipe) return
    
    try {
      // Similar to duct measurements - could be expanded for pipe-specific measurements
      // For now, just ensure position is valid
      const position = this.selectedPipe.position
      if (!isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
        // console.warn('❌ Invalid pipe position during measurement update:', position)
        return
      }
    } catch (error) {
      console.error('❌ Error updating pipe measurements:', error)
    }
  }

  savePipePosition() {
    if (!this.selectedPipe) return

    const pipeData = this.selectedPipe.userData.pipeData
    const newPosition = this.selectedPipe.position.clone()

    // Calculate tier information
    this.updatePipeTierInfo()

    // Update localStorage with new position
    try {
      const savedItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const updatedItems = savedItems.map(item => {
        // Handle ID matching - pipeData.id might have _0, _1 suffix for multiple pipes
        const baseId = pipeData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        if ((baseId === itemBaseId || item.id === pipeData.id) && item.type === 'pipe') {
          return {
            ...item,
            position: {
              x: newPosition.x,
              y: newPosition.y,
              z: newPosition.z
            },
            tier: this.selectedPipe.userData.tier,
            tierName: this.selectedPipe.userData.tierName
          }
        }
        return item
      })
      
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      
      // IMPORTANT: Also update the manifest to ensure consistency
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      } else {
        console.warn('⚠️ updateMEPItemsManifest not available - manifest may be out of sync')
      }
      
      // Dispatch custom event to notify MEP panel of changes
      window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
        detail: { updatedItems, updatedPipeId: pipeData.id }
      }))
      
      // Also try multiple refresh methods
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      // Force re-render by dispatching storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'configurMepItems',
        newValue: JSON.stringify(updatedItems),
        storageArea: localStorage
      }))
    } catch (error) {
      console.error('❌ Error saving pipe position:', error)
    }
  }

  updatePipeTierInfo() {
    if (!this.selectedPipe) return

    try {
      const yPosition = this.selectedPipe.position.y
      const pipeData = this.selectedPipe.userData.pipeData
      const pipeDiameter = pipeData?.diameter || 2
      const tierInfo = this.calculatePipeTier(yPosition, pipeDiameter)
      
      // Update pipe userData
      this.selectedPipe.userData.tier = tierInfo.tier
      this.selectedPipe.userData.tierName = tierInfo.tierName

      // console.log('🔧 PIPE: Tier info updated to:', tierInfo)
    } catch (error) {
      console.error('❌ Error updating pipe tier info:', error)
    }
  }

  /**
   * Calculate which tier a pipe is in based on its Y position using snap line geometry
   */
  calculatePipeTier(yPosition, pipeDiameter = null) {
    try {
      // Validate yPosition input
      if (!isFinite(yPosition)) {
        console.warn('❌ Invalid yPosition for tier calculation:', yPosition)
        return { tier: null, tierName: 'No Tier' }
      }
      
      // Use the snap line manager to get actual tier spaces from geometry
      const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
      
      if (!snapLines || !snapLines.horizontal || !Array.isArray(snapLines.horizontal)) {
        // Return 'No Tier' if no snap lines available, but don't warn (consistent with ducts)
        return { tier: null, tierName: 'No Tier' }
      }
      
      // Use the same tier space detection logic as DuctInteraction (more resilient)
      const allHorizontalLines = snapLines.horizontal.filter(line => line && isFinite(line.y)).sort((a, b) => b.y - a.y)
      const allBeamPositions = [...allHorizontalLines].map(b => b.y).filter(y => isFinite(y)).sort((a, b) => b - a)

      // Find tier spaces
      const tierSpaces = []
      const minTierHeight = 0.3 // Minimum 30cm tier height in meters
      
      for (let i = 0; i < allBeamPositions.length - 1; i++) {
        const topY = allBeamPositions[i]
        const bottomY = allBeamPositions[i + 1]
        
        // Validate beam positions
        if (!isFinite(topY) || !isFinite(bottomY)) {
          console.warn('❌ Invalid beam position:', { topY, bottomY })
          continue
        }
        
        const gap = topY - bottomY
        
        if (gap >= minTierHeight && isFinite(gap)) {
          const tierSpace = {
            tierIndex: tierSpaces.length + 1,
            top: topY,
            bottom: bottomY,
            height: gap,
            centerY: isFinite(topY + bottomY) ? (topY + bottomY) / 2 : topY
          }
          tierSpaces.push(tierSpace)
        }
      }
      
      // Find which tier space the pipe Y position falls into
      // Use dynamic tolerance based on pipe diameter (similar to how ducts use duct height)
      let diameter = pipeDiameter
      if (!diameter) {
        const pipeData = this.selectedPipe?.userData?.pipeData
        diameter = pipeData?.diameter || 2 // Default 2 inches
      }
      
      // Validate pipe diameter
      if (!isFinite(diameter) || diameter <= 0) {
        diameter = 2 // Fallback to 2 inches
      }
      
      const pipeDiameterM = diameter * 0.0254 // Convert inches to meters
      let tolerance = pipeDiameterM / 2 // Half pipe diameter tolerance
      
      if (!isFinite(tolerance)) {
        tolerance = 0.05 // 5cm fallback (same as conduits)
      }
      
      for (const tierSpace of tierSpaces) {
        // Check if pipe position is within the tier space bounds + tolerance
        const tierBottom = tierSpace.bottom - tolerance
        const tierTop = tierSpace.top + tolerance
        
        if (yPosition >= tierBottom && yPosition <= tierTop) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Check if pipe is close to any tier space (within tolerance)
      for (const tierSpace of tierSpaces) {
        const distanceToCenter = Math.abs(yPosition - tierSpace.centerY)
        if (distanceToCenter <= tolerance) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Check if pipe is above or below the rack (like ducts, conduits, and cable trays)
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
    } catch (error) {
      console.error('❌ Error calculating pipe tier:', error)
      return { tier: null, tierName: 'No Tier' }
    }
  }

  /**
   * Update tier information for all pipes
   */
  updateAllPipeTierInfo() {
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      let updated = false
      
      // Get all pipe groups from the scene to access their current positions
      const pipeGroups = []
      this.scene.traverse((child) => {
        if (child.isGroup && child.name === 'PipingGroup') {
          child.children.forEach(pipeGroup => {
            if (pipeGroup.userData?.pipeData) {
              pipeGroups.push(pipeGroup)
            }
          })
        }
      })
      
      const updatedItems = storedMepItems.map(item => {
        if (item.type === 'pipe') {
          // Find the corresponding 3D pipe group
          const baseId = item.id.toString().split('_')[0]
          const pipeGroup = pipeGroups.find(group => {
            const groupBaseId = group.userData.pipeData.id.toString().split('_')[0]
            return groupBaseId === baseId || group.userData.pipeData.id === item.id
          })
          
          if (pipeGroup) {
            // Calculate tier info based on current 3D position
            const currentYPosition = pipeGroup.position.y
            const pipeDiameter = item.diameter || 2
            const tierInfo = this.calculatePipeTier(currentYPosition, pipeDiameter)
            
            // Update pipe userData in 3D scene
            pipeGroup.userData.tier = tierInfo.tier
            pipeGroup.userData.tierName = tierInfo.tierName
            
            if (item.tier !== tierInfo.tier || item.tierName !== tierInfo.tierName) {
              updated = true
              return {
                ...item,
                tier: tierInfo.tier,
                tierName: tierInfo.tierName,
                position: {
                  x: pipeGroup.position.x,
                  y: pipeGroup.position.y,
                  z: pipeGroup.position.z
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
        
        // console.log('📊 Updated tier information for all pipes')
      }
    } catch (error) {
      console.error('Error updating all pipe tier info:', error)
    }
  }

  /**
   * Update pipe dimensions (recreates the pipe with new dimensions)
   */
  updatePipeDimensions(newDimensions) {
    if (!this.selectedPipe) return

    try {
      const pipeData = this.selectedPipe.userData.pipeData
      if (!pipeData) {
        // console.error('❌ No pipe data found for selected pipe')
        return
      }

      // Update pipe data with new dimensions
      const updatedPipeData = {
        ...pipeData,
        ...newDimensions
      }

      // Update userData
      this.selectedPipe.userData.pipeData = updatedPipeData

      // Recreate pipe geometry with new dimensions
      const currentPosition = this.selectedPipe.position.clone()
      
      // Calculate new pipe length (same as ducts with extension)
      const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12 // Get actual rack length or default 12 feet
      const pipeLength = rackLength * 12 + 12 // Convert feet to inches + 12" extension like ducts

      // Remove old geometry
      while (this.selectedPipe.children.length > 0) {
        const child = this.selectedPipe.children[0]
        this.selectedPipe.remove(child)
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      }

      // Create new geometry
      const newPipeGroup = this.pipeGeometry.createPipeGroup(
        updatedPipeData,
        pipeLength,
        currentPosition
      )

      // Copy the new children to the existing group
      while (newPipeGroup.children.length > 0) {
        const child = newPipeGroup.children[0]
        newPipeGroup.remove(child)
        this.selectedPipe.add(child)
      }

      // Update appearance to selected state
      this.pipeGeometry.updatePipeAppearance(this.selectedPipe, 'selected')

      // Update tier information
      this.updatePipeTierInfo()

      // console.log('🔧 Pipe dimensions updated:', updatedPipeData)

    } catch (error) {
      console.error('❌ Error updating pipe dimensions:', error)
    }
  }

  createPipeMeasurements() {
    if (!this.selectedPipe) return
    
    const measurementTool = window.measurementToolInstance
    if (!measurementTool) return

    
    const pipeData = this.selectedPipe.userData.pipeData
    const pipePos = this.selectedPipe.position
    
    const pipeDiameter = this.snapLineManager.in2m(pipeData.diameter || 2)
    const insulation = this.snapLineManager.in2m(pipeData.insulation || 0)
    const totalDiameter = pipeDiameter + (2 * insulation)
    const radius = totalDiameter / 2
    
    // Get post positions from snap lines
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    
    if (!rightPost || !leftPost) return
    
    const pipeLeft = pipePos.z - radius
    const pipeRight = pipePos.z + radius
    
    const dimY = pipePos.y
    const dimX = pipePos.x
    
    this.pipeMeasurementIds = []
    
    // Right side measurement (from left edge of pipe to right post) - same as duct logic
    const rightP1 = new THREE.Vector3(dimX, dimY, pipeLeft)
    const rightP2 = new THREE.Vector3(dimX, dimY, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    const rightMeasurementId = measurementTool.measurementId
    this.pipeMeasurementIds.push(rightMeasurementId)
    
    // Left side measurement (from right edge of pipe to left post) - same as duct logic
    const leftP1 = new THREE.Vector3(dimX, dimY, pipeRight)
    const leftP2 = new THREE.Vector3(dimX, dimY, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    const leftMeasurementId = measurementTool.measurementId
    this.pipeMeasurementIds.push(leftMeasurementId)

  }

  clearPipeMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.pipeMeasurementIds) return
    
    this.pipeMeasurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    this.pipeMeasurementIds = []
  }

  updatePipeMeasurements() {
    if (!this.selectedPipe || !this.pipeMeasurementIds?.length) return
    
    this.clearPipeMeasurements()
    this.createPipeMeasurements()
  }


  getSelectedPipe() {
    return this.selectedPipe
  }

  /**
   * Delete selected pipe
   */
  deleteSelectedPipe() {
    if (!this.selectedPipe) return

    // Get pipe data for deletion from MEP storage
    const pipeData = this.selectedPipe.userData.pipeData
    if (!pipeData || !pipeData.id) {
      console.error('❌ Cannot delete pipe: missing pipe data or ID')
      return
    }

    // Remove from MEP data storage
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      
      const updatedItems = storedMepItems.filter(item => {
        if (item.type === 'pipe') {
          // Extract base ID from the pipe data ID (remove suffix like _0, _1, etc.)
          const pipeBaseId = pipeData.id.toString().split('_')[0]
          const itemId = item.id.toString()
          
          // Check both full ID match and base ID match
          const fullIdMatch = itemId === pipeData.id.toString()
          const baseIdMatch = itemId === pipeBaseId
          
          return !(fullIdMatch || baseIdMatch)
        }
        return true
      })
      
      // Save updated items to localStorage
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      
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
      console.error('❌ Error removing pipe from MEP data:', error)
    }

    // Remove from 3D scene
    const pipingGroup = this.scene.getObjectByName('PipingGroup')
    if (pipingGroup) {
      // Dispose of geometry and materials
      this.selectedPipe.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })

      // Remove from scene
      pipingGroup.remove(this.selectedPipe)
    }

    // Clear measurements
    this.clearPipeMeasurements()

    // Deselect
    this.deselectPipe()
  }

  /**
   * Duplicate/copy selected pipe - creates a duplicate with offset
   */
  duplicateSelectedPipe() {
    if (!this.selectedPipe) return
    
    const pipeData = this.selectedPipe.userData.pipeData
    if (!pipeData) return
    
    // Create new pipe data with unique ID
    const newPipeData = {
      ...pipeData,
      id: Date.now() + Math.random(),
      position: {
        x: this.selectedPipe.position.x,
        y: this.selectedPipe.position.y,
        z: this.selectedPipe.position.z + 0.3 // Offset by 30cm in Z direction
      }
    }
    
    // Get rack length for pipe creation
    const rackLength = this.snapLineManager ? this.snapLineManager.getRackLength() : 12
    const pipeLength = rackLength * 12 // Convert feet to inches
    
    // Create the new pipe
    const newPipeGroup = this.pipeGeometry.createPipeGroup(
      newPipeData,
      pipeLength,
      newPipeData.position
    )
    
    if (newPipeGroup) {
      // Add to scene
      const pipingGroup = this.scene.getObjectByName('PipingGroup')
      if (pipingGroup) {
        pipingGroup.add(newPipeGroup)
      }
      
      // Add to MEP items storage
      const mepItem = {
        type: 'pipe',
        id: newPipeData.id,
        name: newPipeData.name || 'Pipe',
        diameter: newPipeData.diameter || 2,
        insulation: newPipeData.insulation || 0,
        pipeType: newPipeData.pipeType || 'copper',
        tier: newPipeData.tier || 1,
        position: newPipeData.position,
        color: newPipeData.color
      }
      
      // Update localStorage
      try {
        const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
        storedMepItems.push(mepItem)
        localStorage.setItem('configurMepItems', JSON.stringify(storedMepItems))
        
        // Update manifest if function available
        if (window.updateMEPItemsManifest) {
          window.updateMEPItemsManifest(storedMepItems)
        }
        
        // Refresh MEP panel
        if (window.refreshMepPanel) {
          window.refreshMepPanel()
        }
        
        // Dispatch storage event
        window.dispatchEvent(new Event('storage'))
        
      } catch (error) {
        console.error('❌ Error saving copied pipe to storage:', error)
      }
      
      // Select the new pipe
      setTimeout(() => {
        this.selectPipe(newPipeGroup)
      }, 100)
      
      console.log('✅ Pipe copied successfully')
    }
  }

  dispose() {
    // Dispose of centralized event handler
    if (this.eventHandler) {
      this.eventHandler.dispose()
      this.eventHandler = null
    }
    
    if (this.transformControls) {
      this.scene.remove(this.transformControls.getHelper())
    }
    
    // Fallback cleanup for individual event listeners
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.handleClick)
      this.domElement.removeEventListener('mousemove', this.handleMouseMove)
    }
  }
}