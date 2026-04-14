/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  getDrainFixture,
  getPointAlongEdge,
  getRotatedBoxCorners,
  getWallSegmentsWithDoor,
  validateDoorOpening
} from '../../utils/bathroomPodGeometry'
import { bathroomPodFixtureTypes } from '../../types/bathroomPod'

import './bathroom-pod.css'

const INCH_TO_FEET = 1 / 12

const toScenePoint = (point, center) => ({
  x: (point.x - center.x) * INCH_TO_FEET,
  z: (point.y - center.y) * INCH_TO_FEET
})

const getCenter = (points) => {
  if (!points.length) return { x: 0, y: 0 }
  const bounds = points.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxX: Math.max(acc.maxX, point.x),
    maxY: Math.max(acc.maxY, point.y)
  }), {
    minX: points[0].x,
    minY: points[0].y,
    maxX: points[0].x,
    maxY: points[0].y
  })

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  }
}

const addBoxBetweenPoints = (group, start, end, height, thickness, yCenter, material) => {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const length = Math.sqrt(dx * dx + dz * dz)
  if (length <= 0.001 || height <= 0.001) return

  const geometry = new THREE.BoxGeometry(length, height, thickness)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set((start.x + end.x) / 2, yCenter, (start.z + end.z) / 2)
  mesh.rotation.y = -Math.atan2(dz, dx)
  group.add(mesh)
}

const makeLine = (points, color, y = 0.02) => {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => (
    new THREE.Vector3(point.x, y, point.z)
  )))
  const material = new THREE.LineBasicMaterial({ color })
  return new THREE.LineLoop(geometry, material)
}

export default function BathroomPodPreview3D({ pod }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 420)
    renderer.setClearColor(0xf7f9fb, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf7f9fb)

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const light = new THREE.DirectionalLight(0xffffff, 0.9)
    light.position.set(6, 10, 8)
    scene.add(ambient, light)

    const aspect = (mount.clientWidth || 640) / (mount.clientHeight || 420)
    const camera = new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 8, -8, 0.01, 200)
    camera.position.set(7, 8, 9)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 1.5, 0)
    controls.update()

    const grid = new THREE.GridHelper(20, 20, 0x94a3b8, 0xdbe4ee)
    grid.position.y = -0.02
    scene.add(grid)

    const contentGroup = new THREE.Group()
    scene.add(contentGroup)

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera
    controlsRef.current = controls
    groupRef.current = contentGroup

    const resize = () => {
      const width = mount.clientWidth || 640
      const height = mount.clientHeight || 420
      const nextAspect = width / height
      camera.left = -8 * nextAspect
      camera.right = 8 * nextAspect
      camera.top = 8
      camera.bottom = -8
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let animationFrame
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    const group = groupRef.current
    if (!group || !pod?.layout?.length) return

    while (group.children.length) {
      const child = group.children.pop()
      child.traverse(object => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }

    const center = getCenter(pod.layout)
    const planPoints = pod.layout.map(point => toScenePoint(point, center))
    const shape = new THREE.Shape(planPoints.map(point => new THREE.Vector2(point.x, point.z)))
    const floorGeometry = new THREE.ShapeGeometry(shape)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dee6,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = Math.PI / 2
    floor.position.y = 0
    group.add(floor)

    group.add(makeLine(planPoints, 0x0f172a, 0.03))

    const drain = getDrainFixture(pod.fixtures || [])
    if (drain) {
      const slopeCorners = getRotatedBoxCorners(drain, pod.slopeBox.width, pod.slopeBox.length, pod.slopeBox.rotation)
        .map(point => toScenePoint(point, center))
      const drainPoint = toScenePoint(drain, center)
      const slopeDepth = (pod.slopeBox.depth || 0) * INCH_TO_FEET
      const positions = []
      slopeCorners.forEach((corner, index) => {
        const next = slopeCorners[(index + 1) % slopeCorners.length]
        positions.push(corner.x, 0.035, corner.z)
        positions.push(next.x, 0.035, next.z)
        positions.push(drainPoint.x, -slopeDepth, drainPoint.z)
      })
      const slopeGeometry = new THREE.BufferGeometry()
      slopeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      slopeGeometry.computeVertexNormals()
      const slopeMaterial = new THREE.MeshStandardMaterial({
        color: 0x8fc6c9,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        roughness: 0.8
      })
      group.add(new THREE.Mesh(slopeGeometry, slopeMaterial))
      group.add(makeLine(slopeCorners, 0x256f72, 0.06))
    }

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
    const coveMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.6 })
    const overallHeight = (pod.heights?.overall || 108) * INCH_TO_FEET
    const doorValidation = validateDoorOpening(pod)
    const doorway = doorValidation.valid ? pod.doorway : null
    const wallSegments = getWallSegmentsWithDoor(pod.layout, doorway)
    wallSegments.filter(segment => segment.type === 'wall').forEach(segment => {
      const start = toScenePoint(segment.start, center)
      const end = toScenePoint(segment.end, center)
      const material = segment.edgeIndex === pod.coveEdgeIndex ? coveMaterial : wallMaterial
      addBoxBetweenPoints(group, start, end, overallHeight, 0.28, overallHeight / 2, material)
    })

    if (doorway) {
      const clearHeight = (doorway.height || 84) * INCH_TO_FEET
      const headerHeight = Math.max(0, overallHeight - clearHeight)
      const start = toScenePoint(getPointAlongEdge(pod.layout, doorway.edgeIndex, doorway.offset), center)
      const end = toScenePoint(getPointAlongEdge(pod.layout, doorway.edgeIndex, doorway.offset + doorway.width), center)
      addBoxBetweenPoints(group, start, end, headerHeight, 0.3, clearHeight + headerHeight / 2, wallMaterial)
      addBoxBetweenPoints(group, start, end, 0.06, 0.36, 0.08, new THREE.MeshStandardMaterial({ color: 0xef4444 }))
    }

    const clearHeight = (pod.heights?.clear || 96) * INCH_TO_FEET
    const clearancePoints = planPoints.map(point => new THREE.Vector3(point.x, clearHeight, point.z))
    const clearanceGeometry = new THREE.BufferGeometry().setFromPoints([...clearancePoints, clearancePoints[0]])
    const clearanceMaterial = new THREE.LineDashedMaterial({ color: 0x3b82f6, dashSize: 0.16, gapSize: 0.08 })
    const clearanceLine = new THREE.Line(clearanceGeometry, clearanceMaterial)
    clearanceLine.computeLineDistances()
    group.add(clearanceLine)

    ;(pod.fixtures || []).forEach(fixture => {
      const fixturePoint = toScenePoint(fixture, center)
      const fixtureType = bathroomPodFixtureTypes.find(item => item.value === fixture.type)
      const material = new THREE.MeshStandardMaterial({ color: fixtureType?.color || '#64748b' })
      const isDrain = fixture.type === 'drain'
      const geometry = isDrain
        ? new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24)
        : new THREE.CylinderGeometry(0.2, 0.2, 0.35, 18)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(fixturePoint.x, isDrain ? 0.06 : 0.22, fixturePoint.z)
      group.add(mesh)
    })

    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current
      const controls = controlsRef.current
      controls.target.set(0, overallHeight / 3, 0)
      camera.updateProjectionMatrix()
      controls.update()
    }
  }, [pod])

  return (
    <div className="bathroom-pod-preview-shell">
      <div className="bathroom-pod-pane-heading">
        <span>3D Pod Preview</span>
        <span>{pod?.structuralType === 'tiesIntoExisting' ? 'Ties Into Existing' : 'Monolithic'}</span>
      </div>
      <div ref={mountRef} className="bathroom-pod-preview-canvas" />
    </div>
  )
}
