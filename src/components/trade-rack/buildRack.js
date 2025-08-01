import * as THREE from 'three'
import {
  dispose,
  buildRack,
  buildShell,
  buildDuct,
  buildPipesFlexible
} from './utils.js'

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
  while (p.tierHeights  .length < n) p.tierHeights  .push(0)
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
 * @param {Object} mats  { steelMat, wallMaterial, ceilingMaterial, floorMaterial, roofMaterial, ductMat }
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

  // rack + shell
  const rack  = buildRack(params, mats.steelMat, snapPoints)
  const shell = buildShell(
    params,
    mats.wallMaterial,
    mats.ceilingMaterial,
    mats.floorMaterial,
    mats.roofMaterial
  )
  ;[rack, shell].forEach(g => {
    g.userData.isGenerated = true
    scene.add(g)
  })

  // ducts
  const dg = new THREE.Group()
  dg.userData.isGenerated = true
  params.ductEnabled.forEach((en, i) => {
    if (!en) return
    dg.add(buildDuct({
      ...params,
      ductTier:   i + 1,
      ductWidth:  params.ductWidths[i],
      ductHeight: params.ductHeights[i],
      ductOffset: params.ductOffsets[i]
    }, mats.ductMat))
  })
  scene.add(dg)

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
      })
    ))
  })
  scene.add(pg)
  console.log('Rack scene built with snap points:', snapPoints.length)
  return snapPoints
}
