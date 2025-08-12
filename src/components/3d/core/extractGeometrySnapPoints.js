import * as THREE from 'three'

export function extractSnapPoints(geometry, matrixWorld) {
  const posAttr = geometry.getAttribute('position')
  const vertexCount = posAttr.count

  const cornerPoints = []
  const edgePoints = []
  const faceCenters = []
  
  const getKey = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
  const toVec3 = (i) => {
    return new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(matrixWorld)
  }

  // Track unique edges to avoid duplicates
  const edgeSet = new Set()

  for (let i = 0; i < vertexCount; i += 3) {
    const a = toVec3(i)
    const b = toVec3(i + 1)
    const c = toVec3(i + 2)

    // Add corners (vertices)
    cornerPoints.push(a.clone(), b.clone(), c.clone())

    // Face center
    const faceCenter = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3)
    faceCenters.push(faceCenter)

    // Process edges of this triangle - SIMPLIFIED APPROACH
    const edges = [
      [a, b],
      [b, c], 
      [c, a]
    ]
    
    edges.forEach(([start, end]) => {
      const startKey = getKey(start)
      const endKey = getKey(end)
      const edgeKey = [startKey, endKey].sort().join('|')
      
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        
        // Only add midpoint and quarter points to avoid too many points
        const midpoint = new THREE.Vector3().lerpVectors(start, end, 0.5)
        const quarterPoint1 = new THREE.Vector3().lerpVectors(start, end, 0.25)
        const quarterPoint2 = new THREE.Vector3().lerpVectors(start, end, 0.75)
        
        // Make sure these are far enough from vertices
        const minDistFromVertices = 0.1 // 10cm minimum distance
        
        if (midpoint.distanceTo(start) > minDistFromVertices && midpoint.distanceTo(end) > minDistFromVertices) {
          edgePoints.push(midpoint)
        }
        if (quarterPoint1.distanceTo(start) > minDistFromVertices && quarterPoint1.distanceTo(end) > minDistFromVertices) {
          edgePoints.push(quarterPoint1)  
        }
        if (quarterPoint2.distanceTo(start) > minDistFromVertices && quarterPoint2.distanceTo(end) > minDistFromVertices) {
          edgePoints.push(quarterPoint2)
        }
      }
    })
  }

  // Processing edge points

  return {
    corners: dedupe(cornerPoints),
    edges: dedupe(edgePoints), // Now also deduped
    faces: dedupe(faceCenters)
  }
}

function dedupe(points) {
  const set = new Set()
  const unique = []
  for (const v of points) {
    const key = `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`
    if (!set.has(key)) {
      set.add(key)
      unique.push(v)
    }
  }
  return unique
}
