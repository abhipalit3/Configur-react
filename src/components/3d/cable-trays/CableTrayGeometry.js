/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { extractSnapPoints } from '../core/extractGeometrySnapPoints.js'

/**
 * CableTrayGeometry - Manages 3D geometry and materials for cable trays
 */
export class CableTrayGeometry {
  constructor() {
    this.materials = this.createMaterials()
    this.snapPoints = null // Will be set by three-scene
  }

  /**
   * Set reference to snap points array from measurement tool
   */
  setSnapPoints(snapPoints) {
    this.snapPoints = snapPoints
  }

  /**
   * Create materials for different cable tray types
   */
  createMaterials() {
    return {
      ladder: new THREE.MeshLambertMaterial({
        color: 0x4169E1, // Royal blue for ladder type - more distinct
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      solidBottom: new THREE.MeshLambertMaterial({
        color: 0x32CD32, // Lime green for solid bottom - very distinct
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      wireMesh: new THREE.MeshLambertMaterial({
        color: 0xFF6347, // Tomato red for wire mesh - very distinct
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        wireframe: false
      })
    }
  }

  /**
   * Create cable tray geometry based on type, width, height, and length
   */
  createCableTrayGeometry(width, height, length, trayType = 'ladder') {
    const group = new THREE.Group()
    
    // Convert inches to meters
    const widthM = this.in2m(width)
    const heightM = this.in2m(height)
    const lengthM = this.in2m(length)
    
    // Validate parameters
    if (!isFinite(widthM) || !isFinite(heightM) || !isFinite(lengthM) ||
        widthM <= 0 || heightM <= 0 || lengthM <= 0) {
      console.error('❌ Invalid cable tray dimensions:', { width, height, length })
      return group
    }

    const material = this.getMaterial(trayType)
    
    console.log('🔌 CableTrayGeometry: Creating tray with type:', trayType)
    switch (trayType.toLowerCase()) {
      case 'ladder':
        console.log('🔌 Creating LADDER tray (blue)')
        this.createLadderTray(group, widthM, heightM, lengthM, material)
        break
      case 'solid bottom':
        console.log('🔌 Creating SOLID BOTTOM tray (green)')
        this.createSolidBottomTray(group, widthM, heightM, lengthM, material)
        break
      case 'wire mesh':
        console.log('🔌 Creating WIRE MESH tray (red)')
        this.createWireMeshTray(group, widthM, heightM, lengthM, material)
        break
      default:
        console.log('🔌 Creating DEFAULT LADDER tray (blue)')
        this.createLadderTray(group, widthM, heightM, lengthM, material)
    }

    return group
  }

  /**
   * Create ladder-type cable tray
   */
  createLadderTray(group, width, height, length, material) {
    const wallThickness = 0.003 // 3mm walls
    const rungSpacing = 0.15 // 6 inch spacing between rungs
    const rungWidth = wallThickness // 6mm rung width

    // Create side rails
    const leftRail = new THREE.BoxGeometry(wallThickness, height, length)
    const rightRail = new THREE.BoxGeometry(wallThickness, height, length)
    
    const leftMesh = new THREE.Mesh(leftRail, material)
    const rightMesh = new THREE.Mesh(rightRail, material)

    leftMesh.position.set(-width/2 + wallThickness/2, 0, 0)
    rightMesh.position.set(width/2 - wallThickness/2, 0, 0)

    group.add(leftMesh)
    group.add(rightMesh)
    
    // Create rungs (cross bars)
    const rungCount = Math.floor(length / rungSpacing)
    const rungGeometry = new THREE.BoxGeometry(width - wallThickness, rungWidth, rungWidth)

    for (let i = 0; i <= rungCount; i++) {
      const rung = new THREE.Mesh(rungGeometry, material)
      rung.position.set(0, -height/2 + rungWidth/2, -length/2 + (i * rungSpacing))
      group.add(rung)
    }
  }

  /**
   * Create solid bottom cable tray
   */
  createSolidBottomTray(group, width, height, length, material) {
    const wallThickness = 0.003 // 3mm walls
    
    // Bottom plate
    const bottom = new THREE.BoxGeometry(width, wallThickness, length)
    const bottomMesh = new THREE.Mesh(bottom, material)
    bottomMesh.position.set(0, -height/2, 0)
    group.add(bottomMesh)
    
    // Side walls
    const leftWall = new THREE.BoxGeometry(wallThickness, height, length)
    const rightWall = new THREE.BoxGeometry(wallThickness, height, length)
    
    const leftMesh = new THREE.Mesh(leftWall, material)
    const rightMesh = new THREE.Mesh(rightWall, material)

    leftMesh.position.set(-width/2 + wallThickness/2, 0, 0)
    rightMesh.position.set(width/2 - wallThickness/2, 0, 0)

    group.add(leftMesh)
    group.add(rightMesh)
  }

  /**
   * Create wire mesh cable tray
   */
  createWireMeshTray(group, width, height, length, material) {
    const wireThickness = 0.002 // 2mm wire thickness
    const meshSpacing = 0.05 // 2 inch spacing
    const wallThickness = 0.003
    
    // Create wire mesh pattern
    // Longitudinal wires
    const longWireCount = Math.floor(width / meshSpacing)
    const longWireGeometry = new THREE.CylinderGeometry(wireThickness/2, wireThickness/2, length)
    
    for (let i = 0; i <= longWireCount; i++) {
      const wire = new THREE.Mesh(longWireGeometry, material)
      wire.position.set(-width/2 - wireThickness/2 + (i * meshSpacing), -height/2 + wireThickness/2, 0)
      wire.rotation.x = Math.PI/2
      group.add(wire)
    }
    
    // Cross wires
    const crossWireCount = Math.floor(length / meshSpacing)
    const crossWireGeometry = new THREE.CylinderGeometry(wireThickness/2, wireThickness/2, width - wallThickness)

    for (let i = 0; i <= crossWireCount; i++) {
      const wire = new THREE.Mesh(crossWireGeometry, material)
      wire.position.set(0, -height/2 + wireThickness/2, -length/2 + (i * meshSpacing))
      wire.rotation.z = Math.PI/2
      group.add(wire)
    }
    
    // Side rails
    
    const leftRail = new THREE.BoxGeometry(wallThickness, height, length)
    const rightRail = new THREE.BoxGeometry(wallThickness, height, length)
    
    const leftMesh = new THREE.Mesh(leftRail, material)
    const rightMesh = new THREE.Mesh(rightRail, material)
    
    leftMesh.position.set(-width/2, 0, 0)
    rightMesh.position.set(width/2, 0, 0)
    
    group.add(leftMesh)
    group.add(rightMesh)
  }

  /**
   * Get material for cable tray type
   */
  getMaterial(trayType) {
    const key = trayType.toLowerCase().replace(/\s+/g, '')
    switch (key) {
      case 'solidbottom':
        return this.materials.solidBottom
      case 'wiremesh':
        return this.materials.wireMesh
      case 'ladder':
      default:
        return this.materials.ladder
    }
  }

  /**
   * Create single cable tray group
   */
  createCableTrayGroup(cableTrayData, cableTrayLength, basePosition) {
    const {
      width = 12,
      height = 4,
      trayType = 'ladder',
      tier = 1,
      id,
      color
    } = cableTrayData

    // Create the main group
    const cableTrayGroup = new THREE.Group()
    cableTrayGroup.name = `CableTray_${id}`
    cableTrayGroup.userData = {
      type: 'cableTray',
      cableTrayData: { ...cableTrayData },
      tier,
      basePosition: basePosition || new THREE.Vector3(0, 0, 0),
      isCableTrayGroup: true
    }

    // Validate input parameters
    if (!isFinite(width) || width <= 0) {
      console.error('❌ Invalid cable tray width:', width)
      return new THREE.Group()
    }
    
    if (!isFinite(height) || height <= 0) {
      console.error('❌ Invalid cable tray height:', height)
      return new THREE.Group()
    }
    
    if (!isFinite(cableTrayLength) || cableTrayLength <= 0) {
      console.error('❌ Invalid cable tray length:', cableTrayLength)
      return new THREE.Group()
    }


    // Create the cable tray geometry
    const cableTrayGeometry = this.createCableTrayGeometry(width, height, cableTrayLength, trayType)
    
    // Apply materials
    let material
    if (color) {
      // Use custom color if specified
      material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
      
      // Apply custom material to all meshes in the geometry
      cableTrayGeometry.traverse((child) => {
        if (child.isMesh) {
          child.material = material
        }
      })
    }

    // Add geometry to the group
    cableTrayGroup.add(cableTrayGeometry)

    // Add transparent cover rectangle for easier interaction
    this.addTransparentCover(cableTrayGroup, width, height, cableTrayLength)

    // Rotate cable tray to be horizontal (along X-axis instead of Z-axis)
    cableTrayGroup.rotation.y = Math.PI / 2 // 90 degrees rotation around Y-axis

    // Position the group at the base position
    if (basePosition && isFinite(basePosition.x) && isFinite(basePosition.y) && isFinite(basePosition.z)) {
      cableTrayGroup.position.copy(basePosition)
    }

    // Calculate and store bounding box
    cableTrayGroup.userData.boundingBox = new THREE.Box3().setFromObject(cableTrayGroup)
    
    // Add snap points for measurement tool if available
    if (this.snapPoints) {
      this.addCableTraySnapPoints(cableTrayGroup)
    }
    
    return cableTrayGroup
  }

  /**
   * Add transparent cover surfaces (top, front, back) for easier interaction
   */
  addTransparentCover(cableTrayGroup, width, height, length) {
    console.log('🔌 Adding transparent cover surfaces for interaction')
    // Convert inches to meters
    const widthM = this.in2m(width)
    const heightM = this.in2m(height)
    const lengthM = this.in2m(length)
    
    // Create transparent material
    const coverMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.1, // 10% opacity as requested
      color: 0xffffff, // White color
      side: THREE.DoubleSide,
      visible: true
    })
    
    // 1. Top surface (horizontal plane)
    const topGeometry = new THREE.PlaneGeometry(widthM, lengthM)
    const topMesh = new THREE.Mesh(topGeometry, coverMaterial.clone())
    topMesh.position.set(0, heightM / 2 + 0.001, 0) // Slightly above to avoid z-fighting
    topMesh.rotation.x = -Math.PI / 2 // Horizontal
    topMesh.name = 'CableTrayCoverTop'
    cableTrayGroup.add(topMesh)
    
    // 2. Front surface (vertical plane at front edge)
    const frontGeometry = new THREE.PlaneGeometry(widthM, heightM)
    const frontMesh = new THREE.Mesh(frontGeometry, coverMaterial.clone())
    frontMesh.position.set(0, 0, lengthM / 2 + 0.001) // At front edge
    frontMesh.name = 'CableTrayCoverFront'
    cableTrayGroup.add(frontMesh)
    
    // 3. Back surface (vertical plane at back edge)
    const backGeometry = new THREE.PlaneGeometry(widthM, heightM)
    const backMesh = new THREE.Mesh(backGeometry, coverMaterial.clone())
    backMesh.position.set(0, 0, -lengthM / 2 - 0.001) // At back edge
    backMesh.name = 'CableTrayCoverBack'
    cableTrayGroup.add(backMesh)
  }

  /**
   * Add snap points for cable tray geometry - extracts corners and edges from cable tray rectangle
   */
  addCableTraySnapPoints(cableTrayGroup) {
    console.log('🔌 Adding cable tray snap points for measurements')
    
    try {
      // Update matrix world for accurate snap point calculations
      cableTrayGroup.updateMatrixWorld(true)
      
      // For cable trays, we want to create snap points from a rectangular wireframe
      // representing the cable tray's outer bounds for measurements
      const cableTrayData = cableTrayGroup.userData.cableTrayData
      if (!cableTrayData) {
        console.warn('⚠️ No cable tray data found for snap points')
        return
      }
      
      const width = cableTrayData.width || 12
      const height = cableTrayData.height || 4
      const length = this.calculateCableTrayLength() // Use rack length for cable tray
      
      // Convert to meters
      const widthM = this.in2m(width)
      const heightM = this.in2m(height)
      const lengthM = this.in2m(length)
      
      // Create a wireframe geometry representing the cable tray rectangle bounds
      // This creates the rectangular outline that measurements can snap to
      const wireframeGeometry = new THREE.BoxGeometry(widthM, heightM, lengthM)
      
      // Extract snap points from the wireframe geometry
      const { corners, edges } = extractSnapPoints(wireframeGeometry, cableTrayGroup.matrixWorld)
      
      // Add corners as vertex snap points (highest priority for measurements)
      this.snapPoints.push(...corners.map(p => ({ 
        point: p, 
        type: 'vertex',
        source: 'cableTray',
        cableTrayId: cableTrayData.id
      })))
      
      // Add edges as edge snap points (for measuring along cable tray edges)
      this.snapPoints.push(...edges.map(line => ({ 
        start: line.start, 
        end: line.end, 
        type: 'edge',
        source: 'cableTray',
        cableTrayId: cableTrayData.id
      })))
      
      console.log(`🔌 Added ${corners.length} corner points and ${edges.length} edge points for cable tray ${cableTrayData.id}`)
      
    } catch (error) {
      console.error('❌ Error adding cable tray snap points:', error)
    }
  }
  
  /**
   * Calculate cable tray length based on rack parameters
   */
  calculateCableTrayLength() {
    try {
      // Get rack parameters from localStorage
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      const rackLength = rackParams.length || 24 // Default 24 feet
      return rackLength * 12 // Convert feet to inches
    } catch (error) {
      console.warn('⚠️ Error getting rack length for cable tray snap points, using default:', error)
      return 24 * 12 // Default 24 feet in inches
    }
  }

  /**
   * Update cable tray appearance (selected, highlighted, etc.)
   */
  updateCableTrayAppearance(cableTrayGroup, state = 'normal') {
    if (!cableTrayGroup) return

    const isSelected = state === 'selected'
    const isHighlighted = state === 'highlighted' || state === 'hover'

    cableTrayGroup.traverse((child) => {
      if (child.isMesh) {
        // Store original material if not already stored
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone()
        }

        if (isSelected) {
          // Clone material for selection state - use same blue as other MEP systems
          child.material = child.userData.originalMaterial.clone()
          child.material.color.setHex(0x4A90E2) // Blue for selection (matches ducts/pipes/conduits)
          child.material.opacity = 0.9
        } else if (isHighlighted) {
          // Clone material for hover state - use same light blue as other MEP systems
          child.material = child.userData.originalMaterial.clone()
          child.material.color.setHex(0x00D4FF) // Light blue for hover (matches ducts/pipes/conduits)
          child.material.opacity = 0.8
        } else {
          // Reset to original material
          child.material = child.userData.originalMaterial.clone()
        }
      }
    })
  }

  /**
   * Convert inches to meters
   */
  in2m(inches) {
    return inches * 0.0254
  }

  /**
   * Convert meters to inches
   */
  m2in(meters) {
    return meters / 0.0254
  }

  /**
   * Dispose of geometries and materials
   */
  dispose() {
    Object.values(this.materials).forEach(material => {
      if (material.map) material.map.dispose()
      material.dispose()
    })
  }
}