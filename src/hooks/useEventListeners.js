/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useEffect } from 'react'
import { 
  updateMeasurements,
  updateMEPItems
} from '../utils/projectManifest'

/**
 * Custom hook for managing event listeners
 */
export const useEventListeners = (
  isMeasurementActive,
  setIsMeasurementActive,
  setMepItems,
  isAddMEPVisible,
  setIsAddMEPVisible,
  activePanel,
  setActivePanel,
  isRackPropertiesVisible,
  setIsRackPropertiesVisible
) => {

  // Listen for measurement tool deactivation events
  useEffect(() => {
    const handleMeasurementToolDeactivated = () => {
      setIsMeasurementActive(false)
    }

    document.addEventListener('measurementToolDeactivated', handleMeasurementToolDeactivated)

    return () => {
      document.removeEventListener('measurementToolDeactivated', handleMeasurementToolDeactivated)
    }
  }, [setIsMeasurementActive])

  // Listen for MEP items updates from 3D scene
  useEffect(() => {
    const handleMepItemsUpdated = (event) => {
      if (event.detail && event.detail.updatedItems) {
        setMepItems(event.detail.updatedItems)
      }
    }

    const handleStorageChange = (event) => {
      if (event.key === 'configurMepItems') {
        try {
          const updatedItems = JSON.parse(event.newValue || '[]')
          setMepItems(updatedItems)
        } catch (error) {
          console.error('Error parsing updated MEP items from storage:', error)
        }
      }
    }

    window.addEventListener('mepItemsUpdated', handleMepItemsUpdated)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('mepItemsUpdated', handleMepItemsUpdated)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [setMepItems])

  // Global keyboard handler for measurement deletion when tool is inactive
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Only handle delete when measurement tool is inactive but measurements exist
      if (!isMeasurementActive && window.measurementToolInstance) {
        const measurementTool = window.measurementToolInstance
        
        switch(event.key.toLowerCase()) {
          case 'delete':
          case 'backspace':
            // Delete selected measurements
            if (measurementTool.selectedMeasurements && measurementTool.selectedMeasurements.size > 0) {
              measurementTool.deleteSelectedMeasurements()
            }
            break
          case 'a':
            if (event.ctrlKey || event.metaKey) {
              // Select all measurements
              event.preventDefault()
              measurementTool.selectAll()
            }
            break
          case 'escape':
            // Clear selection when tool is inactive
            if (measurementTool.selectedMeasurements && measurementTool.selectedMeasurements.size > 0) {
              measurementTool.clearSelection()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isMeasurementActive])

  // Handle click-outside to close AppAddMEP panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isAddMEPVisible) return

      // Check if the click is on the plus icon that toggles the panel
      const plusIcon = event.target.closest('.app-tier-mep-icon10')
      if (plusIcon) return

      // Check if the click is inside the AppAddMEP panel
      const addMEPPanel = event.target.closest('.app-add-mep-container')
      if (addMEPPanel) return

      // Close the panel if clicking anywhere else
      setIsAddMEPVisible(false)
    }

    if (isAddMEPVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isAddMEPVisible, setIsAddMEPVisible])

  // Handle click-outside to close left-side panels
  useEffect(() => {
    const handleClickOutsidePanels = (event) => {
      if (!activePanel) return

      // List of all left-side panel types
      const leftPanels = [
        { type: 'ductwork', className: 'app-ductwork-container' },
        { type: 'piping', className: 'app-piping-container1' },
        { type: 'conduits', className: 'app-conduits-container1' },
        { type: 'cableTrays', className: 'app-cable-trays-container1' },
        { type: 'building', className: 'app-manual-building-container' },
        { type: 'aiChat', className: 'app-ai-chat-panel-container1' }
      ]

      // Check if current active panel is one of the left panels
      const currentPanel = leftPanels.find(panel => panel.type === activePanel)
      if (!currentPanel) return

      // Check if the click is inside the current panel
      const panelElement = event.target.closest(`.${currentPanel.className}`)
      if (panelElement) return

      // Check if the click is on the AppAddMEP buttons
      const addMEPPanel = event.target.closest('.app-add-mep-container')
      if (addMEPPanel) return

      // Check if the click is on the AI Chat button
      const aiChatButton = event.target.closest('#AI_ChatButton')
      if (aiChatButton && currentPanel.type === 'aiChat') return

      // Close the panel if clicking anywhere else
      setActivePanel(null)
    }

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutsidePanels)
      return () => {
        document.removeEventListener('mousedown', handleClickOutsidePanels)
      }
    }
  }, [activePanel, setActivePanel])

  // Handle click-outside to close rack properties panel
  useEffect(() => {
    const handleClickOutsideRackProperties = (event) => {
      if (!isRackPropertiesVisible) return

      // Check if the click is inside the rack properties panel
      const rackPropertiesPanel = event.target.closest('.app-rack-properties-container')
      if (rackPropertiesPanel) return

      // Check if the click is on the trade rack button
      const tradeRackButton = event.target.closest('#TradeRackPropButton')
      if (tradeRackButton) return

      // Close the panel if clicking anywhere else
      setIsRackPropertiesVisible(false)
    }

    if (isRackPropertiesVisible) {
      document.addEventListener('mousedown', handleClickOutsideRackProperties)
      return () => {
        document.removeEventListener('mousedown', handleClickOutsideRackProperties)
      }
    }
  }, [isRackPropertiesVisible, setIsRackPropertiesVisible])

  // Setup global functions for external components
  useEffect(() => {
    // Make measurement update function available globally
    window.updateManifestMeasurements = (measurements) => {
      updateMeasurements(measurements)
    }
    
    // Make MEP items update function available globally
    window.updateMEPItemsManifest = (items) => {
      updateMEPItems(items, 'all')
    }
    
    // Make MEP panel refresh function available globally
    window.refreshMepPanel = () => {
      try {
        const savedItems = localStorage.getItem('configurMepItems')
        const parsedItems = savedItems ? JSON.parse(savedItems) : []
        setMepItems([...parsedItems])
      } catch (error) {
        console.error('❌ Error refreshing MEP panel:', error)
      }
    }
    
    // Make tier update function available globally
    window.updateDuctTierInfo = () => {
      if (window.ductworkRendererInstance?.ductInteraction) {
        window.ductworkRendererInstance.ductInteraction.updateAllDuctTierInfo()
      }
    }
    
    // Cleanup function
    return () => {
      if (window.updateManifestMeasurements) {
        delete window.updateManifestMeasurements
      }
      if (window.updateMEPItemsManifest) {
        delete window.updateMEPItemsManifest
      }
      if (window.refreshMepPanel) {
        delete window.refreshMepPanel
      }
      if (window.updateDuctTierInfo) {
        delete window.updateDuctTierInfo
      }
    }
  }, [setMepItems])
}