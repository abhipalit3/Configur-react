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
    this.clickHandler = this.onClick.bind(this)
    
    // Axis locking state
    this.axisLock = { x: false, y: false, z: false }
    
    // MeasurementTool initialized
    
    // High-visibility professional colors for measurement lines
    this.colors = {
      primary: 0x00D4FF,      // Bright cyan for main measurement lines - highly visible
      secondary: 0xFF6B35,    // Orange for dimension/extension lines - contrasting visibility
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
    this.axisLock = { ...axisLock }
    // Axis lock updated
  }

  enable() {
    if (this.active) return
    this.domElement.addEventListener('click', this.clickHandler)
    this.active = true
    this.hoverHandler = this.onPointerMove.bind(this)   
    this.domElement.addEventListener('pointermove', this.hoverHandler)
    
    // Add keyboard shortcuts
    this.keyHandler = this.onKeyDown.bind(this)
    window.addEventListener('keydown', this.keyHandler)
    
    // Show cursor feedback
    this.domElement.style.cursor = 'crosshair'
    
  }

  disable() {
    if (!this.active) return
    this.domElement.removeEventListener('click', this.clickHandler)
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
    
    // Clear current points
    this.points = []
    
  }

  onKeyDown(event) {
    if (!this.active) return
    
    switch(event.key.toLowerCase()) {
      case 'escape':
        // Priority order: Cancel measurement -> Clear selection -> Deactivate tool
        if (this.points.length > 0) {
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

    const rect = this.domElement.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    let closestVertex = null
    let closestEdge = null
    let minVertexDist = Infinity
    let minEdgeDist = Infinity

    try {
      for (const snapPoint of this.snapPoints) {
        const type = snapPoint.type || 'vertex'
        const worldPoint = snapPoint.point || snapPoint
        
        if (!worldPoint || !worldPoint.isVector3) {
          continue // Skip invalid points
        }
        
        const screenPoint = worldPoint.clone().project(this.camera)
        const x = (screenPoint.x * 0.5 + 0.5) * this.domElement.clientWidth
        const y = (-screenPoint.y * 0.5 + 0.5) * this.domElement.clientHeight
        const dist = Math.hypot(mouseX - x, mouseY - y)

        if (dist < 30) { // Increased snap threshold for better edge detection
          if (type === 'vertex' && dist < minVertexDist) {
            minVertexDist = dist
            closestVertex = { point: worldPoint.clone(), type: 'vertex', dist }
          } else if (type === 'edge' && dist < minEdgeDist) {
            minEdgeDist = dist
            closestEdge = { point: worldPoint.clone(), type: 'edge', dist }
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



  onClick(event) {
    // First try to find a snap point for measurement creation
    let snapResult = this.findClosestSnapPoint(event)
    let point = snapResult ? snapResult.point : null
    
    // If this is the first point, it MUST snap to a snap point
    if (this.points.length === 0) {
      if (!snapResult) {
        // No snap point found, check if we clicked on an existing measurement for selection
        const clickedMeasurement = this.findMeasurementAtClick(event)
        
        if (clickedMeasurement) {
          // Handle measurement selection
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
        
        return
      }
    } else {
      // For the second point, allow fallback to world position if no snap point
      if (!snapResult) {
        point = this.getWorldPositionFromMouse(event)
      }
    }
    
    // If not clicking on a measurement and not placing points, clear selection (unless Shift is pressed)
    if (this.points.length === 0 && !event.shiftKey) {
      this.clearSelection()
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
        // Use axis-constrained positioning first
        point = this.getWorldPositionFromMouse(event)
        // Still check for snap points but with lower priority
        const snapResult = this.findClosestSnapPoint(event)
        if (snapResult && snapResult.point) {
          isSnapPoint = true
          snapType = snapResult.type
          // Apply axis constraints to the snap point too
          const snapPoint = snapResult.point.clone()
          if (this.axisLock.x) snapPoint.x = this.points[0].x
          if (this.axisLock.y) snapPoint.y = this.points[0].y
          if (this.axisLock.z) snapPoint.z = this.points[0].z
          point = snapPoint
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
        // Apply axis locking - create axis-constrained measurement
        let targetPoint = new THREE.Vector3()
        
        // Get mouse ray direction
        const rayDirection = this.raycaster.ray.direction.clone()
        const rayOrigin = this.raycaster.ray.origin.clone()
        
        // Project mouse ray onto the appropriate axis/plane
        if (this.axisLock.x && !this.axisLock.y && !this.axisLock.z) {
          // Lock to X-axis: measurement along X only
          // Find intersection with plane perpendicular to X-axis passing through first point
          const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -firstPoint.x)
          if (this.raycaster.ray.intersectPlane(plane, targetPoint)) {
            targetPoint.y = firstPoint.y  // Lock Y
            targetPoint.z = firstPoint.z  // Lock Z
          } else {
            // Fallback: project ray direction onto X-axis
            targetPoint.copy(firstPoint)
            targetPoint.x = rayOrigin.x + rayDirection.x * 100 // Extend along X
          }
        } else if (this.axisLock.y && !this.axisLock.x && !this.axisLock.z) {
          // Lock to Y-axis: measurement along Y only
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -firstPoint.y)
          if (this.raycaster.ray.intersectPlane(plane, targetPoint)) {
            targetPoint.x = firstPoint.x  // Lock X
            targetPoint.z = firstPoint.z  // Lock Z
          } else {
            targetPoint.copy(firstPoint)
            targetPoint.y = rayOrigin.y + rayDirection.y * 100
          }
        } else if (this.axisLock.z && !this.axisLock.x && !this.axisLock.y) {
          // Lock to Z-axis: measurement along Z only
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -firstPoint.z)
          if (this.raycaster.ray.intersectPlane(plane, targetPoint)) {
            targetPoint.x = firstPoint.x  // Lock X
            targetPoint.y = firstPoint.y  // Lock Y
          } else {
            targetPoint.copy(firstPoint)
            targetPoint.z = rayOrigin.z + rayDirection.z * 100
          }
        } else {
          // Fallback to original plane intersection if multiple axes locked
          const distanceToFirst = this.camera.position.distanceTo(firstPoint)
          const direction = new THREE.Vector3().subVectors(firstPoint, this.camera.position).normalize()
          const planePoint = this.camera.position.clone().add(direction.multiplyScalar(distanceToFirst))
          const plane = new THREE.Plane(direction, -direction.dot(planePoint))
          
          if (this.raycaster.ray.intersectPlane(plane, targetPoint)) {
            if (this.axisLock.x) targetPoint.x = firstPoint.x
            if (this.axisLock.y) targetPoint.y = firstPoint.y  
            if (this.axisLock.z) targetPoint.z = firstPoint.z
          }
        }
        
        return targetPoint
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
      const direction = new THREE.Vector3().subVectors(p2, p1).normalize()
      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      
      // Create professional measurement line with gradient effect
      this.createMeasurementLine(p1, p2, measurementGroup)
      
      // Create professional end markers
      this.createEndMarkers(p1, p2, measurementGroup)
      
      // Create dimension extension lines
      this.createExtensionLines(p1, p2, direction, measurementGroup)
      
      // Create professional label positioned on dimension line
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
    
    // Hypar-style minimal end markers
    const markerSize = 0.02
    const points = [p1, p2]
    
    points.forEach((point, index) => {
      const markerGroup = new THREE.Group()
      
      // High-visibility circular end marker
      const endMarker = new THREE.Mesh(
        new THREE.CircleGeometry(markerSize, 12),
        new THREE.MeshBasicMaterial({ 
          color: this.colors.primary,
          transparent: false,
          opacity: 1.0,
          side: THREE.DoubleSide
        })
      )
      endMarker.position.copy(point)
      endMarker.lookAt(this.camera.position)
      
      // Subtle border ring
      const borderRing = new THREE.Mesh(
        new THREE.RingGeometry(markerSize - 0.002, markerSize, 16),
        new THREE.MeshBasicMaterial({ 
          color: 0x000000,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        })
      )
      borderRing.position.copy(point)
      borderRing.lookAt(this.camera.position)
      
      markerGroup.add(endMarker, borderRing)
      markerGroup.renderOrder = 1001
      group.add(markerGroup)
    })
  }

  createExtensionLines(p1, p2, direction, group) {
    // Validate inputs
    if (!p1 || !p2 || !direction || !group) {
      console.error('Invalid parameters for createExtensionLines:', p1, p2, direction, group)
      return
    }
    
    try {
      // Create Hypar-style dimension extension lines
      // Calculate perpendicular direction for dimension offset
      const up = new THREE.Vector3(0, 1, 0)
      const perpendicular = new THREE.Vector3().crossVectors(direction, up).normalize()
      
      // If direction is vertical, use different perpendicular
      if (Math.abs(direction.dot(up)) > 0.9) {
        perpendicular.set(1, 0, 0).cross(direction).normalize()
      }
      
      const dimensionOffset = 0.3 // Distance from main line
      const extensionLength = 0.05 // Short extension beyond dimension line
      
      // Create dimension line parallel to measurement line but offset
      const dimP1 = p1.clone().add(perpendicular.clone().multiplyScalar(dimensionOffset))
      const dimP2 = p2.clone().add(perpendicular.clone().multiplyScalar(dimensionOffset))
      
      // Main dimension line with high visibility
      const dimGeometry = new THREE.BufferGeometry().setFromPoints([dimP1, dimP2])
      const dimMaterial = new THREE.LineBasicMaterial({
        color: this.colors.secondary,
        transparent: true,
        opacity: 1.0,
        linewidth: 2
      })
      const dimLine = new THREE.Line(dimGeometry, dimMaterial)
      dimLine.renderOrder = 998
      group.add(dimLine)
      
      // Extension lines from measurement points to dimension line
      const processPoint = (point, dimPoint) => {
        if (!point || !point.isVector3) return
        
        const extStart = point.clone()
        const extEnd = dimPoint.clone().add(perpendicular.clone().multiplyScalar(extensionLength))
        
        const extGeometry = new THREE.BufferGeometry().setFromPoints([extStart, extEnd])
        const extMaterial = new THREE.LineBasicMaterial({
          color: this.colors.secondary,
          transparent: true,
          opacity: 0.9,
          linewidth: 1.5
        })
        
        const extLine = new THREE.Line(extGeometry, extMaterial)
        extLine.renderOrder = 998
        group.add(extLine)
      }
      
      // Create extension lines
      processPoint(p1, dimP1)
      processPoint(p2, dimP2)
      
      // Store dimension line position for label placement
      this.lastDimensionLine = {
        p1: dimP1,
        p2: dimP2,
        center: dimP1.clone().add(dimP2).multiplyScalar(0.5)
      }
      
    } catch (error) {
      console.error('Error creating extension lines:', error)
    }
  }

  createMeasurementLabel(p1, p2, distance, measurementId) {
    // Use the dimension line center position if available, otherwise fall back to measurement line
    const labelPos = this.lastDimensionLine ? 
      this.lastDimensionLine.center.clone() : 
      new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
    
    // Format distance with appropriate precision
    const formattedDistance = this.formatDistance(distance)
    
    const label = document.createElement('div')
    label.className = 'measurement-label'
    label.dataset.measurementId = measurementId
    
    // Hypar-style label content with feet and inches
    label.innerHTML = `
      <div class="measurement-value">${formattedDistance}</div>
    `
    
    // Static styling with no animations
    Object.assign(label.style, {
      position: 'absolute',
      opacity: '1',
      transform: 'translate(-50%, -50%)',
      transition: 'none', // Remove all transitions
      cursor: 'pointer' // Make labels clickable
    })
    
    // Add click handler for label selection
    label.addEventListener('click', (event) => {
      event.stopPropagation() // Prevent event from reaching the canvas
      
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
    
    // Check intersection with measurement groups
    const intersectableObjects = []
    this.measurements.forEach(measurement => {
      measurement.group.traverse(child => {
        if (child.isMesh || child.isLine) {
          intersectableObjects.push({ object: child, measurementId: measurement.id })
        }
      })
    })
    
    const intersects = this.raycaster.intersectObjects(intersectableObjects.map(item => item.object))
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object
      const item = intersectableObjects.find(item => item.object === intersectedObject)
      if (item) {
        return this.measurements.find(m => m.id === item.measurementId)
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

    // Highlight the label as well with matching blue theme
    const label = this.labels.find(l => l.id === measurementId)
    if (label && label.element) {
      if (isSelected) {
        label.element.style.setProperty('background-color', '#4A90E2', 'important')
        label.element.style.setProperty('border-color', '#4A90E2', 'important')
        label.element.style.setProperty('color', '#FFFFFF', 'important')
        label.element.style.setProperty('font-weight', 'bold', 'important')
        label.element.style.setProperty('box-shadow', '0 0 12px rgba(74, 144, 226, 0.5)', 'important')
        label.element.style.cursor = 'pointer'
        
        // Also update the value text inside with !important
        const valueElement = label.element.querySelector('.measurement-value')
        if (valueElement) {
          valueElement.style.setProperty('color', '#FFFFFF', 'important')
        }
        
        // Update all text elements to ensure white color
        const allTextElements = label.element.querySelectorAll('*')
        allTextElements.forEach(element => {
          element.style.setProperty('color', '#FFFFFF', 'important')
        })
      } else {
        label.element.style.setProperty('background-color', this.colors.background, 'important')
        label.element.style.setProperty('border-color', this.colors.border, 'important')
        label.element.style.setProperty('color', this.colors.text, 'important')
        label.element.style.setProperty('font-weight', 'normal', 'important')
        label.element.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)', 'important')
        label.element.style.cursor = 'pointer'
        
        // Restore original value text color
        const valueElement = label.element.querySelector('.measurement-value')
        if (valueElement) {
          valueElement.style.setProperty('color', '#1A202C', 'important')
        }
        
        // Restore original colors for all text elements
        const allTextElements = label.element.querySelectorAll('*')
        allTextElements.forEach(element => {
          element.style.setProperty('color', '#1A202C', 'important')
        })
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
          const direction = new THREE.Vector3().subVectors(p2, p1).normalize()
          
          // Create all measurement components
          this.createMeasurementLine(p1, p2, measurementGroup)
          this.createEndMarkers(p1, p2, measurementGroup)
          this.createExtensionLines(p1, p2, direction, measurementGroup)
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

}
