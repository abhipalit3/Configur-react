/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

/**
 * RackSnapLineManager - Handles creation and management of snap lines for duct positioning
 */
export class RackSnapLineManager {
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

  // Utility functions with validation
  convertToFeet(value) {
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        console.warn('❌ Invalid numeric feet value:', value)
        return 2 // Default fallback
      }
      return value
    }
    if (typeof value === 'object' && value !== null) {
      const feet = value.feet || 0
      const inches = value.inches || 0
      if (!isFinite(feet) || !isFinite(inches)) {
        console.warn('❌ Invalid feet/inches values:', { feet, inches })
        return 2
      }
      return feet + (inches / 12)
    }
    return 2
  }

  ft2m(feet) { 
    if (!isFinite(feet)) {
      console.warn('❌ Invalid feet for conversion:', feet)
      return 0
    }
    return feet * 0.3048 
  }
  
  in2m(inches) { 
    if (!isFinite(inches)) {
      console.warn('❌ Invalid inches for conversion:', inches)
      return 0
    }
    return inches * 0.0254 
  }

  getRackLength() {
    let rackLength = null
    
    try {
      // Priority 1: Check manifest for most up-to-date values
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const activeConfig = manifest.tradeRacks?.active
      
      if (activeConfig?.rackLength) {
        rackLength = this.convertToFeet(activeConfig.rackLength)
      } else if (activeConfig?.totalLength) {
        rackLength = this.convertToFeet(activeConfig.totalLength)
      }
      
      // Priority 2: Check rackParams as fallback
      if (!rackLength && this.rackParams) {
        if (this.rackParams.rackLength) {
          rackLength = this.convertToFeet(this.rackParams.rackLength)
        } else if (this.rackParams.totalLength) {
          rackLength = this.convertToFeet(this.rackParams.totalLength)
        }
      }
    } catch (error) {
      console.error('Error reading rack config:', error)
    }
    
    // Priority 3: Calculate from bay dimensions as last resort
    if (!rackLength || rackLength <= 0) {
      const bayCount = this.rackParams?.bayCount || 4
      const bayWidth = this.rackParams?.bayWidth || 3
      rackLength = bayCount * bayWidth
      console.warn(`Using calculated rack length: ${rackLength}ft (${bayCount} bays × ${bayWidth}ft)`)
    }
    
    return rackLength
  }

  /**
   * Get post/column size in inches from rack parameters or manifest
   * Returns the size in inches for consistency with rack parameters
   */
  getPostSize() {
    let postSize = null
    
    try {
      // Priority 1: Check rackParams for post/column size
      // Handle both old format (postSize/columnSize) and new format (columnSizes with columnType)
      if (this.rackParams?.postSize && this.rackParams.postSize > 0) {
        postSize = this.rackParams.postSize
      } else if (this.rackParams?.columnSize && this.rackParams.columnSize > 0) {
        postSize = this.rackParams.columnSize
      } else if (this.rackParams?.columnSizes && this.rackParams?.columnType) {
        // New format: columnSizes is an object with sizes for different types
        postSize = this.rackParams.columnSizes[this.rackParams.columnType]
      }
      
      // Priority 2: Try to get from manifest as backup
      if (!postSize) {
        const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
        const activeConfig = manifest.tradeRacks?.active
        
        if (activeConfig?.postSize && activeConfig.postSize > 0) {
          postSize = activeConfig.postSize
        } else if (activeConfig?.columnSize && activeConfig.columnSize > 0) {
          postSize = activeConfig.columnSize
        } else if (activeConfig?.columnSizes && activeConfig?.columnType) {
          // New format in manifest
          postSize = activeConfig.columnSizes[activeConfig.columnType]
        }
      }
      
      // Priority 3: Try localStorage rackParameters directly
      if (!postSize) {
        const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
        if (rackParams?.columnSizes && rackParams?.columnType) {
          postSize = rackParams.columnSizes[rackParams.columnType]
        }
      }
    } catch (error) {
      console.error('Error reading post size:', error)
    }
    
    // Default to 3 inches if not found
    if (!postSize || postSize <= 0) {
      postSize = 3
      // Only log once to avoid spam
      if (!this._hasLoggedDefaultPostSize) {
        console.info('ℹ️ Post size not found in config, using default: 3 inches')
        this._hasLoggedDefaultPostSize = true
      }
    }
    
    return postSize
  }

  /**
   * Calculate the available duct length
   * Returns length in meters
   */
  getAvailableDuctLength() {
    const rackLengthFt = this.getRackLength()
    const rackLengthM = this.ft2m(rackLengthFt)
    
    // Duct length equals rack length
    const ductLength = rackLengthM
    
    // Ensure minimum viable length
    if (ductLength <= 0) {
      console.error('Invalid duct length calculation:', {
        rackLengthFt,
        rackLengthM,
        calculated: ductLength
      })
      return 0.1 // Return minimum viable length
    }
    
    return ductLength
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
        try {
          // Get world bounding box
          const bbox = new THREE.Box3().setFromObject(child)
          const size = bbox.getSize(new THREE.Vector3())
          const center = bbox.getCenter(new THREE.Vector3())
          
          // Validate bounding box calculations
          if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z) ||
              !isFinite(center.x) || !isFinite(center.y) || !isFinite(center.z)) {
            console.warn('❌ Invalid bounding box for mesh:', child.name)
            return // Skip this mesh
          }
          
          // Classify by dimensions - more lenient detection
          const isLongX = size.x > size.y && size.x > size.z && size.x > 0.5 // Long in X direction
          const isLongY = size.y > size.x && size.y > size.z && size.y > 0.5 // Long in Y direction  
          const isLongZ = size.z > size.x && size.z > size.y && size.z > 0.3 // Long in Z direction
          
          if (isLongX || isLongZ) {
            // Horizontal beam
            if (isFinite(center.y) && isFinite(size.y)) {
              beamYPositions.set(center.y, size.y)
            } else {
              console.warn('❌ Invalid beam geometry:', { centerY: center.y, sizeY: size.y })
            }
          } else if (isLongY) {
            // Vertical post  
            if (isFinite(bbox.min.z) && isFinite(bbox.max.z) && isFinite(size.z)) {
              postZExtents.min = Math.min(postZExtents.min, bbox.min.z)
              postZExtents.max = Math.max(postZExtents.max, bbox.max.z)  
              postZExtents.width = Math.max(postZExtents.width, size.z)
            } else {
              console.warn('❌ Invalid post geometry:', { minZ: bbox.min.z, maxZ: bbox.max.z, sizeZ: size.z })
            }
          } else {
            // Unclassified geometry - might still be useful
          }
        } catch (error) {
          console.error('❌ Error processing mesh geometry:', child.name, error)
        }
      }
    })

    // No offset needed - rack geometry is already positioned correctly in the scene
    let yOffset = 0

    // Create horizontal snap lines from actual beam positions
    const validBeamPositions = Array.from(beamYPositions.keys()).filter(y => isFinite(y))
    const sortedBeamY = validBeamPositions.sort((a, b) => b - a)
    
    sortedBeamY.forEach((beamCenterY, index) => {
      const beamDepth = beamYPositions.get(beamCenterY) || 0.1
      
      // Validate beam depth
      if (!isFinite(beamDepth) || beamDepth <= 0) {
        console.warn('❌ Invalid beam depth:', beamDepth)
        return
      }
      
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
    
    // Snap lines disabled - return early without creating any lines
    return
    
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