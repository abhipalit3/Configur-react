/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { updateMouseCoordinates } from './common3dHelpers.js'

/**
 * Centralized MEP Event Handler
 * Handles all mouse and keyboard events for MEP elements (ducts, pipes, conduits, cable trays, trade racks)
 */
export class MepEventHandler {
  constructor(options = {}) {
    this.scene = options.scene
    this.camera = options.camera
    this.renderer = options.renderer
    this.orbitControls = options.orbitControls
    this.domElement = options.renderer?.domElement || options.domElement
    this.componentType = options.componentType || 'generic'
    
    // Event state
    this.raycaster = new THREE.Raycaster()
    this.raycaster.near = 0.01
    this.raycaster.far = 1000
    this.mouse = new THREE.Vector2()
    
    // Selection state
    this.selectedObject = null
    this.hoveredObject = null
    
    // Event callbacks - to be set by parent component
    this.callbacks = {
      onSelect: null,
      onDeselect: null,
      onHover: null,
      onHoverEnd: null,
      onClick: null,
      onMouseMove: null,
      onKeyDown: null,
      onDelete: null,
      onCopy: null,
      onPaste: null,
      onDuplicate: null,
      onEscape: null,
      ...options.callbacks
    }
    
    // Configuration
    this.config = {
      enableHover: true,
      enableSelection: true,
      enableKeyboardShortcuts: true,
      targetGroupName: options.targetGroupName, // e.g., 'DuctGroup', 'PipingGroup'
      objectType: options.objectType, // e.g., 'duct', 'pipe', 'conduit'
      selectionAttribute: options.selectionAttribute || 'userData.type',
      ...options.config
    }
    
    // Bind event methods
    this.onMouseClick = this.onMouseClick.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    
    // Auto-setup if enabled
    if (options.autoSetup !== false) {
      this.setupEventListeners()
    }
  }
  
  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    if (this.domElement) {
      this.domElement.addEventListener('click', this.onMouseClick)
      this.domElement.addEventListener('mousemove', this.onMouseMove)
    }
    
    if (this.config.enableKeyboardShortcuts) {
      document.addEventListener('keydown', this.onKeyDown)
      // Also try window for broader coverage
      window.addEventListener('keydown', this.onKeyDown)
    }
  }
  
  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.onMouseClick)
      this.domElement.removeEventListener('mousemove', this.onMouseMove)
    }
    
    document.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keydown', this.onKeyDown)
  }
  
  /**
   * Check if measurement tool is currently active
   */
  isMeasurementToolActive() {
    return window.measurementToolInstance && window.measurementToolInstance.active
  }
  
  /**
   * Handle mouse click events
   */
  onMouseClick(event) {
    // Don't process MEP selection if measurement tool is active
    if (this.isMeasurementToolActive()) {
      return
    }
    
    if (!this.config.enableSelection) return
    
    // Update mouse coordinates
    updateMouseCoordinates(event, this.domElement, this.mouse)
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Find intersected objects
    const intersectedObject = this.findIntersectedObject()
    
    // Handle selection
    if (intersectedObject) {
      this.selectObject(intersectedObject)
    } else {
      this.deselectObject()
    }
    
    // Call custom click handler
    if (this.callbacks.onClick) {
      this.callbacks.onClick(event, intersectedObject)
    }
  }
  
  /**
   * Handle mouse move events
   */
  onMouseMove(event) {
    // Don't process MEP hover if measurement tool is active
    if (this.isMeasurementToolActive()) {
      // Clear any existing hover state when measurement tool becomes active
      if (this.hoveredObject && this.callbacks.onHoverEnd) {
        this.callbacks.onHoverEnd(this.hoveredObject)
        this.hoveredObject = null
      }
      return
    }
    
    if (!this.config.enableHover && !this.callbacks.onMouseMove) return
    
    // Update mouse coordinates
    updateMouseCoordinates(event, this.domElement, this.mouse)
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    if (this.config.enableHover) {
      // Find intersected objects for hover
      const intersectedObject = this.findIntersectedObject()
      
      // Handle hover state changes
      if (intersectedObject !== this.hoveredObject) {
        // End previous hover
        if (this.hoveredObject && this.callbacks.onHoverEnd) {
          this.callbacks.onHoverEnd(this.hoveredObject)
        }
        
        // Start new hover
        this.hoveredObject = intersectedObject
        if (this.hoveredObject && this.callbacks.onHover) {
          this.callbacks.onHover(this.hoveredObject)
        }
      }
    }
    
    // Call custom mouse move handler
    if (this.callbacks.onMouseMove) {
      this.callbacks.onMouseMove(event, this.mouse)
    }
  }
  
  /**
   * Handle keyboard events
   */
  onKeyDown(event) {
    if (!this.config.enableKeyboardShortcuts) return
    
    // Only handle shortcuts when an object is selected (for most operations)
    const hasSelection = !!this.selectedObject
    
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (hasSelection && this.callbacks.onDelete) {
          event.preventDefault()
          console.log(`🗑️ Deleting ${this.componentType}`)
          this.callbacks.onDelete(this.selectedObject)
        }
        break
        
      case 'Escape':
        if (this.callbacks.onEscape) {
          console.log(`🔲 Escape pressed for ${this.componentType}`)
          this.callbacks.onEscape()
        } else if (hasSelection) {
          this.deselectObject()
        }
        break
        
      case 'd':
      case 'D':
        if ((event.ctrlKey || event.metaKey) && hasSelection && this.callbacks.onDuplicate) {
          event.preventDefault()
          console.log(`📋 Duplicating ${this.componentType}`)
          this.callbacks.onDuplicate(this.selectedObject)
        }
        break
        
      case 'c':
      case 'C':
        if ((event.ctrlKey || event.metaKey) && hasSelection && this.callbacks.onCopy) {
          event.preventDefault()
          console.log(`📄 Copying ${this.componentType}`)
          this.callbacks.onCopy(this.selectedObject)
        }
        break
        
      case 'v':
      case 'V':
        if ((event.ctrlKey || event.metaKey) && this.callbacks.onPaste) {
          event.preventDefault()
          console.log(`📋 Pasting ${this.componentType}`)
          this.callbacks.onPaste()
        }
        break
        
      case 'a':
      case 'A':
        if ((event.ctrlKey || event.metaKey) && this.callbacks.onSelectAll) {
          event.preventDefault()
          console.log(`🔘 Selecting all ${this.componentType}s`)
          this.callbacks.onSelectAll()
        }
        break
    }
    
    // Call custom key handler
    if (this.callbacks.onKeyDown) {
      this.callbacks.onKeyDown(event, this.selectedObject)
    }
  }
  
  /**
   * Find the closest intersected MEP object
   */
  findIntersectedObject() {
    if (!this.scene || !this.config.targetGroupName) {
      return null
    }
    
    // Find target group in scene
    const targetGroup = this.scene.getObjectByName(this.config.targetGroupName)
    if (!targetGroup) {
      return null
    }
    
    // Get intersections
    const intersects = this.raycaster.intersectObjects(targetGroup.children, true)
    if (intersects.length === 0) {
      return null
    }
    
    // Sort by distance and find the correct object type
    intersects.sort((a, b) => a.distance - b.distance)
    
    for (const intersect of intersects) {
      const object = this.findParentObjectOfType(intersect.object)
      if (object) {
        return object
      }
    }
    
    return null
  }
  
  /**
   * Find parent object of the specified type
   */
  findParentObjectOfType(object) {
    if (!this.config.objectType) {
      return object // Return any object if no type specified
    }
    
    let current = object
    while (current) {
      // Check if this object matches our criteria
      if (this.checkObjectType(current)) {
        return current
      }
      current = current.parent
    }
    
    return null
  }
  
  /**
   * Check if an object matches the target type
   */
  checkObjectType(object) {
    if (!this.config.objectType || !this.config.selectionAttribute) {
      return true
    }
    
    // Navigate to the attribute (e.g., 'userData.type')
    const attributeParts = this.config.selectionAttribute.split('.')
    let value = object
    
    for (const part of attributeParts) {
      value = value?.[part]
      if (value === undefined) {
        return false
      }
    }
    
    return value === this.config.objectType
  }
  
  /**
   * Select an object
   */
  selectObject(object) {
    if (object === this.selectedObject) {
      return // Already selected
    }
    
    // Deselect previous object
    this.deselectObject()
    
    // Select new object
    this.selectedObject = object
    console.log(`✅ Selected ${this.componentType}:`, object.name || object.id || 'unnamed')
    
    if (this.callbacks.onSelect) {
      this.callbacks.onSelect(object)
    }
  }
  
  /**
   * Deselect current object
   */
  deselectObject() {
    if (!this.selectedObject) {
      return
    }
    
    const previousObject = this.selectedObject
    this.selectedObject = null
    
    console.log(`❌ Deselected ${this.componentType}:`, previousObject.name || previousObject.id || 'unnamed')
    
    if (this.callbacks.onDeselect) {
      this.callbacks.onDeselect(previousObject)
    }
  }
  
  /**
   * Get current selection
   */
  getSelectedObject() {
    return this.selectedObject
  }
  
  /**
   * Get current hover object
   */
  getHoveredObject() {
    return this.hoveredObject
  }
  
  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  
  /**
   * Set callback for specific event
   */
  setCallback(eventName, callback) {
    this.callbacks[eventName] = callback
  }
  
  /**
   * Update configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * Force select an object (programmatically)
   */
  forceSelect(object) {
    this.selectObject(object)
  }
  
  /**
   * Force deselect (programmatically)
   */
  forceDeselect() {
    this.deselectObject()
  }
  
  /**
   * Check if an object is selected
   */
  isSelected(object) {
    return this.selectedObject === object
  }
  
  /**
   * Check if an object is hovered
   */
  isHovered(object) {
    return this.hoveredObject === object
  }
  
  /**
   * Dispose of the event handler
   */
  dispose() {
    this.removeEventListeners()
    this.selectedObject = null
    this.hoveredObject = null
    this.callbacks = {}
  }
}

/**
 * Factory function to create MEP-specific event handlers
 */
export function createMepEventHandler(componentType, scene, camera, renderer, orbitControls, options = {}) {
  const config = {
    duct: {
      targetGroupName: 'DuctGroup',
      objectType: 'duct',
      selectionAttribute: 'userData.type'
    },
    pipe: {
      targetGroupName: 'PipingGroup', 
      objectType: 'pipe',
      selectionAttribute: 'userData.type'
    },
    conduit: {
      targetGroupName: 'ConduitsGroup',
      objectType: 'conduit', 
      selectionAttribute: 'userData.type'
    },
    cableTray: {
      targetGroupName: 'CableTraysGroup',
      objectType: 'cableTray',
      selectionAttribute: 'userData.type'
    },
    tradeRack: {
      targetGroupName: 'TradeRackGroup',
      objectType: 'rack',
      selectionAttribute: 'userData.type'
    }
  }
  
  const componentConfig = config[componentType] || {}
  
  return new MepEventHandler({
    scene,
    camera,
    renderer,
    orbitControls,
    componentType,
    config: { ...componentConfig, ...options.config },
    callbacks: options.callbacks,
    autoSetup: options.autoSetup
  })
}