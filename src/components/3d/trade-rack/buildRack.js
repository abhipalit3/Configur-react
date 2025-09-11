/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import {
  dispose,
  buildRack,
  buildShell,
  buildPipesFlexible
} from '../core/utils.js'

// Ensure arrays exist even if user omitted them
function ensureArrays(p) {
  p.tierHeights   ||= []
  p.ductEnabled   ||= []
  p.ductWidths    ||= []
  p.ductHeights   ||= []
  p.ductOffsets   ||= []
  p.pipeEnabled   ||= []
  p.pipesPerTier  ||= []
}

// Trim or pad arrays to match tierCount
function syncArrays(p) {
  const n = p.tierCount || 0
  // Default tier height in feet-inches format
  const defaultTierHeight = { feet: 2, inches: 0 }
  
  while (p.tierHeights  .length < n) p.tierHeights  .push(defaultTierHeight)
  while (p.ductEnabled  .length < n) p.ductEnabled  .push(false)
  while (p.ductWidths   .length < n) p.ductWidths   .push(0)
  while (p.ductHeights  .length < n) p.ductHeights  .push(0)
  while (p.ductOffsets  .length < n) p.ductOffsets  .push(0)
  while (p.pipeEnabled  .length < n) p.pipeEnabled  .push(false)
  while (p.pipesPerTier .length < n) p.pipesPerTier .push([])
  p.tierHeights  .length = n
  p.ductEnabled  .length = n
  p.ductWidths   .length = n
  p.ductHeights  .length = n
  p.ductOffsets  .length = n
  p.pipeEnabled  .length = n
  p.pipesPerTier .length = n
}

/**
 * Rebuilds the rack, shell, ducts, and pipes in the scene based on params
 * @param {THREE.Scene} scene
 * @param {Object} params
 * @param {Object} mats  { postMaterial, longBeamMaterial, transBeamMaterial, wallMaterial, ceilingMaterial, floorMaterial, roofMaterial, ductMat }
 */
export function buildRackScene(scene, params, mats) {
  console.log('🔧 BUILD RACK SCENE: Received params:', JSON.stringify({
    position: params.position,
    topClearance: params.topClearance,
    topClearanceInches: params.topClearanceInches,
    mountType: params.mountType
  }, null, 2))
  
  ensureArrays(params)
  syncArrays(params)

  // remove previously generated meshes
  scene.children.slice().forEach(obj => {
    if (obj.userData.isGenerated) {
      dispose(obj)
      scene.remove(obj)
    }
  })

  const snapPoints = []

  // rack only - shell will be managed separately
  const rack = buildRack(params, mats.postMaterial, mats.longBeamMaterial, mats.transBeamMaterial, snapPoints)
  rack.userData.isGenerated = true
  rack.userData.type = 'tradeRack'
  rack.userData.selectable = true
  rack.userData.rackId = params.id || `rack_${Date.now()}`
  // Store the baseline Y position (where rack was built by buildRack logic)
  const baselineY = rack.position.y
  
  // Handle positioning: saved position takes precedence over clearance calculations
  if (params.position) {
    // If this is a restored configuration, use the exact saved position
    rack.position.set(
      params.position.x || 0,
      params.position.y || 0,
      params.position.z || 0
    )
    console.log('🔧 Applied saved position:', params.position)
  } else {
    // For new racks without saved position, set default position and apply clearance
    // Default position: X=0, Y=baseline (adjusted by clearance), Z=0
    rack.position.x = 0
    rack.position.z = 0 // Force Z position to 0 for new racks
    
    if (params.topClearanceInches && params.topClearanceInches > 0) {
      // Apply clearance to Y position
      const IN2M = 0.0254
      const clearanceMeters = params.topClearanceInches * IN2M
      rack.position.y = baselineY - clearanceMeters
      console.log('🔧 Applied user clearance:', params.topClearanceInches, 'inches, moved rack from', baselineY, 'to', rack.position.y)
    } else {
      // No clearance specified, keep at baseline position
      rack.position.y = baselineY
      console.log('🔧 New rack positioned at baseline Y:', baselineY, 'with default Z=0')
    }
  }

  rack.userData.configuration = { 
    ...params,
    // Store the baseline Y position - this is where the rack was built with 0 clearance
    baselineY: baselineY,
    // Store the user's clearance in inches (or 0 if not specified)
    topClearance: (params.topClearanceInches || 0) / 12 // Convert to feet for storage consistency
  } // Store configuration for access
  
  scene.add(rack)

  // Note: Ductwork is now handled by DuctworkRenderer.js
  // The old buildDuct system has been disabled in favor of the new MEP system

  // pipes
  const pg = new THREE.Group()
  pg.userData.isGenerated = true
  params.pipeEnabled.forEach((en, i) => {
    if (!en) return
    pg.add(buildPipesFlexible(
      params,
      i + 1,
      params.pipesPerTier[i],
      new THREE.MeshStandardMaterial({
        color:    '#4eadff',
        metalness: 0.3,
        roughness: 0.6
      }),
      snapPoints
    ))
  })
  scene.add(pg)
  
  // Update DuctworkRenderer with new rack parameters if it exists
  if (window.ductworkRendererInstance) {
    window.ductworkRendererInstance.updateRackParams({
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      rackWidth: params.depth, // Map depth to rackWidth for consistency
      tierCount: params.tierCount,
      tierHeights: params.tierHeights,
      topClearance: params.topClearance,
      beamSize: params.beamSize,
      postSize: params.postSize,
      columnSize: params.postSize,
      columnType: params.columnType || 'standard',
      // Pass new parameter structure
      beamSizes: params.beamSizes,
      beamType: params.beamType,
      columnSizes: params.columnSizes
    })
  }
  
  return snapPoints
}
