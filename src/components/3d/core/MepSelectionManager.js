/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

/**
 * MepSelectionManager - Centralized MEP selection system
 * Handles click and hover events across all MEP types to ensure only the topmost item is selected
 */
export class MepSelectionManager {
  constructor(scene, camera, renderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.raycaster = new THREE.Raycaster()
    this.raycaster.near = 0.01
    this.raycaster.far = 1000
    this.mouse = new THREE.Vector2()
    
    // Registry of MEP interaction handlers
    this.mepHandlers = {
      ductwork: null,
      piping: null,
      conduits: null,
      cableTrays: null,
      tradeRack: null
    }
    
    // Group name mappings
    this.groupMappings = {
      'DuctworkGroup': 'ductwork',
      'DuctsGroup': 'ductwork',
      'PipingGroup': 'piping', 
      'PipesGroup': 'piping',
      'ConduitsGroup': 'conduits',
      'ConduitGroup': 'conduits',
      'CableTrays': 'cableTrays',
      'CableTraysGroup': 'cableTrays',
      'CableTrayGroup': 'cableTrays'
    }
    
    
    this.setupEventListeners()
  }
  
  /**
   * Register a MEP interaction handler
   */
  registerHandler(mepType, handler) {
    this.mepHandlers[mepType] = handler
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.domElement = this.renderer.domElement
    this.boundClickHandler = this.handleClick.bind(this)
    this.boundMoveHandler = this.handleMouseMove.bind(this)
    
    // Use capture phase to intercept events before individual MEP handlers
    this.domElement.addEventListener('click', this.boundClickHandler, true)
    this.domElement.addEventListener('mousemove', this.boundMoveHandler, true)
  }
  
  /**
   * Handle mouse click with unified MEP selection
   */
  handleClick(event) {
    // Check if any transform controls are dragging
    const isDragging = Object.values(this.mepHandlers).some(handler => 
      handler?.transformControls?.dragging
    )
    if (isDragging) return
    
    // Update mouse position
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Cast ray
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Find closest MEP object
    const closestMep = this.findClosestMepObject()
    
    if (closestMep) {
      // Deselect all other MEP types
      this.deselectAllExcept(closestMep.mepType)
      
      // Select the closest MEP
      this.selectMep(closestMep.mepType, closestMep.object, event)
      
      // Stop event propagation to prevent individual handlers from running
      event.stopPropagation()
      event.preventDefault()
    } else {
      // No MEP found, deselect all
      this.deselectAll()
    }
  }
  
  /**
   * Handle mouse move for hover effects
   */
  handleMouseMove(event) {
    // Check if any transform controls are dragging
    const isDragging = Object.values(this.mepHandlers).some(handler => 
      handler?.transformControls?.dragging
    )
    if (isDragging) return
    
    // Update mouse position
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Cast ray
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Find closest MEP object
    const closestMep = this.findClosestMepObject()
    
    if (closestMep) {
      // Clear hover on all other MEP types
      this.clearHoverAllExcept(closestMep.mepType)
      
      // Apply hover to closest MEP
      this.setHoverMep(closestMep.mepType, closestMep.object)
    } else {
      // Clear all hover effects
      this.clearHoverAll()
    }
  }
  
  /**
   * Find the closest MEP object across all MEP types
   */
  findClosestMepObject() {
    const allMepGroups = []
    
    // Find all MEP groups in the scene
    this.scene.traverse((child) => {
      if (child.isGroup && this.groupMappings[child.name]) {
        allMepGroups.push({
          group: child,
          mepType: this.groupMappings[child.name]
        })
      }
      // Also check for trade racks by userData.type
      if (child.userData && child.userData.type === 'tradeRack' && child.userData.selectable) {
        allMepGroups.push({
          group: child,
          mepType: 'tradeRack'
        })
      }
    })
    
    if (allMepGroups.length === 0) return null
    
    // Collect all intersections from all MEP groups
    const allIntersects = []
    allMepGroups.forEach(({ group, mepType }) => {
      if (mepType === 'tradeRack') {
        // For trade racks, be more selective - only intersect with actual mesh children, not the whole group
        const rackMeshes = []
        group.traverse((child) => {
          if (child.isMesh && child.visible) {
            rackMeshes.push(child)
          }
        })
        const groupIntersects = this.raycaster.intersectObjects(rackMeshes, false) // Don't traverse further
        groupIntersects.forEach(intersect => {
          allIntersects.push({
            ...intersect,
            mepType,
            group
          })
        })
      } else {
        // For other MEP types, use the existing logic
        const groupIntersects = this.raycaster.intersectObjects(group.children, true)
        groupIntersects.forEach(intersect => {
          allIntersects.push({
            ...intersect,
            mepType,
            group
          })
        })
      }
    })
    
    if (allIntersects.length === 0) return null
    
    // Sort by distance and return closest
    allIntersects.sort((a, b) => a.distance - b.distance)
    return allIntersects[0]
  }
  
  /**
   * Select a specific MEP type
   */
  selectMep(mepType, object, event) {
    const handler = this.mepHandlers[mepType]
    if (!handler) return
    
    try {
      switch (mepType) {
        case 'ductwork':
          const ductGroup = handler.findDuctGroup ? handler.findDuctGroup(object) : this.findMepGroupFromObject(object, 'duct')
          if (ductGroup && ductGroup !== handler.selectedDuct) {
            handler.selectDuct(ductGroup)
          }
          break
          
        case 'piping':
          const pipeGroup = handler.findPipeGroup ? handler.findPipeGroup(object) : this.findMepGroupFromObject(object, 'pipe')
          if (pipeGroup && pipeGroup !== handler.selectedPipe) {
            handler.selectPipe(pipeGroup)
          }
          break
          
        case 'conduits':
          // For conduits, we need to find the multi-conduit group
          let conduitGroup = object
          while (conduitGroup && conduitGroup.userData?.type !== 'conduit' && conduitGroup.userData?.type !== 'multiConduit') {
            conduitGroup = conduitGroup.parent
          }
          if (conduitGroup && conduitGroup !== handler.selectedConduit) {
            handler.selectConduit(conduitGroup)
          }
          break
          
        case 'cableTrays':
          let cableTrayGroup = object
          while (cableTrayGroup && !cableTrayGroup.userData?.isCableTrayGroup) {
            cableTrayGroup = cableTrayGroup.parent
          }
          if (cableTrayGroup && cableTrayGroup !== handler.selectedCableTrayGroup) {
            handler.selectCableTray(cableTrayGroup)
          }
          break
          
        case 'tradeRack':
          // Find the trade rack group from the intersected object
          let tradeRackGroup = object
          while (tradeRackGroup && tradeRackGroup.userData?.type !== 'tradeRack') {
            tradeRackGroup = tradeRackGroup.parent
          }
          if (tradeRackGroup && tradeRackGroup !== handler.selectedRack) {
            handler.selectObject(tradeRackGroup)
          }
          break
      }
    } catch (error) {
      console.error(`Error selecting ${mepType}:`, error)
    }
  }
  
  /**
   * Set hover for a specific MEP type
   */
  setHoverMep(mepType, object) {
    const handler = this.mepHandlers[mepType]
    if (!handler) return
    
    try {
      switch (mepType) {
        case 'ductwork':
          const ductGroup = handler.findDuctGroup ? handler.findDuctGroup(object) : this.findMepGroupFromObject(object, 'duct')
          if (ductGroup && ductGroup !== handler.selectedDuct) {
            handler.ductGeometry?.updateDuctAppearance(ductGroup, 'hover')
            this.renderer.domElement.style.cursor = 'pointer'
          }
          break
          
        case 'piping':
          const pipeGroup = handler.findPipeGroup ? handler.findPipeGroup(object) : this.findMepGroupFromObject(object, 'pipe')
          if (pipeGroup && pipeGroup !== handler.selectedPipe) {
            handler.pipeGeometry?.updatePipeAppearance(pipeGroup, 'hover')
            this.renderer.domElement.style.cursor = 'pointer'
          }
          break
          
        case 'conduits':
          // For conduits, we need to find the multi-conduit group (parent of individual conduits)
          let conduitMesh = object
          while (conduitMesh && conduitMesh.userData?.type !== 'conduit') {
            conduitMesh = conduitMesh.parent
          }
          
          // Now find the multi-conduit group that contains this conduit
          let multiConduitGroup = null
          if (conduitMesh) {
            let parent = conduitMesh.parent
            while (parent) {
              if (parent.userData?.type === 'multiConduit') {
                multiConduitGroup = parent
                break
              }
              parent = parent.parent
            }
          }
          
          if (multiConduitGroup && multiConduitGroup !== handler.selectedConduit) {
            // Apply hover effect to the entire multi-conduit group
            if (handler.updateGroupAppearance) {
              handler.updateGroupAppearance(multiConduitGroup, 'hover')
            }
            this.renderer.domElement.style.cursor = 'pointer'
          }
          break
          
        case 'cableTrays':
          let cableTrayGroup = object
          while (cableTrayGroup && !cableTrayGroup.userData?.isCableTrayGroup) {
            cableTrayGroup = cableTrayGroup.parent
          }
          if (cableTrayGroup && cableTrayGroup !== handler.selectedCableTrayGroup) {
            handler.setHoverCableTray?.(cableTrayGroup)
          }
          break
          
        case 'tradeRack':
          // Find the trade rack group from the intersected object
          let tradeRackGroup = object
          while (tradeRackGroup && tradeRackGroup.userData?.type !== 'tradeRack') {
            tradeRackGroup = tradeRackGroup.parent
          }
          if (tradeRackGroup && tradeRackGroup !== handler.selectedRack) {
            handler.setHover?.(tradeRackGroup)
            this.renderer.domElement.style.cursor = 'pointer'
          }
          break
      }
    } catch (error) {
      console.error(`Error setting hover for ${mepType}:`, error)
    }
  }
  
  /**
   * Find MEP group from object by traversing up the hierarchy
   */
  findMepGroupFromObject(object, mepType) {
    let current = object
    while (current && current.parent) {
      if (current.userData?.type === mepType) {
        return current
      }
      current = current.parent
    }
    return null
  }
  
  /**
   * Deselect all MEP types except the specified one
   */
  deselectAllExcept(exceptType) {
    Object.entries(this.mepHandlers).forEach(([type, handler]) => {
      if (type !== exceptType && handler) {
        try {
          switch (type) {
            case 'ductwork':
              handler.deselectDuct?.()
              break
            case 'piping':
              handler.deselectPipe?.()
              break
            case 'conduits':
              handler.deselectConduit?.()
              break
            case 'cableTrays':
              handler.deselectCableTray?.()
              break
            case 'tradeRack':
              handler.deselectAll?.()
              break
          }
        } catch (error) {
          console.error(`Error deselecting ${type}:`, error)
        }
      }
    })
  }
  
  /**
   * Deselect all MEP types
   */
  deselectAll() {
    this.deselectAllExcept(null)
  }
  
  /**
   * Clear hover on all MEP types except the specified one
   */
  clearHoverAllExcept(exceptType) {
    Object.entries(this.mepHandlers).forEach(([type, handler]) => {
      if (type !== exceptType && handler) {
        try {
          switch (type) {
            case 'ductwork':
              // Reset duct hover
              const ductworkGroup = this.scene.getObjectByName('DuctworkGroup')
              if (ductworkGroup && handler.ductGeometry) {
                ductworkGroup.children.forEach(ductGroup => {
                  if (ductGroup !== handler.selectedDuct) {
                    handler.ductGeometry.updateDuctAppearance(ductGroup, 'normal')
                  }
                })
              }
              break
              
            case 'piping':
              // Reset pipe hover
              const pipingGroup = this.scene.getObjectByName('PipingGroup')
              if (pipingGroup && handler.pipeGeometry) {
                pipingGroup.children.forEach(pipeGroup => {
                  if (pipeGroup.userData.type === 'pipe' && pipeGroup !== handler.selectedPipe) {
                    handler.pipeGeometry.updatePipeAppearance(pipeGroup, 'normal')
                  }
                })
              }
              break
              
            case 'conduits':
              // Reset conduit hover
              const conduitsGroup = this.scene.getObjectByName('ConduitsGroup')
              if (conduitsGroup && handler.updateGroupAppearance) {
                conduitsGroup.children.forEach(conduitGroup => {
                  if ((conduitGroup.userData.type === 'conduit' || conduitGroup.userData.type === 'multiConduit') && conduitGroup !== handler.selectedConduit) {
                    handler.updateGroupAppearance(conduitGroup, 'normal')
                  }
                })
              }
              break
              
            case 'cableTrays':
              handler.clearHoverCableTray?.()
              break
            case 'tradeRack':
              handler.clearHover?.()
              break
          }
        } catch (error) {
          console.error(`Error clearing hover for ${type}:`, error)
        }
      }
    })
  }
  
  /**
   * Clear hover on all MEP types
   */
  clearHoverAll() {
    this.clearHoverAllExcept(null)
    this.renderer.domElement.style.cursor = 'default'
  }
  
  /**
   * Dispose of the selection manager
   */
  dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.boundClickHandler, true)
      this.domElement.removeEventListener('mousemove', this.boundMoveHandler, true)
    }
  }
}

// Create global instance
let globalMepSelectionManager = null

/**
 * Initialize global MEP selection manager
 */
export function initializeMepSelectionManager(scene, camera, renderer) {
  if (globalMepSelectionManager) {
    globalMepSelectionManager.dispose()
  }
  
  globalMepSelectionManager = new MepSelectionManager(scene, camera, renderer)
  
  // Make it globally available
  window.mepSelectionManager = globalMepSelectionManager
  
  return globalMepSelectionManager
}

/**
 * Get global MEP selection manager
 */
export function getMepSelectionManager() {
  return globalMepSelectionManager
}