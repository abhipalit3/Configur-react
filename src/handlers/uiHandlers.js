/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { updateMeasurements } from '../utils/projectManifest'

/**
 * Creates UI handlers for the application
 */
export const createUIHandlers = (
  isMeasurementActive,
  setIsMeasurementActive,
  viewMode,
  setViewMode,
  isAddMEPVisible,
  setIsAddMEPVisible,
  activePanel,
  setActivePanel
) => {

  // Handler for measurement tool toggle
  const handleMeasurementToggle = () => {
    const newState = !isMeasurementActive
    setIsMeasurementActive(newState)
  }
  
  // Handler for clearing all measurements
  const handleClearMeasurements = () => {
    if (window.measurementToolInstance) {
      window.measurementToolInstance.clearAll()
      // Update manifest with empty measurements
      updateMeasurements([])
    }
  }
  
  // Handler for view mode change (2D/3D)
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    if (window.sceneViewModeHandler) {
      window.sceneViewModeHandler(mode)
    }
  }
  
  // Handler for fit view
  const handleFitView = () => {
    if (window.sceneFitViewHandler) {
      window.sceneFitViewHandler()
    }
  }
  
  // Handler for toggling AppAddMEP visibility
  const handleToggleAddMEP = () => {
    setIsAddMEPVisible(!isAddMEPVisible)
  }

  // Handler for MEP panel button clicks (from AppAddMEP)
  const createMEPPanelHandler = (panelType) => {
    return () => {
      setActivePanel(panelType)
      setIsAddMEPVisible(false)
    }
  }

  return {
    handleMeasurementToggle,
    handleClearMeasurements,
    handleViewModeChange,
    handleFitView,
    handleToggleAddMEP,
    createMEPPanelHandler
  }
}