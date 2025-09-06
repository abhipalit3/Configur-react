/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

/**
 * Common 3D Helper Functions for MEP Components
 * Centralized utilities to avoid code duplication across editors and renderers
 */

/**
 * Update screen position of an editor UI element based on 3D object position
 * @param {THREE.Object3D} object3D - The 3D object to track
 * @param {THREE.Camera} camera - The camera
 * @param {THREE.WebGLRenderer} renderer - The renderer
 * @param {number} yOffset - Vertical offset in meters below the object
 * @returns {{x: number, y: number} | null} Screen position or null if invalid
 */
export function calculateScreenPosition(object3D, camera, renderer, yOffset = 0.3) {
  if (!object3D || !camera || !renderer) return null
  
  try {
    // Get object position in world coordinates
    const worldPos = new THREE.Vector3()
    object3D.getWorldPosition(worldPos)
    
    // Validate world position
    if (!isFinite(worldPos.x) || !isFinite(worldPos.y) || !isFinite(worldPos.z)) {
      console.warn('⚠️ Invalid world position:', worldPos)
      return null
    }
    
    // Apply vertical offset
    worldPos.y -= yOffset
    
    // Project to screen coordinates
    const screenPos = worldPos.clone().project(camera)
    
    // Validate projection
    if (!isFinite(screenPos.x) || !isFinite(screenPos.y) || !isFinite(screenPos.z)) {
      console.warn('⚠️ Invalid screen projection:', screenPos)
      return null
    }
    
    const canvas = renderer.domElement
    if (!canvas || !canvas.clientWidth || !canvas.clientHeight) {
      console.warn('⚠️ Invalid canvas dimensions')
      return null
    }
    
    const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth
    const y = (-screenPos.y * 0.5 + 0.5) * canvas.clientHeight
    
    // Validate final screen coordinates
    if (!isFinite(x) || !isFinite(y)) {
      console.warn('⚠️ Invalid screen coordinates:', { x, y })
      return null
    }
    
    return { x, y }
  } catch (error) {
    console.error('❌ Error calculating screen position:', error)
    return null
  }
}

/**
 * Validate and sanitize dimension input values
 * @param {string} field - The field name being updated
 * @param {any} value - The input value
 * @param {boolean} isInteger - Whether to enforce integer values
 * @returns {number | null} Validated number or null if invalid
 */
export function validateDimensionInput(field, value, isInteger = false) {
  const numValue = parseFloat(value)
  
  if (isNaN(numValue) || !isFinite(numValue)) {
    console.warn(`❌ Invalid ${field} value: ${value}`)
    return null
  }
  
  // Ensure positive values for dimensions
  if (field === 'tier') {
    return Math.max(1, Math.floor(numValue))
  }
  
  if (isInteger) {
    return Math.max(0, Math.floor(numValue))
  }
  
  return Math.max(0, numValue)
}

/**
 * Get tier options from rack geometry snap lines
 * @param {Object} snapLineManager - The snap line manager instance
 * @returns {number[]} Array of tier numbers
 */
export function getTierOptionsFromGeometry(snapLineManager) {
  try {
    if (!snapLineManager || !snapLineManager.getSnapLinesFromRackGeometry) {
      return [1, 2] // Default fallback
    }
    
    const snapLines = snapLineManager.getSnapLinesFromRackGeometry()
    
    if (!snapLines || !snapLines.horizontal) {
      return [1, 2]
    }
    
    // Get all horizontal snap lines and sort them by Y position (top to bottom)
    const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
    
    // Group beam_top and beam_bottom pairs to identify tiers
    const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')
    const beamBottoms = allHorizontalLines.filter(line => line.type === 'beam_bottom')
    
    // Combine all beam positions and group them to find tier spaces
    const allBeamPositions = [...beamTops, ...beamBottoms].map(b => b.y).sort((a, b) => b - a)
    
    // Find tier spaces - look for gaps between beams that are large enough for MEP
    const tierSpaces = []
    const minTierHeight = 0.3 // Minimum 30cm tier height in meters
    
    for (let i = 0; i < allBeamPositions.length - 1; i++) {
      const topY = allBeamPositions[i]
      const bottomY = allBeamPositions[i + 1]
      const gap = topY - bottomY
      
      // If gap is large enough, it's a potential tier space
      if (gap >= minTierHeight && isFinite(gap)) {
        tierSpaces.push({
          tierIndex: tierSpaces.length + 1,
          top: topY,
          bottom: bottomY,
          height: gap,
          centerY: (topY + bottomY) / 2
        })
      }
    }
    
    if (tierSpaces.length > 0) {
      return Array.from({ length: tierSpaces.length }, (_, i) => i + 1)
    }
    
    // Fallback: if we can't identify tier spaces, use beam count heuristic
    if (beamTops.length > 0) {
      const tierCount = Math.max(1, Math.ceil(beamTops.length / 2))
      return Array.from({ length: tierCount }, (_, i) => i + 1)
    }
  } catch (error) {
    console.error('Error getting tier options from geometry:', error)
  }
  
  return [1, 2] // Final fallback
}

/**
 * Find tier space information for a specific tier number
 * @param {Object} snapLineManager - The snap line manager instance
 * @param {number} tierNumber - The tier number to find
 * @returns {Object | null} Tier space info with {tierIndex, top, bottom, height, centerY} or null
 */
export function findTierSpace(snapLineManager, tierNumber) {
  try {
    if (!snapLineManager || !snapLineManager.getSnapLinesFromRackGeometry) {
      return null
    }
    
    const snapLines = snapLineManager.getSnapLinesFromRackGeometry()
    
    if (!snapLines || !snapLines.horizontal) {
      return null
    }
    
    const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
    const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
    
    // Find tier spaces
    const tierSpaces = []
    const minTierHeight = 0.3 // Minimum 30cm tier height in meters
    
    for (let i = 0; i < allBeamPositions.length - 1; i++) {
      const topY = allBeamPositions[i]
      const bottomY = allBeamPositions[i + 1]
      
      // Validate beam positions
      if (!isFinite(topY) || !isFinite(bottomY)) {
        console.warn('❌ Invalid beam position:', { topY, bottomY })
        continue
      }
      
      const gap = topY - bottomY
      
      if (gap >= minTierHeight && isFinite(gap)) {
        tierSpaces.push({
          tierIndex: tierSpaces.length + 1,
          top: topY,
          bottom: bottomY,
          height: gap,
          centerY: isFinite(topY + bottomY) ? (topY + bottomY) / 2 : topY
        })
      }
    }
    
    // Find the tier space that corresponds to the selected tier number
    return tierSpaces.find(space => space.tierIndex === tierNumber) || null
  } catch (error) {
    console.error('Error finding tier space:', error)
    return null
  }
}

/**
 * Calculate Y position for MEP component based on tier and dimensions
 * @param {Object} tierSpace - Tier space info from findTierSpace
 * @param {number} componentHeight - Height of the component in meters
 * @param {string} alignment - 'bottom', 'center', or 'top'
 * @returns {number} Y position in meters
 */
export function calculateTierYPosition(tierSpace, componentHeight, alignment = 'bottom') {
  if (!tierSpace) {
    console.warn('⚠️ No tier space provided for Y position calculation')
    return 0
  }
  
  const halfHeight = componentHeight / 2
  
  switch (alignment) {
    case 'bottom':
      // Position so bottom sits on the bottom beam of the tier space
      return tierSpace.bottom + halfHeight
    
    case 'center':
      // Center within the tier space
      return tierSpace.centerY
    
    case 'top':
      // Position so top is at the top of the tier space
      return tierSpace.top - halfHeight
    
    default:
      return tierSpace.bottom + halfHeight
  }
}

/**
 * Calculate tier position for components (legacy compatibility)
 * @param {Object} snapLineManager - The snap line manager instance
 * @param {number} tierNumber - The tier number
 * @returns {{y: number}} Object with Y position
 */
export function calculateTierPosition(snapLineManager, tierNumber) {
  try {
    if (snapLineManager) {
      const snapLines = snapLineManager.getSnapLinesFromRackGeometry()
      const allHorizontalLines = snapLines.horizontal.filter(line => isFinite(line.y)).sort((a, b) => b.y - a.y)

      const tierSpaces = []
      const minTierHeight = 0.3

      const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')

      for (let i = 0; i < beamTops.length - 1; i++) {
        const bottomBeam = beamTops[i + 1]
        const topBeam = beamTops[i]
        
        if (bottomBeam && topBeam) {
          const gap = topBeam.y - bottomBeam.y
          if (gap >= minTierHeight && isFinite(gap)) {
            tierSpaces.push({
              tierIndex: tierSpaces.length + 1,
              topBeamY: topBeam.y,
              bottomBeamY: bottomBeam.y,
              centerY: (topBeam.y + bottomBeam.y) / 2,
              defaultY: bottomBeam.y
            })
          }
        }
      }

      const tierSpace = tierSpaces.find(space => space.tierIndex === tierNumber)
      if (tierSpace) {
        return { y: tierSpace.defaultY }
      }
    }

    const tierHeightFeet = 2
    const tierHeightMeters = tierHeightFeet * 0.3048
    return { y: (tierNumber - 1) * tierHeightMeters }
  } catch (error) {
    console.error('❌ Error calculating tier position:', error)
    return { y: (tierNumber - 1) * 0.6 }
  }
}

/**
 * Dispose of Three.js geometry and materials properly
 * @param {THREE.Object3D} object - The object to dispose
 */
export function disposeObject3D(object) {
  if (!object) return
  
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }
    
    if (child.material) {
      // Handle material maps
      if (child.material.map) child.material.map.dispose()
      if (child.material.normalMap) child.material.normalMap.dispose()
      if (child.material.roughnessMap) child.material.roughnessMap.dispose()
      if (child.material.metalnessMap) child.material.metalnessMap.dispose()
      
      // Dispose material itself
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}

/**
 * Create standard button hover handlers
 * @returns {Object} Object with onMouseOver and onMouseOut handlers
 */
export function createButtonHoverHandlers(normalStyle, hoverStyle) {
  return {
    onMouseOver: (e) => {
      Object.assign(e.target.style, hoverStyle)
    },
    onMouseOut: (e) => {
      Object.assign(e.target.style, normalStyle)
    }
  }
}

/**
 * Convert feet-inches object to feet
 * @param {Object|number} feetInches - Either a number or {feet, inches} object
 * @returns {number} Total feet value
 */
export function convertToFeet(feetInches) {
  if (typeof feetInches === 'number') {
    if (!isFinite(feetInches)) {
      console.warn('❌ Invalid numeric feet value:', feetInches)
      return 0
    }
    return feetInches // backwards compatibility
  }
  
  if (!feetInches || typeof feetInches !== 'object') {
    console.warn('❌ Invalid feetInches object:', feetInches)
    return 0
  }
  
  const feet = feetInches.feet || 0
  const inches = feetInches.inches || 0
  
  if (!isFinite(feet) || !isFinite(inches)) {
    console.warn('❌ Invalid feet/inches values:', { feet, inches })
    return 0
  }
  
  return feet + (inches / 12)
}

/**
 * Calculate rack length from parameters
 * @param {Object} params - Rack parameters
 * @returns {number} Rack length in feet
 */
export function calculateRackLength(params) {
  if (!params) return 12 // Default
  
  if (params.getRackLength && typeof params.getRackLength === 'function') {
    return params.getRackLength()
  }
  
  if (params.rackLength) {
    return convertToFeet(params.rackLength)
  }
  
  if (params.totalLength) {
    return params.totalLength
  }
  
  if (params.bayCount && params.bayWidth) {
    return params.bayCount * params.bayWidth
  }
  
  return 12 // Default 12 feet
}

/**
 * Create animation frame loop with cleanup
 * @param {Function} updateFunction - Function to call on each frame
 * @param {Object} mountedRef - React ref to check if component is still mounted
 * @returns {Function} Cleanup function to stop animation
 */
export function createAnimationLoop(updateFunction, mountedRef) {
  let isAnimating = true
  let animationId
  
  const animate = () => {
    if (!isAnimating || (mountedRef && !mountedRef.current)) return
    updateFunction()
    animationId = requestAnimationFrame(animate)
  }
  
  animationId = requestAnimationFrame(animate)
  
  // Return cleanup function
  return () => {
    isAnimating = false
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }
}

/**
 * Standard editor keyboard handlers
 * @param {Function} onSave - Save callback
 * @param {Function} onCancel - Cancel callback
 * @returns {Function} Keyboard event handler
 */
export function createEditorKeyHandler(onSave, onCancel) {
  return (event) => {
    if (event.key === 'Enter' && onSave) {
      onSave()
    }
    if (event.key === 'Escape' && onCancel) {
      onCancel()
    }
  }
}

/**
 * Setup standard transform controls for MEP components
 * @param {THREE.Camera} camera - The camera
 * @param {HTMLElement} domElement - The renderer DOM element
 * @param {THREE.Scene} scene - The scene to add gizmo to
 * @param {Object} orbitControls - Orbit controls to disable during dragging
 * @param {Object} options - Configuration options
 * @returns {TransformControls} Configured transform controls
 */
export function setupTransformControls(camera, domElement, scene, orbitControls, options = {}) {
  const transformControls = new TransformControls(camera, domElement)
  
  // Standard configuration for MEP components
  transformControls.setMode('translate')
  transformControls.setSpace('world')
  transformControls.setSize(options.size || 0.8)
  transformControls.showX = options.showX !== undefined ? options.showX : false
  transformControls.showY = options.showY !== undefined ? options.showY : true
  transformControls.showZ = options.showZ !== undefined ? options.showZ : true
  
  // Handle dragging interaction with orbit controls
  transformControls.addEventListener('dragging-changed', (event) => {
    if (orbitControls) {
      orbitControls.enabled = !event.value
    }
    
    // Also try global orbit controls
    if (window.orbitControls) {
      window.orbitControls.enabled = !event.value
    }
    
    if (!event.value && options.onDragEnd) {
      options.onDragEnd()
    }
  })
  
  // Handle transform changes
  if (options.onChange) {
    transformControls.addEventListener('change', options.onChange)
  }
  
  // Add gizmo to scene
  const gizmo = transformControls.getHelper()
  scene.add(gizmo)
  
  return transformControls
}

/**
 * Register component with MEP selection manager
 * @param {string} handlerName - Name for the handler (e.g., 'ductwork', 'piping')
 * @param {Object} handlerInstance - The handler instance to register
 * @param {Function} fallbackSetup - Optional fallback setup function
 */
export function registerWithMepManager(handlerName, handlerInstance, fallbackSetup) {
  const tryRegister = () => {
    // Dynamic import to avoid circular dependencies
    import('../core/MepSelectionManager.js').then(({ getMepSelectionManager }) => {
      const mepManager = getMepSelectionManager()
      if (mepManager) {
        mepManager.registerHandler(handlerName, handlerInstance)
        return true
      }
      return false
    }).catch(() => {
      if (fallbackSetup) {
        fallbackSetup()
      }
    })
  }
  
  // Try registration with delays to handle initialization timing
  setTimeout(() => tryRegister(), 100)
  setTimeout(() => tryRegister(), 500)
}

/**
 * Setup standard raycaster for MEP interactions
 * @param {THREE.Camera} camera - The camera
 * @returns {THREE.Raycaster} Configured raycaster
 */
export function setupRaycaster(camera) {
  const raycaster = new THREE.Raycaster()
  raycaster.near = 0.01
  raycaster.far = 1000
  raycaster.camera = camera
  return raycaster
}

/**
 * Update mouse coordinates for raycasting
 * @param {MouseEvent} event - Mouse event
 * @param {HTMLElement} domElement - Renderer DOM element  
 * @param {THREE.Vector2} mouseVector - Mouse vector to update
 */
export function updateMouseCoordinates(event, domElement, mouseVector) {
  const rect = domElement.getBoundingClientRect()
  mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

/**
 * Standard keyboard shortcut handler for MEP interactions
 * @param {string} selectedItemName - Name of the selected item for logging
 * @param {Object} handlers - Object with keyboard handler functions
 * @returns {Function} Keyboard event handler
 */
export function createMepKeyboardHandler(selectedItemName, handlers) {
  return (event) => {
    if (!handlers.hasSelection || !handlers.hasSelection()) return
    
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (handlers.onDelete) {
          console.log(`🗑️ Deleting ${selectedItemName}`)
          handlers.onDelete()
        }
        break
        
      case 'Escape':
        if (handlers.onDeselect) {
          console.log(`🔲 Deselecting ${selectedItemName}`)
          handlers.onDeselect()
        }
        break
        
      case 'd':
      case 'D':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          if (handlers.onDuplicate) {
            console.log(`📋 Duplicating ${selectedItemName}`)
            handlers.onDuplicate()
          }
        }
        break
        
      case 'c':
      case 'C':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          if (handlers.onCopy) {
            console.log(`📄 Copying ${selectedItemName}`)
            handlers.onCopy()
          }
        }
        break
        
      case 'v':
      case 'V':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          if (handlers.onPaste) {
            console.log(`📋 Pasting ${selectedItemName}`)
            handlers.onPaste()
          }
        }
        break
    }
  }
}