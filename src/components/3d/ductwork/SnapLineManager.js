import * as THREE from 'three'

/**
 * SnapLineManager - Handles creation and management of snap lines for duct positioning
 */
export class SnapLineManager {
  constructor(scene, rackParams = {}) {
    this.scene = scene
    this.rackParams = rackParams
    
    // Snap line groups
    this.persistentSnapLines = new THREE.Group()
    this.persistentSnapLines.name = 'PersistentSnapLines'
    this.persistentSnapLines.visible = true
    this.scene.add(this.persistentSnapLines)
    
    this.snapGuides = new THREE.Group()
    this.snapGuides.name = 'SnapGuides'
    this.snapGuides.visible = true
    this.scene.add(this.snapGuides)
    
    // Materials
    this.materials = {
      persistent: new THREE.LineBasicMaterial({
        color: 0xFF4444, // Red
        linewidth: 1,
        transparent: true,
        opacity: 0.4
      }),
      activeGuide: new THREE.LineBasicMaterial({
        color: 0x00FF00, // Green
        linewidth: 3,
        transparent: true,
        opacity: 0.9
      }),
      inactiveGuide: new THREE.LineBasicMaterial({
        color: 0xFF0000, // Red
        linewidth: 2,
        transparent: true,
        opacity: 0.6
      })
    }
  }

  // Utility functions
  convertToFeet(value) {
    if (typeof value === 'number') return value
    if (typeof value === 'object' && value !== null) {
      return (value.feet || 0) + (value.inches || 0) / 12
    }
    return 2
  }

  ft2m(feet) { return feet * 0.3048 }
  in2m(inches) { return inches * 0.0254 }

  getRackLength() {
    try {
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const activeConfig = manifest.tradeRacks?.active
      
      if (activeConfig?.rackLength) {
        return this.convertToFeet(activeConfig.rackLength)
      } else if (activeConfig?.totalLength) {
        return this.convertToFeet(activeConfig.totalLength)
      }
    } catch (error) {
      console.error('Error reading rack config:', error)
    }
    
    return (this.rackParams.bayCount || 4) * (this.rackParams.bayWidth || 3)
  }

  /**
   * Get snap lines directly from the rack geometry in the scene
   */
  getSnapLinesFromRackGeometry() {
    const snapLines = {
      horizontal: [], // Y-axis lines (beam surfaces)
      vertical: []    // Z-axis lines (post inner faces)
    }
    
    // Find the rack group in the scene - let's see what groups exist
    let rackGroup = null
    let allGroups = []
    
    this.scene.traverse((child) => {
      if (child.isGroup) {
        allGroups.push({
          name: child.name,
          userData: child.userData,
          children: child.children.length,
          position: child.position
        })
        
        // Try multiple criteria to find the rack - prioritize groups with lots of children
        if (child.userData.isGenerated || 
            child.name.toLowerCase().includes('rack') ||
            child.name.toLowerCase().includes('trade')) {
          
          // Prefer the group with the most children (likely the actual rack with geometry)
          if (!rackGroup || child.children.length > rackGroup.children.length) {
            rackGroup = child
          }
        }
      }
    })
    
    
    if (!rackGroup) {
      console.warn('❌ No rack found in scene for snap lines')
      return snapLines
    }
    
    rackGroup.children.forEach((child, i) => {
    })
    
    // Ensure world matrices are up to date
    rackGroup.updateMatrixWorld(true)
    
    // Extract beam and post positions from rack geometry
    const beamYPositions = new Map()
    const postZExtents = { min: Infinity, max: -Infinity, width: 0 }
    let meshCount = 0
    
    // First, let's see what's actually in the rack group
    let totalChildren = 0
    let meshChildren = 0
    let geometryTypes = new Set()
    
    rackGroup.traverse((child) => {
      totalChildren++
      
      if (child.isMesh) {
        meshChildren++
        if (child.geometry) {
          geometryTypes.add(child.geometry.type)
        }
      }
    })
    
    // Now traverse specifically for BoxGeometry meshes
    rackGroup.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.type === 'BoxGeometry') {
        meshCount++
        // Get world bounding box
        const bbox = new THREE.Box3().setFromObject(child)
        const size = bbox.getSize(new THREE.Vector3())
        const center = bbox.getCenter(new THREE.Vector3())
        
        // Classify by dimensions - more lenient detection
        const isLongX = size.x > size.y && size.x > size.z && size.x > 0.5 // Long in X direction
        const isLongY = size.y > size.x && size.y > size.z && size.y > 0.5 // Long in Y direction  
        const isLongZ = size.z > size.x && size.z > size.y && size.z > 0.3 // Long in Z direction
        
        // Debug all geometry found
        
        if (isLongX || isLongZ) {
          // Horizontal beam
          beamYPositions.set(center.y, size.y)
        } else if (isLongY) {
          // Vertical post  
          postZExtents.min = Math.min(postZExtents.min, bbox.min.z)
          postZExtents.max = Math.max(postZExtents.max, bbox.max.z)  
          postZExtents.width = Math.max(postZExtents.width, size.z)
        } else {
          // Unclassified geometry - might still be useful
        }
      }
    })

    // No offset needed - rack geometry is already positioned correctly in the scene
    let yOffset = 0

    // Create horizontal snap lines from actual beam positions
    const sortedBeamY = Array.from(beamYPositions.keys()).sort((a, b) => b - a)
    
    sortedBeamY.forEach((beamCenterY, index) => {
      const beamDepth = beamYPositions.get(beamCenterY) || 0.1
      const beamHalf = beamDepth / 2
      
      // Use exact geometry position (no offset needed)
      const adjustedBeamY = beamCenterY
      
      snapLines.horizontal.push({
        y: adjustedBeamY + beamHalf,
        type: 'beam_top',
        description: `Beam ${index} top`
      })
      
      snapLines.horizontal.push({
        y: adjustedBeamY - beamHalf,
        type: 'beam_bottom', 
        description: `Beam ${index} bottom`
      })
    })

    // Create vertical snap lines from post positions
    if (postZExtents.min < Infinity && postZExtents.max > -Infinity) {
      const postHalfWidth = (postZExtents.width * 2) / 2  // Double the post width for snap lines
      
      snapLines.vertical.push({
        z: postZExtents.min + postHalfWidth,
        type: 'post_inner',
        side: 'right',
        description: 'Right post inner face'
      })
      
      snapLines.vertical.push({
        z: postZExtents.max - postHalfWidth,
        type: 'post_inner',
        side: 'left', 
        description: 'Left post inner face'
      })
    }
    
    return snapLines
  }

  getBuildingShellParams() {
    try {
      let buildingParams = localStorage.getItem('buildingShellParams')
      if (buildingParams) {
        return JSON.parse(buildingParams)
      }
      
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      if (manifest.buildingShell?.parameters) {
        return manifest.buildingShell.parameters
      }
      if (manifest.buildingShell) {
        return manifest.buildingShell
      }
    } catch (error) {
      console.warn('Error loading building shell params:', error)
    }
    return null
  }

  /**
   * Create persistent snap lines that are always visible
   */
  createPersistentSnapLines() {
    this.clearPersistentSnapLines()
    
    
    const snapLines = this.getSnapLinesFromRackGeometry()
    const rackLength = this.ft2m(this.getRackLength()) + this.in2m(12)
    
    // Create horizontal snap lines
    for (const line of snapLines.horizontal) {
      this.createPersistentHorizontalLine(line.y, rackLength)
    }
    
    // Create vertical snap lines
    for (const line of snapLines.vertical) {
      this.createPersistentVerticalLine(line.z, rackLength, snapLines.horizontal)
    }
    
  }

  createPersistentHorizontalLine(y, length) {
    const rackWidthFt = this.convertToFeet(this.rackParams.rackWidth || this.rackParams.depth || { feet: 4, inches: 0 })
    const rackWidthM = this.ft2m(rackWidthFt)
    
    const points = [
      new THREE.Vector3(-length/2, y, -rackWidthM/2),
      new THREE.Vector3(length/2, y, -rackWidthM/2),
      new THREE.Vector3(length/2, y, rackWidthM/2),
      new THREE.Vector3(-length/2, y, rackWidthM/2),
      new THREE.Vector3(-length/2, y, -rackWidthM/2)
    ]
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, this.materials.persistent)
    line.name = `PersistentSnapLine_H_${y.toFixed(3)}`
    line.visible = true
    
    this.persistentSnapLines.add(line)
  }

  createPersistentVerticalLine(z, length, horizontalLines) {
    const yPositions = horizontalLines.map(line => line.y)
    const minY = Math.min(...yPositions) - 0.2
    const maxY = Math.max(...yPositions) + 0.2
    
    const points = [
      new THREE.Vector3(-length/2, minY, z),
      new THREE.Vector3(-length/2, maxY, z),
      new THREE.Vector3(length/2, maxY, z),
      new THREE.Vector3(length/2, minY, z)
    ]
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, this.materials.persistent)
    line.name = `PersistentSnapLine_V_${z.toFixed(3)}`
    line.visible = true
    
    this.persistentSnapLines.add(line)
  }

  clearPersistentSnapLines() {
    while (this.persistentSnapLines.children.length > 0) {
      const child = this.persistentSnapLines.children[0]
      this.persistentSnapLines.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
  }

  clearSnapGuides() {
    while (this.snapGuides.children.length > 0) {
      const child = this.snapGuides.children[0]
      this.snapGuides.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
  }

  updateRackParams(rackParams) {
    this.rackParams = { ...this.rackParams, ...rackParams }
    this.createPersistentSnapLines()
  }

  dispose() {
    this.clearPersistentSnapLines()
    this.clearSnapGuides()
    this.scene.remove(this.persistentSnapLines)
    this.scene.remove(this.snapGuides)
    
    Object.values(this.materials).forEach(material => material.dispose())
  }
}