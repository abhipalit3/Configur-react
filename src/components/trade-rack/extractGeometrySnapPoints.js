import * as THREE from 'three'

export function extractSnapPoints(geometry, matrixWorld) {
  const posAttr = geometry.getAttribute('position')
  const vertexCount = posAttr.count

  const cornerPoints = []
  const faceCenters = []
  const edgeMidpoints = new Set()

  const getKey = (v) => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`
  const toVec3 = (i) => {
    return new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(matrixWorld)
  }

  for (let i = 0; i < vertexCount; i += 3) {
    const a = toVec3(i)
    const b = toVec3(i + 1)
    const c = toVec3(i + 2)

    // Add corners
    cornerPoints.push(a.clone(), b.clone(), c.clone())

    // Face center
    const faceCenter = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3)
    faceCenters.push(faceCenter)

    // Edge midpoints
    const ab = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const bc = new THREE.Vector3().addVectors(b, c).multiplyScalar(0.5)
    const ca = new THREE.Vector3().addVectors(c, a).multiplyScalar(0.5)

    edgeMidpoints.add(getKey(ab) + '|ab')
    edgeMidpoints.add(getKey(bc) + '|bc')
    edgeMidpoints.add(getKey(ca) + '|ca')
  }

  // Convert edgeMidpoints Set → Vector3[]
  const edgePoints = []
  for (const entry of edgeMidpoints) {
    const key = entry.split('|')[0]
    const [x, y, z] = key.split(',').map(Number)
    edgePoints.push(new THREE.Vector3(x, y, z))
  }

  return {
    corners: dedupe(cornerPoints),
    edges: edgePoints,
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
