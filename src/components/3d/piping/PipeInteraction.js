/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

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
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    this.pipeMeasurementIds = []
    
    this.setupTransformControls()
    this.setupEventListeners()
  }

  setupTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.domElement)
    
    this.transformControls.addEventListener('change', () => {
      this.onTransformChange()
    })

    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
      }
      
      if (!event.value) {
        if (this.snapLineManager && this.snapLineManager.clearSnapGuides) {
          this.snapLineManager.clearSnapGuides()
        }
        this.savePipePosition()
        // Update measurements after transform ends
        this.updatePipeMeasurements()
      }
    })

    this.transformControls.setMode('translate')
    this.transformControls.setSpace('world')
    this.transformControls.setSize(0.8)
    this.transformControls.showX = false
    this.transformControls.showY = true
    this.transformControls.showZ = true
    
    const gizmo = this.transformControls.getHelper()
    this.scene.add(gizmo)
  }

  setupEventListeners() {
    this.domElement.addEventListener('click', this.onMouseClick.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  onMouseClick(event) {
    if (this.transformControls?.dragging) return

    this.updateMousePosition(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Handle pipe selection/deselection (measurement clicks are handled by global handler with event capture)
    let pipingGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'PipingGroup') {
        pipingGroup = child
      }
    })

    if (!pipingGroup) return

    const intersects = this.raycaster.intersectObjects(pipingGroup.children, true)
    
    if (intersects.length > 0) {
      const pipeGroup = this.findPipeGroup(intersects[0].object)
      if (pipeGroup && pipeGroup !== this.selectedPipe) {
        this.selectPipe(pipeGroup)
      }
    } else {
      this.deselectPipe()
    }
  }

  onMouseMove(event) {
    if (!this.transformControls?.dragging) {
      this.updateMousePosition(event)
      this.handleHover()
    }
  }

  updateMousePosition(event) {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  handleHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    let pipingGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'PipingGroup') {
        pipingGroup = child
      }
    })

    if (!pipingGroup) return

    const intersects = this.raycaster.intersectObjects(pipingGroup.children, true)
    
    // Reset all pipes to normal appearance first
    pipingGroup.children.forEach(pipeGroup => {
      if (pipeGroup.userData.type === 'pipe' && pipeGroup !== this.selectedPipe) {
        this.pipeGeometry.updatePipeAppearance(pipeGroup, 'normal')
      }
    })

    // Apply hover effect
    if (intersects.length > 0) {
      const pipeGroup = this.findPipeGroup(intersects[0].object)
      if (pipeGroup && pipeGroup !== this.selectedPipe) {
        this.pipeGeometry.updatePipeAppearance(pipeGroup, 'hover')
        this.domElement.style.cursor = 'pointer'
      }
    } else if (!this.selectedPipe) {
      this.domElement.style.cursor = 'default'
    }
  }

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

    // Attach transform controls
    this.transformControls.attach(pipeGroup)

    // Calculate and update tier information
    this.updatePipeTierInfo()

    // Create measurement lines
    this.createPipeMeasurements()

    const pipeData = pipeGroup.userData.pipeData
    console.log('🔧 Pipe selected:', pipeData)
  }

  deselectPipe() {
    if (this.selectedPipe) {
      // Reset appearance to normal
      this.pipeGeometry.updatePipeAppearance(this.selectedPipe, 'normal')
      this.selectedPipe = null
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
        console.warn('❌ Invalid pipe position during measurement update:', position)
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
      const tierInfo = this.calculatePipeTier(yPosition)
      
      // Update pipe userData
      this.selectedPipe.userData.tier = tierInfo.tier
      this.selectedPipe.userData.tierName = tierInfo.tierName

      console.log('🔧 Pipe tier updated:', tierInfo)
    } catch (error) {
      console.error('❌ Error updating pipe tier info:', error)
    }
  }

  /**
   * Calculate which tier a pipe is in based on its Y position using snap line geometry
   */
  calculatePipeTier(yPosition) {
    try {
      // Validate yPosition input
      if (!isFinite(yPosition)) {
        console.warn('❌ Invalid yPosition for tier calculation:', yPosition)
        return { tier: null, tierName: 'No Tier' }
      }
      
      // Use the snap line manager to get actual tier spaces from geometry
      const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
      
      if (!snapLines || !Array.isArray(snapLines.horizontal)) {
        console.warn('⚠️ Invalid snap lines data')
        return { tier: null, tierName: 'No Tier' }
      }
      
      // Use the same tier space detection logic as DuctInteraction
      const allHorizontalLines = snapLines.horizontal.filter(line => isFinite(line.y)).sort((a, b) => b.y - a.y)
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
          tierSpaces.push({
            tierIndex: tierSpaces.length + 1,
            top: topY,
            bottom: bottomY,
            height: gap,
            centerY: isFinite(topY + bottomY) ? (topY + bottomY) / 2 : topY
          })
        }
      }
      
      // Find which tier space the pipe Y position falls into
      const tolerance = 0.1 // 10cm tolerance for pipes (smaller than ducts)
      
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
    let pipingGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'PipingGroup') {
        pipingGroup = child
      }
    })

    if (!pipingGroup) return

    pipingGroup.children.forEach(pipeGroup => {
      if (pipeGroup.userData.type === 'pipe') {
        const yPosition = pipeGroup.position.y
        const tierInfo = this.calculatePipeTier(yPosition)
        
        // Update pipe userData
        pipeGroup.userData.tier = tierInfo.tier
        pipeGroup.userData.tierName = tierInfo.tierName
      }
    })

    console.log('🔧 All pipe tier info updated')
  }

  /**
   * Update pipe dimensions (recreates the pipe with new dimensions)
   */
  updatePipeDimensions(newDimensions) {
    if (!this.selectedPipe) return

    try {
      const pipeData = this.selectedPipe.userData.pipeData
      if (!pipeData) {
        console.error('❌ No pipe data found for selected pipe')
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

      console.log('🔧 Pipe dimensions updated:', updatedPipeData)

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

  dispose() {
    if (this.transformControls) {
      this.scene.remove(this.transformControls.getHelper())
    }
    
    this.domElement.removeEventListener('click', this.onMouseClick.bind(this))
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this))
  }
}