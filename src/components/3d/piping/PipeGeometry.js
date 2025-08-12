/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { extractSnapPoints } from '../core/extractGeometrySnapPoints.js'

/**
 * PipeGeometry - Handles creation of 3D pipe geometries and materials
 */
export class PipeGeometry {
  constructor() {
    this.snapPoints = null // Will be set by three-scene
    this.materials = {
      // Copper pipes - reddish-brown color
      copper: new THREE.MeshLambertMaterial({
        color: 0xB87333, // Bronze/copper color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      copperSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      copperHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover (same as ducts)
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // PVC pipes - white/light gray
      pvc: new THREE.MeshLambertMaterial({
        color: 0xF5F5F5, // Off-white color
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
        color: 0x00D4FF, // Light blue hover (same as ducts)
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // Steel pipes - dark metallic
      steel: new THREE.MeshLambertMaterial({
        color: 0x708090, // Steel gray color
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      steelSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      steelHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue hover (same as ducts)
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      // Insulation material - light gray surface with low opacity
      insulation: new THREE.MeshLambertMaterial({
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      }),
      insulationSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2,
        transparent: true,
        opacity: 0.4,
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
   * Create cylindrical pipe geometry
   */
  createPipeGeometry(length, diameter, segments = 16) {
    const radius = diameter / 2
    return new THREE.CylinderGeometry(radius, radius, length, segments)
  }

  /**
   * Create a complete pipe group with all components
   */
  createPipeGroup(pipeData, pipeLength, position) {
    const {
      diameter = 2, // inches
      insulation = 0, // inches
      pipeType = 'copper',
      tier = 1,
      id,
      color
    } = pipeData

    // Validate input parameters
    if (!isFinite(diameter) || diameter <= 0) {
      console.error('❌ Invalid pipe diameter:', diameter)
      return new THREE.Group() // Return empty group
    }
    
    if (!isFinite(insulation) || insulation < 0) {
      console.warn('⚠️ Invalid insulation value, using 0:', insulation)
      insulation = 0
    }
    
    if (!isFinite(pipeLength) || pipeLength <= 0) {
      console.error('❌ Invalid pipe length:', pipeLength)
      return new THREE.Group()
    }

    const diameterM = this.in2m(diameter)
    const insulationM = this.in2m(insulation)
    const lengthM = this.in2m(pipeLength)
    
    const pipeGroup = new THREE.Group()
    pipeGroup.name = `Pipe_${id}`
    pipeGroup.userData = { 
      type: 'pipe', 
      pipeData,
      tier,
      position: position || 'bottom'
    }

    // Safely set position with validation
    if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
      if (isFinite(position.x) && isFinite(position.y) && isFinite(position.z)) {
        pipeGroup.position.copy(position)
      } else {
        console.warn('⚠️ Invalid position values, using default:', position)
        pipeGroup.position.set(0, 0, 0)
      }
    } else {
      pipeGroup.position.set(0, 0, 0)
    }

    // Calculate total dimensions with safety checks
    const totalRadius = diameterM / 2 + insulationM
    
    if (!isFinite(totalRadius)) {
      console.error('❌ Invalid total radius:', totalRadius)
      return new THREE.Group()
    }

    // Get material based on pipe type and custom color
    let pipeMaterial
    if (color) {
      // Use custom color if specified
      pipeMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    } else {
      // Use default material for pipe type
      pipeMaterial = this.materials[pipeType.toLowerCase()] || this.materials.copper
    }

    // Create main pipe cylinder (rotated to align with X-axis like ducts)
    const pipeGeometry = this.createPipeGeometry(lengthM, diameterM)
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial)
    pipe.name = 'MainPipe'
    pipe.rotation.z = Math.PI / 2 // Rotate to align with X-axis
    pipeGroup.add(pipe)

    // Add insulation if specified
    if (insulation > 0) {
      // Make insulation full length to be flush with rack boundaries
      const insulationLength = lengthM // Full length, flush with rack
      const insulationGeometry = this.createPipeGeometry(insulationLength, diameterM + 2 * insulationM)
      const insulationMesh = new THREE.Mesh(insulationGeometry, this.materials.insulation)
      insulationMesh.name = 'Insulation'
      insulationMesh.rotation.z = Math.PI / 2 // Rotate to align with X-axis
      pipeGroup.add(insulationMesh)
    }

    // Add snap points for measurement tool if available
    if (this.snapPoints) {
      pipeGroup.updateMatrixWorld(true)
      
      // Get the pipe's world position
      const worldPosition = new THREE.Vector3()
      pipeGroup.getWorldPosition(worldPosition)
      
      const halfLength = lengthM / 2
      const pipeRadius = diameterM / 2
      
      // === MAIN PIPE SNAP POINTS ===
      // Center points (front and back ends) - pipe centerline
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Top points of main pipe (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + pipeRadius, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + pipeRadius, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Bottom points of main pipe (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - pipeRadius, worldPosition.z), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - pipeRadius, worldPosition.z), 
        type: 'vertex' 
      })
      
      // Side points of main pipe (front and back)
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + pipeRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + pipeRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - pipeRadius), 
        type: 'vertex' 
      })
      this.snapPoints.push({ 
        point: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - pipeRadius), 
        type: 'vertex' 
      })
      
      // Edge lines for main pipe
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y + pipeRadius, worldPosition.z),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y + pipeRadius, worldPosition.z),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y - pipeRadius, worldPosition.z),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y - pipeRadius, worldPosition.z),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z + pipeRadius),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z + pipeRadius),
        type: 'edge'
      })
      this.snapPoints.push({
        start: new THREE.Vector3(worldPosition.x - halfLength, worldPosition.y, worldPosition.z - pipeRadius),
        end: new THREE.Vector3(worldPosition.x + halfLength, worldPosition.y, worldPosition.z - pipeRadius),
        type: 'edge'
      })
      
      // === INSULATION SNAP POINTS (if insulation exists) ===
      if (insulation > 0) {
        const insulationRadius = totalRadius
        const insulationHalfLength = lengthM / 2 // Full insulation length
        
        // Top points of insulation (front and back)
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y + insulationRadius, worldPosition.z), 
          type: 'vertex' 
        })
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y + insulationRadius, worldPosition.z), 
          type: 'vertex' 
        })
        
        // Bottom points of insulation (front and back)
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y - insulationRadius, worldPosition.z), 
          type: 'vertex' 
        })
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y - insulationRadius, worldPosition.z), 
          type: 'vertex' 
        })
        
        // Side points of insulation (front and back)
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y, worldPosition.z + insulationRadius), 
          type: 'vertex' 
        })
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y, worldPosition.z + insulationRadius), 
          type: 'vertex' 
        })
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y, worldPosition.z - insulationRadius), 
          type: 'vertex' 
        })
        this.snapPoints.push({ 
          point: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y, worldPosition.z - insulationRadius), 
          type: 'vertex' 
        })
        
        // Edge lines for insulation
        this.snapPoints.push({
          start: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y + insulationRadius, worldPosition.z),
          end: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y + insulationRadius, worldPosition.z),
          type: 'edge'
        })
        this.snapPoints.push({
          start: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y - insulationRadius, worldPosition.z),
          end: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y - insulationRadius, worldPosition.z),
          type: 'edge'
        })
        this.snapPoints.push({
          start: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y, worldPosition.z + insulationRadius),
          end: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y, worldPosition.z + insulationRadius),
          type: 'edge'
        })
        this.snapPoints.push({
          start: new THREE.Vector3(worldPosition.x - insulationHalfLength, worldPosition.y, worldPosition.z - insulationRadius),
          end: new THREE.Vector3(worldPosition.x + insulationHalfLength, worldPosition.y, worldPosition.z - insulationRadius),
          type: 'edge'
        })
      }
    }

    return pipeGroup
  }

  /**
   * Update pipe material (for selection, color changes, etc.)
   */
  updatePipeMaterial(pipeGroup, materialType) {
    if (!pipeGroup) return

    const mainPipe = pipeGroup.getObjectByName('MainPipe')
    const insulation = pipeGroup.getObjectByName('Insulation')
    
    if (mainPipe) {
      mainPipe.material = this.materials[materialType] || this.materials.copper
    }
    
    if (insulation && materialType.includes('Selected')) {
      insulation.material = this.materials.insulationSelected
    } else if (insulation) {
      insulation.material = this.materials.insulation
    }
  }

  /**
   * Get material type based on pipe type and state
   */
  getMaterialType(pipeType, selected = false, hover = false) {
    const baseType = pipeType.toLowerCase()
    if (selected) return `${baseType}Selected`
    if (hover) return `${baseType}Hover`
    return baseType
  }

  /**
   * Update pipe appearance (normal, hover, selected)
   */
  updatePipeAppearance(pipeGroup, appearance) {
    if (!pipeGroup) return

    const pipeData = pipeGroup.userData.pipeData
    if (!pipeData) return

    const mainPipe = pipeGroup.getObjectByName('MainPipe')
    const insulation = pipeGroup.getObjectByName('Insulation')
    
    let materialType
    switch (appearance) {
      case 'selected':
        materialType = this.getMaterialType(pipeData.pipeType, true, false)
        break
      case 'hover':
        materialType = this.getMaterialType(pipeData.pipeType, false, true)
        break
      case 'normal':
      default:
        materialType = this.getMaterialType(pipeData.pipeType, false, false)
        break
    }

    // Handle custom color
    if (pipeData.color && appearance === 'normal') {
      const customMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color(pipeData.color),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
      if (mainPipe) mainPipe.material = customMaterial
    } else {
      // Use predefined materials
      if (mainPipe && this.materials[materialType]) {
        mainPipe.material = this.materials[materialType]
      }
    }
    
    // Update insulation appearance
    if (insulation) {
      if (appearance === 'selected') {
        insulation.material = this.materials.insulationSelected
      } else {
        insulation.material = this.materials.insulation
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