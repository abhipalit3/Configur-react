import * as THREE from 'three'

export class MeasurementTool {
  constructor(scene, camera, domElement, snapPoints = []) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.snapPoints = snapPoints
    this.points = []
    this.lines = []
    this.labels = []
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.active = false
    this.clickHandler = this.onClick.bind(this)
    this.hoverMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.01),
        new THREE.MeshBasicMaterial({ color: 0x0088ff })
        )
    this.hoverMarker.visible = false
    this.scene.add(this.hoverMarker)
    this.previewLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineDashedMaterial({
        color: 0x0088ff,
        dashSize: 0.1,
        gapSize: 0.05
    })
    )
    this.previewLine.computeLineDistances()
    this.previewLine.visible = false
    this.scene.add(this.previewLine)
  }

  enable() {
    if (this.active) return
    this.domElement.addEventListener('click', this.clickHandler)
    this.active = true
    this.hoverHandler = this.onPointerMove.bind(this)   
    this.domElement.addEventListener('pointermove', this.hoverHandler)
  }

  disable() {
    if (!this.active) return
    this.domElement.removeEventListener('click', this.clickHandler)
    this.domElement.removeEventListener('pointermove', this.hoverHandler)
    this.active = false
  }

  findClosestSnapPoint(event) {
    const rect = this.domElement.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    let closest = null
    let minDist = Infinity

    for (const worldPoint of this.snapPoints) {
        const screenPoint = worldPoint.clone().project(this.camera)
        const x = (screenPoint.x * 0.5 + 0.5) * this.domElement.clientWidth
        const y = (-screenPoint.y * 0.5 + 0.5) * this.domElement.clientHeight
        const dist = Math.hypot(mouseX - x, mouseY - y)

        if (dist < minDist && dist < 15) { // screen-space threshold in pixels
        minDist = dist
        closest = worldPoint.clone()
        }
    }

    return closest
    }


  onClick(event) {
    const point = this.findClosestSnapPoint(event)
    if (!point) return

    this.points.push(point)

    this.previewLine.visible = false

    if (this.points.length === 2) {
      this.drawMeasurement(this.points[0], this.points[1])
      this.points = []
    }
  }

    onPointerMove(event) {
    const point = this.findClosestSnapPoint(event)

    if (point) {
        this.hoverMarker.position.copy(point)
        this.hoverMarker.visible = true

        if (this.points.length === 1) {
        this.previewLine.geometry.setFromPoints([this.points[0], point])
        this.previewLine.computeLineDistances()
        this.previewLine.visible = true
        } else {
        this.previewLine.visible = false
        }
    } else {
        this.hoverMarker.visible = false
        this.previewLine.visible = false
    }
    }


  drawMeasurement(p1, p2) {
    // Main line
    const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2])
    const material = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 })
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)
    this.lines.push(line)

    // Arrowheads
    const arrowSize = 0.1
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize()
    const left = new THREE.Vector3().copy(dir).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.75).multiplyScalar(arrowSize)
    const right = new THREE.Vector3().copy(dir).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.75).multiplyScalar(arrowSize)

    const addArrow = (base) => {
        const g = new THREE.BufferGeometry().setFromPoints([
        base.clone().add(left), base, base.clone().add(right)
        ])
        const m = new THREE.LineBasicMaterial({ color: 0x0088ff })
        const arrow = new THREE.LineSegments(g, m)
        this.scene.add(arrow)
        this.lines.push(arrow)
    }

    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x0088ff })
    const sphereGeo = new THREE.SphereGeometry(0.01)
    const s1 = new THREE.Mesh(sphereGeo, sphereMat)
    const s2 = new THREE.Mesh(sphereGeo, sphereMat)
    s1.position.copy(p1)
    s2.position.copy(p2)
    this.scene.add(s1, s2)
    this.lines.push(s1, s2)

    // Label
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
    const offset = new THREE.Vector3(0, 0.1, 0) // slight vertical offset
    const labelPos = mid.clone().add(offset)
    const distance = p1.distanceTo(p2).toFixed(3)

    const label = document.createElement('div')
    label.textContent = `${distance} m`
    Object.assign(label.style, {
        position: 'absolute',
        fontSize: '13px',
        fontWeight: 'bold',
        background: '#222',
        padding: '2px 6px',
        borderRadius: '4px',
        color: 'white',
        border: '1px solid #ccc',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap',
        zIndex: 1000
    })

    this.domElement.parentElement.appendChild(label)
    this.labels.push({ element: label, position: labelPos })
}


  updateLabels() {
    for (const label of this.labels) {
      const pos = label.position.clone().project(this.camera)
      const x = (pos.x * 0.5 + 0.5) * this.domElement.clientWidth
      const y = (-pos.y * 0.5 + 0.5) * this.domElement.clientHeight
      label.element.style.left = `${x}px`
      label.element.style.top = `${y}px`
    }
  }

  dispose() {
    this.disable()
    this.lines.forEach(line => this.scene.remove(line))
    this.labels.forEach(label => label.element.remove())
    this.points = []
    this.lines = []
    this.labels = []
  }
}
