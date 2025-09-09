/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { 
  updateMEPItems,
  addMEPItem,
  removeMEPItem
} from '../utils/projectManifest'

/**
 * Creates comprehensive MEP (Mechanical, Electrical, Plumbing) handlers for the application
 * Provides functions for adding, removing, updating, and managing MEP items in the 3D scene
 * Handles state updates and persistence to project manifest
 * @param {Array} mepItems - Current array of MEP items in state
 * @param {Function} setMepItems - State setter function for MEP items
 * @returns {Object} Object containing all MEP handler functions
 */
export const createMEPHandlers = (mepItems, setMepItems) => {
  
  /**
   * Adds a new MEP item to the system
   * Generates unique ID and updates both state and project manifest
   * @param {Object} item - MEP item to add (duct, pipe, conduit, cable tray)
   * @returns {Object} The added item with generated ID
   */
  const handleAddMepItem = (item) => {
    const newItem = { ...item, id: Date.now() + Math.random() }
    setMepItems([...mepItems, newItem])
    
    // Update manifest with new item
    addMEPItem(newItem)
    
    return newItem
  }
  
  /**
   * Removes a specific MEP item from the system
   * Updates both state and project manifest
   * @param {number|string} itemId - Unique identifier of the item to remove
   */
  const handleRemoveMepItem = (itemId) => {
    const itemToRemove = mepItems.find(item => item.id === itemId)
    setMepItems(mepItems.filter(item => item.id !== itemId))
    
    // Update manifest
    if (itemToRemove) {
      removeMEPItem(itemId, itemToRemove.type)
    }
  }

  /**
   * Removes all MEP items from the system
   * Clears state, localStorage, and project manifest
   */
  const handleDeleteAllMepItems = () => {
    // Clear all MEP items from state
    setMepItems([])
    
    // Clear from localStorage
    localStorage.setItem('configurMepItems', JSON.stringify([]))
    
    // Update manifest with empty array
    updateMEPItems([], 'all')
    
    // Trigger refresh of 3D scene to remove all MEP elements
    if (window.ductworkRendererInstance) {
      window.ductworkRendererInstance.updateDuctwork([])
    }
  }

  // Handler for clicking MEP items in the panel
  const handleMepItemClick = (item) => {
    if (item.type === 'duct') {
      selectDuct(item)
    } else if (item.type === 'pipe') {
      selectPipe(item)
    } else if (item.type === 'conduit') {
      selectConduit(item)
    } else if (item.type === 'cableTray') {
      selectCableTray(item)
    }
  }

  // Handler for changing MEP item color
  const handleDuctColorChange = (itemId, newColor) => {
    // Update the mepItems state
    const updatedItems = mepItems.map(item => {
      const baseId = item.id.toString().split('_')[0]
      const itemBaseId = itemId.toString().split('_')[0]
      if (baseId === itemBaseId || item.id === itemId) {
        return { ...item, color: newColor }
      }
      return item
    })
    setMepItems(updatedItems)
    
    // Find the item to determine its type
    const targetItem = updatedItems.find(item => {
      const baseId = item.id.toString().split('_')[0]
      const itemBaseId = itemId.toString().split('_')[0]
      return baseId === itemBaseId || item.id === itemId
    })
    
    if (targetItem?.type === 'duct') {
      updateDuctColor(itemId, newColor)
    } else if (targetItem?.type === 'pipe') {
      updatePipeColor(itemId, newColor)
    } else if (targetItem?.type === 'conduit') {
      updateConduitColor(itemId, newColor)
    } else if (targetItem?.type === 'cableTray') {
      updateCableTrayColor(itemId, newColor)
    }
    
    // Update localStorage with new color
    localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
    
    // Update manifest
    updateMEPItems(updatedItems, 'color_change')
  }

  return {
    handleAddMepItem,
    handleRemoveMepItem,
    handleDeleteAllMepItems,
    handleMepItemClick,
    handleDuctColorChange
  }
}

// Helper functions for selecting MEP items in 3D scene
function selectDuct(item) {
  // First deselect any selected pipes and conduits
  if (window.pipingRendererInstance?.pipeInteraction) {
    window.pipingRendererInstance.pipeInteraction.deselectPipe()
  }
  if (window.conduitRendererInstance?.conduitInteraction) {
    window.conduitRendererInstance.conduitInteraction.deselectConduit()
  }
  
  // Find and select the duct in the 3D scene
  if (window.ductworkRendererInstance?.ductInteraction) {
    const ductworkRenderer = window.ductworkRendererInstance
    const ductworkGroup = ductworkRenderer.getDuctworkGroup()
    
    // Find the duct group by ID
    let targetDuct = null
    ductworkGroup.children.forEach(ductGroup => {
      const ductData = ductGroup.userData?.ductData
      if (ductData) {
        const baseId = ductData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        if (baseId === itemBaseId || ductData.id === item.id) {
          targetDuct = ductGroup
        }
      }
    })
    
    if (targetDuct) {
      ductworkRenderer.ductInteraction.selectDuct(targetDuct)
    } else {
      console.warn('⚠️ Could not find duct to select:', item.id)
    }
  }
}

function selectPipe(item) {
  // First deselect any selected ducts and conduits
  if (window.ductworkRendererInstance?.ductInteraction) {
    window.ductworkRendererInstance.ductInteraction.deselectDuct()
  }
  if (window.conduitRendererInstance?.conduitInteraction) {
    window.conduitRendererInstance.conduitInteraction.deselectConduit()
  }
  
  // Find and select the pipe in the 3D scene
  if (window.pipingRendererInstance?.pipeInteraction) {
    const pipingRenderer = window.pipingRendererInstance
    const pipingGroup = pipingRenderer.getPipingGroup()
    
    // Find the pipe group by ID
    let targetPipe = null
    pipingGroup.children.forEach(pipeGroup => {
      const pipeData = pipeGroup.userData?.pipeData
      if (pipeData) {
        const baseId = pipeData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        if (baseId === itemBaseId || pipeData.id === item.id) {
          targetPipe = pipeGroup
        }
      }
    })
    
    if (targetPipe) {
      pipingRenderer.pipeInteraction.selectPipe(targetPipe)
    } else {
      console.warn('⚠️ Could not find pipe to select:', item.id)
    }
  }
}

function selectConduit(item) {
  // First deselect any selected ducts and pipes
  if (window.ductworkRendererInstance?.ductInteraction) {
    window.ductworkRendererInstance.ductInteraction.deselectDuct()
  }
  if (window.pipingRendererInstance?.pipeInteraction) {
    window.pipingRendererInstance.pipeInteraction.deselectPipe()
  }
  
  // Find and select the conduit in the 3D scene
  if (window.conduitRendererInstance?.conduitInteraction) {
    const conduitRenderer = window.conduitRendererInstance
    const conduitsGroup = conduitRenderer.getConduitsGroup()
    
    // Find the multi-conduit group by ID
    let targetConduit = null
    conduitsGroup.children.forEach(multiConduitGroup => {
      const conduitData = multiConduitGroup.userData?.conduitData
      if (conduitData && multiConduitGroup.userData?.type === 'multiConduit') {
        const baseId = conduitData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        if (baseId === itemBaseId || conduitData.id === item.id) {
          targetConduit = multiConduitGroup
        }
      }
    })
    
    if (targetConduit) {
      conduitRenderer.conduitInteraction.selectConduit(targetConduit)
    } else {
      console.warn('⚠️ Could not find conduit to select:', item.id)
    }
  }
}

function selectCableTray(item) {
  // First deselect any selected ducts, pipes, and conduits
  if (window.ductworkRendererInstance?.ductInteraction) {
    window.ductworkRendererInstance.ductInteraction.deselectDuct()
  }
  if (window.pipingRendererInstance?.pipeInteraction) {
    window.pipingRendererInstance.pipeInteraction.deselectPipe()
  }
  if (window.conduitRendererInstance?.conduitInteraction) {
    window.conduitRendererInstance.conduitInteraction.deselectConduit()
  }
  
  // Find and select the cable tray in the 3D scene
  if (window.cableTrayRendererInstance?.cableTrayInteraction) {
    const cableTrayRenderer = window.cableTrayRendererInstance
    const cableTraysGroup = cableTrayRenderer.getCableTraysGroup()
    
    // Find the cable tray group by ID
    let targetCableTray = null
    cableTraysGroup.children.forEach(cableTrayGroup => {
      const cableTrayData = cableTrayGroup.userData?.cableTrayData
      if (cableTrayData) {
        const baseId = cableTrayData.id.toString().split('_')[0]
        const itemBaseId = item.id.toString().split('_')[0]
        if (baseId === itemBaseId || cableTrayData.id === item.id) {
          targetCableTray = cableTrayGroup
        }
      }
    })
    
    if (targetCableTray) {
      cableTrayRenderer.cableTrayInteraction.selectCableTray(targetCableTray)
    } else {
      console.warn('⚠️ Could not find cable tray to select:', item.id)
    }
  }
}

// Helper functions for updating MEP item colors in 3D scene
function updateDuctColor(itemId, newColor) {
  if (window.ductworkRendererInstance?.ductInteraction) {
    const ductworkRenderer = window.ductworkRendererInstance
    const ductworkGroup = ductworkRenderer.getDuctworkGroup()
    
    ductworkGroup.children.forEach(ductGroup => {
      const ductData = ductGroup.userData?.ductData
      if (ductData) {
        const baseId = ductData.id.toString().split('_')[0]
        const ductBaseId = itemId.toString().split('_')[0]
        if (baseId === ductBaseId || ductData.id === itemId) {
          if (ductworkRenderer.ductInteraction.updateDuctDimensions) {
            ductworkRenderer.ductInteraction.updateDuctDimensions({ color: newColor })
          }
        }
      }
    })
  }
}

function updatePipeColor(itemId, newColor) {
  if (window.pipingRendererInstance?.pipeInteraction) {
    const pipingRenderer = window.pipingRendererInstance
    const pipingGroup = pipingRenderer.getPipingGroup()
    
    pipingGroup.children.forEach(pipeGroup => {
      const pipeData = pipeGroup.userData?.pipeData
      if (pipeData) {
        const baseId = pipeData.id.toString().split('_')[0]
        const pipeBaseId = itemId.toString().split('_')[0]
        if (baseId === pipeBaseId || pipeData.id === itemId) {
          if (pipingRenderer.pipeInteraction.updatePipeDimensions) {
            pipingRenderer.pipeInteraction.updatePipeDimensions({ color: newColor })
          }
        }
      }
    })
  }
}

function updateConduitColor(itemId, newColor) {
  if (window.conduitRendererInstance?.conduitInteraction) {
    const conduitRenderer = window.conduitRendererInstance
    const conduitsGroup = conduitRenderer.getConduitsGroup()
    
    conduitsGroup.children.forEach(conduitGroup => {
      const conduitData = conduitGroup.userData?.conduitData
      if (conduitData) {
        const baseId = conduitData.id.toString().split('_')[0]
        const conduitBaseId = itemId.toString().split('_')[0]
        if (baseId === conduitBaseId || conduitData.id === itemId) {
          if (conduitRenderer.conduitInteraction.selectedConduitGroup !== conduitGroup) {
            conduitRenderer.conduitInteraction.selectConduit(conduitGroup)
          }
          if (conduitRenderer.conduitInteraction.updateConduitDimensions) {
            conduitRenderer.conduitInteraction.updateConduitDimensions({ color: newColor })
          }
        }
      }
    })
  }
}

function updateCableTrayColor(itemId, newColor) {
  if (window.cableTrayRendererInstance?.cableTrayInteraction) {
    const cableTrayRenderer = window.cableTrayRendererInstance
    const cableTraysGroup = cableTrayRenderer.getCableTraysGroup()
    
    cableTraysGroup.children.forEach(cableTrayGroup => {
      const cableTrayData = cableTrayGroup.userData?.cableTrayData
      if (cableTrayData) {
        const baseId = cableTrayData.id.toString().split('_')[0]
        const cableTrayBaseId = itemId.toString().split('_')[0]
        if (baseId === cableTrayBaseId || cableTrayData.id === itemId) {
          if (cableTrayRenderer.cableTrayInteraction.selectedCableTrayGroup !== cableTrayGroup) {
            cableTrayRenderer.cableTrayInteraction.selectCableTray(cableTrayGroup)
          }
          if (cableTrayRenderer.cableTrayInteraction.updateCableTrayDimensions) {
            cableTrayRenderer.cableTrayInteraction.updateCableTrayDimensions({ color: newColor })
          }
        }
      }
    })
  }
}