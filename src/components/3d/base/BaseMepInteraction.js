/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { getMepSelectionManager } from '../core/MepSelectionManager.js'
import { getProjectManifest } from '../../../utils/projectManifest'
import { getAllMEPItemsFromTemporary, updateAllMEPItemsInTemporary } from '../../../utils/temporaryState'
import {
  setupTransformControls,
  setupRaycaster,
  updateMouseCoordinates,
  registerWithMepManager
} from '../utils/common3dHelpers.js'
import { createMepEventHandler } from '../utils/mepEventHandler.js'

/**
 * Base class for all MEP interaction handlers
 * Provides common functionality for selection, transformation, and measurement
 */
export class BaseMepInteraction {
  constructor(config) {
    // Required configuration
    this.scene = config.scene
    this.camera = config.camera
    this.renderer = config.renderer
    this.orbitControls = config.orbitControls
    this.snapLineManager = config.snapLineManager
    
    // MEP type configuration
    this.mepType = config.mepType // 'duct', 'pipe', 'conduit', 'cableTray', 'tradeRack'
    this.mepTypePlural = config.mepTypePlural || `${this.mepType}s`
    this.groupName = config.groupName // 'DuctsGroup', 'PipingGroup', etc.
    this.geometryManager = config.geometryManager // DuctGeometry, PipeGeometry, etc.
    
    // State management
    this.selectedObject = null
    this.selectedGroup = null
    this.hoveredObject = null
    this.hoveredGroup = null
    this.measurementIds = []
    
    // Setup common components
    this.raycaster = setupRaycaster(this.camera)
    this.mouse = new THREE.Vector2()
    this.domElement = this.renderer.domElement
    this.mountedRef = { current: true }
    
    // Initialize transform controls
    this.setupTransformControls()
    
    // Setup event handling
    this.setupEventHandler()
    
    // Register with MEP manager
    this.registerWithMepManager()
  }

  /**
   * Setup transform controls with common configuration
   */
  setupTransformControls() {
    const onTransformChange = () => {
      if (this.selectedObject && this.selectedObject.parent) {
        this.onTransformChange()
      } else if (this.transformControls.object && !this.transformControls.object.parent) {
        this.transformControls.detach()
      }
    }
    
    const onDragEnd = () => {
      if (this.snapLineManager?.clearSnapGuides) {
        this.snapLineManager.clearSnapGuides()
      }
      this.saveObjectPosition()
    }
    
    const config = this.getTransformControlsConfig()
    this.transformControls = setupTransformControls(
      this.camera,
      this.domElement,
      this.scene,
      this.orbitControls,
      {
        onChange: onTransformChange,
        onDragEnd: onDragEnd,
        ...config
      }
    )
  }

  /**
   * Override to customize transform controls for specific MEP type
   */
  getTransformControlsConfig() {
    return {
      showX: false,  // Lock X-axis by default
      showY: true,   // Allow Y-axis (vertical)
      showZ: true,   // Allow Z-axis (depth)
      size: 0.8
    }
  }

  /**
   * Setup centralized event handler
   */
  setupEventHandler() {
    this.eventHandler = createMepEventHandler(
      this.mepType,
      this.scene,
      this.camera,
      this.renderer,
      this.orbitControls,
      {
        callbacks: {
          onSelect: (object) => this.selectObject(object),
          onDeselect: () => this.deselectObject(),
          onClick: (event, object) => this.handleClick(event, object),
          onMouseMove: (event, mouse) => this.handleMouseMove(event, mouse),
          onDelete: () => this.deleteSelectedObject(),
          onCopy: () => this.copySelectedObject(),
          onEscape: () => this.deselectObject(),
          onKeyDown: (event) => this.handleTransformKeys(event)
        },
        config: {
          targetGroupName: this.groupName,
          objectType: this.mepType,
          selectionAttribute: 'userData.type'
        }
      }
    )
  }

  /**
   * Register with central MEP selection manager
   */
  registerWithMepManager() {
    const fallbackSetup = () => {
      this.domElement.addEventListener('click', this.handleClick.bind(this))
      this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this))
    }
    
    registerWithMepManager(this.mepTypePlural, this, fallbackSetup)
  }

  /**
   * Common selection logic
   */
  selectObject(targetObject) {
    // Clear any existing selection
    this.deselectObject()
    
    // Find the appropriate group/object to select
    const objectToSelect = this.findSelectableObject(targetObject)
    if (!objectToSelect) {
      console.warn(`⚠️ Could not find selectable ${this.mepType}`)
      return
    }
    
    this.selectedObject = objectToSelect
    this.selectedGroup = this.findGroupForObject(objectToSelect)
    
    // Update visual appearance
    this.updateObjectAppearance(objectToSelect, 'selected')
    
    // Update event handler reference
    if (this.eventHandler) {
      this.eventHandler.selectedObject = objectToSelect
    }
    
    // Attach transform controls
    if (objectToSelect.parent) {
      this.transformControls.attach(objectToSelect)
      this.transformControls.setMode('translate')
    }
    
    // Create measurements
    this.createMeasurements()
    
    // Trigger selection event
    this.triggerSelectionEvent()
    
    console.log(`✅ ${this.mepType} selected:`, objectToSelect.userData)
  }

  /**
   * Common deselection logic
   */
  deselectObject() {
    if (this.selectedObject) {
      this.updateObjectAppearance(this.selectedObject, 'normal')
      this.transformControls.detach()
    }
    
    this.clearMeasurements()
    this.clearHover()
    
    this.selectedObject = null
    this.selectedGroup = null
    
    if (this.eventHandler) {
      this.eventHandler.selectedObject = null
    }
    
    this.triggerSelectionEvent()
  }

  /**
   * Set hover state
   */
  setHover(targetObject) {
    if (this.hoveredObject === targetObject || this.selectedObject === targetObject) return
    
    this.clearHover()
    
    this.hoveredObject = targetObject
    this.hoveredGroup = this.findGroupForObject(targetObject)
    this.updateObjectAppearance(targetObject, 'hover')
  }

  /**
   * Clear hover state
   */
  clearHover() {
    if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
      this.updateObjectAppearance(this.hoveredObject, 'normal')
      this.hoveredObject = null
      this.hoveredGroup = null
    }
  }

  /**
   * Handle click events
   */
  handleClick(event, intersectedObject) {
    if (this.transformControls?.dragging) return false
    
    if (intersectedObject) {
      console.log(`🔧 ${this.mepType} clicked:`, 
        intersectedObject.userData?.[`${this.mepType}Data`]?.id || 'unknown')
      return true
    }
    return false
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event, mouse) {
    if (this.transformControls?.dragging) {
      updateMouseCoordinates(event, this.domElement, this.mouse)
    }
  }

  /**
   * Handle transform keyboard shortcuts
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
   * Handle transform changes
   */
  onTransformChange() {
    if (!this.selectedObject || !this.transformControls?.object) return
    
    if (!this.selectedObject.parent) {
      this.deselectObject()
      return
    }
    
    if (this.transformControls.dragging) {
      this.applyRealTimeSnapping()
      this.updateMeasurements()
    }
  }

  /**
   * Apply real-time snapping during transformation
   */
  applyRealTimeSnapping() {
    if (!this.selectedObject || !this.snapLineManager) return
    
    const snapTolerance = 0.03 // ~1.2 inches
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    if (!snapLines) return
    
    const objectData = this.getObjectData(this.selectedObject)
    const dimensions = this.calculateObjectDimensions(objectData)
    const currentPos = this.selectedObject.position.clone()
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping (vertical)
    const snapY = this.snapToHorizontalLines(
      posY, 
      dimensions.height, 
      snapLines.horizontal, 
      snapTolerance
    )
    if (snapY) {
      posY = snapY.newY
      snapped = true
    }
    
    // Z-axis snapping (depth)
    const snapZ = this.snapToVerticalLines(
      posZ,
      dimensions.width,
      snapLines.vertical,
      snapTolerance
    )
    if (snapZ) {
      posZ = snapZ.newZ
      snapped = true
    }
    
    if (snapped) {
      this.selectedObject.position.set(posX, posY, posZ)
    }
  }

  /**
   * Snap to horizontal lines (beams)
   */
  snapToHorizontalLines(posY, height, horizontalLines, tolerance) {
    const objBottom = posY - (height / 2)
    const objTop = posY + (height / 2)
    
    let closest = null
    let closestDist = tolerance
    
    for (const line of horizontalLines) {
      if (line.type === 'beam_top') {
        const dist = Math.abs(objBottom - line.y)
        if (dist < closestDist) {
          closest = { newY: line.y + (height / 2), dist }
          closestDist = dist
        }
      }
      
      if (line.type === 'beam_bottom') {
        const dist = Math.abs(objTop - line.y)
        if (dist < closestDist) {
          closest = { newY: line.y - (height / 2), dist }
          closestDist = dist
        }
      }
    }
    
    return closest
  }

  /**
   * Snap to vertical lines (posts)
   */
  snapToVerticalLines(posZ, width, verticalLines, tolerance) {
    const objLeft = posZ - (width / 2)
    const objRight = posZ + (width / 2)
    
    let closest = null
    let closestDist = tolerance
    
    for (const line of verticalLines) {
      if (line.side === 'right') {
        const dist = Math.abs(objLeft - line.z)
        if (dist < closestDist) {
          closest = { newZ: line.z + (width / 2), dist }
          closestDist = dist
        }
      }
      
      if (line.side === 'left') {
        const dist = Math.abs(objRight - line.z)
        if (dist < closestDist) {
          closest = { newZ: line.z - (width / 2), dist }
          closestDist = dist
        }
      }
    }
    
    return closest
  }

  /**
   * Calculate tier from Y position
   */
  calculateTier(yPosition, objectHeight = null) {
    try {
      if (!isFinite(yPosition)) {
        return { tier: null, tierName: 'No Tier' }
      }
      
      const snapLines = this.snapLineManager?.getSnapLinesFromRackGeometry()
      if (!snapLines?.horizontal) {
        return { tier: null, tierName: 'No Tier' }
      }
      
      const tierSpaces = this.findTierSpaces(snapLines.horizontal)
      const tolerance = this.calculateTierTolerance(objectHeight)
      
      // Check if position is within a tier space
      for (const tierSpace of tierSpaces) {
        if (yPosition >= tierSpace.bottom - tolerance && 
            yPosition <= tierSpace.top + tolerance) {
          return {
            tier: tierSpace.tierIndex,
            tierName: `Tier ${tierSpace.tierIndex}`
          }
        }
      }
      
      // Check if above or below rack
      if (tierSpaces.length > 0) {
        if (yPosition > tierSpaces[0].top + tolerance) {
          return { tier: null, tierName: 'Above Rack' }
        }
        if (yPosition < tierSpaces[tierSpaces.length - 1].bottom - tolerance) {
          return { tier: null, tierName: 'Below Rack' }
        }
      }
      
      return { tier: null, tierName: 'No Tier' }
    } catch (error) {
      console.error(`Error calculating ${this.mepType} tier:`, error)
      return { tier: null, tierName: 'Error' }
    }
  }

  /**
   * Find tier spaces from horizontal snap lines
   */
  findTierSpaces(horizontalLines) {
    const tierSpaces = []
    const minTierHeight = 0.3 // 30cm minimum
    
    const beamPositions = horizontalLines
      .filter(line => isFinite(line.y))
      .map(line => line.y)
      .sort((a, b) => b - a)
    
    for (let i = 0; i < beamPositions.length - 1; i++) {
      const topY = beamPositions[i]
      const bottomY = beamPositions[i + 1]
      const gap = topY - bottomY
      
      if (gap >= minTierHeight && isFinite(gap)) {
        tierSpaces.push({
          tierIndex: tierSpaces.length + 1,
          top: topY,
          bottom: bottomY,
          height: gap,
          centerY: (topY + bottomY) / 2
        })
      }
    }
    
    return tierSpaces
  }

  /**
   * Save object position to storage
   */
  saveObjectPosition() {
    if (!this.selectedObject) return
    
    try {
      const objectData = this.getObjectData(this.selectedObject)
      const tierInfo = this.calculateTier(this.selectedObject.position.y)
      
      // Use temporary state instead of legacy manifest
      const storedItems = getAllMEPItemsFromTemporary()
      const baseId = objectData.id.toString().split('_')[0]
      
      const updatedItems = storedItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId && item.type === this.mepType) {
          return {
            ...item,
            position: {
              x: this.selectedObject.position.x,
              y: this.selectedObject.position.y,
              z: this.selectedObject.position.z
            },
            tier: tierInfo.tier,
            tierName: tierInfo.tierName
          }
        }
        return item
      })
      
      // Update temporary state (primary storage)
      updateAllMEPItemsInTemporary(updatedItems)
      
      // Legacy manifest update removed - using temporary state only
      
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      // Trigger MEP panel refresh to reflect changes
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
        detail: { updatedItems, [`updated${this.mepType}Id`]: objectData.id }
      }))
      
    } catch (error) {
      console.error(`Error saving ${this.mepType} position:`, error)
    }
  }

  /**
   * Delete selected object
   */
  deleteSelectedObject() {
    if (!this.selectedObject) return
    
    const objectData = this.getObjectData(this.selectedObject)
    if (!objectData?.id) {
      console.error(`Cannot delete ${this.mepType}: missing data or ID`)
      return
    }
    
    // Remove from storage
    try {
      // Use temporary state instead of legacy manifest
      const storedItems = getAllMEPItemsFromTemporary()
      const updatedItems = storedItems.filter(item => {
        const baseId = objectData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        return !(item.type === this.mepType && itemBaseId === baseId)
      })
      
      // Update temporary state (primary storage)
      updateAllMEPItemsInTemporary(updatedItems)
      
      // Legacy manifest update removed - using temporary state only
      
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      if (window.refreshMepPanel) {
        window.refreshMepPanel()
      }
      
      window.dispatchEvent(new Event('mepItemsUpdated'))
    } catch (error) {
      console.error(`Error removing ${this.mepType} from storage:`, error)
    }
    
    // Remove from scene
    const group = this.scene.getObjectByName(this.groupName)
    if (group) {
      this.disposeObject(this.selectedObject)
      group.remove(this.selectedObject)
    }
    
    this.deselectObject()
  }

  /**
   * Copy selected object
   */
  copySelectedObject() {
    if (!this.selectedObject) return
    
    const objectData = this.getObjectData(this.selectedObject)
    if (!objectData) return
    
    // Create new object with offset
    const newObjectData = {
      ...objectData,
      id: Date.now() + Math.random(),
      position: {
        x: this.selectedObject.position.x,
        y: this.selectedObject.position.y,
        z: this.selectedObject.position.z + 0.3 // 30cm offset
      }
    }
    
    // Create new object (must be implemented by subclass)
    const newObject = this.createNewObject(newObjectData)
    
    if (newObject) {
      // Add to scene
      const group = this.scene.getObjectByName(this.groupName)
      if (group) {
        group.add(newObject)
      }
      
      // Add to storage
      this.saveNewObjectToStorage(newObjectData)
      
      // Select the new object
      setTimeout(() => {
        this.selectObject(newObject)
      }, 100)
      
      console.log(`✅ ${this.mepType} copied successfully`)
    }
  }

  /**
   * Update object dimensions
   */
  updateObjectDimensions(newDimensions) {
    if (!this.selectedObject) return
    
    try {
      const objectData = this.getObjectData(this.selectedObject)
      const updatedData = { 
        ...objectData, 
        ...newDimensions,
        // Always include current position to handle tier changes
        position: {
          x: this.selectedObject.position.x,
          y: this.selectedObject.position.y,
          z: this.selectedObject.position.z
        }
      }
      
      this.setObjectData(this.selectedObject, updatedData)
      
      // Recreate geometry if needed
      if (this.needsGeometryUpdate(newDimensions)) {
        this.recreateObjectGeometry(this.selectedObject, updatedData)
      }
      
      // Update measurements
      this.updateMeasurements()
      
      // Save to storage
      this.saveObjectDataToStorage(updatedData)
      
    } catch (error) {
      console.error(`Error updating ${this.mepType} dimensions:`, error)
    }
  }

  /**
   * Create measurements for selected object
   */
  createMeasurements() {
    if (!this.selectedObject || !window.measurementToolInstance) return
    
    const measurementTool = window.measurementToolInstance
    const snapLines = this.snapLineManager?.getSnapLinesFromRackGeometry()
    if (!snapLines) return
    
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    if (!rightPost || !leftPost) return
    
    const objectData = this.getObjectData(this.selectedObject)
    const dimensions = this.calculateObjectDimensions(objectData)
    const pos = this.selectedObject.position
    
    const objLeft = pos.z - (dimensions.width / 2)
    const objRight = pos.z + (dimensions.width / 2)
    
    this.measurementIds = []
    
    // Right side measurement
    const rightP1 = new THREE.Vector3(pos.x, pos.y, objLeft)
    const rightP2 = new THREE.Vector3(pos.x, pos.y, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    this.measurementIds.push(measurementTool.measurementId)
    
    // Left side measurement
    const leftP1 = new THREE.Vector3(pos.x, pos.y, objRight)
    const leftP2 = new THREE.Vector3(pos.x, pos.y, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    this.measurementIds.push(measurementTool.measurementId)
  }

  /**
   * Clear measurements
   */
  clearMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.measurementIds) return
    
    this.measurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    
    this.measurementIds = []
  }

  /**
   * Update measurements
   */
  updateMeasurements() {
    if (!this.selectedObject || !this.measurementIds?.length) return
    
    this.clearMeasurements()
    this.createMeasurements()
  }

  /**
   * Trigger selection event for UI updates
   */
  triggerSelectionEvent() {
    const event = new CustomEvent(`${this.mepType}SelectionChanged`, {
      detail: {
        [`selected${this.mepType}`]: this.selectedObject,
        [`selected${this.mepType}Group`]: this.selectedGroup
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Dispose of object geometry and materials
   */
  disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        // Handle both single materials and material arrays
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach(material => {
          if (material && typeof material.dispose === 'function') {
            if (material.map) material.map.dispose()
            material.dispose()
          }
        })
      }
    })
  }

  /**
   * Clean up and dispose
   */
  dispose() {
    if (this.eventHandler) {
      this.eventHandler.dispose()
      this.eventHandler = null
    }
    
    this.deselectObject()
    this.clearMeasurements()
    
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
    
    this.mountedRef.current = false
  }

  // Abstract methods to be implemented by subclasses
  
  /**
   * Find the selectable object from a target
   */
  findSelectableObject(target) {
    throw new Error('findSelectableObject must be implemented by subclass')
  }

  /**
   * Find the group containing an object
   */
  findGroupForObject(object) {
    throw new Error('findGroupForObject must be implemented by subclass')
  }

  /**
   * Update object appearance (normal, hover, selected)
   */
  updateObjectAppearance(object, state) {
    throw new Error('updateObjectAppearance must be implemented by subclass')
  }

  /**
   * Get object data
   */
  getObjectData(object) {
    throw new Error('getObjectData must be implemented by subclass')
  }

  /**
   * Set object data
   */
  setObjectData(object, data) {
    throw new Error('setObjectData must be implemented by subclass')
  }

  /**
   * Calculate object dimensions in meters
   */
  calculateObjectDimensions(objectData) {
    throw new Error('calculateObjectDimensions must be implemented by subclass')
  }

  /**
   * Calculate tier tolerance based on object size
   */
  calculateTierTolerance(objectHeight) {
    throw new Error('calculateTierTolerance must be implemented by subclass')
  }

  /**
   * Check if geometry needs to be recreated
   */
  needsGeometryUpdate(newDimensions) {
    throw new Error('needsGeometryUpdate must be implemented by subclass')
  }

  /**
   * Recreate object geometry
   */
  recreateObjectGeometry(object, updatedData) {
    throw new Error('recreateObjectGeometry must be implemented by subclass')
  }

  /**
   * Create a new object
   */
  createNewObject(objectData) {
    throw new Error('createNewObject must be implemented by subclass')
  }

  /**
   * Save new object to storage
   */
  saveNewObjectToStorage(objectData) {
    throw new Error('saveNewObjectToStorage must be implemented by subclass')
  }

  /**
   * Save object data to storage
   */
  saveObjectDataToStorage(objectData) {
    throw new Error('saveObjectDataToStorage must be implemented by subclass')
  }
}

export default BaseMepInteraction