/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

/**
 * ConduitGeometry - Handles creation of 3D conduit geometries and materials
 * Conduits are electrical raceways that protect and route electrical wiring
 */
export class ConduitGeometry {
  constructor() {
    this.snapPoints = null // Will be set by three-scene
    this.materials = {
      // EMT (Electrical Metallic Tubing) - silver/galvanized color
      emt: new THREE.MeshLambertMaterial({
        color: 0xC0C0C0, // Silver color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      emtSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      emtHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // Rigid conduit - dark gray
      rigid: new THREE.MeshLambertMaterial({
        color: 0x505050, // Dark gray color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      rigidSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      rigidHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // PVC conduit - gray
      pvc: new THREE.MeshLambertMaterial({
        color: 0x808080, // Gray color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      pvcSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      pvcHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // Flexible conduit - yellow/orange color
      flexible: new THREE.MeshLambertMaterial({
        color: 0xFFA500, // Orange color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      flexibleSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      flexibleHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // Custom color material
      custom: new THREE.MeshLambertMaterial({
        color: 0xFFFFFF, // Default white, will be overridden
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    }
  }

  // Set reference to snap points array from measurement tool
  setSnapPoints(snapPoints) {
    this.snapPoints = snapPoints
  }

  // Utility functions
  in2m(inches) { 
    if (!isFinite(inches)) {
      console.warn('❌ Invalid inches value for conversion:', inches)
      return 0
    }
    return inches * 0.0254 
  }

  /**
   * Create cylindrical conduit geometry
   */
  createConduitGeometry(length, diameter, segments = 16) {
    // Validate inputs
    if (!isFinite(length) || length <= 0) {
      console.error('❌ Invalid geometry length:', length)
      return new THREE.CylinderGeometry(0.01, 0.01, 0.1, segments) // Fallback geometry
    }
    
    if (!isFinite(diameter) || diameter <= 0) {
      console.error('❌ Invalid geometry diameter:', diameter)
      return new THREE.CylinderGeometry(0.01, 0.01, length, segments) // Fallback geometry
    }
    
    const radius = diameter / 2
    
    if (!isFinite(radius) || radius <= 0) {
      console.error('❌ Invalid geometry radius:', radius, 'from diameter:', diameter)
      return new THREE.CylinderGeometry(0.01, 0.01, length, segments) // Fallback geometry
    }
    
    console.log(`⚡ Creating conduit geometry: length=${length.toFixed(3)}m, diameter=${diameter.toFixed(3)}m, radius=${radius.toFixed(3)}m`)
    return new THREE.CylinderGeometry(radius, radius, length, segments)
  }

  /**
   * Create a unified group containing multiple conduits (new approach)
   */
  createMultiConduitGroup(conduitData, conduitLength, basePosition) {
    const {
      count = 1,
      spacing = 4, // inches
      diameter = 1,
      conduitType = 'emt',
      tier = 1,
      id,
      color,
      fillPercentage = 0
    } = conduitData

    // Create the main group that will contain all conduits
    const multiConduitGroup = new THREE.Group()
    multiConduitGroup.name = `MultiConduit_${id}`
    multiConduitGroup.userData = {
      type: 'multiConduit',
      conduitData: { ...conduitData },
      tier,
      basePosition: basePosition || new THREE.Vector3(0, 0, 0),
      count,
      isConduitGroup: true
    }

    // Validate input parameters
    if (!isFinite(diameter) || diameter <= 0) {
      console.error('❌ Invalid conduit diameter:', diameter)
      return new THREE.Group() // Return empty group
    }
    
    if (!isFinite(conduitLength) || conduitLength <= 0) {
      console.error('❌ Invalid conduit length:', conduitLength)
      return new THREE.Group()
    }
    
    if (!isFinite(spacing) || spacing < 0) {
      console.error('❌ Invalid conduit spacing:', spacing)
      return new THREE.Group()
    }
    
    if (!isFinite(count) || count <= 0) {
      console.error('❌ Invalid conduit count:', count)
      return new THREE.Group()
    }

    console.log(`⚡ Creating multi-conduit group with ${count} conduits, spacing: ${spacing}`)
    console.log(`⚡ Conduit parameters: diameter=${diameter}", length=${conduitLength}", type=${conduitType}`)

    // Create individual conduits and add them to the group
    for (let i = 0; i < count; i++) {
      const conduitId = `${id}_${i}`
      
      const individualConduitData = {
        ...conduitData,
        id: conduitId,
        diameter,
        conduitType,
        fillPercentage,
        tier,
        color // Pass the color through to individual conduit data
      }

      // Create the individual conduit geometry
      // Convert diameter from inches to meters for geometry creation
      const diameterM = this.in2m(diameter)
      const lengthM = this.in2m(conduitLength)
      
      // Validate parameters before creating geometry
      if (!isFinite(diameterM) || diameterM <= 0) {
        console.error('❌ Invalid conduit diameter (meters):', diameterM, 'from inches:', diameter)
        continue // Skip this conduit
      }
      
      if (!isFinite(lengthM) || lengthM <= 0) {
        console.error('❌ Invalid conduit length (meters):', lengthM, 'from inches:', conduitLength)
        continue // Skip this conduit
      }
      
      const conduitGeometry = this.createConduitGeometry(lengthM, diameterM)
      
      // Apply materials
      let material
      if (color) {
        // Use custom color if specified
        material = new THREE.MeshLambertMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        })
        console.log(`⚡ Using custom color for conduit ${conduitId}:`, color)
      } else {
        // Use default material for conduit type
        const materialKey = conduitType?.toLowerCase() || 'emt'
        material = this.materials[materialKey] || this.materials.emt
      }
      
      // Create mesh
      const conduitMesh = new THREE.Mesh(conduitGeometry, material)
      conduitMesh.name = `Conduit_${conduitId}`
      conduitMesh.userData = {
        type: 'conduit',
        conduitData: individualConduitData,
        tier,
        index: i
      }

      // Rotate conduit to be horizontal (along X-axis instead of Y-axis)
      conduitMesh.rotation.z = Math.PI / 2 // 90 degrees rotation around Z-axis

      // Position within the group - spacing along Z-axis
      const spacingM = spacing * 0.0254 // Convert inches to meters
      conduitMesh.position.set(0, 0, i * spacingM)
      
      multiConduitGroup.add(conduitMesh)
    }

    // Position the entire group at the base position
    if (basePosition && isFinite(basePosition.x) && isFinite(basePosition.y) && isFinite(basePosition.z)) {
      multiConduitGroup.position.copy(basePosition)
      console.log(`⚡ Group positioned at:`, basePosition)
    } else {
      console.warn('⚠️ Invalid base position for multi-conduit group:', basePosition)
    }

    // Calculate and store bounding box
    multiConduitGroup.userData.boundingBox = new THREE.Box3().setFromObject(multiConduitGroup)
    
    // Add snap points for measurement tool if available
    if (this.snapPoints) {
      multiConduitGroup.updateMatrixWorld(true)
      
      // Calculate length once for all conduits (they're all the same length)
      const lengthM = this.in2m(conduitLength)
      
      // Add snap points for each conduit in the group
      multiConduitGroup.children.forEach((conduitMesh, index) => {
        if (conduitMesh.userData?.type === 'conduit') {
          // Get the conduit's world position
          const worldPosition = new THREE.Vector3()
          conduitMesh.getWorldPosition(worldPosition)
          
          const conduitDiameter = this.in2m(diameter)
          const conduitRadius = conduitDiameter / 2
          const halfLength = lengthM / 2
          
          // === CONDUIT SNAP POINTS ===
          // Center points (front and back ends) - conduit centerline
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z), 
            type: 'vertex' 
          })
          
          // Top points of conduit (front and back)
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + conduitRadius, worldPosition.z), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + conduitRadius, worldPosition.z), 
            type: 'vertex' 
          })
          
          // Bottom points of conduit (front and back)
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - conduitRadius, worldPosition.z), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - conduitRadius, worldPosition.z), 
            type: 'vertex' 
          })
          
          // Side points of conduit (front and back)
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + conduitRadius), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + conduitRadius), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - conduitRadius), 
            type: 'vertex' 
          })
          this.snapPoints.push({ 
            point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - conduitRadius), 
            type: 'vertex' 
          })
          
          // Edge lines for conduit
          this.snapPoints.push({
            start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + conduitRadius, worldPosition.z),
            end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + conduitRadius, worldPosition.z),
            type: 'edge'
          })
          this.snapPoints.push({
            start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - conduitRadius, worldPosition.z),
            end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - conduitRadius, worldPosition.z),
            type: 'edge'
          })
          this.snapPoints.push({
            start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + conduitRadius),
            end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + conduitRadius),
            type: 'edge'
          })
          this.snapPoints.push({
            start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - conduitRadius),
            end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - conduitRadius),
            type: 'edge'
          })
        }
      })
    }
    
    console.log(`✅ Multi-conduit group created with ${multiConduitGroup.children.length} conduits`)
    return multiConduitGroup
  }

  /**
   * Create a complete conduit group with all components (legacy single conduit)
   */
  createConduitGroup(conduitData, conduitLength, position) {
    const {
      diameter = 1, // inches - typical conduit sizes: 0.5", 0.75", 1", 1.25", 1.5", 2"
      conduitType = 'emt',
      tier = 1,
      id,
      color,
      fillPercentage = 0 // Percentage of conduit fill (for visual indication)
    } = conduitData

    // Validate input parameters
    if (!isFinite(diameter) || diameter <= 0) {
      console.error('❌ Invalid conduit diameter:', diameter)
      return new THREE.Group() // Return empty group
    }
    
    if (!isFinite(conduitLength) || conduitLength <= 0) {
      console.error('❌ Invalid conduit length:', conduitLength)
      return new THREE.Group()
    }

    const diameterM = this.in2m(diameter)
    const lengthM = this.in2m(conduitLength)
    
    const conduitGroup = new THREE.Group()
    conduitGroup.name = `Conduit_${id}`
    conduitGroup.userData = { 
      type: 'conduit', 
      conduitData,
      tier,
      position: position || 'bottom'
    }

    // Safely set position with validation
    if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
      if (isFinite(position.x) && isFinite(position.y) && isFinite(position.z)) {
        conduitGroup.position.copy(position)
      } else {
        console.warn('⚠️ Invalid position values, using default:', position)
        conduitGroup.position.set(0, 0, 0)
      }
    } else {
      conduitGroup.position.set(0, 0, 0)
    }

    // Get material based on conduit type and custom color
    let conduitMaterial
    if (color) {
      // Use custom color if specified
      conduitMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    } else {
      // Use default material for conduit type
      conduitMaterial = this.materials[conduitType.toLowerCase()] || this.materials.emt
    }

    // Create main conduit cylinder (rotated to align with X-axis like pipes)
    const conduitGeometry = this.createConduitGeometry(lengthM, diameterM)
    const conduit = new THREE.Mesh(conduitGeometry, conduitMaterial)
    conduit.name = 'MainConduit'
    conduit.rotation.z = Math.PI / 2 // Rotate to align with X-axis
    conduitGroup.add(conduit)

    // Add fill indicator if specified (visual representation of wire fill)
    if (fillPercentage > 0 && fillPercentage <= 100) {
      const fillRadius = (diameterM / 2) * 0.8 * (fillPercentage / 100) // Inner fill indicator
      const fillGeometry = this.createConduitGeometry(lengthM * 0.99, fillRadius * 2)
      const fillMaterial = new THREE.MeshLambertMaterial({
        color: fillPercentage > 40 ? 0xFF0000 : 0x00FF00, // Red if overfilled, green if ok
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial)
      fillMesh.name = 'FillIndicator'
      fillMesh.rotation.z = Math.PI / 2
      conduitGroup.add(fillMesh)
    }

    // Add snap points for measurement tool if available
    if (this.snapPoints) {
      conduitGroup.updateMatrixWorld(true)
      
      // Get the conduit's world position
      const worldPosition = new THREE.Vector3()
      conduitGroup.getWorldPosition(worldPosition)
      
      const halfLength = lengthM / 2
      const conduitRadius = diameterM / 2
      
      // === MAIN CONDUIT SNAP POINTS ===
      // Center points (front and back ends) - conduit centerline
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Top points of main conduit (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + conduitRadius, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + conduitRadius, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Bottom points of main conduit (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - conduitRadius, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - conduitRadius, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Side points of main conduit (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + conduitRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + conduitRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - conduitRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - conduitRadius), 
        type: 'vertex' 
      })
      
      // Edge lines for main conduit
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + conduitRadius, worldPosition.z),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + conduitRadius, worldPosition.z),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - conduitRadius, worldPosition.z),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - conduitRadius, worldPosition.z),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + conduitRadius),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + conduitRadius),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - conduitRadius),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - conduitRadius),
        type: 'edge'
      })
    }

    return conduitGroup
  }

  /**
   * Update conduit material (for selection, color changes, etc.)
   */
  updateConduitMaterial(conduitGroup, materialType) {
    if (!conduitGroup) return

    const mainConduit = conduitGroup.getObjectByName('MainConduit')
    
    if (mainConduit) {
      mainConduit.material = this.materials[materialType] || this.materials.emt
    }
  }

  /**
   * Get material type based on conduit type and state
   */
  getMaterialType(conduitType, selected = false, hover = false) {
    const baseType = conduitType.toLowerCase()
    if (selected) return `${baseType}Selected`
    if (hover) return `${baseType}Hover`
    return baseType
  }

  /**
   * Update conduit appearance (normal, hover, selected)
   */
  updateConduitAppearance(conduitGroup, appearance) {
    if (!conduitGroup) return

    const conduitData = conduitGroup.userData.conduitData
    if (!conduitData) return

    // For multi-conduit groups created by createMultiConduitGroup, 
    // the conduit mesh itself IS the conduitGroup (not a child named 'MainConduit')
    // For legacy single conduits, look for 'MainConduit' child
    let conduitMesh = null
    
    if (conduitGroup.type === 'Mesh') {
      // This is a direct mesh from multi-conduit group
      conduitMesh = conduitGroup
    } else {
      // This is a legacy single conduit group with MainConduit child
      conduitMesh = conduitGroup.getObjectByName('MainConduit')
    }
    
    if (!conduitMesh) return
    
    let materialType
    switch (appearance) {
      case 'selected':
        materialType = this.getMaterialType(conduitData.conduitType, true, false)
        break
      case 'hover':
        materialType = this.getMaterialType(conduitData.conduitType, false, true)
        break
      case 'normal':
      default:
        materialType = this.getMaterialType(conduitData.conduitType, false, false)
        break
    }

    // Handle custom color
    if (conduitData.color && appearance === 'normal') {
      const customMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(conduitData.color),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
      conduitMesh.material = customMaterial
    } else {
      // Use predefined materials
      if (this.materials[materialType]) {
        conduitMesh.material = this.materials[materialType]
      }
    }
  }

  /**
   * Create custom colored material
   */
  createCustomMaterial(color, selected = false, hover = false) {
    let baseColor = new THREE.Color(color)
    
    if (selected) {
      baseColor = new THREE.Color(0x4A90E2) // Blue for selection
    } else if (hover) {
      // Lighten the color for hover effect
      baseColor.multiplyScalar(1.2)
    }
    
    return new THREE.MeshLambertMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
  }
}