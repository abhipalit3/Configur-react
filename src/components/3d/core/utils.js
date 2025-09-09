/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three';
import { extractSnapPoints } from './extractGeometrySnapPoints.js'

/* ---------- unit helpers with validation ---------- */
const FT2M = 0.3048;
const IN2M = 0.0254;

/**
 * Converts feet to meters with validation
 * @param {number} ft - Length in feet to convert
 * @returns {number} Length in meters, returns 0 if input is invalid
 */
export const ft2m  = ft   => {
  if (!isFinite(ft)) {
    // console.warn('❌ Invalid feet value for conversion:', ft)
    return 0
  }
  return ft * FT2M
};

/**
 * Converts inches to meters with validation
 * @param {number} inch - Length in inches to convert
 * @returns {number} Length in meters, returns 0 if input is invalid
 */
export const in2m  = inch => {
  if (!isFinite(inch)) {
    // console.warn('❌ Invalid inches value for conversion:', inch)
    return 0
  }
  return inch * IN2M
};

/**
 * Converts feet to inches with validation
 * @param {number} ft - Length in feet to convert
 * @returns {number} Length in inches, returns 0 if input is invalid
 */
export const ft2in = ft   => {
  if (!isFinite(ft)) {
    // console.warn('❌ Invalid feet value for conversion:', ft)
    return 0
  }
  return ft * 12
};

/**
 * Convert feet and inches object to total feet with validation
 * @param {Object|number} value - Either a {feet, inches} object or a number
 * @returns {number} - Total feet, returns 0 if input is invalid
 */
export function convertToFeet(value) {
  if (typeof value === 'number') {
    if (!isFinite(value)) {
      // console.warn('❌ Invalid numeric feet value:', value)
      return 0
    }
    return value
  }
  
  if (!value || typeof value !== 'object') {
    // console.warn('❌ Invalid feetInches object:', value)
    return 0
  }
  
  const feet = value.feet || 0
  const inches = value.inches || 0
  
  if (!isFinite(feet) || !isFinite(inches)) {
    // console.warn('❌ Invalid feet/inches values:', { feet, inches })
    return 0
  }
  
  return feet + (inches / 12)
}

/**
 * Get the column/post size from rack parameters
 * Handles both old format (postSize/columnSize) and new format (columnSizes with columnType)
 * @param {Object} rackParams - The rack parameters object
 * @returns {number} - Column size in inches
 */
export function getColumnSize(rackParams) {
  let columnSize = null
  
  try {
    // Check for old format first (postSize or columnSize directly)
    if (rackParams?.postSize && rackParams.postSize > 0) {
      columnSize = rackParams.postSize
    } else if (rackParams?.columnSize && rackParams.columnSize > 0) {
      columnSize = rackParams.columnSize
    } 
    // Check for new format (columnSizes object with columnType)
    else if (rackParams?.columnSizes && rackParams?.columnType) {
      columnSize = rackParams.columnSizes[rackParams.columnType]
    }
    
    // If still not found, try localStorage as backup
    if (!columnSize) {
      const storedParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      if (storedParams?.columnSizes && storedParams?.columnType) {
        columnSize = storedParams.columnSizes[storedParams.columnType]
      }
    }
  } catch (error) {
    console.error('Error reading column size:', error)
  }
  
  // Default to 3 inches if not found
  return columnSize || 3
}
/**
 * Recursively disposes of geometries in a THREE.js object hierarchy to prevent memory leaks
 * @param {THREE.Object3D} g - The 3D object to traverse and dispose
 */
export const dispose = g => g.traverse(o => o.isMesh && o.geometry?.dispose());

/**
 * Adds wireframe edges to a mesh for better visibility and definition
 * @param {THREE.Mesh} mesh - The mesh to add edges to
 * @param {number} [color=0x333333] - Hex color for the edge lines
 * @param {number} [lineWidth=0.5] - Width of the edge lines
 * @param {number} [opacity=0.5] - Opacity of the edge lines (0-1)
 */
function addEdges(mesh, color = 0x333333, lineWidth = 0.5, opacity = 0.5) {
  const geometry = new THREE.EdgesGeometry(mesh.geometry);
  const material = new THREE.LineBasicMaterial({ color, linewidth: lineWidth });
  material.opacity = opacity;
  material.transparent = true;
  const edges = new THREE.LineSegments(geometry, material);
  mesh.add(edges);
}

/**
 * Build a parametric pallet‑rack frame and return it as a {@link THREE.Group}.
 *
 * The rack is centred on the world origin in the *plan* (X–Z) plane and sits
 * on Y = 0 (floor).  
 * Local axes:
 * ```
 *   X : length  (bays laid end‑to‑end)
 *   Y : height  (up)
 *   Z : depth   (front ↔ back)
 * ```
 *
 * **Geometry notes**
 * - **Posts** are square columns (`postSize × postSize` inches).  
 * - **Beams** are square members (`beamSize` inches) used for roof and for the
 *   *bottom* of every tier.  
 * - The centre‑line of the roof beam is positioned at **`topClearance` ft**.  
 * - Tiers are defined *top‑to‑bottom* by their clear heights `tierHeights[]`.
 *
 * @param {Object} p                         Rack parameters (feet unless noted)
 * @param {number} p.bayCount                Number of bays along X (≥ 1)
 * @param {number} p.bayWidth                Clear width of each bay (ft)
 * @param {number} p.depth                   Overall rack depth (ft, along Z)
 * @param {number} p.postSize                Post width × depth (inches)
 * @param {number} p.beamSize                Beam depth × width (inches)
 * @param {number} p.topClearance            Y‑coord of roof‑beam centre (ft)
 * @param {number[]} p.tierHeights           Clear tier heights *top → bottom* (ft)
 *                                           `tierHeights.length` = tier count
 * @param {THREE.Material} [p.material]      Optional override for the steel
 *                                           material; defaults to `steelMat`
 *
 * @returns {THREE.Group} A group containing all posts and beams that make up
 *                        the rack.  Child meshes share the material
 *                        `p.material || steelMat`.
 */
export function buildRack(p, postMaterial, longBeamMaterial, transBeamMaterial, snapPoints = []){
  const g     = new THREE.Group();

  // Calculate bay configuration from total length and standard bay width
  const totalLengthFeet = p.rackLength ? convertToFeet(p.rackLength) : (p.totalLength || (isFinite(p.bayCount) && isFinite(p.bayWidth) ? (p.bayCount * p.bayWidth) : 12)); // backwards compatibility
  const standardBayFeet = p.bayWidth ? convertToFeet(p.bayWidth) : (p.standardBayWidth || 3);
  
  // Validate dimensions before calculations
  if (!isFinite(totalLengthFeet) || totalLengthFeet <= 0) {
    // console.error('❌ Invalid total length:', totalLengthFeet)
    return new THREE.Group() // Return empty group
  }
  
  if (!isFinite(standardBayFeet) || standardBayFeet <= 0) {
    // console.error('❌ Invalid standard bay width:', standardBayFeet)
    return new THREE.Group()
  }
  
  const fullBays = Math.floor(totalLengthFeet / standardBayFeet);
  const remainder = totalLengthFeet - (fullBays * standardBayFeet);
  const bayCount = remainder > 0.1 ? fullBays + 1 : fullBays; // if remainder > ~1 inch, add extra bay
  const lastBayWidth = remainder > 0.1 ? remainder : standardBayFeet;
  
  // Validate calculated values
  if (!isFinite(bayCount) || bayCount <= 0) {
    // console.error('❌ Invalid bay count:', bayCount)
    return new THREE.Group()
  }

  // Rack configuration calculated

  /* -- pre‑compute common metric dimensions with validation -- */
  const lenM   = ft2m(totalLengthFeet);           // overall length (m)
  const depthFeet = p.rackWidth ? convertToFeet(p.rackWidth) : (p.depth || 4)
  const depthM = ft2m(depthFeet);  // overall depth  (m)
  
  // Validate metric dimensions
  if (!isFinite(lenM) || lenM <= 0) {
    // console.error('❌ Invalid rack length (meters):', lenM)
    return new THREE.Group()
  }
  
  if (!isFinite(depthM) || depthM <= 0) {
    // console.error('❌ Invalid rack depth (meters):', depthM)
    return new THREE.Group()
  }
  
  // Get column and beam sizes based on type selection
  const columnSize = p.columnSizes && p.columnType ? p.columnSizes[p.columnType] : (p.columnSize || p.postSize || 3);
  const beamSize = p.beamSizes && p.beamType ? p.beamSizes[p.beamType] : (p.beamSize || 3);
  
  const postM  = in2m(columnSize);  // post size (m) - renamed from postSize
  const beamM  = in2m(beamSize);    // beam size (m)
  
  // Convert tier heights to feet if they're in feet-inches format (MUST be done first)
  const tierHeightsFeet = p.tierHeights ? p.tierHeights.map(convertToFeet) : [2, 2];
  const tiersM = tierHeightsFeet.map(ft2m);  // clear tier heights [m]
  const totalH = tiersM.reduce((s,h)=>s+h,0) + (p.tierCount || tiersM.length) * beamM; // total clear height
  
  // Calculate rack positioning based on mount type
  let rackBaseY = 0; // Base Y position of rack (where bottom starts)
  let topClearanceFt = p.topClearance || 10; // default fallback for deck mounted
  
  const mountType = p.mountType || 'deck'; // default to deck mounted
  
  if (mountType === 'deck') {
    // Deck mounted: rack hangs from the ceiling/beam
    // PRIORITY: Building shell context takes precedence over stored topClearance
    if (p.buildingContext && p.buildingContext.corridorHeight && p.buildingContext.beamDepth !== undefined) {
      const corridorHeightFt = convertToFeet(p.buildingContext.corridorHeight);
      const beamDepthFt = convertToFeet(p.buildingContext.beamDepth);
      
      // Validate beam depth to avoid NaN issues
      if (isFinite(corridorHeightFt) && isFinite(beamDepthFt) && corridorHeightFt > 0) {
        topClearanceFt = corridorHeightFt - beamDepthFt;
        // console.log(`📐 Deck mounted rack positioned: corridor=${corridorHeightFt}ft, beam=${beamDepthFt}ft, clearance=${topClearanceFt}ft`)
      } else {
        console.warn('❌ Invalid building context values, using default topClearance')
      }
    }
    rackBaseY = ft2m(topClearanceFt) - tiersM.reduce((s,h)=>s+h,0) - (p.tierCount || tiersM.length) * beamM;
  } else {
    // Floor mounted: rack sits on the floor (Y=0) and builds upward
    rackBaseY = 0;
    topClearanceFt = tiersM.reduce((s,h)=>s+h,0) / FT2M + (p.tierCount || tiersM.length) * (beamM / FT2M); // total rack height
    // Floor mounted configuration calculated
  }
  
  const roofY  = ft2m(topClearanceFt);     // roof beam Y (top of rack)
  const dx = lenM/2, dz = depthM/2;               // half‑extents

  /* -- reusable geometries ------------------------------------------------- */
  const postGeom = new THREE.BoxGeometry(postM, totalH - beamM, postM);
  // Longitudinal beams should be reduced by post width to fit between inset posts
  const longGeom = new THREE.BoxGeometry(lenM , beamM, beamM);       // X beams between inset posts
  const tranGeom = new THREE.BoxGeometry(beamM, beamM, depthM - postM*2);     // Z beams between inset posts

  /* -- vertical posts ---------------------------------------------------- */
  /* There are (bayCount + 1) frames along X and two frames (front/back) along Z. */
  const zRows = [-dz + postM/2,  dz - postM/2];   // back row, front row (posts inside rack boundary)
  // Calculate post positions with variable bay widths
  // Start at left edge, inset by half post width so edge aligns with rack boundary
  let currentX = -dx + postM;  // Start at left edge (post center inset by half post width)
  for (let bay = 0; bay <= bayCount; bay++) {    // walk bays left ➜ right
    // Adjust the last post position to end at dx - postM
    if (bay === bayCount) {
      currentX = dx;  // Force last post to this position
    }
    for (const z of zRows) {                       // place back & front posts
      const post = new THREE.Mesh(postGeom, postMaterial);
      post.position.set(
        currentX,              // length direction
        rackBaseY + totalH / 2 - beamM/2,    // centre‑Y based on mount type
        z                      // depth direction (back / front)
      );
      g.add(post);
      addEdges(post); // add edges for visibility
      post.updateMatrixWorld(true)
      if (snapPoints) {
        const { corners, edges } = extractSnapPoints(post.geometry, post.matrixWorld)
        // Add corners with higher priority (they'll be first in array)
        snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })))
        // Add edge lines with lower priority
        snapPoints.push(...edges.map(p => ({ point: p, type: 'edge' })))
      }
    }
    
    // Move to next post position
    if (bay < bayCount) {
      const bayWidth = (bay === bayCount - 1 && remainder > 0.1) ? lastBayWidth : standardBayFeet;
      currentX += ft2m(bayWidth);
    }
  }

/* ---------- beam levels: roof + bottom of each tier -------------------- */
const levels = new Set();

if (mountType === 'deck') {
  // Deck mounted: calculate levels from top down
  levels.add(roofY - beamM / 2);               // roof‑beam centre‑line
  let cursor = roofY;               // cursor for tier heights
  
  for (let i = 0; i < p.tierCount; i++) { // walk tiers upward
    const h = tiersM[i];            // height of this tier
    const bottomBeam = cursor - ((i + 1) * beamM )- h - beamM/2     // cursor to bottom of this tier
    levels.add(bottomBeam);        // bottom‑beam centre‑line
    cursor -= h;                  // move cursor down to next tier
  }
} else {
  // Floor mounted: calculate levels from bottom up
  levels.add(rackBaseY + beamM / 2);  // bottom beam at floor level
  let cursor = rackBaseY + beamM;     // start above bottom beam
  
  for (let i = 0; i < p.tierCount; i++) {
    const h = tiersM[i];            // height of this tier
    cursor += h;                    // move cursor up by tier height
    if (i < p.tierCount - 1) {      // don't add top beam for last tier
      levels.add(cursor + beamM / 2); // top beam of this tier
      cursor += beamM;              // move cursor up by beam thickness
    } else {
      levels.add(cursor - beamM / 2); // final top beam
    }
  }
}


const levelList   = [...levels];             // array for min/max searches
const topLevel    = Math.max(...levelList);  // highest beam elevation
const bottomLevel = Math.min(...levelList);  // lowest  beam elevation

/* ---------- longitudinal beams: ONLY at top & bottom ------------------- */
[topLevel, bottomLevel].forEach(y => {
  // Position beams at the same Z as posts (inside rack boundary)
  [dz - postM/2, -dz + postM/2].forEach(z => {
    const rail = new THREE.Mesh(longGeom, longBeamMaterial);
    rail.position.set(postM/2, y, z);
    g.add(rail);
    addEdges(rail);
    rail.updateMatrixWorld(true)
    if (snapPoints) {
      const { corners, edges } = extractSnapPoints(rail.geometry, rail.matrixWorld)
      snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })))
      snapPoints.push(...edges.map(line => ({ 
        start: line.start, 
        end: line.end, 
        type: 'edge' 
      })))
    }
});
});

/* ---------- transverse beams: at every level --------------------------- */
levelList.forEach(y => {
  // Use the same post positions for transverse beams (inset to align with posts)
  let currentX = -dx + postM;
  for (let i = 0; i <= bayCount; i++) {

    if (i === bayCount) {
      currentX = dx;  // Force last beam to align with last post
    }

    const tr = new THREE.Mesh(tranGeom, transBeamMaterial);
    tr.position.set(currentX, y, 0);
    g.add(tr);
    addEdges(tr);
    tr.updateMatrixWorld(true)
    if (snapPoints) {
      const { corners, edges } = extractSnapPoints(tr.geometry, tr.matrixWorld)
      snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })))
      snapPoints.push(...edges.map(p => ({ point: p, type: 'edge' })))
    }
    
    // Move to next beam position (same as posts)
    if (i < bayCount) {
      const bayWidth = (i === bayCount - 1 && remainder > 0.1) ? lastBayWidth : standardBayFeet;
      currentX += ft2m(bayWidth);
    }
  }
});

return g;
}

/* ---------- I-beam builder ---------- */
/**
 * Creates a standard structural I-beam geometry with proper proportions
 * Generates an I-beam with top flange, bottom flange, and connecting web
 * @param {number} depth - Overall beam depth in inches
 * @param {number} length - Beam length in meters (pre-converted)
 * @returns {THREE.BufferGeometry} Complete I-beam geometry ready for mesh creation
 */
function createIBeamGeometry(depth, length) {
  const depthM = in2m(depth);
  const flangeWidth = depthM * 0.8; // Flange width is typically 80% of depth
  const flangeThickness = depthM * 0.1; // Flange thickness
  const webThickness = depthM * 0.05; // Web thickness
  
  // Create I-beam using simple box geometries
  const shapes = [];
  
  // Top flange
  const topFlangeGeom = new THREE.BoxGeometry(length, flangeThickness, flangeWidth);
  topFlangeGeom.translate(0, (depthM - flangeThickness) / 2, 0);
  shapes.push(topFlangeGeom);
  
  // Bottom flange  
  const bottomFlangeGeom = new THREE.BoxGeometry(length, flangeThickness, flangeWidth);
  bottomFlangeGeom.translate(0, -(depthM - flangeThickness) / 2, 0);
  shapes.push(bottomFlangeGeom);
  
  // Web (vertical part)
  const webGeom = new THREE.BoxGeometry(length, depthM - 2 * flangeThickness, webThickness);
  shapes.push(webGeom);
  
  // Merge all geometries
  const mergedGeometry = new THREE.BufferGeometry();
  const geometries = shapes.map(geom => {
    geom.computeBoundingBox();
    return geom;
  });
  
  // Use the first geometry as base
  const baseGeom = geometries[0];
  const positions = Array.from(baseGeom.attributes.position.array);
  const normals = Array.from(baseGeom.attributes.normal.array);
  let indices = baseGeom.index ? Array.from(baseGeom.index.array) : [];
  
  let vertexOffset = positions.length / 3;
  
  // Add remaining geometries
  for (let i = 1; i < geometries.length; i++) {
    const geom = geometries[i];
    const pos = geom.attributes.position.array;
    const norm = geom.attributes.normal.array;
    const idx = geom.index ? geom.index.array : [];
    
    // Add positions and normals
    positions.push(...pos);
    normals.push(...norm);
    
    // Add indices with offset
    if (idx.length > 0) {
      for (let j = 0; j < idx.length; j++) {
        indices.push(idx[j] + vertexOffset);
      }
    } else {
      // Generate indices if not present
      for (let j = 0; j < pos.length / 3; j++) {
        indices.push(j + vertexOffset);
      }
    }
    
    vertexOffset += pos.length / 3;
  }
  
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  mergedGeometry.setIndex(indices);
  mergedGeometry.computeVertexNormals();
  
  return mergedGeometry;
}

/* ---------- shell builder ---------- */
/**
 * Build a simple corridor “shell” (floor, intermediate ceiling, roof,
 * front / back walls) that encloses the rack.
 *
 * The shell is centred on world‑origin in X and Z and sits on Y = 0.  
 * It is intentionally very lightweight: each slab / wall is a single
 * {@link THREE.Mesh} using `shellMat`.
 *
 * Geometry reference
 * ```
 *           Y
 *           ↑
 *   roofM ──┼────────── (roof slab)
 *           │
 *   ceilM ──┼────────── (intermediate ceiling slab)
 *           │
 *  floor ───┼────────── (floor slab at Y=0)
 *           └── Z (depth)
 * ```
 *
 * @param {Object} p
 * @param {number} p.bayCount         Number of rack bays (used for shell length)
 * @param {number} p.bayWidth         Width of one bay (ft)
 * @param {number} p.corridorWidth    Inside corridor width  (ft, along Z)
 * @param {number} p.corridorHeight   Total corridor height  (ft, along Y)
 * @param {number} p.ceilingHeight    Height of the **intermediate** ceiling (ft)
 * @param {THREE.Material} [p.material=shellMat] Optional material override
 *
 * @returns {THREE.Group} Group containing five meshes:
 *  * floor, ceiling, roof slabs (XY‑planes)  
 *  * front & back walls   (XZ‑planes)
 */
export function buildShell(p, wallMaterial, ceilingMaterial, floorMaterial, roofMaterial, shellBeamMaterial, snapPoints = []){
  const s   = new THREE.Group();

  /* -- metric dimensions -------------------------------------------------- */
  const defaultBayCount = 2; // Default bay count for now
  const lenM    = ft2m(defaultBayCount * convertToFeet(p.bayWidth)); 
  const widthM  = ft2m(convertToFeet(p.corridorWidth));
  const heightM = ft2m(convertToFeet(p.corridorHeight));
  const ceilM   = ft2m(convertToFeet(p.ceilingHeight));

  /* -- reusable geometries ------------------------------------------------- */
  const slabGeom = new THREE.BoxGeometry(lenM, widthM * 2, in2m(p.slabDepth));   // XY‑plane
  const ceilingGeom = new THREE.BoxGeometry(lenM, widthM, in2m(p.ceilingDepth));         // XY‑plane
  const wallGeom = new THREE.BoxGeometry(lenM, heightM, in2m(p.wallThickness));  // XZ‑plane

  /* -- horizontal slabs ---------------------------------------------------- */
  const floor = new THREE.Mesh(slabGeom, floorMaterial);
  floor.position.y = -in2m(p.slabDepth)/2;                     // floor at Y=0
  floor.rotation.x = -Math.PI/2;            // make it horizontal
  s.add(floor);
  addEdges(floor, 0x333333, 0.5, 0.6);
  // Add snap points for floor
  floor.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(floor.geometry, floor.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  const ceiling = new THREE.Mesh(ceilingGeom, ceilingMaterial);
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = ceilM + in2m(p.ceilingDepth)/2; // ceiling at Y=ceilM
  s.add(ceiling);
  addEdges(ceiling, 0x333333, 0.5, 0.1);
  // Add snap points for ceiling
  ceiling.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(ceiling.geometry, ceiling.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  const roof = new THREE.Mesh(slabGeom, roofMaterial);
  roof.rotation.x =  Math.PI/2;
  roof.position.y = heightM + in2m(p.slabDepth)/2; // roof at Y=heightM
  s.add(roof);
  addEdges(roof, 0x333333, 0.5, 0.1);
  // Add snap points for roof
  roof.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(roof.geometry, roof.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  /* -- vertical walls ------------------------------------------------------ */
  const dz = widthM/2 + in2m(p.wallThickness/2); 
  const back = new THREE.Mesh(wallGeom, wallMaterial);
  back.position.set(0, heightM/2, -dz);
  s.add(back);
  addEdges(back, 0x333333, 0.5, 0.1);
  // Add snap points for back wall
  back.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(back.geometry, back.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  const front = new THREE.Mesh(wallGeom, wallMaterial);
  front.rotation.y = Math.PI;              // flip normal inward
  front.position.set(0, heightM/2,  dz);
  s.add(front);
  addEdges(front, 0x333333, 0.5, 0.1);
  // Add snap points for front wall
  front.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(front.geometry, front.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  /* -- I-beam below roof ---------------------------------------------- */
  if (p.beamDepth) {
    const beamDepthTotal = convertToFeet(p.beamDepth);
    
    if (beamDepthTotal > 0) {
      // Use the passed shell beam material
      
      // Create I-beam geometry - length should span the entire slab width (Z direction - perpendicular to corridor)
      const beamDepthInches = beamDepthTotal * 12; // Convert feet to inches for geometry function
      const slabWidth = widthM * 2; // Slab is twice the corridor width
      const iBeamGeom = createIBeamGeometry(beamDepthInches, slabWidth);
      
      // Position single I-beam below the roof, centered, spanning perpendicular to corridor
      // Offset slightly below the wall top to avoid Z-fighting
      const beamY = heightM - ft2m(beamDepthTotal) / 2 - 0.001; // Just below the roof with small offset
      
      // Single I-beam positioned at center, running perpendicular to corridor (Z direction)
      const iBeam = new THREE.Mesh(iBeamGeom, shellBeamMaterial);
      iBeam.position.set(0, beamY, 0); // Centered in X and Z
      iBeam.rotation.y = Math.PI / 2; // Rotate 90 degrees to align with Z-axis (perpendicular to corridor)
      s.add(iBeam);
      addEdges(iBeam, 0x333333, 0.5, 0.1); // Same edge opacity as roof
      
      // Add snap points for I-beam
      iBeam.updateMatrixWorld(true);
      if (snapPoints) {
        const { corners, edges } = extractSnapPoints(iBeam.geometry, iBeam.matrixWorld);
        snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
        snapPoints.push(...edges.map(line => ({ 
        start: line.start, 
        end: line.end, 
        type: 'edge' 
      })));
      }
    }
  }

  return s;
}

/**
 * Build floor-only shell for floor-mounted racks
 * Only creates the floor plane without walls, ceiling, or roof
 */
export function buildFloorOnly(p, floorMaterial, snapPoints = []){
  const s = new THREE.Group();

  /* -- metric dimensions -------------------------------------------------- */
  const defaultBayCount = 4; // Default bay count for floor
  const lenM    = ft2m(defaultBayCount * convertToFeet(p.bayWidth || { feet: 3, inches: 0 })); 
  const widthM  = ft2m(convertToFeet(p.corridorWidth || { feet: 10, inches: 0 }));

  /* -- floor slab only ---------------------------------------------------- */
  const slabGeom = new THREE.BoxGeometry(lenM * 1.5, widthM * 1.5, in2m(p.slabDepth || 4));   // Larger floor for floor-mounted
  
  const floor = new THREE.Mesh(slabGeom, floorMaterial);
  floor.position.y = -in2m(p.slabDepth || 4)/2;     // floor at Y=0
  floor.rotation.x = -Math.PI/2;            // make it horizontal
  s.add(floor);
  addEdges(floor, 0x333333, 0.5, 0.6);
  
  // Add snap points for floor
  floor.updateMatrixWorld(true);
  if (snapPoints) {
    const { corners, edges } = extractSnapPoints(floor.geometry, floor.matrixWorld);
    snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
    snapPoints.push(...edges.map(line => ({ 
      start: line.start, 
      end: line.end, 
      type: 'edge' 
    })));
  }

  return s;
}

/* ---------- tier helpers ---------- */
/**
 * Gets the height of a specific tier in feet
 * @param {Object} p - Rack parameters containing tierHeights array
 * @param {number} idx - 1-based tier index
 * @returns {number} Tier height in feet
 */
export function tierHeightFt(p,idx){ return p.tierHeights[idx-1]; }

/**
 * Calculates the Y-coordinate of the center of the bottom beam for a given tier
 * Used for positioning MEP components within rack tiers
 * @param {Object} p - Rack parameters with topClearance, beamSize, and tierHeights
 * @param {number} idx - 1-based tier index
 * @returns {number} Y-coordinate in meters of the bottom beam center
 */
export function bottomBeamCenterY(p, idx){
  const beamM = in2m(p.beamSize);
  let y = ft2m(p.topClearance) - beamM/2;     // centre of roof beam
  for(let i=0;i<idx;i++){
    y -= beamM/2;                             // to bottom of current beam
    y -= ft2m(p.tierHeights[i]);              // clear height of tier i+1
    y -= beamM/2;                             // to centre of next beam down
  }
  return y;
}

/* ---------- duct builder (deprecated - use DuctworkRenderer instead) ---------- */
// This function is kept for reference but is no longer used
// All ductwork is now handled by DuctworkRenderer.js

/* =========================================================================
   buildPipesFlexible()
   -------------------------------------------------------------------------
   Builds one or more circular pipes per tier, oriented along the X-axis.

   • tierIdx   : 1-based index of the tier the pipes belong to
   • pipes[]   : array of pipe descriptors; each pipe has:
                   - diamIn     : diameter (inches)
                   - sideOffIn  : horizontal offset (inches, along Z)
                   - vertOffIn  : vertical offset from bottom beam (inches)
   • pipeMat   : THREE.Material instance for the pipes

   Pipes are positioned:
   - Vertically: from the top of the bottom beam in the tier,
     plus the specified `vertOffIn`, plus `radius` so they rest on their base.
   - Clamped vertically to stay within the tier (avoids pipe poking outside).
   - Horizontally centered and offset by `sideOffIn` (left-right).

   Returns:
   - A THREE.Group containing all pipe meshes for the tier.
   ========================================================================= */
export function buildPipesFlexible(p, tierIdx, pipes, pipeMat, snapPoints = []) {
  const normalise = o => ({
    diamIn     : o.diamIn     ?? o.diam,
    sideOffIn  : o.sideOffIn  ?? o.side,
    vertOffIn  : o.vertOffIn  ?? o.vert
  });

  pipes = pipes.map(normalise);
  const totalLengthFeet = p.rackLength ? convertToFeet(p.rackLength) : (p.totalLength || (p.bayCount * p.bayWidth));
  const lenM  = ft2m(totalLengthFeet); // pipe length (X-axis) to match user input
  const beamM = in2m(p.beamSize);

  const g = new THREE.Group();

  // Compute vertical bounds of the tier
  const tierHeightM  = ft2m(p.tierHeights[tierIdx - 1]);      // clear height of tier
  const tierBottomY  = bottomBeamCenterY(p, tierIdx) + beamM / 2;
  const tierTopY     = tierBottomY + tierHeightM;

  pipes.forEach(({ diamIn, sideOffIn, vertOffIn }) => {
    const rM = in2m(diamIn) / 2;
    const geom = new THREE.CylinderGeometry(rM, rM, lenM, 32);
    geom.rotateZ(Math.PI / 2); // X-axis pipe

    // Position Y: bottom beam top + user offset + radius
    let y = tierBottomY + in2m(vertOffIn) + rM;

    // Clamp within tier
    const maxY = tierTopY - rM;
    const minY = tierBottomY + rM;
    y = THREE.MathUtils.clamp(y, minY, maxY);

    const mesh = new THREE.Mesh(geom, pipeMat);
    mesh.position.set(
      0,              // X (centered)
      y,              // Y (adjusted)
      in2m(sideOffIn) // Z
    );
    g.add(mesh);
    
    // Add snap points for each pipe
    mesh.updateMatrixWorld(true);
    if (snapPoints) {
      const { corners, edges } = extractSnapPoints(mesh.geometry, mesh.matrixWorld);
      snapPoints.push(...corners.map(p => ({ point: p, type: 'vertex' })));
      snapPoints.push(...edges.map(line => ({ 
        start: line.start, 
        end: line.end, 
        type: 'edge' 
      })));
    }
  });

  return g;
}