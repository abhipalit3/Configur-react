/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

/**
 * DuctInteraction - Handles mouse interactions and transform controls for ducts
 */
export class DuctInteraction {
  constructor(scene, camera, renderer, orbitControls, ductGeometry, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.ductGeometry = ductGeometry
    this.snapLineManager = snapLineManager
    
    this.selectedDuct = null
    this.transformControls = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    
    this.ductMeasurementIds = []
    
    // Editor callbacks - to be set by parent
    this.onDuctEditorSave = null
    this.onDuctEditorCancel = null
    
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
        this.snapLineManager.clearSnapGuides()
        // Save position when dragging ends
        this.saveDuctPosition()
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
    this.setupKeyboardShortcuts()
  }

  onMouseClick(event) {
    if (this.transformControls?.dragging) return

    this.updateMousePosition(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Handle duct selection/deselection (measurement clicks are handled by global handler with event capture)
    let ductworkGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'DuctworkGroup') {
        ductworkGroup = child
      }
    })

    if (!ductworkGroup) return

    const intersects = this.raycaster.intersectObjects(ductworkGroup.children, true)
    
    if (intersects.length > 0) {
      const ductGroup = this.findDuctGroup(intersects[0].object)
      if (ductGroup && ductGroup !== this.selectedDuct) {
        this.selectDuct(ductGroup)
      }
    } else {
      this.deselectDuct()
    }
  }

  onMouseMove(event) {
    if (!this.transformControls?.dragging) {
      this.updateMousePosition(event)
      this.handleHover()
    }
  }

  onTransformChange() {
    if (!this.selectedDuct || !this.transformControls?.object) return
    
    if (!this.selectedDuct.parent) {
      this.deselectDuct()
      return
    }
    
    if (this.transformControls.dragging) {
      this.applyRealTimeSnapping()
      this.updateDuctMeasurements()
    }
  }

  applyRealTimeSnapping() {
    if (!this.selectedDuct) return
    
    const snapTolerance = 0.03 // Reduced from 0.1 to 0.03 (about 1.2 inches instead of 4 inches)
    const ductData = this.selectedDuct.userData.ductData
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    
    const currentPos = this.selectedDuct.position.clone()
    const ductHeight = this.snapLineManager.in2m(ductData.height || 8)
    const ductWidth = this.snapLineManager.in2m(ductData.width || 12)
    const insulation = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalHeight = ductHeight + (2 * insulation)
    const totalWidth = ductWidth + (2 * insulation)
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping
    const ductBottom = posY - (totalHeight / 2)
    const ductTop = posY + (totalHeight / 2)
    
    let closestYSnap = null
    let closestYDist = snapTolerance
    
    for (const line of snapLines.horizontal) {
      if (line.type === 'beam_top') {
        const dist = Math.abs(ductBottom - line.y)
        if (dist < closestYDist) {
          closestYSnap = { newY: line.y + (totalHeight / 2), dist, lineY: line.y }
          closestYDist = dist
        }
      }
      
      if (line.type === 'beam_bottom') {
        const dist = Math.abs(ductTop - line.y)
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
    
    // Z-axis snapping
    const ductLeft = posZ - (totalWidth / 2)
    const ductRight = posZ + (totalWidth / 2)
    
    let closestZSnap = null
    let closestZDist = snapTolerance
    
    for (const line of snapLines.vertical) {
      if (line.side === 'right') {
        const dist = Math.abs(ductLeft - line.z)
        if (dist < closestZDist) {
          closestZSnap = { newZ: line.z + (totalWidth / 2), dist }
          closestZDist = dist
        }
      }
      
      if (line.side === 'left') {
        const dist = Math.abs(ductRight - line.z)
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
      this.selectedDuct.position.set(posX, posY, posZ)
    }
  }

  selectDuct(ductGroup) {
    if (!ductGroup || !ductGroup.position || !ductGroup.parent) return
    
    this.deselectDuct()
    
    this.selectedDuct = ductGroup
    this.ductGeometry.updateDuctAppearance(ductGroup, 'selected')
    
    const originalPosition = ductGroup.position.clone()
    
    // Ensure transform controls are in translate mode when selecting a duct
    this.transformControls.setMode('translate')
    this.transformControls.attach(ductGroup)
    ductGroup.position.copy(originalPosition)
    
    this.createDuctMeasurements()
  }

  deselectDuct() {
    if (this.selectedDuct) {
      if (this.selectedDuct.parent) {
        this.ductGeometry.updateDuctAppearance(this.selectedDuct, 'normal')
      }
      
      if (this.transformControls) {
        try {
          this.transformControls.detach()
        } catch (error) {
          // Silent error handling
        }
      }
      
      this.selectedDuct = null
    }
    
    this.snapLineManager.clearSnapGuides()
    this.clearDuctMeasurements()
  }

  createDuctMeasurements() {
    if (!this.selectedDuct) return
    
    const measurementTool = window.measurementToolInstance
    if (!measurementTool) return

    
    const ductData = this.selectedDuct.userData.ductData
    const ductPos = this.selectedDuct.position
    
    const ductWidth = this.snapLineManager.in2m(ductData.width || 12)
    const insulation = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalWidth = ductWidth + (2 * insulation)
    
    // Get post positions from snap lines
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    
    if (!rightPost || !leftPost) return
    
    const ductLeft = ductPos.z - (totalWidth / 2)
    const ductRight = ductPos.z + (totalWidth / 2)
    
    const dimY = ductPos.y
    const dimX = ductPos.x
    
    this.ductMeasurementIds = []
    
    // Right side measurement
    const rightP1 = new THREE.Vector3(dimX, dimY, ductLeft)
    const rightP2 = new THREE.Vector3(dimX, dimY, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    const rightMeasurementId = measurementTool.measurementId
    this.ductMeasurementIds.push(rightMeasurementId)
    
    // Left side measurement
    const leftP1 = new THREE.Vector3(dimX, dimY, ductRight)
    const leftP2 = new THREE.Vector3(dimX, dimY, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    const leftMeasurementId = measurementTool.measurementId
    this.ductMeasurementIds.push(leftMeasurementId)

  }

  clearDuctMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.ductMeasurementIds) return
    
    this.ductMeasurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    
    this.ductMeasurementIds = []
  }

  updateDuctMeasurements() {
    if (!this.selectedDuct || !this.ductMeasurementIds?.length) return
    
    this.clearDuctMeasurements()
    this.createDuctMeasurements()
  }


  handleHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    let ductworkGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'DuctworkGroup') {
        ductworkGroup = child
      }
    })

    if (!ductworkGroup) return

    const intersects = this.raycaster.intersectObjects(ductworkGroup.children, true)

    // Reset all ducts to normal (except selected)
    ductworkGroup.children.forEach(ductGroup => {
      if (ductGroup !== this.selectedDuct) {
        this.ductGeometry.updateDuctAppearance(ductGroup, 'normal')
      }
    })

    // Apply hover effect
    if (intersects.length > 0) {
      const ductGroup = this.findDuctGroup(intersects[0].object)
      if (ductGroup && ductGroup !== this.selectedDuct) {
        this.ductGeometry.updateDuctAppearance(ductGroup, 'hover')
        this.domElement.style.cursor = 'pointer'
      }
    } else if (!this.selectedDuct) {
      this.domElement.style.cursor = 'default'
    }
  }

  findDuctGroup(object) {
    let current = object
    while (current && current.parent) {
      if (current.userData.type === 'duct') {
        return current
      }
      current = current.parent
    }
    return null
  }

  updateMousePosition(event) {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  setupKeyboardShortcuts() {
    this.onKeyDown = (event) => {
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
        case 'Delete':
        case 'Backspace':
          if (this.selectedDuct) {
            this.deleteSelectedDuct()
          }
          break
        case 'Escape':
          this.deselectDuct()
          break
      }
    }
    
    document.addEventListener('keydown', this.onKeyDown)
    this.keyboardHandler = this.onKeyDown
  }

  /**
   * Set callback for duct editor save action
   */
  setDuctEditorCallbacks(onSave, onCancel) {
    this.onDuctEditorSave = onSave
    this.onDuctEditorCancel = onCancel
  }

  /**
   * Calculate which tier a duct is in based on its Y position using snap line geometry
   */
  calculateDuctTier(yPosition) {
    try {
      // Use the snap line manager to get actual tier spaces from geometry
      const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
      
      // Use the same tier space detection logic as DuctEditor
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
      
      // Find which tier space the duct Y position falls into
      // Add tolerance based on duct height - if within half duct height of tier space, consider it in that tier
      const ductData = this.selectedDuct?.userData?.ductData
      let ductHeight = ductData?.height || 8
      
      // Validate duct height
      if (!isFinite(ductHeight) || ductHeight <= 0) {
        console.warn('⚠️ Invalid duct height, using fallback:', ductHeight)
        ductHeight = 8
      }
      
      const ductHeightM = ductHeight * 0.0254 // Convert inches to meters
      let tolerance = ductHeightM / 2 // Half duct height tolerance
      
      if (!isFinite(tolerance)) {
        console.warn('⚠️ Invalid tolerance, using fallback')
        tolerance = 0.1 // 10cm fallback
      }
      
      for (const tierSpace of tierSpaces) {
        // Check if duct position is within the tier space bounds + tolerance
        const tierBottom = tierSpace.bottom - tolerance
        const tierTop = tierSpace.top + tolerance
        
        if (yPosition >= tierBottom && yPosition <= tierTop) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Check if duct is close to any tier space (within tolerance)
      for (const tierSpace of tierSpaces) {
        const distanceToCenter = Math.abs(yPosition - tierSpace.centerY)
        if (distanceToCenter <= tolerance) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Duct is not within any tier tolerance
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
      console.error('Error calculating tier from geometry:', error)
      return { tier: null, tierName: 'No Tier' }
    }
  }

  /**
   * Update tier information for all ducts in MEP items based on their current positions
   */
  updateAllDuctTierInfo() {
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      let updated = false
      
      // Get all duct groups from the scene to access their current positions
      const ductGroups = []
      if (window.ductworkRendererInstance?.ductworkGroup) {
        const ductworkGroup = window.ductworkRendererInstance.ductworkGroup
        ductworkGroup.children.forEach(ductGroup => {
          if (ductGroup.userData?.ductData) {
            ductGroups.push(ductGroup)
          }
        })
      }
      
      const updatedItems = storedMepItems.map(item => {
        if (item.type === 'duct') {
          // Find the corresponding 3D duct group
          const baseId = item.id.toString().split('_')[0]
          const ductGroup = ductGroups.find(group => {
            const groupBaseId = group.userData.ductData.id.toString().split('_')[0]
            return groupBaseId === baseId || group.userData.ductData.id === item.id
          })
          
          if (ductGroup) {
            // Calculate tier info based on current 3D position
            const currentYPosition = ductGroup.position.y
            const tierInfo = this.calculateDuctTierFromPosition(currentYPosition, item.height || 8)
            
            if (item.tier !== tierInfo.tier || item.tierName !== tierInfo.tierName) {
              updated = true
              return {
                ...item,
                tier: tierInfo.tier,
                tierName: tierInfo.tierName,
                position: {
                  x: ductGroup.position.x,
                  y: ductGroup.position.y,
                  z: ductGroup.position.z
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
        
        console.log('📊 Updated tier information for all ducts')
      }
    } catch (error) {
      console.error('Error updating all duct tier info:', error)
    }
  }

  /**
   * Calculate tier info for a given Y position and duct height (utility version)
   */
  calculateDuctTierFromPosition(yPosition, ductHeightInches) {
    try {
      const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
      const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
      const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
      
      // Find tier spaces
      const tierSpaces = []
      const minTierHeight = 0.3
      
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
      
      // Calculate tolerance based on duct height
      const ductHeightM = (ductHeightInches || 8) * 0.0254
      const tolerance = ductHeightM / 2
      
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
      
      return { tier: null, tierName: 'No Tier' }
      
    } catch (error) {
      console.error('Error calculating tier from position:', error)
      return { tier: null, tierName: 'No Tier' }
    }
  }

  /**
   * Save duct position to localStorage and manifest
   */
  saveDuctPosition() {
    if (!this.selectedDuct?.userData?.ductData) return
    
    
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const selectedDuctData = this.selectedDuct.userData.ductData
      
      // Calculate which tier the duct is in
      const tierInfo = this.calculateDuctTier(this.selectedDuct.position.y)
      
      // Handle ID matching - selectedDuctData.id might have _0, _1 suffix
      const baseId = selectedDuctData.id.toString().split('_')[0]
      
      const updatedItems = storedMepItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId) {
          const updatedItem = { 
            ...item, 
            position: {
              x: this.selectedDuct.position.x,
              y: this.selectedDuct.position.y,
              z: this.selectedDuct.position.z
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
        detail: { updatedItems, updatedDuctId: selectedDuctData.id }
      }))
      
    } catch (error) {
      console.error('❌ Error saving duct position:', error)
    }
  }

  /**
   * Get selected duct for external editor component
   */
  getSelectedDuct() {
    return this.selectedDuct
  }

  /**
   * Update duct dimensions (called from editor)
   */
  updateDuctDimensions(newDimensions) {
    if (!this.selectedDuct) return

    
    // Update userData
    const oldDuctData = this.selectedDuct.userData.ductData
    const updatedDuctData = {
      ...oldDuctData,
      ...newDimensions
    }
    this.selectedDuct.userData.ductData = updatedDuctData

    // If color changed, update the custom materials
    if (newDimensions.color && newDimensions.color !== oldDuctData.color) {
      const ductBody = this.selectedDuct.getObjectByName('DuctBody')
      const ductCore = this.selectedDuct.getObjectByName('DuctCore')
      const ductMesh = ductCore || ductBody
      
      if (ductMesh) {
        // Create new custom material with the new color
        const newCustomMaterial = new THREE.MeshLambertMaterial({
          color: new THREE.Color(newDimensions.color),
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        })
        
        // Update the stored custom materials
        ductMesh.userData.customMaterial = newCustomMaterial
        ductMesh.material = newCustomMaterial
        
      }
    }

    // Recreate the duct geometry with new dimensions
    const ductLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + this.snapLineManager.in2m(12)
    const currentPosition = this.selectedDuct.position.clone()
    
    // Clear current children
    while (this.selectedDuct.children.length > 0) {
      const child = this.selectedDuct.children[0]
      this.selectedDuct.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Recreate the duct using the improved geometry structure
    const newDuctGroup = this.ductGeometry.createDuctGroup(
      updatedDuctData,
      ductLength,
      new THREE.Vector3(0, 0, 0) // Position will be set by copying from current position
    )

    // Copy the new children to the existing duct group
    newDuctGroup.children.forEach(child => {
      this.selectedDuct.add(child.clone())
    })

    // Clean up temporary group
    newDuctGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Update appearance for selected state
    this.ductGeometry.updateDuctAppearance(this.selectedDuct, 'selected')
    
    // Update measurements
    this.updateDuctMeasurements()
    
  }

  /**
   * Delete selected duct
   */
  deleteSelectedDuct() {
    if (!this.selectedDuct) return

    // Get duct data for deletion from MEP storage
    const ductData = this.selectedDuct.userData.ductData
    if (!ductData || !ductData.id) {
      console.error('❌ Cannot delete duct: missing duct data or ID')
      return
    }

    console.log(`⚡ Deleting duct with ID: ${ductData.id}`)

    // Remove from MEP data storage
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const updatedItems = storedMepItems.filter(item => {
        // Remove the duct with matching ID
        return !(item.type === 'duct' && item.id === ductData.id)
      })
      
      // Save updated items to localStorage
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      console.log(`⚡ Duct ${ductData.id} removed from MEP data storage`)
      
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
      console.error('❌ Error removing duct from MEP data:', error)
    }

    // Remove from 3D scene
    const ductGroup = this.scene.getObjectByName('DuctsGroup')
    if (ductGroup) {
      // Dispose of geometry and materials
      this.selectedDuct.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })

      // Remove from scene
      ductGroup.remove(this.selectedDuct)
      console.log('⚡ Duct deleted from scene')
    }

    // Clear measurements
    this.clearDuctMeasurements()

    // Deselect
    this.deselectDuct()
  }

  dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.onMouseClick)
      this.domElement.removeEventListener('mousemove', this.onMouseMove)
    }
    
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
    }
    
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
    
    this.clearDuctMeasurements()
  }
}