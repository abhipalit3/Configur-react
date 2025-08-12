/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

// ViewCube.js
import * as THREE from 'three';

function createLabelMaterial(label) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'black';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size / 2, size / 2);
  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshBasicMaterial({ map: texture });
}

export class ViewCube extends THREE.Mesh {
  constructor(size = 1) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // Let's map them correctly to standard view directions
    const materials = [
      createLabelMaterial('RIGHT'),   // +X (index 0) - Right side
      createLabelMaterial('LEFT'),    // -X (index 1) - Left side  
      createLabelMaterial('TOP'),     // +Y (index 2) - Top
      createLabelMaterial('BOTTOM'),  // -Y (index 3) - Bottom
      createLabelMaterial('FRONT'),   // +Z (index 4) - Front
      createLabelMaterial('BACK')     // -Z (index 5) - Back
    ];
    
    super(geometry, materials);
    
    // Apply initial rotation to align ViewCube with standard orientation
    // This ensures TOP is actually on top when camera.up is (0,1,0)
    this.rotation.set(0, 0, 0); // Start with no rotation
    
    // Store view configurations - simplified for consistent Y-up orbit
    this.viewConfigs = {
      0: { // RIGHT (+X) - looking from right side toward left
        name: 'RIGHT',
        position: new THREE.Vector3(1, 0, 0)
      },
      1: { // LEFT (-X) - looking from left side toward right  
        name: 'LEFT', 
        position: new THREE.Vector3(-1, 0, 0)
      },
      2: { // TOP (+Y) - looking from above downward
        name: 'TOP',
        position: new THREE.Vector3(0, 1, 0)
      },
      3: { // BOTTOM (-Y) - looking from below upward
        name: 'BOTTOM',
        position: new THREE.Vector3(0, -1, 0)
      },
      4: { // FRONT (+Z) - looking from front toward back
        name: 'FRONT',
        position: new THREE.Vector3(0, 0, 1)
      },
      5: { // BACK (-Z) - looking from back toward front
        name: 'BACK',
        position: new THREE.Vector3(0, 0, -1)
      }
    };
  }

  setupClickHandler(camera, controls, scene) {
    this.camera = camera;
    this.controls = controls;
    this.scene = scene;

    // Create raycaster for click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Bind the click handler
    this.clickHandler = this.onViewCubeClick.bind(this);
  }

  onViewCubeClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObject(this);

    if (intersects.length > 0) {
      const faceIndex = intersects[0].face.materialIndex;
      this.animateToView(faceIndex);
    }
  }

  getBoundingBox() {
    const bbox = new THREE.Box3();
    
    // Only include generated objects (rack and MEP components)
    this.scene.traverse((object) => {
      if (object.userData.isGenerated && object.isMesh) {
        const objectBBox = new THREE.Box3().setFromObject(object);
        bbox.union(objectBBox);
      }
    });

    // If no generated objects found, create a default bounding box
    if (bbox.isEmpty()) {
      bbox.setFromCenterAndSize(
        new THREE.Vector3(0, 2, 0), 
        new THREE.Vector3(10, 4, 8)
      );
    }

    return bbox;
  }

  // Method to center orbit controls on the content
  centerOrbitOnContent() {
    const bbox = this.getBoundingBox();
    if (!bbox.isEmpty()) {
      const center = bbox.getCenter(new THREE.Vector3());
      this.controls.target.copy(center);
      this.controls.update();
      return center;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  animateToView(faceIndex) {
    const config = this.viewConfigs[faceIndex];
    if (!config) return;


    // Get bounding box of generated content and center orbit on it
    const center = this.centerOrbitOnContent();
    const bbox = this.getBoundingBox();
    const size = bbox.getSize(new THREE.Vector3());
    
    // Calculate appropriate distance based on bounding box
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;

    // Calculate camera position relative to center
    const targetPosition = center.clone().add(
      config.position.clone().multiplyScalar(distance)
    );

    // Store initial values for animation
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startZoom = this.camera.zoom;

    // CRITICAL: NEVER change the up vector - always keep Y-up for consistent orbit
    // This ensures orbit axis never changes regardless of view
    
    // Set target zoom for orthographic camera
    const targetZoom = this.calculateOptimalZoom(bbox, config);

    // Animation parameters
    const duration = 1200;
    const startTime = Date.now();

    // Temporarily disable controls during animation
    const wasEnabled = this.controls.enabled;
    this.controls.enabled = false;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth animation
      const eased = this.easeInOutCubic(progress);

      // Interpolate camera position
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Interpolate target (center of bounding box)
      this.controls.target.lerpVectors(startTarget, center, eased);
      
      // NEVER TOUCH THE UP VECTOR - always keep it as (0,1,0)
      this.camera.up.set(0, 1, 0);

      // Interpolate zoom for orthographic camera
      this.camera.zoom = THREE.MathUtils.lerp(startZoom, targetZoom, eased);
      this.camera.updateProjectionMatrix();

      // Update controls to apply changes
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Re-enable controls when animation is complete
        this.controls.enabled = wasEnabled;
        
        // Ensure camera is looking at center with Y-up
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(center);
        this.controls.update();
      }
    };

    animate();
  }

  calculateOptimalZoom(bbox, config) {
    const size = bbox.getSize(new THREE.Vector3());
    
    // Calculate zoom based on the view direction
    let relevantSize;
    if (config.name === 'TOP' || config.name === 'BOTTOM') {
      // For top/bottom views, consider X and Z dimensions
      relevantSize = Math.max(size.x, size.z);
    } else if (config.name === 'LEFT' || config.name === 'RIGHT') {
      // For side views, consider Y and Z dimensions
      relevantSize = Math.max(size.y, size.z);
    } else {
      // For front/back views, consider X and Y dimensions
      relevantSize = Math.max(size.x, size.y);
    }
    
    // Calculate zoom to fit the content with some padding
    const padding = 1.2; // 20% padding
    return Math.max(0.5, Math.min(10, 20 / (relevantSize * padding)));
  }

  // Method to reset camera to standard architectural orbit behavior
  resetOrbitAxis() {
    // Always return to Y-up for consistent orbiting
    this.camera.up.set(0, 1, 0);
    this.controls.update();
  }

  // Update the ViewCube orientation to match the main camera
  updateOrientation(mainCamera) {
    // Get the main camera's view direction and up vector
    const direction = new THREE.Vector3();
    mainCamera.getWorldDirection(direction);
    
    // Create proper rotation matrix for ViewCube orientation
    const up = mainCamera.up.clone().normalize();
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(direction, right).normalize();
    
    // Create rotation matrix from camera vectors
    const matrix = new THREE.Matrix4();
    matrix.makeBasis(right, correctedUp, direction);
    
    // Apply rotation to ViewCube (invert for proper visual feedback)
    this.quaternion.setFromRotationMatrix(matrix);
    this.rotateY(Math.PI); // Flip to match expected orientation
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  enableClickHandling(viewCubeRenderer) {
    if (viewCubeRenderer && viewCubeRenderer.domElement) {
      viewCubeRenderer.domElement.addEventListener('click', this.clickHandler);
      viewCubeRenderer.domElement.style.cursor = 'pointer';
    }
  }

  disableClickHandling(viewCubeRenderer) {
    if (viewCubeRenderer && viewCubeRenderer.domElement) {
      viewCubeRenderer.domElement.removeEventListener('click', this.clickHandler);
      viewCubeRenderer.domElement.style.cursor = 'default';
    }
  }
}