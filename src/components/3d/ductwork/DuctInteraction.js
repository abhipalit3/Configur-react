import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

/**
 * DuctInteraction - Handles mouse interactions and transform controls for ducts
 */
export class DuctInteraction {
  constructor(scene, camera, renderer, orbitControls, ductGeometry, snapLineManager) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.orbitControls = orbitControls
    this.ductGeometry = ductGeometry
    this.snapLineManager = snapLineManager
    
    this.selectedDuct = null
    this.transformControls = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.domElement = renderer.domElement
    
    this.ductMeasurementIds = []
    
    // Editor callbacks - to be set by parent
    this.onDuctEditorSave = null
    this.onDuctEditorCancel = null
    
    this.setupTransformControls()
    this.setupEventListeners()
  }

  setupTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.domElement)
    
    this.transformControls.addEventListener('change', () => {
      this.onTransformChange()
    })

    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
      }
      
      if (!event.value) {
        this.snapLineManager.clearSnapGuides()
        // Save position when dragging ends
        this.saveDuctPosition()
      }
    })

    this.transformControls.setMode('translate')
    this.transformControls.setSpace('world')
    this.transformControls.setSize(2.0)
    this.transformControls.showX = false
    this.transformControls.showY = true
    this.transformControls.showZ = true
    
    const gizmo = this.transformControls.getHelper()
    this.scene.add(gizmo)
  }

  setupEventListeners() {
    this.domElement.addEventListener('click', this.onMouseClick.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.setupKeyboardShortcuts()
  }

  onMouseClick(event) {
    if (this.transformControls?.dragging) return

    this.updateMousePosition(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Find ductwork group in scene
    let ductworkGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'DuctworkGroup') {
        ductworkGroup = child
      }
    })

    if (!ductworkGroup) return

    const intersects = this.raycaster.intersectObjects(ductworkGroup.children, true)
    
    if (intersects.length > 0) {
      const ductGroup = this.findDuctGroup(intersects[0].object)
      if (ductGroup && ductGroup !== this.selectedDuct) {
        this.selectDuct(ductGroup)
      }
    } else {
      this.deselectDuct()
    }
  }

  onMouseMove(event) {
    if (!this.transformControls?.dragging) {
      this.updateMousePosition(event)
      this.handleHover()
    }
  }

  onTransformChange() {
    if (!this.selectedDuct || !this.transformControls?.object) return
    
    if (!this.selectedDuct.parent) {
      this.deselectDuct()
      return
    }
    
    if (this.transformControls.dragging) {
      this.applyRealTimeSnapping()
      this.updateDuctMeasurements()
    }
  }

  applyRealTimeSnapping() {
    if (!this.selectedDuct) return
    
    const snapTolerance = 0.03 // Reduced from 0.1 to 0.03 (about 1.2 inches instead of 4 inches)
    const ductData = this.selectedDuct.userData.ductData
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    
    const currentPos = this.selectedDuct.position.clone()
    const ductHeight = this.snapLineManager.in2m(ductData.height || 8)
    const ductWidth = this.snapLineManager.in2m(ductData.width || 12)
    const insulation = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalHeight = ductHeight + (2 * insulation)
    const totalWidth = ductWidth + (2 * insulation)
    
    let snapped = false
    let posX = currentPos.x
    let posY = currentPos.y
    let posZ = currentPos.z
    
    // Y-axis snapping
    const ductBottom = posY - (totalHeight / 2)
    const ductTop = posY + (totalHeight / 2)
    
    let closestYSnap = null
    let closestYDist = snapTolerance
    
    for (const line of snapLines.horizontal) {
      if (line.type === 'beam_top') {
        const dist = Math.abs(ductBottom - line.y)
        if (dist < closestYDist) {
          closestYSnap = { newY: line.y + (totalHeight / 2), dist, lineY: line.y }
          closestYDist = dist
        }
      }
      
      if (line.type === 'beam_bottom') {
        const dist = Math.abs(ductTop - line.y)
        if (dist < closestYDist) {
          closestYSnap = { newY: line.y - (totalHeight / 2), dist, lineY: line.y }
          closestYDist = dist
        }
      }
    }
    
    if (closestYSnap) {
      posY = closestYSnap.newY
      snapped = true
    }
    
    // Z-axis snapping
    const ductLeft = posZ - (totalWidth / 2)
    const ductRight = posZ + (totalWidth / 2)
    
    let closestZSnap = null
    let closestZDist = snapTolerance
    
    for (const line of snapLines.vertical) {
      if (line.side === 'right') {
        const dist = Math.abs(ductLeft - line.z)
        if (dist < closestZDist) {
          closestZSnap = { newZ: line.z + (totalWidth / 2), dist }
          closestZDist = dist
        }
      }
      
      if (line.side === 'left') {
        const dist = Math.abs(ductRight - line.z)
        if (dist < closestZDist) {
          closestZSnap = { newZ: line.z - (totalWidth / 2), dist }
          closestZDist = dist
        }
      }
    }
    
    if (closestZSnap) {
      posZ = closestZSnap.newZ
      snapped = true
    }
    
    if (snapped) {
      this.selectedDuct.position.set(posX, posY, posZ)
    }
  }

  selectDuct(ductGroup) {
    if (!ductGroup || !ductGroup.position || !ductGroup.parent) return
    
    this.deselectDuct()
    
    this.selectedDuct = ductGroup
    this.ductGeometry.updateDuctAppearance(ductGroup, 'selected')
    
    const originalPosition = ductGroup.position.clone()
    
    // Ensure transform controls are in translate mode when selecting a duct
    this.transformControls.setMode('translate')
    this.transformControls.attach(ductGroup)
    ductGroup.position.copy(originalPosition)
    
    this.createDuctMeasurements()
  }

  deselectDuct() {
    if (this.selectedDuct) {
      if (this.selectedDuct.parent) {
        this.ductGeometry.updateDuctAppearance(this.selectedDuct, 'normal')
      }
      
      if (this.transformControls) {
        try {
          this.transformControls.detach()
        } catch (error) {
          // Silent error handling
        }
      }
      
      this.selectedDuct = null
    }
    
    this.snapLineManager.clearSnapGuides()
    this.clearDuctMeasurements()
  }

  createDuctMeasurements() {
    if (!this.selectedDuct) return
    
    const measurementTool = window.measurementToolInstance
    if (!measurementTool) return
    
    const ductData = this.selectedDuct.userData.ductData
    const ductPos = this.selectedDuct.position
    
    const ductWidth = this.snapLineManager.in2m(ductData.width || 12)
    const insulation = this.snapLineManager.in2m(ductData.insulation || 0)
    const totalWidth = ductWidth + (2 * insulation)
    
    // Get post positions from snap lines
    const snapLines = this.snapLineManager.getSnapLinesFromRackGeometry()
    const rightPost = snapLines.vertical.find(line => line.side === 'right')
    const leftPost = snapLines.vertical.find(line => line.side === 'left')
    
    if (!rightPost || !leftPost) return
    
    const ductLeft = ductPos.z - (totalWidth / 2)
    const ductRight = ductPos.z + (totalWidth / 2)
    
    const dimY = ductPos.y
    const dimX = ductPos.x
    
    this.ductMeasurementIds = []
    
    // Right side measurement
    const rightP1 = new THREE.Vector3(dimX, dimY, ductLeft)
    const rightP2 = new THREE.Vector3(dimX, dimY, rightPost.z)
    measurementTool.drawMeasurement(rightP1, rightP2)
    this.ductMeasurementIds.push(measurementTool.measurementId)
    
    // Left side measurement
    const leftP1 = new THREE.Vector3(dimX, dimY, ductRight)
    const leftP2 = new THREE.Vector3(dimX, dimY, leftPost.z)
    measurementTool.drawMeasurement(leftP1, leftP2)
    this.ductMeasurementIds.push(measurementTool.measurementId)
  }

  clearDuctMeasurements() {
    const measurementTool = window.measurementToolInstance
    if (!measurementTool || !this.ductMeasurementIds) return
    
    this.ductMeasurementIds.forEach(id => {
      measurementTool.removeMeasurement(id)
    })
    
    this.ductMeasurementIds = []
  }

  updateDuctMeasurements() {
    if (!this.selectedDuct || !this.ductMeasurementIds?.length) return
    
    this.clearDuctMeasurements()
    this.createDuctMeasurements()
  }

  handleHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    let ductworkGroup = null
    this.scene.traverse((child) => {
      if (child.isGroup && child.name === 'DuctworkGroup') {
        ductworkGroup = child
      }
    })

    if (!ductworkGroup) return

    const intersects = this.raycaster.intersectObjects(ductworkGroup.children, true)

    // Reset all ducts to normal (except selected)
    ductworkGroup.children.forEach(ductGroup => {
      if (ductGroup !== this.selectedDuct) {
        this.ductGeometry.updateDuctAppearance(ductGroup, 'normal')
      }
    })

    // Apply hover effect
    if (intersects.length > 0) {
      const ductGroup = this.findDuctGroup(intersects[0].object)
      if (ductGroup && ductGroup !== this.selectedDuct) {
        this.ductGeometry.updateDuctAppearance(ductGroup, 'hover')
        this.domElement.style.cursor = 'pointer'
      }
    } else if (!this.selectedDuct) {
      this.domElement.style.cursor = 'default'
    }
  }

  findDuctGroup(object) {
    let current = object
    while (current && current.parent) {
      if (current.userData.type === 'duct') {
        return current
      }
      current = current.parent
    }
    return null
  }

  updateMousePosition(event) {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  setupKeyboardShortcuts() {
    const onKeyDown = (event) => {
      if (!this.transformControls) return
      
      switch (event.key.toLowerCase()) {
        case 'w':
          this.transformControls.setMode('translate')
          break
        case 'e':
          this.transformControls.setMode('rotate')
          break
        case 'r':
          this.transformControls.setMode('scale')
          break
        case 'escape':
          this.deselectDuct()
          break
      }
    }
    
    document.addEventListener('keydown', onKeyDown)
    this.keyboardHandler = onKeyDown
  }

  /**
   * Set callback for duct editor save action
   */
  setDuctEditorCallbacks(onSave, onCancel) {
    this.onDuctEditorSave = onSave
    this.onDuctEditorCancel = onCancel
  }

  /**
   * Save duct position to localStorage and manifest
   */
  saveDuctPosition() {
    if (!this.selectedDuct?.userData?.ductData) return
    
    
    try {
      const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
      const selectedDuctData = this.selectedDuct.userData.ductData
      
      // Handle ID matching - selectedDuctData.id might have _0, _1 suffix
      const baseId = selectedDuctData.id.toString().split('_')[0]
      
      const updatedItems = storedMepItems.map(item => {
        const itemBaseId = item.id.toString().split('_')[0]
        
        if (itemBaseId === baseId) {
          const currentPosition = {
            x: this.selectedDuct.position.x,
            y: this.selectedDuct.position.y,
            z: this.selectedDuct.position.z
          }
          
          const updatedItem = { 
            ...item, 
            position: currentPosition
          }
          return updatedItem
        }
        return item
      })
      
      localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
      
      // Update manifest if function available
      if (window.updateMEPItemsManifest) {
        window.updateMEPItemsManifest(updatedItems)
      }
      
      // Dispatch events to update MEP panel
      window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
        detail: { updatedItems, updatedDuctId: selectedDuctData.id }
      }))
      
    } catch (error) {
      console.error('❌ Error saving duct position:', error)
    }
  }

  /**
   * Get selected duct for external editor component
   */
  getSelectedDuct() {
    return this.selectedDuct
  }

  /**
   * Update duct dimensions (called from editor)
   */
  updateDuctDimensions(newDimensions) {
    if (!this.selectedDuct) return

    
    // Update userData
    const oldDuctData = this.selectedDuct.userData.ductData
    const updatedDuctData = {
      ...oldDuctData,
      ...newDimensions
    }
    this.selectedDuct.userData.ductData = updatedDuctData

    // If color changed, update the custom materials
    if (newDimensions.color && newDimensions.color !== oldDuctData.color) {
      const ductBody = this.selectedDuct.getObjectByName('DuctBody')
      const ductCore = this.selectedDuct.getObjectByName('DuctCore')
      const ductMesh = ductCore || ductBody
      
      if (ductMesh) {
        // Create new custom material with the new color
        const newCustomMaterial = new THREE.MeshLambertMaterial({
          color: new THREE.Color(newDimensions.color),
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        })
        
        // Update the stored custom materials
        ductMesh.userData.customMaterial = newCustomMaterial
        ductMesh.material = newCustomMaterial
        
      }
    }

    // Recreate the duct geometry with new dimensions
    const ductLength = this.snapLineManager.ft2m(this.snapLineManager.getRackLength()) + this.snapLineManager.in2m(12)
    const currentPosition = this.selectedDuct.position.clone()
    
    // Clear current children
    while (this.selectedDuct.children.length > 0) {
      const child = this.selectedDuct.children[0]
      this.selectedDuct.remove(child)
      if (child.geometry) child.geometry.dispose()
    }
    
    // Recreate the duct using the improved geometry structure
    const newDuctGroup = this.ductGeometry.createDuctGroup(
      updatedDuctData,
      ductLength,
      new THREE.Vector3(0, 0, 0) // Position will be set by copying from current position
    )

    // Copy the new children to the existing duct group
    newDuctGroup.children.forEach(child => {
      this.selectedDuct.add(child.clone())
    })

    // Clean up temporary group
    newDuctGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose()
    })

    // Update appearance for selected state
    this.ductGeometry.updateDuctAppearance(this.selectedDuct, 'selected')
    
    // Update measurements
    this.updateDuctMeasurements()
    
  }

  dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('click', this.onMouseClick)
      this.domElement.removeEventListener('mousemove', this.onMouseMove)
    }
    
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
    }
    
    if (this.transformControls) {
      try {
        this.transformControls.detach()
        const gizmo = this.transformControls.getHelper()
        if (gizmo?.parent) {
          this.scene.remove(gizmo)
        }
        this.transformControls.dispose?.()
      } catch (error) {
        console.warn('Error disposing TransformControls:', error)
      }
    }
    
    this.clearDuctMeasurements()
  }
}