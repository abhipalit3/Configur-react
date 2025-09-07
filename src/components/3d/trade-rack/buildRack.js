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
import { extractSnapPoints } from '../core/extractGeometrySnapPoints.js'

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

  // Generate a consistent rack ID
  const rackId = params.id || `rack_${Date.now()}`
  params.id = rackId // Ensure params has the ID for snap point creation
  
  // rack only - shell will be managed separately
  const rack = buildRack(params, mats.postMaterial, mats.longBeamMaterial, mats.transBeamMaterial, snapPoints)
  rack.userData.isGenerated = true
  rack.userData.type = 'tradeRack'
  rack.userData.selectable = true
  rack.userData.rackId = rackId
  rack.userData.configuration = { ...params } // Store configuration for access
  
  // Set initial position if provided in params
  if (params.position) {
    rack.position.set(
      params.position.x || 0,
      params.position.y || 0,
      params.position.z || 0
    )
    
    // IMPORTANT: After moving the rack, we need to update snap points to the new position
    // The snap points were generated at (0,0,0) but the rack has been moved
    console.log('💾 Rack positioned at:', params.position, 'updating snap points...')
    
    // Update world matrices for all rack components
    rack.updateMatrixWorld(true)
    
    // Clear old snap points for this rack and regenerate them at the correct position
    const rackSnapPoints = []
    rack.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Update the child's world matrix to ensure it's current
        child.updateMatrixWorld(true)
        
        // Use the snap point extraction function
        const { corners, edges } = extractSnapPoints(child.geometry, child.matrixWorld)
        
        // Add corners as vertex snap points with rack ID
        rackSnapPoints.push(...corners.map(p => ({ point: p, type: 'vertex', rackId })))
        
        // Add edges as edge snap points with rack ID
        rackSnapPoints.push(...edges.map(edge => {
          if (edge.start && edge.end) {
            return { start: edge.start, end: edge.end, type: 'edge', rackId }
          } else {
            return { point: edge, type: 'edge', rackId }
          }
        }))
      }
    })
    
    // Replace old rack snap points with new ones at correct position
    const nonRackSnapPoints = snapPoints.filter(sp => sp.rackId !== rackId)
    snapPoints.length = 0
    snapPoints.push(...nonRackSnapPoints, ...rackSnapPoints)
    
    console.log(`🎯 Regenerated ${rackSnapPoints.length} snap points at correct rack position`)
  }
  
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
