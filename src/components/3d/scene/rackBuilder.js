/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { buildRackScene } from '../trade-rack/buildRack.js'
import { createMaterials, loadTextures } from '../materials'

/**
 * Build rack parameters from initial configuration
 */
export function buildRackParameters(initialRackParams, initialBuildingParams) {
  return {
    // Building parameters
    corridorWidth: initialBuildingParams?.corridorWidth || 10,
    corridorHeight: initialBuildingParams?.corridorHeight || 15,
    ceilingHeight: initialBuildingParams?.ceilingHeight || 9,
    ceilingDepth: initialBuildingParams?.ceilingDepth || 2,
    slabDepth: initialBuildingParams?.slabDepth || 4,
    wallThickness: initialBuildingParams?.wallThickness || 6,

    // Rack parameters
    bayCount: initialRackParams?.bayCount || 4,
    bayWidth: initialRackParams?.bayWidth || 3,
    depth: initialRackParams?.depth || 4,
    topClearance: initialRackParams?.topClearance || 15,
    
    // Handle both old and new formats for post/column size
    postSize: initialRackParams?.columnSizes && initialRackParams?.columnType 
              ? initialRackParams.columnSizes[initialRackParams.columnType] 
              : (initialRackParams?.postSize || 2),
    
    // Handle both old and new formats for beam size
    beamSize: initialRackParams?.beamSizes && initialRackParams?.beamType 
              ? initialRackParams.beamSizes[initialRackParams.beamType] 
              : (initialRackParams?.beamSize || 2),

    tierCount: initialRackParams?.tierCount || 2,
    tierHeights: initialRackParams?.tierHeights || [2, 2],

    // Pass new parameter structure
    beamSizes: initialRackParams?.beamSizes,
    beamType: initialRackParams?.beamType,
    columnSizes: initialRackParams?.columnSizes,
    columnType: initialRackParams?.columnType,

    // Disabled duct settings (using DuctworkRenderer instead)
    ductEnabled: [false, false],
    ductWidths: [18, 18],
    ductHeights: [16, 16],
    ductOffsets: [0, 0]
  }
}

/**
 * Initialize and build the rack scene
 */
export function initializeRackScene(scene, initialRackParams, initialBuildingParams) {
  // Load textures and create materials
  const textures = loadTextures()
  const materials = createMaterials(textures)

  // Build parameters
  const params = buildRackParameters(initialRackParams, initialBuildingParams)

  // Build the rack scene
  const snapPoints = buildRackScene(scene, params, materials)

  // Extract simplified rack params for state
  const rackParams = {
    tierCount: params.tierCount,
    tierHeights: params.tierHeights,
    bayCount: params.bayCount,
    bayWidth: params.bayWidth,
    depth: params.depth,
    beamSize: params.beamSize,
    postSize: params.postSize
  }

  return {
    materials,
    snapPoints,
    rackParams,
    fullParams: params
  }
}