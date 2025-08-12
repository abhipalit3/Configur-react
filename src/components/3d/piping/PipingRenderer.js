import * as THREE from 'three'
import { PipeGeometry } from './PipeGeometry.js'
import { PipeInteraction } from './PipeInteraction.js'

/**
 * PipingRenderer - Main class for managing 3D piping system
 */
export class PipingRenderer {
  constructor(scene, camera, renderer, orbitControls, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.snapLineManager = snapLineManager

    // Initialize piping subsystems
    this.pipeGeometry = new PipeGeometry()
    this.pipeInteraction = null // Will be set up in setupInteractions

    // Create piping group
    this.pipingGroup = new THREE.Group()
    this.pipingGroup.name = 'PipingGroup'
    this.scene.add(this.pipingGroup)

    // Rack parameters for positioning
    this.rackParams = {
      tierCount: 2,
      tierHeights: [{ feet: 2, inches: 0 }, { feet: 2, inches: 0 }],
      bayCount: 4,
      bayWidth: { feet: 3, inches: 0 }
    }

    console.log('🔧 PipingRenderer initialized')
  }

  /**
   * Setup interaction controls (similar to DuctworkRenderer)
   */
  setupInteractions(camera, renderer, orbitControls) {
    this.pipeInteraction = new PipeInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls, 
      this.pipeGeometry, 
      this.snapLineManager
    )
  }

  /**
   * Update piping display with new MEP items
   */
  updatePiping(mepItems = []) {
    try {
      // Clear existing pipes
      this.clearPiping()

      // Filter pipe items
      const pipeItems = mepItems.filter(item => item.type === 'pipe')
      
      console.log('🔧 Updating piping display with', pipeItems.length, 'pipes')

      // Create pipes
      pipeItems.forEach((pipeData, index) => {
        this.createPipe(pipeData, index)
      })

      // Update tier information for all pipes
      setTimeout(() => {
        this.pipeInteraction.updateAllPipeTierInfo()
      }, 100)

    } catch (error) {
      console.error('❌ Error updating piping:', error)
    }
  }

  /**
   * Create a single pipe in the 3D scene
   */
  createPipe(pipeData, index = 0) {
    try {
      // Validate pipe data
      if (!pipeData || typeof pipeData !== 'object') {
        console.error('❌ Invalid pipe data:', pipeData)
        return
      }

      // Default pipe parameters with validation
      const diameter = isFinite(pipeData.diameter) ? parseFloat(pipeData.diameter) : 2
      const insulation = isFinite(pipeData.insulation) ? parseFloat(pipeData.insulation) : 0
      const spacing = isFinite(pipeData.spacing) ? parseFloat(pipeData.spacing) : 6
      const count = isFinite(pipeData.count) ? parseInt(pipeData.count) : 1
      const pipeType = pipeData.pipeType || 'copper'

      console.log('🔧 Creating pipes:', { diameter, insulation, spacing, count, pipeType })

      // Use rack length parameter directly to match user input
      const rackLength = this.calculateRackLength()
      const pipeLength = rackLength * 12 // Convert feet to inches

      // Create multiple pipes based on count
      for (let i = 0; i < count; i++) {
        const pipeId = pipeData.id ? `${pipeData.id}_${i}` : `pipe_${Date.now()}_${index}_${i}`
        
        const individualPipeData = {
          ...pipeData,
          id: pipeId,
          diameter: diameter,
          insulation: insulation,
          pipeType: pipeType,
          tier: pipeData.tier || 1
        }

        // Calculate position
        const position = this.calculatePipePosition(individualPipeData, i, spacing)
        
        // Create pipe group
        const pipeGroup = this.pipeGeometry.createPipeGroup(
          individualPipeData,
          pipeLength,
          position
        )

        if (pipeGroup && pipeGroup.children.length > 0) {
          this.pipingGroup.add(pipeGroup)
          console.log('✅ Pipe created:', pipeId)
        } else {
          console.warn('⚠️ Failed to create pipe geometry for:', pipeId)
        }
      }

    } catch (error) {
      console.error('❌ Error creating pipe:', error, pipeData)
    }
  }

  /**
   * Calculate pipe position based on tier and spacing
   */
  calculatePipePosition(pipeData, pipeIndex, spacing) {
    try {
      // Default position at origin
      let x = 0
      let y = 1 // Default height of 1 meter
      let z = pipeIndex * (spacing * 0.0254) // Convert spacing from inches to meters

      // If pipe has a saved position, use it
      if (pipeData.position && 
          isFinite(pipeData.position.x) && 
          isFinite(pipeData.position.y) && 
          isFinite(pipeData.position.z)) {
        return new THREE.Vector3(
          pipeData.position.x,
          pipeData.position.y,
          pipeData.position.z
        )
      }

      // Calculate tier-based position
      const tier = pipeData.tier || 1
      const tierPosition = this.calculateTierPosition(tier)
      
      if (tierPosition && isFinite(tierPosition.y)) {
        y = tierPosition.y
        
        // Adjust for pipe diameter (like ducts adjust for their height)
        const pipeDiameter = this.snapLineManager ? this.snapLineManager.in2m(pipeData.diameter || 2) : 0.05
        const insulation = this.snapLineManager ? this.snapLineManager.in2m(pipeData.insulation || 0) : 0
        const totalDiameter = pipeDiameter + (2 * insulation)
        const pipeRadius = totalDiameter / 2
        
        // Position pipe center so bottom sits on beam (like ducts)
        y = y + pipeRadius
      }

      // Offset pipes slightly from rack center (like ducts)
      x = 0 // Center along rack length
      z = z - (this.getRackWidth() / 2) + 0.3 // Position along rack width with offset (similar to ducts)

      return new THREE.Vector3(x, y, z)
    } catch (error) {
      console.error('❌ Error calculating pipe position:', error)
      return new THREE.Vector3(0, 1, pipeIndex * 0.15) // Fallback position
    }
  }

  /**
   * Calculate Y position for a given tier
   */
  calculateTierPosition(tierNumber) {
    try {
      // Use snap line manager to get tier positions from actual geometry
      if (this.snapLineManager) {
        const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
        const allHorizontalLines = snapLines.horizontal.filter(line => isFinite(line.y)).sort((a, b) => b.y - a.y)

        // Find tier spaces by analyzing beam positions
        const tierSpaces = []
        const minTierHeight = 0.3

        // Group lines by type
        const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')
        const beamBottoms = allHorizontalLines.filter(line => line.type === 'beam_bottom')

        // Create tier spaces from beam pairs
        for (let i = 0; i < beamTops.length - 1; i++) {
          const bottomBeam = beamTops[i + 1] // Lower beam top
          const topBeam = beamTops[i] // Upper beam top
          
          if (bottomBeam && topBeam) {
            const gap = topBeam.y - bottomBeam.y
            if (gap >= minTierHeight && isFinite(gap)) {
              tierSpaces.push({
                tierIndex: tierSpaces.length + 1,
                topBeamY: topBeam.y,
                bottomBeamY: bottomBeam.y,
                centerY: (topBeam.y + bottomBeam.y) / 2,
                // Position pipes on bottom beam (like ducts)
                defaultPipeY: bottomBeam.y
              })
            }
          }
        }

        // Find the requested tier and position pipe on its bottom beam
        const tierSpace = tierSpaces.find(space => space.tierIndex === tierNumber)
        if (tierSpace) {
          return { y: tierSpace.defaultPipeY }
        }
      }

      // Fallback calculation - position on estimated beam
      const tierHeightFeet = 2 // Default tier height
      const tierHeightMeters = tierHeightFeet * 0.3048
      return { y: (tierNumber - 1) * tierHeightMeters } // Subtract 1 to start at ground level
    } catch (error) {
      console.error('❌ Error calculating tier position:', error)
      return { y: (tierNumber - 1) * 0.6 } // Fallback
    }
  }

  /**
   * Calculate rack length from parameters (same as ducts)
   */
  calculateRackLength() {
    try {
      // First try to get from snapLineManager if available (more accurate)
      if (this.snapLineManager && this.snapLineManager.getRackLength) {
        return this.snapLineManager.getRackLength()
      }
      
      // Fallback to rack parameters
      const bayCount = this.rackParams.bayCount || 4
      const bayWidth = this.rackParams.bayWidth || { feet: 3, inches: 0 }
      
      let bayWidthFeet
      if (typeof bayWidth === 'number') {
        bayWidthFeet = bayWidth
      } else {
        bayWidthFeet = (bayWidth.feet || 0) + (bayWidth.inches || 0) / 12
      }
      
      return bayCount * bayWidthFeet
    } catch (error) {
      console.error('❌ Error calculating rack length:', error)
      return 12 // Fallback 12 feet
    }
  }

  /**
   * Get rack width in meters
   */
  getRackWidth() {
    try {
      // Default rack width is typically 4 feet
      return 4 * 0.3048 // Convert feet to meters
    } catch (error) {
      return 1.2 // Fallback 1.2 meters
    }
  }

  /**
   * Update rack parameters
   */
  updateRackParams(params) {
    this.rackParams = { ...this.rackParams, ...params }
    console.log('🔧 Piping rack parameters updated:', this.rackParams)
  }

  /**
   * Clear all pipes from the scene
   */
  clearPiping() {
    try {
      // Clear the piping group
      while (this.pipingGroup.children.length > 0) {
        const pipe = this.pipingGroup.children[0]
        this.pipingGroup.remove(pipe)
        
        // Dispose of geometries and materials
        pipe.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        })
      }
      
      // Deselect any selected pipe
      if (this.pipeInteraction) {
        this.pipeInteraction.deselectPipe()
      }
      
      console.log('🔧 Piping cleared')
    } catch (error) {
      console.error('❌ Error clearing piping:', error)
    }
  }

  /**
   * Get the piping group
   */
  getPipingGroup() {
    return this.pipingGroup
  }

  /**
   * Recalculate tier info for all pipes
   */
  recalculateTierInfo() {
    if (this.pipeInteraction) {
      this.pipeInteraction.updateAllPipeTierInfo()
    }
  }

  /**
   * Dispose of the piping renderer
   */
  dispose() {
    try {
      this.clearPiping()
      
      if (this.pipingGroup) {
        this.scene.remove(this.pipingGroup)
      }
      
      if (this.pipeInteraction) {
        this.pipeInteraction.dispose()
      }
      
      console.log('🔧 PipingRenderer disposed')
    } catch (error) {
      console.error('❌ Error disposing piping renderer:', error)
    }
  }
}