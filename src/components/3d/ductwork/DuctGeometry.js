import * as THREE from 'three'

/**
 * DuctGeometry - Handles creation of 3D duct geometries and materials
 */
export class DuctGeometry {
  constructor() {
    this.materials = {
      duct: new THREE.MeshLambertMaterial({
        color: 0xd05e8f, // Pink color for duct
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      ductSelected: new THREE.MeshLambertMaterial({
        color: 0x4A90E2, // Blue when selected
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      }),
      ductHover: new THREE.MeshLambertMaterial({
        color: 0x00D4FF, // Light blue when hovered
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      }),
      insulation: new THREE.MeshBasicMaterial({
        color: 0xCCCCCC, // Light gray wireframe
        wireframe: true,
        transparent: true,
        opacity: 0.6
      }),
      insulationSelected: new THREE.MeshBasicMaterial({
        color: 0x4A90E2, // Blue wireframe when selected
        wireframe: true,
        transparent: true,
        opacity: 0.8
      }),
      wireframe: new THREE.MeshBasicMaterial({
        color: 0x333333,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      }),
      wireframeSelected: new THREE.MeshBasicMaterial({
        color: 0x4A90E2,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      })
    }
  }

  // Utility functions
  ft2m(feet) { return feet * 0.3048 }
  in2m(inches) { return inches * 0.0254 }

  /**
   * Create rectangular duct geometry
   */
  createRectangularDuctGeometry(length, height, width) {
    return new THREE.BoxGeometry(length, height, width)
  }

  /**
   * Create a complete duct group with all components
   */
  createDuctGroup(ductData, ductLength, position) {
    const {
      width = 12,
      height = 8,
      insulation = 0,
      tier = 1,
      id,
      color = '#d05e8f'
    } = ductData

    // Validate input parameters
    if (!isFinite(width) || width <= 0) {
      console.error('❌ Invalid duct width:', width)
      return new THREE.Group() // Return empty group
    }
    
    if (!isFinite(height) || height <= 0) {
      console.error('❌ Invalid duct height:', height)
      return new THREE.Group()
    }
    
    if (!isFinite(insulation) || insulation < 0) {
      console.warn('⚠️ Invalid insulation value, using 0:', insulation)
      insulation = 0
    }
    
    if (!isFinite(ductLength) || ductLength <= 0) {
      console.error('❌ Invalid duct length:', ductLength)
      return new THREE.Group()
    }

    const widthM = this.in2m(width)
    const heightM = this.in2m(height)
    const insulationM = this.in2m(insulation)
    
    const ductGroup = new THREE.Group()
    ductGroup.name = `Duct_${id}`
    ductGroup.userData = { 
      type: 'duct', 
      ductData,
      tier,
      position: position || 'bottom'
    }

    // Safely set position with validation
    if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
      if (isFinite(position.x) && isFinite(position.y) && isFinite(position.z)) {
        ductGroup.position.copy(position)
      } else {
        console.warn('⚠️ Invalid position values, using default:', position)
        ductGroup.position.set(0, 0, 0)
      }
    } else {
      ductGroup.position.set(0, 0, 0)
    }

    // Calculate total dimensions with safety checks
    const totalWidth = widthM + (2 * insulationM)
    const totalHeight = heightM + (2 * insulationM)
    
    if (!isFinite(totalWidth) || !isFinite(totalHeight)) {
      console.error('❌ Invalid total dimensions:', { totalWidth, totalHeight })
      return new THREE.Group()
    }

    // Create custom materials for this duct using the specified color
    const customDuctMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    
    const customDuctSelectedMaterial = new THREE.MeshLambertMaterial({
      color: 0x4A90E2, // Blue when selected
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })

    if (insulation > 0) {
      // Create duct core (inner) first - solid duct with custom color
      const coreGeometry = this.createRectangularDuctGeometry(ductLength, heightM, widthM)
      const coreMesh = new THREE.Mesh(coreGeometry, customDuctMaterial)
      coreMesh.name = 'DuctCore'
      coreMesh.userData.customMaterial = customDuctMaterial
      coreMesh.userData.customSelectedMaterial = customDuctSelectedMaterial
      ductGroup.add(coreMesh)
      
      // Create insulation shell (outer) as wireframe outline
      const insulationGeometry = this.createRectangularDuctGeometry(ductLength, totalHeight, totalWidth)
      const insulationMesh = new THREE.Mesh(insulationGeometry, this.materials.insulation)
      insulationMesh.name = 'DuctInsulation'
      ductGroup.add(insulationMesh)
    } else {
      // No insulation - just create the duct body with custom color
      const ductGeometry = this.createRectangularDuctGeometry(ductLength, heightM, widthM)
      const ductMesh = new THREE.Mesh(ductGeometry, customDuctMaterial)
      ductMesh.name = 'DuctBody'
      ductMesh.userData.customMaterial = customDuctMaterial
      ductMesh.userData.customSelectedMaterial = customDuctSelectedMaterial
      ductGroup.add(ductMesh)
    }

    // Wireframe outline
    const wireframeGeometry = this.createRectangularDuctGeometry(ductLength, totalHeight, totalWidth)
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, this.materials.wireframe)
    wireframeMesh.name = 'DuctWireframe'
    ductGroup.add(wireframeMesh)

    return ductGroup
  }

  /**
   * Update duct appearance based on state
   */
  updateDuctAppearance(ductGroup, state) {
    const ductBody = ductGroup.getObjectByName('DuctBody')
    const ductCore = ductGroup.getObjectByName('DuctCore')
    const ductInsulation = ductGroup.getObjectByName('DuctInsulation')
    const wireframe = ductGroup.getObjectByName('DuctWireframe')

    // Update duct core material
    const ductMesh = ductCore || ductBody
    if (ductMesh) {
      switch (state) {
        case 'selected':
          // Use custom selected material if available, otherwise default
          const selectedMaterial = ductMesh.userData.customSelectedMaterial || this.materials.ductSelected
          ductMesh.material = selectedMaterial
          if (wireframe) wireframe.material = this.materials.wireframeSelected
          break
        case 'hover':
          ductMesh.material = this.materials.ductHover
          break
        default:
          // Use custom material if available, otherwise default
          const normalMaterial = ductMesh.userData.customMaterial || this.materials.duct
          ductMesh.material = normalMaterial
          if (wireframe) wireframe.material = this.materials.wireframe
      }
    }

    // Update insulation material
    if (ductInsulation) {
      switch (state) {
        case 'selected':
          ductInsulation.material = this.materials.insulationSelected
          break
        case 'hover':
          // Make even more transparent on hover to show duct better
          ductInsulation.material = this.materials.insulation.clone()
          ductInsulation.material.opacity = 0.1
          break
        default:
          ductInsulation.material = this.materials.insulation
      }
    }
  }

  dispose() {
    Object.values(this.materials).forEach(material => material.dispose())
  }
}