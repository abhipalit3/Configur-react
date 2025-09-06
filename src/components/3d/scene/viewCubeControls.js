/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'
import { ViewCube } from '../controls/ViewCube.js'

/**
 * Initialize ViewCube scene and camera
 */
export function initializeViewCubeScene() {
  const viewCubeScene = new THREE.Scene()
  const viewCubeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  viewCubeCamera.position.set(0, 0, 5) // Closer for better visibility
  viewCubeCamera.lookAt(0, 0, 0)
  
  return { viewCubeScene, viewCubeCamera }
}

/**
 * Create and setup ViewCube
 */
export function createViewCube(scene, camera, controls, mainScene) {
  const viewCube = new ViewCube(1.2) // Larger size
  scene.add(viewCube)
  
  // Setup click handling for the ViewCube
  viewCube.setupClickHandler(camera, controls, mainScene)
  
  return viewCube
}

/**
 * Setup ViewCube lighting
 */
export function setupViewCubeLighting(scene) {
  const viewCubeAmbient = new THREE.AmbientLight(0xffffff, 0.6)
  const viewCubeDirectional = new THREE.DirectionalLight(0xffffff, 0.4)
  viewCubeDirectional.position.set(1, 1, 1)
  scene.add(viewCubeAmbient, viewCubeDirectional)
  
  return { viewCubeAmbient, viewCubeDirectional }
}

/**
 * Create ViewCube renderer
 */
export function createViewCubeRenderer() {
  const viewCubeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  viewCubeRenderer.setSize(150, 150) // Larger ViewCube display
  viewCubeRenderer.setClearColor(0x000000, 0) // Fully transparent background
  viewCubeRenderer.toneMapping = THREE.ACESFilmicToneMapping
  viewCubeRenderer.outputColorSpace = THREE.SRGBColorSpace
  viewCubeRenderer.physicallyCorrectLights = true
  
  return viewCubeRenderer
}

/**
 * Setup ViewCube DOM element positioning
 */
export function setupViewCubeDOM(renderer, mountElement) {
  // Apply styling directly to the renderer's DOM element to match original positioning
  renderer.setPixelRatio(window.devicePixelRatio)
  mountElement.appendChild(renderer.domElement)
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    left: '20px',
    bottom: '20px',
    zIndex: '1000',
    cursor: 'pointer'
    // Removed border and background styling for clean transparent look
  })
  
  return renderer.domElement
}

/**
 * Create ViewCube click handler
 */
export function createViewCubeClickHandler(viewCube, viewCubeCamera, viewCubeRenderer) {
  return (event) => {
    // Calculate mouse position relative to ViewCube canvas
    const rect = viewCubeRenderer.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast against ViewCube
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, viewCubeCamera)
    const intersects = raycaster.intersectObject(viewCube)

    if (intersects.length > 0) {
      const faceIndex = intersects[0].face.materialIndex
      viewCube.animateToView(faceIndex)
      console.log('🎯 ViewCube clicked on face:', faceIndex)
    }
  }
}

/**
 * Update ViewCube rotation based on main camera
 */
export function updateViewCubeRotation(viewCube, viewCubeCamera, mainCamera) {
  if (viewCube && viewCubeCamera) {
    // Apply inverse rotation to ViewCube
    const inverseQuaternion = mainCamera.quaternion.clone().invert()
    viewCube.quaternion.copy(inverseQuaternion)
    
    // Keep ViewCube camera looking at the ViewCube
    viewCubeCamera.position.set(0, 0, 5)
    viewCubeCamera.up.copy(mainCamera.up)
    viewCubeCamera.lookAt(0, 0, 0)
  }
}

/**
 * Render ViewCube
 */
export function renderViewCube(renderer, scene, camera) {
  renderer.render(scene, camera)
}

/**
 * Initialize complete ViewCube system
 */
export function initializeViewCube(mainCamera, mainControls, mainScene, mountElement) {
  // Initialize ViewCube scene and camera
  const { viewCubeScene, viewCubeCamera } = initializeViewCubeScene()
  
  // Create ViewCube
  const viewCube = createViewCube(viewCubeScene, mainCamera, mainControls, mainScene)
  
  // Setup lighting
  setupViewCubeLighting(viewCubeScene)
  
  // Create renderer
  const viewCubeRenderer = createViewCubeRenderer()
  
  // Setup DOM
  const viewCubeContainer = setupViewCubeDOM(viewCubeRenderer, mountElement)
  
  // Create click handler
  const onViewCubeClick = createViewCubeClickHandler(viewCube, viewCubeCamera, viewCubeRenderer)
  
  // Add event listener
  viewCubeRenderer.domElement.addEventListener('click', onViewCubeClick)
  
  // Update function for animation loop
  const updateViewCube = () => {
    updateViewCubeRotation(viewCube, viewCubeCamera, mainCamera)
    renderViewCube(viewCubeRenderer, viewCubeScene, viewCubeCamera)
  }
  
  // Cleanup function
  const cleanup = () => {
    viewCubeRenderer.domElement.removeEventListener('click', onViewCubeClick)
    if (viewCubeRenderer.domElement && viewCubeRenderer.domElement.parentNode) {
      viewCubeRenderer.domElement.parentNode.removeChild(viewCubeRenderer.domElement)
    }
    viewCubeRenderer.dispose()
  }
  
  return {
    viewCube,
    viewCubeScene,
    viewCubeCamera,
    viewCubeRenderer,
    viewCubeContainer,
    updateViewCube,
    cleanup
  }
}