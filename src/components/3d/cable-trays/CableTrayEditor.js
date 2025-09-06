/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { 
  calculateScreenPosition, 
  validateDimensionInput, 
  getTierOptionsFromGeometry,
  findTierSpace,
  calculateTierYPosition,
  createAnimationLoop,
  createEditorKeyHandler
} from '../utils/common3dHelpers'

/**
 * CableTrayEditor - Compact horizontal editor for cable tray dimensions
 */
export const CableTrayEditor = ({ 
  selectedCableTray, 
  camera, 
  renderer, 
  onSave, 
  onCancel,
  visible = true,
  rackParams = {}
}) => {
  const [dimensions, setDimensions] = useState({
    width: 12,
    height: 4,
    trayType: 'ladder',
    tier: 1
  })
  
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

  // Update dimensions when selectedCableTray changes
  useEffect(() => {
    if (selectedCableTray?.userData?.cableTrayData) {
      const cableTrayData = selectedCableTray.userData.cableTrayData
      // console.log('🔌 CableTrayEditor: Loading cable tray data:', cableTrayData)
      setDimensions({
        width: cableTrayData.width || 12,
        height: cableTrayData.height || 4,
        trayType: cableTrayData.trayType || 'ladder',
        tier: cableTrayData.tier || 1
      })
    }
  }, [selectedCableTray])
  
  // Log when component mounts/unmounts
  useEffect(() => {
    // console.log('🔌 CableTrayEditor: Component mounted, visible:', visible)
    return () => {
      // console.log('🔌 CableTrayEditor: Component unmounted')
    }
  }, [])

  // Update screen position when cable tray moves or camera changes
  useEffect(() => {
    if (!selectedCableTray || !camera || !renderer || !visible) return

    const updatePosition = () => {
      // Calculate offset based on cable tray height
      const cableTrayData = selectedCableTray.userData.cableTrayData
      const height = cableTrayData.height || 4
      const heightM = height * 0.0254 // Convert inches to meters
      const offset = (heightM / 2) + 0.3
      
      const screenPos = calculateScreenPosition(selectedCableTray, camera, renderer, offset)
      if (screenPos && mountedRef.current) {
        setPosition(screenPos)
      }
    }

    updatePosition()
    
    // Use common animation loop helper
    const cleanup = createAnimationLoop(updatePosition, mountedRef)
    
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [selectedCableTray, camera, renderer, visible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleDimensionChange = (field, value) => {
    const validValue = validateDimensionInput(field, value)
    if (validValue !== null) {
      setDimensions(prev => ({
        ...prev,
        [field]: validValue
      }))
    }
  }

  const handleTrayTypeChange = (newTrayType) => {
    // console.log('🔌 CableTrayEditor: trayType changed to:', newTrayType)
    // console.log('🔌 CableTrayEditor: Current dimensions before change:', dimensions)
    setDimensions(prev => {
      const newDimensions = {
        ...prev,
        trayType: newTrayType
      }
      // console.log('🔌 CableTrayEditor: New dimensions after change:', newDimensions)
      return newDimensions
    })
  }

  const handleTierChange = (newTier) => {
    const tierValue = validateDimensionInput('tier', newTier)
    if (tierValue === null) return
    
    setDimensions(prev => ({
      ...prev,
      tier: tierValue
    }))
    
    // Update cable tray position based on tier using actual geometry
    if (selectedCableTray && window.cableTrayRendererInstance) {
      const cableTrayRenderer = window.cableTrayRendererInstance
      const cableTrayData = selectedCableTray.userData.cableTrayData
      
      try {
        // Use duct system's snap line manager for tier positioning
        if (window.ductworkRendererInstance?.snapLineManager) {
          const snapLineManager = window.ductworkRendererInstance.snapLineManager
          const tierSpace = findTierSpace(snapLineManager, tierValue)
          
          if (tierSpace) {
            // Calculate cable tray dimensions for positioning
            const heightM = (cableTrayData.height || 4) * 0.0254 // Convert inches to meters
            const newYPosition = calculateTierYPosition(tierSpace, heightM, 'bottom')
            
            // Update cable tray position
            selectedCableTray.position.y = newYPosition
          }
        }
        
      } catch (error) {
        console.error('Error positioning cable tray using geometry:', error)
      }
      
      // Update cable tray userData with new tier
      selectedCableTray.userData.cableTrayData = {
        ...cableTrayData,
        tier: tierValue
      }
      
      // Clear and recreate measurements if cable tray interaction exists
      if (cableTrayRenderer.cableTrayInteraction) {
        cableTrayRenderer.cableTrayInteraction.clearCableTrayMeasurements()
        cableTrayRenderer.cableTrayInteraction.createCableTrayMeasurements()
      }
    }
  }

  // Generate tier options based on actual geometry from snap lines
  const getTierOptions = () => {
    const snapLineManager = window.ductworkRendererInstance?.snapLineManager
    return getTierOptionsFromGeometry(snapLineManager)
  }

  const handleSave = () => {
    // console.log('🔌 CableTrayEditor: handleSave called with dimensions:', dimensions)
    if (onSave) {
      onSave(dimensions)
    } else {
      console.error('❌ onSave callback not provided to CableTrayEditor')
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (selectedCableTray?.userData?.cableTrayData) {
      const cableTrayData = selectedCableTray.userData.cableTrayData
      setDimensions({
        width: cableTrayData.width || 12,
        height: cableTrayData.height || 4,
        trayType: cableTrayData.trayType || 'ladder',
        tier: cableTrayData.tier || 1
      })
    }
    if (onCancel) {
      onCancel()
    }
  }

  const handleKeyDown = createEditorKeyHandler(handleSave, handleCancel)

  if (!visible || !selectedCableTray) return null

  return (
    <div
      ref={editorRef}
      style={{
        position: 'fixed',
        left: position.x - 200,
        top: position.y,
        zIndex: 1000,
        background: 'rgba(30, 33, 45, 0.95)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: '6px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'all',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '450px'
      }}
    >
      {/* Tier Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '40px'
        }}>
          Tier
        </span>
        <select
          value={dimensions.tier}
          onChange={(e) => handleTierChange(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            padding: '4px 6px',
            width: '50px',
            outline: 'none'
          }}
        >
          {getTierOptions().map(tier => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </div>

      {/* Tray Type Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '35px'
        }}>
          Type
        </span>
        <select
          value={dimensions.trayType}
          onChange={(e) => handleTrayTypeChange(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            padding: '4px 6px',
            width: '80px',
            outline: 'none'
          }}
        >
          <option value="ladder">Ladder</option>
          <option value="solid bottom">Solid</option>
          <option value="wire mesh">Wire</option>
        </select>
      </div>

      {/* Width */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          W
        </span>
        <input
          type="number"
          value={dimensions.width}
          onChange={(e) => handleDimensionChange('width', e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            padding: '4px 6px',
            textAlign: 'center',
            width: '50px',
            outline: 'none'
          }}
          step="1"
          min="6"
        />
      </div>

      {/* Height */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          H
        </span>
        <input
          type="number"
          value={dimensions.height}
          onChange={(e) => handleDimensionChange('height', e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            padding: '4px 6px',
            textAlign: 'center',
            width: '50px',
            outline: 'none'
          }}
          step="1"
          min="2"
        />
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '6px',
        marginLeft: '8px'
      }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '4px 8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.color = 'white'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            e.target.style.color = 'rgba(255, 255, 255, 0.7)'
          }}
        >
          ✕
        </button>
        <button
          onClick={(e) => {
            // console.log('🔌 CableTrayEditor: Save button clicked!')
            e.preventDefault()
            e.stopPropagation()
            handleSave()
          }}
          style={{
            padding: '4px 8px',
            border: '1px solid #4A90E2',
            borderRadius: '4px',
            background: '#4A90E2',
            color: 'white',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#5ba0f2'
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#4A90E2'
          }}
        >
          ✓
        </button>
      </div>
    </div>
  )
}