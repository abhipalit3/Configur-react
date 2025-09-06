/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { MeasurementTool } from '../controls/MeasurementTool.js'

/**
 * Initialize measurement tool with scene setup
 */
export function initializeMeasurementTool(scene, camera, rendererDomElement, snapPoints) {
  const measurementTool = new MeasurementTool(
    scene,
    camera,
    rendererDomElement,
    snapPoints
  )
  
  // Make measurement tool globally accessible for clear functionality
  window.measurementToolInstance = measurementTool
  
  return measurementTool
}

/**
 * Setup measurement tool restoration with delay
 */
export function setupMeasurementRestoration(measurementTool) {
  const restoreTimer = setTimeout(() => {
    measurementTool.restoreFromManifest()
  }, 100) // Small delay to ensure scene is fully initialized
  
  // Return cleanup function
  return () => {
    if (restoreTimer) {
      clearTimeout(restoreTimer)
    }
  }
}

/**
 * Create axis toggle handler function
 */
export function createAxisToggleHandler(setAxisLock) {
  return (axis) => {
    setAxisLock(prev => {
      const currentlyLocked = prev[axis]
      if (currentlyLocked) {
        // If clicking already locked axis, unlock it
        return { x: false, y: false, z: false }
      } else {
        // If clicking unlocked axis, lock only this axis
        return { 
          x: axis === 'x', 
          y: axis === 'y', 
          z: axis === 'z' 
        }
      }
    })
  }
}

/**
 * Create clear measurements handler function
 */
export function createClearMeasurementsHandler(measurementToolRef) {
  return () => {
    if (measurementToolRef.current) {
      measurementToolRef.current.clearAll()
    }
  }
}

/**
 * Setup measurement tool activation/deactivation effect
 */
export function setupMeasurementActivation(measurementToolRef, isMeasurementActive) {
  if (measurementToolRef.current) {
    if (isMeasurementActive) {
      measurementToolRef.current.enable()
    } else {
      measurementToolRef.current.disable()
    }
  }
}

/**
 * Setup axis lock updates
 */
export function setupAxisLockUpdates(measurementToolRef, axisLock) {
  if (measurementToolRef.current) {
    measurementToolRef.current.setAxisLock(axisLock)
  }
}

/**
 * Update measurement labels (for animation loop)
 */
export function updateMeasurementLabels(measurementTool) {
  if (measurementTool) {
    measurementTool.updateLabels()
  }
}

/**
 * Cleanup measurement tool
 */
export function cleanupMeasurementTool(measurementToolRef) {
  if (measurementToolRef.current) {
    measurementToolRef.current.dispose()
  }
  if (window.measurementToolInstance) {
    delete window.measurementToolInstance
  }
}