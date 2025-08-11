import * as THREE from 'three'
import { SnapLineManager, DuctGeometry, DuctInteraction } from '../ductwork'

/**
 * DuctworkRenderer - Main controller for 3D ductwork visualization
 * Now modular and much cleaner!
 */
export class DuctworkRenderer {
  constructor(scene, rackParams = {}) {
    this.scene = scene
    this.rackParams = rackParams
    
    // Create main ductwork group
    this.ductworkGroup = new THREE.Group()
    this.ductworkGroup.name = 'DuctworkGroup'
    this.scene.add(this.ductworkGroup)
    
    // Initialize modular components
    try {
      this.snapLineManager = new SnapLineManager(scene, rackParams)
      
      this.ductGeometry = new DuctGeometry()
      
      this.ductInteraction = null // Will be set up in setupInteractions
    } catch (error) {
      console.error('🏭 Error initializing modular components:', error)
      throw error
    }
    
    // Create initial persistent snap lines
    setTimeout(() => {
      try {
        this.snapLineManager.createPersistentSnapLines()
      } catch (error) {
        console.error('🏭 Error creating persistent snap lines:', error)
      }
    }, 100)
  }

  /**
   * Setup interaction controls
   */
  setupInteractions(camera, renderer, orbitControls) {
    this.ductInteraction = new DuctInteraction(
      this.scene, 
      camera, 
      renderer, 
      orbitControls, 
      this.ductGeometry, 
      this.snapLineManager
    )
  }

  /**
   * Update rack parameters
   */
  updateRackParams(rackParams) {
    this.rackParams = { ...this.rackParams, ...rackParams }
    this.snapLineManager.updateRackParams(this.rackParams)
    this.refreshDuctwork()
  }

  /**
   * Recalculate tier information for all ducts based on their current 3D positions
   */
  recalculateTierInfo() {
    if (!this.ductInteraction) return
    
    // Use the new comprehensive tier update method
    this.ductInteraction.updateAllDuctTierInfo()
  }

  /**
   * Refresh all ductwork
   */
  refreshDuctwork() {
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const ductItems = storedMepItems.filter(item => item && item.type === 'duct')
      
      
      if (ductItems.length > 0) {
        this.updateDuctwork(ductItems)
      }
    } catch (error) {
      console.error('🏭 Error refreshing ductwork:', error)
    }
  }

  /**
   * Update ductwork visualization
   */
  updateDuctwork(mepItems) {
    if (!Array.isArray(mepItems)) return
    
    this.clearDuctwork()
    
    const ductItems = mepItems.filter(item => item && item.type === 'duct')
    
    ductItems.forEach(duct => {
      this.createDuct(duct)
    })
    
  }

  /**
   * Create a single duct
   */
  createDuct(ductData) {
    const {
      width = 12,
      height = 8,
      tier = 1,
      position = 'bottom'
    } = ductData

    // Calculate duct length
    const rackLengthFt = this.snapLineManager.getRackLength()
    const ductLength = this.snapLineManager.ft2m(rackLengthFt) + this.snapLineManager.in2m(12)

    let ductPosition
    let calculatedTierInfo = null
    
    // Check if this duct has a saved position
    if (ductData.position && typeof ductData.position === 'object' && ductData.position.x !== undefined) {
      // Use saved position
      ductPosition = new THREE.Vector3(
        ductData.position.x,
        ductData.position.y,
        ductData.position.z
      )
      
      // Calculate tier info based on Y position if not already present
      if (!ductData.tierName && this.ductInteraction) {
        calculatedTierInfo = this.ductInteraction.calculateDuctTier(ductData.position.y)
      }
    } else {
      // Calculate default position within tier
      const yPos = this.calculateDuctYPosition(ductData, tier, position)
      ductPosition = new THREE.Vector3(0, yPos, 0)
      
      // Calculate tier info for new position
      if (this.ductInteraction) {
        calculatedTierInfo = this.ductInteraction.calculateDuctTier(yPos)
      }
    }
    
    // Update duct data with tier info if calculated
    if (calculatedTierInfo && !ductData.tierName) {
      ductData.tier = calculatedTierInfo.tier
      ductData.tierName = calculatedTierInfo.tierName
      
      // Update in localStorage too
      try {
        const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
        const updatedItems = storedMepItems.map(item => {
          if (item.id === ductData.id) {
            return { ...item, tier: calculatedTierInfo.tier, tierName: calculatedTierInfo.tierName }
          }
          return item
        })
        localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      } catch (error) {
        console.error('Error updating tier info:', error)
      }
    }
    
    // Create duct group using modular geometry
    const ductGroup = this.ductGeometry.createDuctGroup(
      ductData,
      ductLength,
      ductPosition
    )
    
    this.ductworkGroup.add(ductGroup)
  }

  /**
   * Calculate duct Y position within tier
   * Tier 1 = topmost tier, Tier 2 = below it, etc.
   * Duct bottom sits on the TOP surface of the bottom beam in each tier
   */
  calculateDuctYPosition(ductData, tier = 1, position = 'bottom') {
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    
    // Get beam top surfaces (where ducts sit)
    const beamTopSurfaces = snapLines.horizontal
      .filter(line => line.type === 'beam_top')
      .sort((a, b) => b.y - a.y) // Top to bottom (highest Y first)
    
    
    if (beamTopSurfaces.length === 0) {
      console.warn('⚠️ No beam top surfaces found, using fallback position')
      return 2 - (tier - 1) * 2 // Fallback
    }
    
    // Calculate duct dimensions
    const heightM = this.snapLineManager.in2m(ductData.height || 8)
    const insulationM = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalHeight = heightM + (2 * insulationM)
    
    // Tier mapping: 
    // Tier 1 = topmost tier, use the top surface of the bottom beam in tier 1
    // Tier 2 = next tier down, use the top surface of the bottom beam in tier 2
    // Each tier has 2 beams (top and bottom), we want the TOP surface of the bottom beam
    const tierIndex = (tier - 1) * 2 + 1 // +1 to get the bottom beam of the tier
    
    if (tierIndex < beamTopSurfaces.length) {
      const tierBeamTop = beamTopSurfaces[tierIndex]
      // Position duct so its bottom sits on the beam top surface
      const ductCenterY = tierBeamTop.y + (totalHeight / 2)
      
      
      return ductCenterY
    }
    
    // Fallback - use the lowest available beam top
    console.warn(`⚠️ Tier ${tier} not available, using lowest beam`)
    const lowestBeam = beamTopSurfaces[beamTopSurfaces.length - 1]
    return lowestBeam.y + (totalHeight / 2)
  }


  /**
   * Clear all ductwork
   */
  clearDuctwork() {
    if (this.ductInteraction?.selectedDuct) {
      this.ductInteraction.deselectDuct()
    }
    
    while (this.ductworkGroup.children.length > 0) {
      const child = this.ductworkGroup.children[0]
      this.ductworkGroup.remove(child)
      
      // Dispose geometries and materials
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  }

  /**
   * Get ductwork group
   */
  getDuctworkGroup() {
    return this.ductworkGroup
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.ductworkGroup.visible = visible
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.ductInteraction?.dispose()
    this.snapLineManager.dispose()
    this.ductGeometry.dispose()
    
    this.clearDuctwork()
    this.scene.remove(this.ductworkGroup)
  }
}