/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { DuctworkRenderer } from '../ductwork'
import { PipingRenderer } from '../piping'
import { ConduitRenderer } from '../conduits'
import { CableTrayRenderer } from '../cable-trays'
import { initializeMepSelectionManager } from '../core/MepSelectionManager.js'

/**
 * Initialize all MEP renderers with rack parameters
 */
export function initializeMepRenderers(scene, camera, renderer, controls, rackParams) {
  const renderers = {}
  
  // Initialize ductwork renderer
  const ductworkRenderer = new DuctworkRenderer(scene, {
    bayCount: rackParams.bayCount,
    bayWidth: rackParams.bayWidth,
    depth: rackParams.depth,
    rackWidth: rackParams.depth,
    tierCount: rackParams.tierCount,
    tierHeights: rackParams.tierHeights,
    topClearance: rackParams.topClearance,
    beamSize: rackParams.beamSize,
    postSize: rackParams.postSize,
    columnSize: rackParams.postSize,
    columnType: 'standard'
  })
  renderers.ductwork = ductworkRenderer
  
  // Make globally accessible
  window.ductworkRendererInstance = ductworkRenderer
  
  // Initialize piping renderer
  const pipingRenderer = new PipingRenderer(
    scene,
    camera, 
    renderer,
    controls,
    ductworkRenderer.snapLineManager // Share snap line manager
  )
  renderers.piping = pipingRenderer
  
  // Make globally accessible
  window.pipingRendererInstance = pipingRenderer
  
  // Update piping renderer with rack parameters
  pipingRenderer.updateRackParams({
    bayCount: rackParams.bayCount,
    bayWidth: rackParams.bayWidth,
    depth: rackParams.depth,
    rackWidth: rackParams.depth,
    tierCount: rackParams.tierCount,
    tierHeights: rackParams.tierHeights,
    topClearance: rackParams.topClearance,
    beamSize: rackParams.beamSize,
    postSize: rackParams.postSize
  })

  // Initialize conduit renderer
  const conduitRenderer = new ConduitRenderer(
    scene,
    camera, 
    renderer,
    controls,
    ductworkRenderer.snapLineManager // Share snap line manager
  )
  renderers.conduit = conduitRenderer
  
  // Make globally accessible
  window.conduitRendererInstance = conduitRenderer
  
  // Update conduit renderer with rack parameters
  conduitRenderer.updateRackParams({
    bayCount: rackParams.bayCount,
    bayWidth: rackParams.bayWidth,
    depth: rackParams.depth,
    rackWidth: rackParams.depth,
    tierCount: rackParams.tierCount,
    tierHeights: rackParams.tierHeights,
    topClearance: rackParams.topClearance,
    beamSize: rackParams.beamSize,
    postSize: rackParams.postSize
  })

  // Initialize cable tray renderer
  const cableTrayRenderer = new CableTrayRenderer(
    scene,
    ductworkRenderer.snapLineManager // Share snap line manager
  )
  renderers.cableTray = cableTrayRenderer
  
  // Make globally accessible
  window.cableTrayRendererInstance = cableTrayRenderer

  return renderers
}

/**
 * Setup interactions for all MEP renderers
 */
export function setupMepInteractions(renderers, camera, renderer, controls) {
  if (renderers.ductwork) {
    renderers.ductwork.setupInteractions(camera, renderer, controls)
  }
  
  if (renderers.piping) {
    renderers.piping.setupInteractions(camera, renderer, controls)
  }
  
  if (renderers.conduit) {
    renderers.conduit.setupInteractions(camera, renderer, controls)
  }
  
  if (renderers.cableTray) {
    renderers.cableTray.setupInteractions(camera, renderer, controls)
  }
}

/**
 * Provide snap points to all MEP geometries
 */
export function setupMepSnapPoints(renderers, snapPoints) {
  if (!snapPoints) return
  
  // Ductwork
  if (renderers.ductwork?.ductGeometry) {
    renderers.ductwork.ductGeometry.setSnapPoints(snapPoints)
  }
  
  // Piping
  if (renderers.piping?.pipeGeometry) {
    renderers.piping.pipeGeometry.setSnapPoints(snapPoints)
  }
  
  // Conduits
  if (renderers.conduit?.conduitGeometry) {
    renderers.conduit.conduitGeometry.setSnapPoints(snapPoints)
  }
  
  // Cable Trays
  if (renderers.cableTray?.cableTrayGeometry) {
    renderers.cableTray.cableTrayGeometry.setSnapPoints(snapPoints)
  }
}

/**
 * Update all MEP renderers with new MEP items
 */
export function updateAllMepItems(renderers, mepItems) {
  if (!mepItems || mepItems.length === 0) return
  
  if (renderers.ductwork) {
    renderers.ductwork.updateDuctwork(mepItems)
  }
  
  if (renderers.piping) {
    renderers.piping.updatePiping(mepItems)
  }
  
  if (renderers.conduit) {
    renderers.conduit.updateConduits(mepItems)
  }
  
  if (renderers.cableTray) {
    renderers.cableTray.updateCableTrays(mepItems)
  }
}

/**
 * Initialize MEP selection manager
 */
export function initializeMepSelection(scene, camera, renderer) {
  const mepSelectionManager = initializeMepSelectionManager(scene, camera, renderer)
  console.log('🎯 MEP Selection Manager initialized in MEP Management')
  return mepSelectionManager
}

/**
 * Setup MEP editor callbacks and selection polling
 */
export function setupMepEditorCallbacks(renderers, editorCallbacks) {
  const pollInterval = setInterval(() => {
    // Poll for duct selection changes
    if (editorCallbacks.handleDuctSelection) {
      editorCallbacks.handleDuctSelection()
    }
    
    // Poll for pipe selection changes
    if (editorCallbacks.handlePipeSelection) {
      editorCallbacks.handlePipeSelection()
    }
    
    // Poll for conduit selection changes
    if (editorCallbacks.handleConduitSelection) {
      editorCallbacks.handleConduitSelection()
    }
    
    // Poll for cable tray selection changes
    if (editorCallbacks.handleCableTraySelection) {
      editorCallbacks.handleCableTraySelection()
    }
  }, 100)
  
  // Return cleanup function
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval)
    }
  }
}

/**
 * Setup periodic tier information updates
 */
export function setupMepTierUpdates(renderers, mepItems) {
  const tierUpdateInterval = setInterval(() => {
    if (mepItems.length === 0) return
    
    // Update duct tier information
    if (renderers.ductwork?.ductInteraction) {
      renderers.ductwork.ductInteraction.updateAllDuctTierInfo()
    }
    
    // Update pipe tier information
    if (renderers.piping?.pipeInteraction) {
      renderers.piping.pipeInteraction.updateAllPipeTierInfo()
    }
    
    // Update cable tray tier information
    if (renderers.cableTray?.cableTrayInteraction) {
      renderers.cableTray.cableTrayInteraction.updateAllCableTrayTierInfo()
    }
  }, 5000) // Update every 5 seconds
  
  // Return cleanup function
  return () => {
    if (tierUpdateInterval) {
      clearInterval(tierUpdateInterval)
    }
  }
}

/**
 * Setup initial MEP items update with delay
 */
export function setupInitialMepUpdate(renderers, mepItems) {
  const initialUpdateTimer = setTimeout(() => {
    if (mepItems && mepItems.length > 0) {
      updateAllMepItems(renderers, mepItems)
    }
  }, 200) // Small delay to ensure everything is ready
  
  // Return cleanup function
  return () => {
    if (initialUpdateTimer) {
      clearTimeout(initialUpdateTimer)
    }
  }
}

/**
 * Cleanup all MEP renderers and global references
 */
export function cleanupMepRenderers(renderers) {
  // Clean up global references
  if (window.ductworkRendererInstance) {
    delete window.ductworkRendererInstance
  }
  if (window.pipingRendererInstance) {
    delete window.pipingRendererInstance
  }
  if (window.conduitRendererInstance) {
    delete window.conduitRendererInstance
  }
  if (window.cableTrayRendererInstance) {
    delete window.cableTrayRendererInstance
  }
  
  // Clean up MEP selection manager
  if (window.mepSelectionManager) {
    window.mepSelectionManager.dispose()
    delete window.mepSelectionManager
  }
}