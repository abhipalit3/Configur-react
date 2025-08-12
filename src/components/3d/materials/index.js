import * as THREE from 'three'

/**
 * Create all materials used in the 3D scene
 * @param {Object} textures - Object containing loaded textures
 * @returns {Object} Object containing all materials
 */
export function createMaterials(textures = {}) {
  const materials = {}

  // Floor material with textures
  materials.floorMaterial = new THREE.MeshStandardMaterial({ 
    map: textures.floorAlbedo, 
    normalMap: textures.floorNormal, 
    roughnessMap: textures.floorRough, 
    metalness: 0.2, 
    roughness: 1.0 
  })

  // Rack structural materials
  materials.postMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666, 
    metalness: 0.8, 
    roughness: 0.3 
  }) // Darker posts

  materials.longBeamMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888, 
    metalness: 0.9, 
    roughness: 0.2 
  }) // Lighter longitudinal beams

  materials.transBeamMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x777777, 
    metalness: 1.0, 
    roughness: 0.25 
  }) // Original color for transverse beams

  // Building shell materials
  materials.wallMaterial = new THREE.MeshStandardMaterial({ 
    color: '#e0e0e0', 
    metalness: 0.1, 
    roughness: 0.7, 
    transparent: true, 
    opacity: 0.4 
  })

  materials.ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: '#f5f5f5a8', 
    metalness: 0.2, 
    roughness: 0.6, 
    transparent: true, 
    opacity: 0.6 
  })

  materials.roofMaterial = new THREE.MeshStandardMaterial({ 
    color: '#bdbdbd', 
    metalness: 0.3, 
    roughness: 0.4, 
    transparent: true, 
    opacity: 0.4 
  })

  materials.shellBeamMaterial = new THREE.MeshStandardMaterial({ 
    color: '#8B8680', 
    metalness: 0.7, 
    roughness: 0.3, 
    opacity: 0.9, 
    transparent: true 
  }) // Steel I-beam

  // MEP materials
  materials.ductMat = new THREE.MeshStandardMaterial({ 
    color: '#d05e8f', 
    metalness: 0.5, 
    roughness: 0.9, 
    transparent: true, 
    opacity: 1 
  })

  return materials
}

/**
 * Load textures for materials
 * @param {string} publicUrl - Base URL for texture files
 * @returns {Object} Object containing loaded textures
 */
export function loadTextures(publicUrl = process.env.PUBLIC_URL) {
  const texLoader = new THREE.TextureLoader()
  
  const floorAlbedo = texLoader.load(publicUrl + '/textures/Floor-Roof/Wood066_1K-JPG_Color.jpg')
  const floorNormal = texLoader.load(publicUrl + '/textures/Floor-Roof/Wood066_1K-JPG_NormalGL.jpg')
  const floorRough = texLoader.load(publicUrl + '/textures/Floor-Roof/Wood066_1K-JPG_Roughness.jpg')
  
  // Configure texture wrapping and repeat
  ;[floorAlbedo, floorNormal, floorRough].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(8, 8)
  })

  return {
    floorAlbedo,
    floorNormal,
    floorRough
  }
}

/**
 * Dispose of all materials to prevent memory leaks
 * @param {Object} materials - Materials object to dispose
 */
export function disposeMaterials(materials) {
  Object.values(materials).forEach(material => {
    if (material && typeof material.dispose === 'function') {
      // Dispose textures if they exist
      if (material.map) material.map.dispose()
      if (material.normalMap) material.normalMap.dispose()
      if (material.roughnessMap) material.roughnessMap.dispose()
      
      // Dispose the material itself
      material.dispose()
    }
  })
}