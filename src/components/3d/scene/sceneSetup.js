/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * Initialize the WebGL renderer
 */
export function initializeRenderer(mountElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.physicallyCorrectLights = true
  mountElement.appendChild(renderer.domElement)
  return renderer
}

/**
 * Initialize the Three.js scene with background
 */
export function initializeScene() {
  const scene = new THREE.Scene()
  scene.background = null // Transparent background
  return scene
}

/**
 * Setup scene lighting
 */
export function setupLighting(scene) {
  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)

  // Directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(10, 20, 10)
  dirLight.castShadow = true
  scene.add(dirLight)

  return { ambient, dirLight }
}

/**
 * Setup grid helpers
 */
export function setupGrids(scene) {
  // Primary grid
  const gridHelper = new THREE.GridHelper(100, 100, 0x000000, 0x000000)
  gridHelper.material.opacity = 0.15
  gridHelper.material.transparent = true
  gridHelper.material.depthWrite = false
  gridHelper.renderOrder = -1
  scene.add(gridHelper)

  // Background grid
  const createBackgroundGrid = (size = 1000, step = 10, color = 0x000000) => {
    const lines = []
    for (let i = -size; i <= size; i += step) {
      lines.push(-size, 0, i, size, 0, i)
      lines.push(i, 0, -size, i, 0, size)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines.flat(), 3))
    const material = new THREE.LineBasicMaterial({ 
      color, 
      opacity: 0.3, 
      transparent: true, 
      depthWrite: false 
    })
    const lineSegments = new THREE.LineSegments(geometry, material)
    lineSegments.renderOrder = -2
    scene.add(lineSegments)
    return lineSegments
  }

  const backgroundGrid = createBackgroundGrid()
  
  return { gridHelper, backgroundGrid }
}

/**
 * Initialize orthographic camera
 */
export function initializeCamera() {
  const aspect = window.innerWidth / window.innerHeight
  const d = 10
  const camera = new THREE.OrthographicCamera(
    -d * aspect, d * aspect, d, -d, 0.01, 100
  )
  camera.zoom = 2
  camera.position.set(9.238, 7.435, 6.181)
  camera.lookAt(0, 0, 0)
  return camera
}

/**
 * Initialize orbit controls
 */
export function initializeControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.minZoom = 1.5
  controls.maxZoom = 100
  controls.keys = { 
    LEFT: 'ArrowLeft', 
    UP: 'ArrowUp', 
    RIGHT: 'ArrowRight', 
    BOTTOM: 'ArrowDown' 
  }
  controls.target.set(-1.731, 2.686, -1.376)
  controls.mouseButtons = { 
    LEFT: THREE.MOUSE.ROTATE, 
    MIDDLE: THREE.MOUSE.DOLLY, 
    RIGHT: THREE.MOUSE.PAN 
  }
  controls.update()
  return controls
}

/**
 * Setup environment
 */
export function setupEnvironment(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
  pmremGenerator.dispose()
}

/**
 * Update orthographic camera for proper aspect ratio
 */
export function updateOrthoCamera(camera, viewHeight) {
  const aspect = window.innerWidth / window.innerHeight
  const halfHeight = viewHeight / 2
  const halfWidth = halfHeight * aspect
  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
}

/**
 * Setup keyboard controls for camera mode switching
 */
export function setupKeyboardControls(controls) {
  let currentMode = 'default'
  
  const onKeyDown = (evt) => {
    switch (evt.key.toLowerCase()) {
      case 'p':
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN
        currentMode = 'pan'
        break
      case 'o':
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
        currentMode = 'orbit'
        break
      case 'escape':
        controls.mouseButtons = { 
          LEFT: THREE.MOUSE.ROTATE, 
          MIDDLE: THREE.MOUSE.DOLLY, 
          RIGHT: THREE.MOUSE.PAN 
        }
        currentMode = 'default'
        break
    }
    controls.update()
  }

  window.addEventListener('keydown', onKeyDown)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', onKeyDown)
  }
}

/**
 * Setup camera logging (for debugging)
 */
export function setupCameraLogger(camera, controls) {
  const logCamera = () => {
    console.log('Camera position:', camera.position)
    console.log('Camera rotation:', camera.rotation)
    console.log('Camera zoom:', camera.zoom)
    console.log('Controls target:', controls.target)
  }

  const onLog = (e) => { 
    if (e.code === 'KeyL') logCamera() 
  }

  window.addEventListener('keydown', onLog)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', onLog)
  }
}

/**
 * Setup window resize handler
 */
export function setupResizeHandler(camera, renderer) {
  const onResize = () => {
    const aspect = window.innerWidth / window.innerHeight
    const d = 10
    camera.left = -d * aspect
    camera.right = d * aspect
    camera.top = d
    camera.bottom = -d
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', onResize)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', onResize)
  }
}

/**
 * Start animation loop
 */
export function startAnimationLoop(renderer, scene, camera, controls, onFrame) {
  let animationId

  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    updateOrthoCamera(camera, 20)
    renderer.render(scene, camera)
    
    // Call optional frame callback
    if (onFrame) {
      onFrame()
    }
  }
  
  animate()
  
  // Return stop function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }
}

/**
 * Center orbit controls on content
 */
export function centerOrbitOnContent(scene, controls) {
  const bbox = new THREE.Box3()
  
  // Only include generated objects (rack and MEP components)
  scene.traverse((object) => {
    if (object.userData.isGenerated && object.isMesh) {
      const objectBBox = new THREE.Box3().setFromObject(object)
      bbox.union(objectBBox)
    }
  })

  if (!bbox.isEmpty()) {
    const center = bbox.getCenter(new THREE.Vector3())
    controls.target.copy(center)
    controls.update()
  }
}