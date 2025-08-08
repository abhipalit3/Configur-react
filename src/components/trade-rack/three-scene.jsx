import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { dispose } from './utils.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { ViewCube } from './ViewCube.js'
import {buildRackScene} from './buildRack.js'
import { MeasurementTool } from './MeasurementTool.js'


export default function ThreeScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.physicallyCorrectLights = true
    mountRef.current.appendChild(renderer.domElement)

    // Scene & Lights
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xdbefff)

    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)

    const gridHelper = new THREE.GridHelper(100, 100, 0x000000, 0x000000)
    gridHelper.material.opacity = 0.15
    gridHelper.material.transparent = true
    gridHelper.material.depthWrite = false
    gridHelper.renderOrder = -1
    scene.add(gridHelper)

    function createBackgroundGrid(size = 1000, step = 10, color = 0x000000) {
      const lines = []
      for (let i = -size; i <= size; i += step) {
        lines.push(-size, 0, i, size, 0, i)
        lines.push(i, 0, -size, i, 0, size)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines.flat(), 3))
      const material = new THREE.LineBasicMaterial({ color, opacity: 0.3, transparent: true, depthWrite: false })
      const lineSegments = new THREE.LineSegments(geometry, material)
      lineSegments.renderOrder = -2
      scene.add(lineSegments)
    }
    createBackgroundGrid()

    function updateOrthoCamera(camera, viewHeight) {
      const aspect = window.innerWidth / window.innerHeight
      const halfHeight = viewHeight / 2
      const halfWidth = halfHeight * aspect
      camera.left = -halfWidth
      camera.right = halfWidth
      camera.top = halfHeight
      camera.bottom = -halfHeight
      camera.updateProjectionMatrix()
    }

    // Camera & Controls
    const aspect = window.innerWidth / window.innerHeight
    const d = 10
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.01, 100)
    camera.zoom = 2
    camera.position.set(9.238, 7.435, 6.181)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.minZoom = 1.5
    controls.maxZoom = 100
    controls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' }
    controls.target.set(-1.731, 2.686, -1.376)
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }

    let currentMode = 'default'
    const onKeyDown = (evt) => {
      switch (evt.key.toLowerCase()) {
        case 'p':
          controls.mouseButtons.LEFT = THREE.MOUSE.PAN; currentMode = 'pan'; break
        case 'o':
          controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; currentMode = 'orbit'; break
        case 'escape':
          controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
          currentMode = 'default'; break
      }
      controls.update()
    }
    window.addEventListener('keydown', onKeyDown)
    controls.update()

    // Environment
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.1).texture

    // Camera Logger
    const logCamera = () => {
      console.log(`camera.position.set(${camera.position.x.toFixed(3)}, ${camera.position.y.toFixed(3)}, ${camera.position.z.toFixed(3)});`)
      console.log(`controls.target.set(${controls.target.x.toFixed(3)}, ${controls.target.y.toFixed(3)}, ${controls.target.z.toFixed(3)}); controls.update();`)
    }
    const onLog = (e) => { if (e.code === 'KeyL') logCamera() }
    window.addEventListener('keydown', onLog)

    // Materials
    const texLoader = new THREE.TextureLoader()
    const floorAlbedo = texLoader.load(process.env.PUBLIC_URL + '/textures/Floor-Roof/Wood066_1K-JPG_Color.jpg')
    const floorNormal = texLoader.load(process.env.PUBLIC_URL + '/textures/Floor-Roof/Wood066_1K-JPG_NormalGL.jpg')
    const floorRough  = texLoader.load(process.env.PUBLIC_URL + '/textures/Floor-Roof/Wood066_1K-JPG_Roughness.jpg')
    ;[floorAlbedo, floorNormal, floorRough].forEach(tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(8, 8)
    })

    const floorMaterial    = new THREE.MeshStandardMaterial({ map: floorAlbedo, normalMap: floorNormal, roughnessMap: floorRough, metalness: 0.2, roughness: 1.0 })
    const steelMat         = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.25 })
    const wallMaterial     = new THREE.MeshStandardMaterial({ color: '#e0e0e0', metalness: 0.1, roughness: 0.7, transparent: true, opacity: 0.4 })
    const ceilingMaterial  = new THREE.MeshStandardMaterial({ color: '#f5f5f5', metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.4 })
    const roofMaterial     = new THREE.MeshStandardMaterial({ color: '#bdbdbd', metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.4 })
    const ductMat          = new THREE.MeshStandardMaterial({ color: '#d05e8f', metalness: 0.5, roughness: 0.9, transparent: true, opacity: 1 })

    /* ---------- parameters ---------- */
    const params = {
    corridorWidth  : 10,
    corridorHeight : 15,
    ceilingHeight  : 9,
    ceilingDepth   : 2,
    slabDepth      : 4,
    wallThickness  : 6,

    bayCount  : 4,
    bayWidth  : 3,
    depth     : 4,

    topClearance : 15,
    postSize     : 2,
    beamSize     : 2,

    tierCount    : 2,
    tierHeights  : [2, 2],   // ft  (parallel array #1)

    /* per-tier duct settings – parallel arrays keep the old utils untouched */
    ductEnabled  : [true, false],
    ductWidths   : [18, 18], // in  (parallel array #2)
    ductHeights  : [16, 16], // in  (parallel array #3)
    ductOffsets  : [ 0,  0]  // in  (parallel array #4)
    };

    const mats = {
        steelMat,
        wallMaterial,
        ceilingMaterial,
        floorMaterial,
        roofMaterial,
        ductMat
        };
    
    const snapPoints = buildRackScene(scene, params, mats)

    console.log('Snap points extracted:', snapPoints.length)

    const measurementTool = new MeasurementTool(
      scene,
      camera,
      renderer.domElement,
      snapPoints
    )
    measurementTool.enable()

    // Enhanced ViewCube Setup
    const viewCubeScene    = new THREE.Scene()
    const viewCubeCamera   = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    viewCubeCamera.position.set(0, 0, 5) // Closer for better visibility
    viewCubeCamera.lookAt(0, 0, 0)
    
    const viewCube         = new ViewCube(1.2) // Larger size
    viewCubeScene.add(viewCube)

    // Add some lighting to the ViewCube scene
    const viewCubeAmbient = new THREE.AmbientLight(0xffffff, 0.6)
    const viewCubeDirectional = new THREE.DirectionalLight(0xffffff, 0.4)
    viewCubeDirectional.position.set(1, 1, 1)
    viewCubeScene.add(viewCubeAmbient, viewCubeDirectional)

    // Setup click handling for the ViewCube
    viewCube.setupClickHandler(camera, controls, scene)

    const viewCubeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    viewCubeRenderer.setSize(150, 150) // Larger ViewCube display
    viewCubeRenderer.setClearColor(0x000000, 0) // Fully transparent background
    viewCubeRenderer.toneMapping = THREE.ACESFilmicToneMapping
    viewCubeRenderer.outputColorSpace = THREE.SRGBColorSpace
    viewCubeRenderer.physicallyCorrectLights = true
    viewCubeRenderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(viewCubeRenderer.domElement)
    Object.assign(viewCubeRenderer.domElement.style, {
      position: 'absolute',
      left: '20px',
      bottom: '20px',
      zIndex: '1000',
      cursor: 'pointer'
      // Removed border and background styling for clean transparent look
    })

    // ViewCube click handler
    const onViewCubeClick = (event) => {
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
        console.log(`Clicked face index: ${faceIndex}, Face: ${viewCube.viewConfigs[faceIndex]?.name}`)
        viewCube.animateToView(faceIndex)
      }
    }

    viewCubeRenderer.domElement.addEventListener('click', onViewCubeClick)

    // Resize & Animate
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    ;(function animate() {
      requestAnimationFrame(animate)
      controls.update()
      updateOrthoCamera(camera, 20)
      renderer.render(scene, camera)
      
      // Apply inverse rotation to ViewCube so it shows correct faces
      // When camera rotates right, ViewCube should rotate left to show the face we're looking from
      const inverseQuaternion = camera.quaternion.clone().invert()
      viewCube.quaternion.copy(inverseQuaternion)
      
      // Keep ViewCube camera looking at the ViewCube with same up vector as main camera
      viewCubeCamera.position.set(0, 0, 5)
      viewCubeCamera.up.copy(camera.up)
      viewCubeCamera.lookAt(0, 0, 0)
      
      viewCubeRenderer.render(viewCubeScene, viewCubeCamera)
      measurementTool.updateLabels()
    })()

    // Cleanup
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onLog)
      window.removeEventListener('resize', onResize)
      viewCubeRenderer.domElement.removeEventListener('click', onViewCubeClick)
      dispose(scene)
      renderer.dispose()
      viewCubeRenderer.dispose()
      if (mountRef.current) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
        }
        if (mountRef.current.contains(viewCubeRenderer.domElement)) {
          mountRef.current.removeChild(viewCubeRenderer.domElement)
        }
      }
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}