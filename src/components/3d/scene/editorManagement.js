/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Update localStorage with MEP item changes
 */
export function updateMepItemInStorage(selectedItem, newDimensions, itemType) {
  try {
    const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
    const selectedItemData = selectedItem?.userData?.[`${itemType}Data`]
    
    if (!selectedItemData) {
      console.warn(`No ${itemType} data found for localStorage update`)
      return false
    }

    // Handle ID matching - selectedItemData.id might have _0, _1 suffix for multiple items
    const baseId = selectedItemData.id.toString().split('_')[0]
    
    const updatedItems = storedMepItems.map(item => {
      const itemBaseId = item.id.toString().split('_')[0]
      
      if (itemBaseId === baseId && item.type === itemType) {
        // Include current item position in the update
        const currentPosition = {
          x: selectedItem.position.x,
          y: selectedItem.position.y, 
          z: selectedItem.position.z
        }
        
        return { 
          ...item, 
          ...newDimensions,
          position: currentPosition
        }
      }
      return item
    })
    
    localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
    
    // Update the manifest to ensure consistency
    if (window.updateMEPItemsManifest) {
      window.updateMEPItemsManifest(updatedItems)
    } else {
      console.warn('⚠️ updateMEPItemsManifest not available - manifest may be out of sync')
    }
    
    // Dispatch custom event to notify MEP panel of changes
    window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
      detail: { updatedItems, [`updated${itemType.charAt(0).toUpperCase() + itemType.slice(1)}Id`]: selectedItemData.id }
    }))
    
    // Try multiple refresh methods
    if (window.refreshMepPanel) {
      window.refreshMepPanel()
    }
    
    // Force re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'configurMepItems',
      newValue: JSON.stringify(updatedItems),
      storageArea: localStorage
    }))
    
    console.log(`💾 ${itemType} updated in localStorage:`, selectedItemData.id)
    return true
  } catch (error) {
    console.error(`Error updating MEP ${itemType} items:`, error)
    return false
  }
}

/**
 * Create duct editor save handler
 */
export function createDuctEditorSaveHandler(mepRenderers, selectedDuct, setSkipDuctRecreation) {
  return (newDimensions) => {
    // Set flag to prevent duct recreation
    setSkipDuctRecreation(true)
    
    if (mepRenderers.ductwork?.ductInteraction) {
      // First update the selected duct's userData to ensure consistency
      if (selectedDuct?.userData?.ductData) {
        selectedDuct.userData.ductData = {
          ...selectedDuct.userData.ductData,
          ...newDimensions
        }
      }
      
      // Update the 3D duct
      mepRenderers.ductwork.ductInteraction.updateDuctDimensions(newDimensions)
      
      // Update localStorage
      updateMepItemInStorage(selectedDuct, newDimensions, 'duct')
    }
    
    // Don't close the editor immediately - let user click away or edit another duct
    // Editor will be closed by the cancel handler or when selecting something else
  }
}

/**
 * Create pipe editor save handler
 */
export function createPipeEditorSaveHandler(mepRenderers, selectedPipe, setSkipPipeRecreation) {
  return (newDimensions) => {
    // Set flag to prevent pipe recreation
    setSkipPipeRecreation(true)
    
    if (mepRenderers.piping?.pipeInteraction) {
      // First update the selected pipe's userData to ensure consistency
      if (selectedPipe?.userData?.pipeData) {
        selectedPipe.userData.pipeData = {
          ...selectedPipe.userData.pipeData,
          ...newDimensions
        }
      }
      
      // Update the 3D pipe
      mepRenderers.piping.pipeInteraction.updatePipeDimensions(newDimensions)
      
      // Update localStorage
      updateMepItemInStorage(selectedPipe, newDimensions, 'pipe')
    }
    
    // Don't close the editor immediately
  }
}

/**
 * Create conduit editor save handler
 */
export function createConduitEditorSaveHandler(mepRenderers, selectedConduit, setSkipConduitRecreation) {
  return (newDimensions) => {
    // Set flag to prevent conduit recreation
    setSkipConduitRecreation(true)
    
    if (mepRenderers.conduit?.conduitInteraction) {
      // First update the selected conduit's userData to ensure consistency
      if (selectedConduit?.userData?.conduitData) {
        selectedConduit.userData.conduitData = {
          ...selectedConduit.userData.conduitData,
          ...newDimensions
        }
      }
      
      // Update the 3D conduit
      mepRenderers.conduit.conduitInteraction.updateConduitDimensions(newDimensions)
      
      // Update localStorage
      updateMepItemInStorage(selectedConduit, newDimensions, 'conduit')
    }
    
    // Don't close the editor immediately
  }
}

/**
 * Create cable tray editor save handler with special tier detection
 */
export function createCableTrayEditorSaveHandler(mepRenderers, selectedCableTray, setSkipCableTrayRecreation) {
  return (newDimensions) => {
    // Set flag to prevent cable tray recreation
    setSkipCableTrayRecreation(true)
    
    if (mepRenderers.cableTray?.cableTrayInteraction) {
      // First update the selected cable tray's userData to ensure consistency
      if (selectedCableTray?.userData?.cableTrayData) {
        selectedCableTray.userData.cableTrayData = {
          ...selectedCableTray.userData.cableTrayData,
          ...newDimensions
        }
      }
      
      // Update the 3D cable tray
      mepRenderers.cableTray.cableTrayInteraction.updateCableTrayDimensions(newDimensions)
      
      // Update localStorage with special handling for cable tray tier detection
      try {
        const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
        const selectedCableTrayData = selectedCableTray?.userData?.cableTrayData
        
        if (selectedCableTrayData) {
          const baseId = selectedCableTrayData.id.toString().split('_')[0]
          
          const updatedItems = storedMepItems.map(item => {
            const itemBaseId = item.id.toString().split('_')[0]
            
            if (itemBaseId === baseId && item.type === 'cableTray') {
              const currentPosition = {
                x: selectedCableTray.position.x,
                y: selectedCableTray.position.y,
                z: selectedCableTray.position.z
              }
              
              // Auto-detect tier based on current Y position
              let tierInfo = { tier: newDimensions.tier, tierName: `Tier ${newDimensions.tier}` }
              if (mepRenderers.cableTray?.cableTrayInteraction) {
                const detectedTier = mepRenderers.cableTray.cableTrayInteraction.calculateCableTrayTierFromPosition(
                  currentPosition.y, 
                  newDimensions.height
                )
                if (detectedTier.tier) {
                  tierInfo = detectedTier
                }
              }
              
              return {
                ...item,
                width: newDimensions.width,
                height: newDimensions.height,
                trayType: newDimensions.trayType,
                tier: tierInfo.tier,
                tierName: tierInfo.tierName,
                position: currentPosition
              }
            }
            return item
          })
          
          localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
          
          // Update manifest and dispatch events
          if (window.updateMEPItemsManifest) {
            window.updateMEPItemsManifest(updatedItems)
          }
          
          window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
            detail: { updatedItems, updatedCableTrayId: selectedCableTrayData.id }
          }))
          
          if (window.refreshMepPanel) {
            window.refreshMepPanel()
          }
          
          // Dispatch storage event
          window.dispatchEvent(new Event('storage'))
          
          console.log(`💾 Cable tray updated in localStorage:`, selectedCableTrayData.id)
        }
      } catch (error) {
        console.error('Error updating MEP cable tray items:', error)
      }
    }
    
    // Don't close the editor immediately
  }
}

/**
 * Create editor cancel handlers
 */
export function createDuctEditorCancelHandler(setShowDuctEditor) {
  return () => {
    setShowDuctEditor(false)
  }
}

export function createPipeEditorCancelHandler(setShowPipeEditor) {
  return () => {
    setShowPipeEditor(false)
  }
}

export function createConduitEditorCancelHandler(setShowConduitEditor) {
  return () => {
    setShowConduitEditor(false)
  }
}

export function createCableTrayEditorCancelHandler(setShowCableTrayEditor) {
  return () => {
    setShowCableTrayEditor(false)
  }
}

/**
 * Setup editor callbacks for MEP renderers
 */
export function setupEditorCallbacks(mepRenderers, editorHandlers) {
  // Set callbacks on duct interaction
  if (mepRenderers.ductwork?.ductInteraction && editorHandlers.duct) {
    mepRenderers.ductwork.ductInteraction.setDuctEditorCallbacks(
      editorHandlers.duct.save,
      editorHandlers.duct.cancel
    )
  }
  
  // Note: Pipe, conduit, and cable tray editors don't have explicit callback setters
  // They rely on the selection polling mechanism
}

/**
 * Create all editor handlers for a MEP type
 */
export function createEditorHandlers(mepRenderers, editorStates, editorSetters) {
  return {
    duct: {
      save: createDuctEditorSaveHandler(
        mepRenderers, 
        editorStates.selectedDuct, 
        editorSetters.setSkipDuctRecreation
      ),
      cancel: createDuctEditorCancelHandler(editorSetters.setShowDuctEditor)
    },
    pipe: {
      save: createPipeEditorSaveHandler(
        mepRenderers, 
        editorStates.selectedPipe, 
        editorSetters.setSkipPipeRecreation
      ),
      cancel: createPipeEditorCancelHandler(editorSetters.setShowPipeEditor)
    },
    conduit: {
      save: createConduitEditorSaveHandler(
        mepRenderers, 
        editorStates.selectedConduit, 
        editorSetters.setSkipConduitRecreation
      ),
      cancel: createConduitEditorCancelHandler(editorSetters.setShowConduitEditor)
    },
    cableTray: {
      save: createCableTrayEditorSaveHandler(
        mepRenderers, 
        editorStates.selectedCableTray, 
        editorSetters.setSkipCableTrayRecreation
      ),
      cancel: createCableTrayEditorCancelHandler(editorSetters.setShowCableTrayEditor)
    }
  }
}

/**
 * Create selection handlers that update editor state
 */
export function createSelectionHandlers(mepRenderers, editorSetters) {
  return {
    handleDuctSelection: () => {
      const selected = mepRenderers.ductwork?.ductInteraction?.getSelectedDuct()
      editorSetters.setSelectedDuct(selected)
      editorSetters.setShowDuctEditor(!!selected)
    },
    
    handlePipeSelection: () => {
      const selected = mepRenderers.piping?.pipeInteraction?.getSelectedPipe()
      editorSetters.setSelectedPipe(selected)
      editorSetters.setShowPipeEditor(!!selected)
    },
    
    handleConduitSelection: () => {
      const selected = mepRenderers.conduit?.conduitInteraction?.getSelectedConduit()
      editorSetters.setSelectedConduit(selected)
      editorSetters.setShowConduitEditor(!!selected)
    },
    
    handleCableTraySelection: () => {
      const selected = mepRenderers.cableTray?.cableTrayInteraction?.getSelectedCableTray()
      editorSetters.setSelectedCableTray(selected)
      editorSetters.setShowCableTrayEditor(!!selected)
    }
  }
}