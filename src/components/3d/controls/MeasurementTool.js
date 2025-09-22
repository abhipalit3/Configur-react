/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

export class MeasurementTool {
  constructor(scene, camera, domElement, snapPoints = []) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.snapPoints = snapPoints || []
    this.points = []
    this.measurements = []
    this.labels = []
    this.selectedMeasurements = new Set() // Track selected measurements
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.active = false
    this.measurementId = 0
    this.clickHandler = null // Will be bound in enable()
    this.mouseDownPos = null // Track mouse down position for drag detection

    // Axis locking state
    this.axisLock = { x: false, y: false, z: false }

    // Button visual state (tracks which buttons should appear active)
    this.buttonActive = { x: false, y: false, z: false }

    // MeasurementTool initialized

    // Blue color scheme to match labels
    this.colors = {
      primary: 0x4A90E2,      // Blue for main measurement lines (matching label)
      secondary: 0x4A90E2,    // Same blue color for consistency
      hover: 0x4A90E2,        // Professional blue for hover
      accent: 0xFF6B6B,       // Subtle red for selected/active state
      text: '#2C3E50',        // Dark blue-gray text
      background: 'rgba(255, 255, 255, 0.95)', // Clean white background
      border: '#E1E8ED',      // Subtle border
      shadow: 'rgba(0, 0, 0, 0.3)' // Darker shadow for better visibility
    }

    // Enhanced hover markers with professional styling
    this.createHoverMarkers()
    this.createPreviewLine()
  }

  /**
   * Update snap points for measurement tool
   * This should be called whenever geometry changes (rack moves, MEP items added/removed)
   */
  updateSnapPoints(newSnapPoints) {
    console.log('🔧 MeasurementTool: Updating snap points', {
      oldCount: this.snapPoints.length,
      newCount: newSnapPoints.length
    })
    this.snapPoints = newSnapPoints || []
  }

  createHoverMarkers() {
    // Create vertex marker (crosshair with center dot)
    this.createVertexMarker()
    
    // Create edge marker (diamond shape)  
    this.createEdgeMarker()
    
    // Start animation
    this.animateHover()
  }

  createVertexMarker() {
    const markerGroup = new THREE.Group()
    
    // Main crosshair indicator for vertices
    const crosshairMaterial = new THREE.LineBasicMaterial({
      color: this.colors.hover,
      transparent: true,
      opacity: 0.9,
      linewidth: 3
    })
    
    // Horizontal line
    const hLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.12, 0, 0),
      new THREE.Vector3(0.12, 0, 0)
    ])
    const hLine = new THREE.Line(hLineGeometry, crosshairMaterial)
    
    // Vertical line
    const vLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.12, 0),
      new THREE.Vector3(0, 0.12, 0)
    ])
    const vLine = new THREE.Line(vLineGeometry, crosshairMaterial)
    
    // Center dot for vertices (larger, more prominent)
    const centerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 8),
      new THREE.MeshBasicMaterial({
        color: this.colors.hover,
        transparent: true,
        opacity: 1
      })
    )
    
    // Outer circle for vertices
    const outerCircle = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.065, 24),
      new THREE.MeshBasicMaterial({
        color: this.colors.primary,
        transparent: true,
        opacity: 0.4
      })
    )
    
    markerGroup.add(hLine, vLine, centerDot, outerCircle)
    markerGroup.visible = false
    this.vertexMarker = markerGroup
    this.scene.add(this.vertexMarker)
    
    // Store references for animation
    this.centerDot = centerDot
    this.outerCircle = outerCircle
  }

  createEdgeMarker() {
    const markerGroup = new THREE.Group()
    
    // Different style for edge points (diamond shape)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: this.colors.secondary, // Orange color for edges
      transparent: true,
      opacity: 0.9,
      linewidth: 3
    })
    
    // Diamond shape for edge markers
    const diamondGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.08, 0),
      new THREE.Vector3(0.08, 0, 0),
      new THREE.Vector3(0, -0.08, 0),
      new THREE.Vector3(-0.08, 0, 0),
      new THREE.Vector3(0, 0.08, 0)
    ])
    const diamondLine = new THREE.Line(diamondGeometry, edgeMaterial)
    
    // Center dot for edges (smaller, different color)
    const centerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 12, 8),
      new THREE.MeshBasicMaterial({
        color: this.colors.secondary,
        transparent: true,
        opacity: 1
      })
    )
    
    markerGroup.add(diamondLine, centerDot)
    markerGroup.visible = false
    this.edgeMarker = markerGroup
    this.scene.add(this.edgeMarker)
  }

  createPreviewLine() {
    // Create Hypar-style minimal preview line
    this.previewLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({
        color: this.colors.hover,
        dashSize: 0.1,
        gapSize: 0.05,
        transparent: true,
        opacity: 0.6,
        linewidth: 1
      })
    )
    this.previewLine.computeLineDistances()
    this.previewLine.visible = false
    this.scene.add(this.previewLine)
  }

  animateHover() {
    const animate = () => {
      if (this.centerDot && this.vertexMarker && this.vertexMarker.visible) {
        const time = Date.now() * 0.003
        // Subtle pulsing of the center dot
        const scale = 1 + Math.sin(time) * 0.15
        this.centerDot.scale.setScalar(scale)
        
        // Gentle opacity fade for outer circle
        if (this.outerCircle) {
          this.outerCircle.material.opacity = 0.3 + Math.sin(time) * 0.1
        }
      }
      requestAnimationFrame(animate)
    }
    animate()
  }

  setAxisLock(axisLock) {
    // DON'T let external calls override our carefully set axis locks
    // Only accept external axis lock changes if no buttons are currently active
    const hasButtonStates = this.buttonActive.x || this.buttonActive.y || this.buttonActive.z
    if (!hasButtonStates) {
      // Only set axis locks if no buttons are active (for arrow keys)
      this.axisLock = { ...axisLock }
      this.buttonActive = { ...axisLock }
    }
    // If buttons are active, ignore the external setAxisLock call entirely
    
    this.updateAxisLockVisuals()
  }

  toggleAxisLock(axis) {
    // Toggle the specified axis, clear others (exclusive locking)
    const wasLocked = this.axisLock[axis]
    this.axisLock = { x: false, y: false, z: false }
    this.axisLock[axis] = !wasLocked
    this.updateAxisLockVisuals()
    // console.log(`Axis ${axis.toUpperCase()} lock ${this.axisLock[axis] ? 'ON' : 'OFF'}`)
  }

  toggleButtonAndAxis(buttonId, axisToLock) {
    // Toggle the button state and corresponding axis lock
    const wasActive = this.buttonActive[buttonId]
    
    // Clear all button states and axis locks (exclusive)
    this.buttonActive = { x: false, y: false, z: false }
    this.axisLock = { x: false, y: false, z: false }
    
    // Set the new states
    this.buttonActive[buttonId] = !wasActive
    this.axisLock[axisToLock] = !wasActive
    
    this.updateAxisLockVisuals()
  }

  clearAxisLocks() {
    this.axisLock = { x: false, y: false, z: false }
    this.buttonActive = { x: false, y: false, z: false }
    this.updateAxisLockVisuals()
    // console.log('All axis locks cleared')
  }

  updateAxisLockVisuals() {
    // Update cursor to indicate axis lock status
    if (this.axisLock.x) {
      this.domElement.style.cursor = 'ew-resize' // Horizontal resize cursor for X-axis
    } else if (this.axisLock.y) {
      this.domElement.style.cursor = 'move' // Move cursor for Y-axis (depth)
    } else if (this.axisLock.z) {
      this.domElement.style.cursor = 'ns-resize' // Vertical resize cursor for Z-axis (height)
    } else {
      this.domElement.style.cursor = 'crosshair' // Default measurement cursor
    }
    
    // Update preview line color to indicate locked axis
    if (this.previewLine && this.points.length > 0) {
      let color = this.colors.primary
      if (this.axisLock.x) color = 0xff0000 // Red for X-axis
      else if (this.axisLock.y) color = 0x0000ff // Blue for Y-axis (depth)
      else if (this.axisLock.z) color = 0x00ff00 // Green for Z-axis (height)
      
      this.previewLine.material.color.setHex(color)
    }

    // Update controls panel button states
    this.updateControlsPanelState()
  }

  enable() {
    if (this.active) return
    // Use mousedown/mouseup pair to detect drag vs click
    this.mouseDownHandler = this.onMouseDown.bind(this)
    this.clickHandler = this.onMouseUp.bind(this)
    this.domElement.addEventListener('mousedown', this.mouseDownHandler, false)
    this.domElement.addEventListener('mouseup', this.clickHandler, false)
    this.active = true
    this.hoverHandler = this.onPointerMove.bind(this)   
    this.domElement.addEventListener('pointermove', this.hoverHandler)
    
    // Add keyboard shortcuts
    this.keyHandler = this.onKeyDown.bind(this)
    window.addEventListener('keydown', this.keyHandler)
    
    // Show cursor feedback
    this.domElement.style.cursor = 'crosshair'
    
    // Create and show measurement controls panel
    this.createControlsPanel()
    
  }

  disable() {
    if (!this.active) return
    this.domElement.removeEventListener('mousedown', this.mouseDownHandler)
    this.domElement.removeEventListener('mouseup', this.clickHandler)
    this.domElement.removeEventListener('pointermove', this.hoverHandler)
    window.removeEventListener('keydown', this.keyHandler)
    this.active = false
    
    // Reset cursor
    this.domElement.style.cursor = 'default'
    
    // Hide hover markers and preview
    if (this.vertexMarker) this.vertexMarker.visible = false
    if (this.edgeMarker) this.edgeMarker.visible = false
    if (this.previewLine) this.previewLine.visible = false
    this.hidePreviewLabel()
    
    // Hide measurement controls panel
    this.hideControlsPanel()
    
    // Clear current points
    this.points = []
    
  }

  onKeyDown(event) {
    if (!this.active) return
    
    switch(event.key.toLowerCase()) {
      case 'escape':
        // Priority order: Clear axis locks -> Cancel measurement -> Clear selection -> Deactivate tool
        if (this.axisLock.x || this.axisLock.y || this.axisLock.z) {
          this.clearAxisLocks()
        } else if (this.points.length > 0) {
          this.points = []
          this.previewLine.visible = false
        } else if (this.selectedMeasurements.size > 0) {
          this.clearSelection()
        } else {
          // No active measurement or selection, deactivate the tool
          this.disable()
          // Notify the parent component that the tool should be deactivated
          if (window.measurementToolInstance === this) {
            // Trigger the measurement tool button to update its state
            const event = new CustomEvent('measurementToolDeactivated')
            document.dispatchEvent(event)
          }
        }
        break
      
      // === AXIS LOCKING SHORTCUTS (Industry Standard) ===
      case 'x':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          this.toggleButtonAndAxis('x', 'x')
        }
        break
      case 'y':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          this.toggleButtonAndAxis('y', 'z')  // Y key locks to Z-axis
        }
        break
      case 'z':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          this.toggleButtonAndAxis('z', 'y')  // Z key locks to Y-axis
        }
        break
        
      // === ARROW KEYS FOR AXIS LOCKING (SnapTrude Style) ===
      case 'arrowleft':  // Left arrow = X-axis
        event.preventDefault()
        this.setAxisLock({ x: true, y: false, z: false })
        break
      case 'arrowup':    // Up arrow = Y-axis
        event.preventDefault()
        this.setAxisLock({ x: false, y: true, z: false })
        break
      case 'arrowright': // Right arrow = Z-axis
        event.preventDefault()
        this.setAxisLock({ x: false, y: false, z: true })
        break
      case 'arrowdown':  // Down arrow = Clear locks
        event.preventDefault()
        this.clearAxisLocks()
        break
        
      case 'c':
        if (event.ctrlKey || event.metaKey) {
          // Clear all measurements
          this.clearAll()
        }
        break
      case 'delete':
      case 'backspace':
        // Delete selected measurements, or last measurement if none selected
        if (this.selectedMeasurements.size > 0) {
          this.deleteSelectedMeasurements()
        } else if (this.measurements.length > 0) {
          const lastMeasurement = this.measurements[this.measurements.length - 1]
          this.removeMeasurement(lastMeasurement.id)
        }
        break
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          // Select all measurements
          event.preventDefault()
          this.selectAll()
        }
        break
    }
  }

  /**
   * Check if we're in 2D view based on the bottom panel view mode state
   */
  isIn2DView() {
    // Check the global view mode state from the bottom panel
    // This is set by the 2D/3D buttons in the bottom panel
    return window.currentViewMode === '2D'
  }

  /**
   * Filter snap points for 2D view - set all X values to 0 and filter unique points
   */
  filterSnapPointsFor2D(snapPoints) {
    if (!snapPoints || snapPoints.length === 0) return snapPoints
    
    const uniqueKeys = new Set()
    const filteredPoints = []
    const THREE = window.THREE
    
    for (const snapPoint of snapPoints) {
      // Clone and process the snap point with X=0
      if (snapPoint.type === 'edge' && snapPoint.start && snapPoint.end) {
        const start = snapPoint.start.clone ? snapPoint.start.clone() : new THREE.Vector3(0, snapPoint.start.y, snapPoint.start.z)
        const end = snapPoint.end.clone ? snapPoint.end.clone() : new THREE.Vector3(0, snapPoint.end.y, snapPoint.end.z)
        start.x = 0
        end.x = 0
        
        const key = `${start.y.toFixed(2)}_${start.z.toFixed(2)}_${end.y.toFixed(2)}_${end.z.toFixed(2)}`
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key)
          filteredPoints.push({ ...snapPoint, start, end })
        }
      } else {
        // Get the point reference
        const originalPoint = snapPoint.point || snapPoint
        let point
        
        // Create a new Vector3 with X=0
        if (originalPoint.clone) {
          point = originalPoint.clone()
        } else if (originalPoint.x !== undefined && originalPoint.y !== undefined && originalPoint.z !== undefined) {
          point = new THREE.Vector3(0, originalPoint.y, originalPoint.z)
        } else {
          continue // Skip invalid points
        }
        
        point.x = 0
        
        const key = `${point.y.toFixed(2)}_${point.z.toFixed(2)}`
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key)
          filteredPoints.push(snapPoint.point ? { ...snapPoint, point } : point)
        }
      }
    }
    
    return filteredPoints
  }

  findClosestSnapPoint(event) {
    // Validate inputs
    if (!event || !this.domElement || !this.camera) {
      console.warn('Missing dependencies for findClosestSnapPoint')
      return null
    }

    // Check if we have snap points
    if (!this.snapPoints || this.snapPoints.length === 0) {
      console.warn('No snap points available for measurement tool')
      return null
    }

    // Filter snap points for 2D view if applicable
    let activeSnapPoints = this.snapPoints
    const is2DView = this.isIn2DView()
    if (is2DView) {
      activeSnapPoints = this.filterSnapPointsFor2D(this.snapPoints)
      // console.log('🔌 2D View Active: Using filtered snap points for measurements')
    }

    const rect = this.domElement.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    let closestVertex = null
    let closestEdge = null
    let minVertexDist = Infinity
    let minEdgeDist = Infinity

    try {
      for (const snapPoint of activeSnapPoints) {
        const type = snapPoint.type || 'vertex'
        
        if (type === 'edge' && snapPoint.start && snapPoint.end) {
          // Handle edge snap points with start/end
          const start = snapPoint.start
          const end = snapPoint.end
          
          // Calculate closest point on the edge line to the mouse cursor
          const startScreen = start.clone().project(this.camera)
          const endScreen = end.clone().project(this.camera)
          
          const startX = (startScreen.x * 0.5 + 0.5) * this.domElement.clientWidth
          const startY = (-startScreen.y * 0.5 + 0.5) * this.domElement.clientHeight
          const endX = (endScreen.x * 0.5 + 0.5) * this.domElement.clientWidth
          const endY = (-endScreen.y * 0.5 + 0.5) * this.domElement.clientHeight
          
          // Find closest point on the line segment to mouse
          const lineVec = { x: endX - startX, y: endY - startY }
          const mouseVec = { x: mouseX - startX, y: mouseY - startY }
          const lineLength = Math.hypot(lineVec.x, lineVec.y)
          
          if (lineLength > 0) {
            const t = Math.max(0, Math.min(1, (mouseVec.x * lineVec.x + mouseVec.y * lineVec.y) / (lineLength * lineLength)))
            const closestScreenX = startX + t * lineVec.x
            const closestScreenY = startY + t * lineVec.y
            const dist = Math.hypot(mouseX - closestScreenX, mouseY - closestScreenY)
            
            if (dist < 15 && dist < minEdgeDist) {
              // Calculate corresponding 3D world point
              const worldPoint = start.clone().lerp(end, t)
              minEdgeDist = dist
              closestEdge = { point: worldPoint, type: 'edge', dist }
            }
          }
          
        } else {
          // Handle vertex snap points
          const worldPoint = snapPoint.point || snapPoint
          
          if (!worldPoint || !worldPoint.isVector3) {
            continue // Skip invalid points
          }
          
          const screenPoint = worldPoint.clone().project(this.camera)
          const x = (screenPoint.x * 0.5 + 0.5) * this.domElement.clientWidth
          const y = (-screenPoint.y * 0.5 + 0.5) * this.domElement.clientHeight
          const dist = Math.hypot(mouseX - x, mouseY - y)

          if (dist < 15) { // Reduced snap threshold for more precise snapping
            if (type === 'vertex' && dist < minVertexDist) {
              minVertexDist = dist
              closestVertex = { point: worldPoint.clone(), type: 'vertex', dist }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in findClosestSnapPoint:', error)
      return null
    }

    // Return the absolutely closest snap point, regardless of type
    if (closestVertex && closestEdge) {
      return minVertexDist <= minEdgeDist ? closestVertex : closestEdge
    } else if (closestVertex) {
      return closestVertex
    } else if (closestEdge) {
      return closestEdge
    }
    
    return null
  }

  onMouseDown(event) {
    // Store mouse down position for drag detection
    if (event.button === 0) {
      this.mouseDownPos = { x: event.clientX, y: event.clientY }
    }
  }

  onMouseUp(event) {
    console.log('🔧 MeasurementTool onMouseUp called')
    // Don't process if this is a right-click or middle-click (for panning)
    if (event.button !== 0) {
      console.log('🔧 Ignoring non-left click:', event.button)
      return
    }
    
    // Check if this was a drag operation (mouse moved more than 5 pixels)
    if (this.mouseDownPos) {
      const dragDistance = Math.sqrt(
        Math.pow(event.clientX - this.mouseDownPos.x, 2) + 
        Math.pow(event.clientY - this.mouseDownPos.y, 2)
      )
      this.mouseDownPos = null
      
      // If user dragged, don't process as a click (let pan work)
      if (dragDistance > 5) {
        console.log('🔧 Ignoring drag operation, distance:', dragDistance)
        return
      } else {
        console.log('🔧 Click detected, drag distance:', dragDistance)
      }
    }
    
    // First check if we clicked on an existing measurement
    const clickedMeasurement = this.findMeasurementAtClick(event)
    
    if (clickedMeasurement) {
      // Handle measurement selection
      event.stopPropagation() // Only stop propagation when we actually select something
      const isShiftPressed = event.shiftKey
      
      if (isShiftPressed) {
        // Multi-select mode: toggle selection
        if (this.selectedMeasurements.has(clickedMeasurement.id)) {
          this.selectedMeasurements.delete(clickedMeasurement.id)
          this.updateMeasurementHighlight(clickedMeasurement.id, false)
        } else {
          this.selectedMeasurements.add(clickedMeasurement.id)
          this.updateMeasurementHighlight(clickedMeasurement.id, true)
        }
      } else {
        // Single select mode: clear others and select this one
        this.clearSelection()
        this.selectedMeasurements.add(clickedMeasurement.id)
        this.updateMeasurementHighlight(clickedMeasurement.id, true)
      }
      
      return
    }
    
    // No measurement was clicked - clear selection unless shift is held
    if (!event.shiftKey && this.selectedMeasurements.size > 0) {
      this.clearSelection()
    }
    
    // Now check for snap points for measurement creation
    let snapResult = this.findClosestSnapPoint(event)
    let point = snapResult ? snapResult.point : null

    // Allow free measurements for both first and second points
    if (!snapResult) {
      // If no snap point found, use world position from mouse
      console.log('🔧 No snap point found, creating free measurement point')
      point = this.getWorldPositionFromMouse(event)
      console.log('🔧 Free measurement point created:', point)
    } else {
      console.log('🔧 Using snap point:', snapResult.point)
    }
    
    if (!point) {
      return
    }

    // Validate the point is a proper Vector3
    if (!point.isVector3) {
      console.error('Invalid point returned:', point)
      return
    }

    this.points.push(point)

    this.previewLine.visible = false

    if (this.points.length === 2) {
      this.drawMeasurement(this.points[0], this.points[1])
      this.points = []
    }
  }

  onPointerMove(event) {
    if (!this.active) return
    
    let point = null
    let isSnapPoint = false
    
    let snapType = null
    
    // For the first point, only use snap points
    if (this.points.length === 0) {
      const snapResult = this.findClosestSnapPoint(event)
      if (snapResult) {
        point = snapResult.point
        snapType = snapResult.type
        isSnapPoint = true
        
        // Throttled debug logging (only log occasionally)
        if (!this.lastLogTime || Date.now() - this.lastLogTime > 1000) {
          this.lastLogTime = Date.now()
        }
      }
    } else {
      // For the second point, prioritize axis-locked positioning if axis is locked
      const anyAxisLocked = this.axisLock.x || this.axisLock.y || this.axisLock.z
      
      if (anyAxisLocked) {
        // Use axis-constrained positioning - simplified approach
        const worldPoint = this.getWorldPositionFromMouse(event)
        const firstPoint = this.points[0]
        
        // Apply axis constraints consistently
        if (this.axisLock.x) {
          point = new THREE.Vector3(worldPoint.x, firstPoint.y, firstPoint.z)
        } else if (this.axisLock.y) {
          point = new THREE.Vector3(firstPoint.x, worldPoint.y, firstPoint.z)
        } else if (this.axisLock.z) {
          point = new THREE.Vector3(firstPoint.x, firstPoint.y, worldPoint.z)
        }
        
        // Still check for snap points but apply constraints to them too
        const snapResult = this.findClosestSnapPoint(event)
        if (snapResult && snapResult.point) {
          isSnapPoint = true
          snapType = snapResult.type
          const snapPoint = snapResult.point.clone()
          
          // Apply same axis constraints to snap points
          if (this.axisLock.x) {
            point = new THREE.Vector3(snapPoint.x, firstPoint.y, firstPoint.z)
          } else if (this.axisLock.y) {
            point = new THREE.Vector3(firstPoint.x, snapPoint.y, firstPoint.z)
          } else if (this.axisLock.z) {
            point = new THREE.Vector3(firstPoint.x, firstPoint.y, snapPoint.z)
          }
        }
      } else {
        // No axis lock, use original behavior
        const snapResult = this.findClosestSnapPoint(event)
        if (snapResult) {
          point = snapResult.point
          snapType = snapResult.type
          isSnapPoint = true
        } else {
          point = this.getWorldPositionFromMouse(event)
        }
      }
    }
    
    if (point) {
      // Show appropriate hover marker based on snap type
      if (isSnapPoint) {
        // Hide both markers first
        this.vertexMarker.visible = false
        this.edgeMarker.visible = false
        
        // Show the appropriate marker
        if (snapType === 'vertex') {
          this.vertexMarker.position.copy(point)
          this.vertexMarker.visible = true
        } else if (snapType === 'edge') {
          this.edgeMarker.position.copy(point)
          this.edgeMarker.visible = true
        }
      } else {
        this.vertexMarker.visible = false
        this.edgeMarker.visible = false
      }

      // Show preview line when we have the first point selected
      if (this.points.length === 1) {
        this.previewLine.geometry.setFromPoints([this.points[0], point])
        this.previewLine.computeLineDistances()
        this.previewLine.visible = true
        
        // Show temporary distance label
        this.updatePreviewLabel(this.points[0], point, event)
      } else {
        this.previewLine.visible = false
        this.hidePreviewLabel()
      }
    } else {
      this.vertexMarker.visible = false
      this.edgeMarker.visible = false
      this.previewLine.visible = false
    }
  }

  getWorldPositionFromMouse(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = this.domElement.getBoundingClientRect()
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Create raycaster from camera through mouse position
    this.raycaster.setFromCamera({ x: mouseX, y: mouseY }, this.camera)

    // If we have a first point, project onto a plane through that point
    if (this.points.length === 1) {
      const firstPoint = this.points[0]
      let intersection = new THREE.Vector3()
      
      // Check for axis locking
      const anyAxisLocked = this.axisLock.x || this.axisLock.y || this.axisLock.z
      
      if (anyAxisLocked) {
        // For axis locking, we need to use the original unconstrained plane intersection first
        const distanceToFirst = this.camera.position.distanceTo(firstPoint)
        const direction = new THREE.Vector3().subVectors(firstPoint, this.camera.position).normalize()
        const planePoint = this.camera.position.clone().add(direction.multiplyScalar(distanceToFirst))
        const plane = new THREE.Plane(direction, -direction.dot(planePoint))
        
        let worldPoint = new THREE.Vector3()
        if (this.raycaster.ray.intersectPlane(plane, worldPoint)) {
          // Apply axis constraints - much simpler and more intuitive approach
          if (this.axisLock.x) {
            // X-axis lock: only allow movement along X, keep Y and Z from first point
            return new THREE.Vector3(worldPoint.x, firstPoint.y, firstPoint.z)
          } else if (this.axisLock.y) {
            // Y-axis lock: only allow movement along Y, keep X and Z from first point
            return new THREE.Vector3(firstPoint.x, worldPoint.y, firstPoint.z)
          } else if (this.axisLock.z) {
            // Z-axis lock: only allow movement along Z, keep X and Y from first point
            return new THREE.Vector3(firstPoint.x, firstPoint.y, worldPoint.z)
          }
        }
        
        // Fallback if plane intersection fails
        return firstPoint.clone()
      } else {
        // Original behavior when no axis is locked
        const distanceToFirst = this.camera.position.distanceTo(firstPoint)
        const direction = new THREE.Vector3().subVectors(firstPoint, this.camera.position).normalize()
        const planePoint = this.camera.position.clone().add(direction.multiplyScalar(distanceToFirst))
        const plane = new THREE.Plane(direction, -direction.dot(planePoint))
        
        // Intersect ray with plane
        if (this.raycaster.ray.intersectPlane(plane, intersection)) {
          return intersection
        }
      }
    }

    // Fallback: intersect with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(groundPlane, intersection)) {
      return intersection
    }

    return null
  }

  updatePreviewLabel(p1, p2, event) {
    const distance = p1.distanceTo(p2)
    const formattedDistance = this.formatDistance(distance)
    
    if (!this.previewLabel) {
      this.previewLabel = document.createElement('div')
      this.previewLabel.className = 'measurement-preview-label'
      document.body.appendChild(this.previewLabel)
    }
    
    // Just show the distance without axis info (as requested by user)
    this.previewLabel.textContent = formattedDistance
    this.previewLabel.style.left = `${event.clientX + 10}px`
    this.previewLabel.style.top = `${event.clientY - 10}px`
    this.previewLabel.style.display = 'block'
  }

  hidePreviewLabel() {
    if (this.previewLabel) {
      this.previewLabel.style.display = 'none'
    }
  }

  drawMeasurement(p1, p2) {
    // Validate input points
    if (!p1 || !p2 || !p1.isVector3 || !p2.isVector3) {
      console.error('Invalid points provided to drawMeasurement:', p1, p2)
      return
    }
    
    const measurementId = ++this.measurementId
    const measurementGroup = new THREE.Group()
    measurementGroup.userData = { type: 'measurement', id: measurementId }
    
    try {
      const distance = p1.distanceTo(p2)
      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      
      // Create simple measurement line between points
      this.createMeasurementLine(p1, p2, measurementGroup)
      
      // Create end markers
      this.createEndMarkers(p1, p2, measurementGroup)
      
      // Create label positioned at midpoint
      this.createMeasurementLabel(p1, p2, distance, measurementId)
      
      this.scene.add(measurementGroup)
      this.measurements.push({
        id: measurementId,
        group: measurementGroup,
        p1: p1.clone(), 
        p2: p2.clone(), 
        distance,
        createdAt: new Date().toISOString()
      })
      
      // Update manifest with new measurement
      this.updateManifestMeasurements()
      
    } catch (error) {
      console.error('Error creating measurement:', error)
      this.scene.remove(measurementGroup)
    }
  }

  createMeasurementLine(p1, p2, group) {
    // Validate inputs
    if (!p1 || !p2 || !group) {
      console.error('Invalid parameters for createMeasurementLine:', p1, p2, group)
      return
    }
    
    // High-visibility measurement line
    const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2])
    const material = new THREE.LineBasicMaterial({ 
      color: this.colors.primary,
      linewidth: 3,
      transparent: true,
      opacity: 1.0
    })
    
    const line = new THREE.Line(geometry, material)
    line.renderOrder = 1000
    group.add(line)
    
    // Add subtle shadow line for better visibility against any background
    const shadowGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2])
    const shadowMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000,
      linewidth: 2,
      transparent: true,
      opacity: 0.1
    })
    const shadowLine = new THREE.Line(shadowGeometry, shadowMaterial)
    shadowLine.renderOrder = 999
    shadowLine.position.set(0.001, -0.001, 0.001) // Slight offset for shadow effect
    group.add(shadowLine)
  }

  createEndMarkers(p1, p2, group) {
    // Validate inputs
    if (!p1 || !p2 || !group) {
      console.error('Invalid parameters for createEndMarkers:', p1, p2, group)
      return
    }
    
    // Autodesk-style minimal end markers (small dots)
    const markerSize = 0.015  // Smaller size for cleaner look
    const points = [p1, p2]
    
    points.forEach((point, index) => {
      // Simple sphere marker (Autodesk style)
      const endMarker = new THREE.Mesh(
        new THREE.SphereGeometry(markerSize, 8, 6),
        new THREE.MeshBasicMaterial({ 
          color: this.colors.primary,  // Dark color matching the line
          transparent: false,
          opacity: 1.0
        })
      )
      endMarker.position.copy(point)
      endMarker.renderOrder = 1001
      group.add(endMarker)
    })
  }


  createMeasurementLabel(p1, p2, distance, measurementId) {
    // Position label at the midpoint of the measurement line
    const labelPos = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
    
    // Format distance with appropriate precision
    const formattedDistance = this.formatDistance(distance)
    
    const label = document.createElement('div')
    label.className = 'measurement-final-label'  // Use new clickable class
    label.dataset.measurementId = measurementId
    
    // Simple label content - just the distance value (same as preview)
    label.textContent = formattedDistance
    
    // Add mouseup handler for label selection (consistent with main handler)
    label.addEventListener('mouseup', (event) => {
      event.stopPropagation() // Prevent event from reaching the canvas
      
      // Only handle left clicks
      if (event.button !== 0) return
      
      const measurementId = parseInt(label.dataset.measurementId)
      const measurement = this.measurements.find(m => m.id === measurementId)
      
      if (measurement) {
        const isShiftPressed = event.shiftKey
        
        if (isShiftPressed) {
          // Multi-select mode: toggle selection
          if (this.selectedMeasurements.has(measurementId)) {
            this.selectedMeasurements.delete(measurementId)
            this.updateMeasurementHighlight(measurementId, false)
          } else {
            this.selectedMeasurements.add(measurementId)
            this.updateMeasurementHighlight(measurementId, true)
          }
        } else {
          // Single select mode: clear others and select this one
          this.clearSelection()
          this.selectedMeasurements.add(measurementId)
          this.updateMeasurementHighlight(measurementId, true)
        }
      }
    })
    
    // Prevent label from interfering with drag operations
    label.addEventListener('mousedown', (event) => {
      event.stopPropagation()
    })
    
    // Append to body for proper z-indexing
    document.body.appendChild(label)
    
    this.labels.push({ 
      element: label, 
      position: labelPos,
      id: measurementId,
      originalDistance: distance
    })
  }

  formatDistance(distance) {
    // Convert meters to feet and fractional inches
    const totalInches = distance * 39.3701 // meters to inches
    const feet = Math.floor(totalInches / 12)
    const remainingInches = totalInches - (feet * 12)
    
    // Handle fractional inches
    const wholeInches = Math.floor(remainingInches)
    const fraction = remainingInches - wholeInches
    
    // Convert decimal fraction to nearest common fraction
    const fractionString = this.decimalToFraction(fraction)
    
    // Format the output
    let result = ''
    
    if (feet > 0) {
      result += `${feet}'`
    }
    
    if (wholeInches > 0 || fractionString) {
      if (feet > 0) result += '-'
      
      if (wholeInches > 0) {
        result += wholeInches.toString()
      }
      
      if (fractionString) {
        if (wholeInches > 0) {
          result += ` ${fractionString}"`
        } else {
          result += `${fractionString}"`
        }
      } else if (wholeInches > 0) {
        result += '"'
      }
    } else if (feet === 0) {
      // Less than 1 inch
      if (fraction > 0) {
        result = `${fractionString}"`
      } else {
        result = '0"'
      }
    }
    
    return result || '0"'
  }

  decimalToFraction(decimal) {
    if (decimal < 0.01) return '' // Less than 1/64 inch
    
    // Common fractions used in construction (to 1/16 inch)
    const fractions = [
      { decimal: 15/16, text: '15/16' },
      { decimal: 7/8, text: '7/8' },
      { decimal: 13/16, text: '13/16' },
      { decimal: 3/4, text: '3/4' },
      { decimal: 11/16, text: '11/16' },
      { decimal: 5/8, text: '5/8' },
      { decimal: 9/16, text: '9/16' },
      { decimal: 1/2, text: '1/2' },
      { decimal: 7/16, text: '7/16' },
      { decimal: 3/8, text: '3/8' },
      { decimal: 5/16, text: '5/16' },
      { decimal: 1/4, text: '1/4' },
      { decimal: 3/16, text: '3/16' },
      { decimal: 1/8, text: '1/8' },
      { decimal: 1/16, text: '1/16' }
    ]
    
    // Find the closest fraction
    let closest = null
    let minDiff = Infinity
    
    for (const fraction of fractions) {
      const diff = Math.abs(decimal - fraction.decimal)
      if (diff < minDiff) {
        minDiff = diff
        closest = fraction
      }
    }
    
    // Only return fraction if it's reasonably close (within 1/32 inch tolerance)
    if (closest && minDiff < (1/32)) {
      return closest.text
    }
    
    return ''
  }

  calculateOptimalLabelPosition(basePosition) {
    // Smart label positioning to avoid overlaps
    const testPositions = [
      basePosition.clone().add(new THREE.Vector3(0, 0.2, 0)),
      basePosition.clone().add(new THREE.Vector3(0.15, 0.1, 0)),
      basePosition.clone().add(new THREE.Vector3(-0.15, 0.1, 0)),
      basePosition.clone().add(new THREE.Vector3(0, -0.1, 0))
    ]
    
    // For now, return the first position - could be enhanced with overlap detection
    return testPositions[0]
  }

  updateLabels() {
    // Update labels to follow their 3D positions smoothly
    for (const label of this.labels) {
      if (!label.element || !label.position) continue
      
      // Project 3D position to screen coordinates
      const pos = label.position.clone().project(this.camera)
      
      // Convert normalized device coordinates to screen pixels
      const rect = this.domElement.getBoundingClientRect()
      const x = rect.left + (pos.x * 0.5 + 0.5) * rect.width
      const y = rect.top + (-pos.y * 0.5 + 0.5) * rect.height
      
      // Update label position directly (no transitions for smooth following)
      label.element.style.left = `${x}px`
      label.element.style.top = `${y}px`
      
      // Hide labels that are behind the camera
      const isVisible = pos.z < 1
      label.element.style.opacity = isVisible ? '1' : '0'
    }
  }

  dispose() {
    this.disable()
    
    // Remove all measurements
    this.measurements.forEach(measurement => {
      this.scene.remove(measurement.group)
      measurement.group.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
    
    // Remove all labels
    this.labels.forEach(label => label.element.remove())
    
    // Remove preview label
    if (this.previewLabel) {
      this.previewLabel.remove()
      this.previewLabel = null
    }
    
    // Remove hover marker and preview line
    this.scene.remove(this.hoverMarker)
    this.scene.remove(this.previewLine)
    
    // Clean up
    this.points = []
    this.measurements = []
    this.labels = []
  }

  // Add method to clear all measurements
  clearAll() {
    this.measurements.forEach(measurement => {
      this.scene.remove(measurement.group)
    })
    this.labels.forEach(label => label.element.remove())
    this.hidePreviewLabel()
    this.measurements = []
    this.labels = []
    this.points = []
    this.selectedMeasurements.clear()
    
    // Update manifest with cleared measurements
    this.updateManifestMeasurements()
  }

  // Add method to remove specific measurement
  removeMeasurement(measurementId) {
    const measurementIndex = this.measurements.findIndex(m => m.id === measurementId)
    if (measurementIndex !== -1) {
      const measurement = this.measurements[measurementIndex]
      this.scene.remove(measurement.group)
      this.measurements.splice(measurementIndex, 1)
    }
    
    const labelIndex = this.labels.findIndex(l => l.id === measurementId)
    if (labelIndex !== -1) {
      this.labels[labelIndex].element.remove()
      this.labels.splice(labelIndex, 1)
    }
    
    // Update manifest with updated measurements
    this.updateManifestMeasurements()
    
    // Remove from selection if it was selected
    this.selectedMeasurements.delete(measurementId)
  }

  // Find measurement at click position using raycasting
  findMeasurementAtClick(event) {
    const rect = this.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(mouse, this.camera)
    
    // Set a smaller threshold for line picking (default is too sensitive)
    this.raycaster.params.Line = { threshold: 0.05 } // Smaller threshold = more precise
    
    // Check intersection with measurement groups
    const intersectableObjects = []
    this.measurements.forEach(measurement => {
      measurement.group.traverse(child => {
        if (child.isMesh || child.isLine) {
          intersectableObjects.push({ object: child, measurementId: measurement.id })
        }
      })
    })
    
    if (intersectableObjects.length === 0) {
      return null // No measurements to check
    }
    
    const intersects = this.raycaster.intersectObjects(intersectableObjects.map(item => item.object))
    
    if (intersects.length > 0) {
      // Filter to only consider close intersections
      const validIntersects = intersects.filter(intersect => {
        // Only consider intersections within a reasonable distance
        return intersect.distance < 100 // Adjust this value as needed
      })
      
      if (validIntersects.length > 0) {
        const intersectedObject = validIntersects[0].object
        const item = intersectableObjects.find(item => item.object === intersectedObject)
        if (item) {
          return this.measurements.find(m => m.id === item.measurementId)
        }
      }
    }
    
    return null
  }

  // Update visual highlight for measurement selection
  updateMeasurementHighlight(measurementId, isSelected) {
    const measurement = this.measurements.find(m => m.id === measurementId)
    if (!measurement) return

    const highlightColor = isSelected ? 0x4A90E2 : null // Professional blue for selection
    const opacity = isSelected ? 1.0 : 1.0

    measurement.group.traverse(child => {
      if (child.isMesh && child.material) {
        if (isSelected) {
          // Store original color if not already stored
          if (!child.userData.originalColor) {
            child.userData.originalColor = child.material.color.getHex()
          }
          child.material.color.setHex(highlightColor)
          child.material.opacity = opacity
        } else {
          // Restore original color
          if (child.userData.originalColor !== undefined) {
            child.material.color.setHex(child.userData.originalColor)
          }
          child.material.opacity = opacity
        }
      } else if (child.isLine && child.material) {
        if (isSelected) {
          if (!child.userData.originalColor) {
            child.userData.originalColor = child.material.color.getHex()
          }
          child.material.color.setHex(highlightColor)
          child.material.opacity = opacity
        } else {
          if (child.userData.originalColor !== undefined) {
            child.material.color.setHex(child.userData.originalColor)
          }
          child.material.opacity = opacity
        }
      }
    })

    // Highlight the label as well
    const label = this.labels.find(l => l.id === measurementId)
    if (label && label.element) {
      if (isSelected) {
        // Add selected class
        label.element.classList.add('selected')
      } else {
        // Remove selected class
        label.element.classList.remove('selected')
      }
    }
  }

  // Clear all selections
  clearSelection() {
    this.selectedMeasurements.forEach(measurementId => {
      this.updateMeasurementHighlight(measurementId, false)
    })
    this.selectedMeasurements.clear()
  }

  // Select all measurements
  selectAll() {
    this.measurements.forEach(measurement => {
      this.selectedMeasurements.add(measurement.id)
      this.updateMeasurementHighlight(measurement.id, true)
    })
  }

  // Delete all selected measurements
  deleteSelectedMeasurements() {
    const selectedIds = Array.from(this.selectedMeasurements)
    selectedIds.forEach(id => {
      this.removeMeasurement(id)
    })
    this.selectedMeasurements.clear()
  }
  
  // Update manifest with current measurements
  updateManifestMeasurements() {
    if (typeof window !== 'undefined' && window.updateManifestMeasurements) {
      const measurementData = this.measurements.map(measurement => ({
        id: measurement.id,
        distance: measurement.distance,
        p1: {
          x: measurement.p1.x,
          y: measurement.p1.y,
          z: measurement.p1.z
        },
        p2: {
          x: measurement.p2.x,
          y: measurement.p2.y,
          z: measurement.p2.z
        },
        createdAt: measurement.createdAt || new Date().toISOString()
      }))
      
      window.updateManifestMeasurements(measurementData)
    }
  }

  // Restore measurements from manifest/localStorage on initialization
  restoreFromManifest() {
    try {
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const savedMeasurements = manifest.measurements?.items || []
      
      // Measurements restored from manifest
      
      if (savedMeasurements.length > 0) {
        savedMeasurements.forEach(savedMeasurement => {
          const p1 = new THREE.Vector3(savedMeasurement.p1.x, savedMeasurement.p1.y, savedMeasurement.p1.z)
          const p2 = new THREE.Vector3(savedMeasurement.p2.x, savedMeasurement.p2.y, savedMeasurement.p2.z)
          
          // Restore the measurement using the same logic as drawMeasurement
          const measurementId = savedMeasurement.id
          this.measurementId = Math.max(this.measurementId, measurementId) // Ensure IDs don't conflict
          
          const measurementGroup = new THREE.Group()
          measurementGroup.userData = { type: 'measurement', id: measurementId }
          
          const distance = savedMeasurement.distance
          
          // Create all measurement components
          this.createMeasurementLine(p1, p2, measurementGroup)
          this.createEndMarkers(p1, p2, measurementGroup)
          this.createMeasurementLabel(p1, p2, distance, measurementId)
          
          this.scene.add(measurementGroup)
          this.measurements.push({
            id: measurementId,
            group: measurementGroup,
            p1: p1.clone(),
            p2: p2.clone(),
            distance,
            createdAt: savedMeasurement.createdAt
          })
        })
        
      }
    } catch (error) {
      console.error('❌ Error restoring measurements from manifest:', error)
    }
  }

  createControlsPanel() {
    // Check if a measurement controls panel already exists in the DOM
    const existingPanel = document.querySelector('.measurement-controls-panel')
    if (existingPanel) {
      // console.log('Measurement controls panel already exists, modifying existing buttons')
      this.modifyExistingControlsPanel(existingPanel)
      return
    }
    
    // Don't create if already exists
    if (this.controlsPanel) return

    // Create the measurement controls panel
    this.controlsPanel = document.createElement('div')
    this.controlsPanel.className = 'measurement-controls-panel'
    Object.assign(this.controlsPanel.style, {
      position: 'absolute',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgb(225, 232, 237)',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
      zIndex: '1000',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backdropFilter: 'blur(8px)',
      minWidth: '260px'
    })

    // Title
    const title = document.createElement('div')
    title.textContent = 'Measurement Controls'
    Object.assign(title.style, {
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '8px',
      color: 'rgb(44, 62, 80)',
      textAlign: 'center'
    })
    this.controlsPanel.appendChild(title)

    // Axis Lock Section
    const axisSection = document.createElement('div')
    axisSection.style.marginBottom = '8px'
    
    const axisLabel = document.createElement('div')
    axisLabel.textContent = 'Axis Lock:'
    Object.assign(axisLabel.style, {
      fontSize: '11px',
      fontWeight: '500',
      marginBottom: '4px',
      color: 'rgb(85, 85, 85)',
      textAlign: 'center'
    })
    axisSection.appendChild(axisLabel)

    // Axis Buttons Container
    const buttonsContainer = document.createElement('div')
    Object.assign(buttonsContainer.style, {
      display: 'flex',
      gap: '6px',
      justifyContent: 'center',
      marginBottom: '8px'
    })

    // Create X, Y, Z buttons
    this.axisButtons = {}
    
    // X Button
    this.axisButtons.x = this.createAxisButton('X', () => this.toggleButtonAndAxis('x', 'x'))
    buttonsContainer.appendChild(this.axisButtons.x)
    
    // Y Button - NOTE: This triggers Z-axis lock (swapped functionality)
    this.axisButtons.y = this.createAxisButton('Y', () => this.toggleButtonAndAxis('y', 'z'))
    buttonsContainer.appendChild(this.axisButtons.y)
    
    // Z Button - NOTE: This triggers Y-axis lock (swapped functionality)  
    this.axisButtons.z = this.createAxisButton('Z', () => this.toggleButtonAndAxis('z', 'y'))
    buttonsContainer.appendChild(this.axisButtons.z)

    axisSection.appendChild(buttonsContainer)
    this.controlsPanel.appendChild(axisSection)

    // Clear All Button
    const clearAllContainer = document.createElement('div')
    clearAllContainer.style.textAlign = 'center'
    
    const clearAllButton = document.createElement('button')
    clearAllButton.textContent = 'Clear All'
    Object.assign(clearAllButton.style, {
      padding: '6px 12px',
      border: '1px solid rgb(255, 68, 68)',
      borderRadius: '4px',
      background: 'white',
      color: 'rgb(255, 68, 68)',
      fontWeight: '500',
      cursor: 'pointer',
      transition: '0.2s',
      fontSize: '11px'
    })
    
    clearAllButton.addEventListener('click', () => this.clearAxisLocks())
    clearAllButton.addEventListener('mouseenter', () => {
      clearAllButton.style.background = 'rgb(255, 68, 68)'
      clearAllButton.style.color = 'white'
    })
    clearAllButton.addEventListener('mouseleave', () => {
      clearAllButton.style.background = 'white'
      clearAllButton.style.color = 'rgb(255, 68, 68)'
    })
    
    clearAllContainer.appendChild(clearAllButton)
    this.controlsPanel.appendChild(clearAllContainer)

    // Add to DOM
    document.body.appendChild(this.controlsPanel)

    // Update button states
    this.updateControlsPanelState()
  }

  createAxisButton(label, onClick) {
    const button = document.createElement('button')
    button.textContent = label
    Object.assign(button.style, {
      width: '30px',
      height: '30px',
      border: '1px solid rgb(221, 221, 221)',
      borderRadius: '4px',
      background: 'white',
      color: 'rgb(51, 51, 51)',
      fontWeight: '600',
      cursor: 'pointer',
      transition: '0.2s',
      fontSize: '12px'
    })

    button.addEventListener('click', onClick)
    return button
  }

  updateControlsPanelState() {
    if (!this.axisButtons) return

    // Visual state should match which button was clicked
    this.updateAxisButtonState(this.axisButtons.x, this.buttonActive.x)
    this.updateAxisButtonState(this.axisButtons.y, this.buttonActive.y)
    this.updateAxisButtonState(this.axisButtons.z, this.buttonActive.z)
  }

  updateAxisButtonState(button, isLocked) {
    if (isLocked) {
      button.style.border = '1px solid rgb(0, 212, 255)'
      button.style.background = 'rgb(0, 212, 255)'
      button.style.color = 'white'
    } else {
      button.style.border = '1px solid rgb(221, 221, 221)'
      button.style.background = 'white'
      button.style.color = 'rgb(51, 51, 51)'
    }
  }

  modifyExistingControlsPanel(existingPanel) {
    // Find all buttons in the existing panel
    const buttons = existingPanel.querySelectorAll('button')
    
    // Look for X, Y, Z buttons by their text content
    buttons.forEach(button => {
      const buttonText = button.textContent.trim()
      
      if (buttonText === 'X') {
        // X button works normally
        button.onclick = () => this.toggleButtonAndAxis('x', 'x')
      } else if (buttonText === 'Y') {
        // Y button should trigger Z-axis lock (swapped functionality)
        button.onclick = () => this.toggleButtonAndAxis('y', 'z')
      } else if (buttonText === 'Z') {
        // Z button should trigger Y-axis lock (swapped functionality)
        button.onclick = () => this.toggleButtonAndAxis('z', 'y')
      } else if (buttonText === 'Clear All') {
        // Clear all button
        button.onclick = () => this.clearAxisLocks()
      }
    })
    
    // Store reference to the existing panel and buttons for state updates
    this.controlsPanel = existingPanel
    this.axisButtons = {
      x: Array.from(buttons).find(btn => btn.textContent.trim() === 'X'),
      y: Array.from(buttons).find(btn => btn.textContent.trim() === 'Y'),
      z: Array.from(buttons).find(btn => btn.textContent.trim() === 'Z')
    }
    
    // console.log('Modified existing controls panel with Y/Z swapped functionality')
    
    // Update button states to reflect current axis locks
    this.updateControlsPanelState()
  }

  hideControlsPanel() {
    // For existing React-managed panels, we don't remove them, just clear our references
    if (this.controlsPanel && this.controlsPanel.querySelector) {
      // This is likely a React-managed panel, don't remove it
      // console.log('Not removing React-managed controls panel')
      this.controlsPanel = null
      this.axisButtons = null
      return
    }
    
    // Only remove panels that we created ourselves
    if (this.controlsPanel) {
      try {
        // Check if the element still exists and has a parent before removing
        if (this.controlsPanel && this.controlsPanel.parentNode) {
          this.controlsPanel.parentNode.removeChild(this.controlsPanel)
        }
      } catch (error) {
        // Silently handle the case where React has already removed the element
        console.warn('Controls panel already removed:', error.message)
      }
      this.controlsPanel = null
      this.axisButtons = null
    }
  }

}
