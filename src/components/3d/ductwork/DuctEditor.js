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
 * DuctEditor - Compact horizontal editor for duct dimensions
 */
export const DuctEditor = ({ 
  selectedDuct, 
  camera, 
  renderer, 
  onSave, 
  onCancel,
  onCopy,
  visible = true,
  rackParams = {}
}) => {
  const [dimensions, setDimensions] = useState({
    width: 12,
    height: 8,
    insulation: 0,
    tier: 1
  })
  
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

  // Update dimensions when selectedDuct changes
  useEffect(() => {
    if (selectedDuct?.userData?.ductData) {
      const ductData = selectedDuct.userData.ductData
      setDimensions({
        width: ductData.width || 12,
        height: ductData.height || 8,
        insulation: ductData.insulation || 0,
        tier: ductData.tier || 1
      })
    }
  }, [selectedDuct])

  // Update screen position when duct moves or camera changes
  useEffect(() => {
    if (!selectedDuct || !camera || !renderer || !visible) return

    const updatePosition = () => {
      // Calculate offset based on duct dimensions
      const ductData = selectedDuct.userData.ductData
      const height = ductData.height || 8
      const insulation = ductData.insulation || 0
      const heightM = height * 0.0254 // Convert inches to meters
      const insulationM = insulation * 0.0254
      const totalHeight = heightM + (2 * insulationM)
      const offset = (totalHeight / 2) + 0.3
      
      const screenPos = calculateScreenPosition(selectedDuct, camera, renderer, offset)
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
  }, [selectedDuct, camera, renderer, visible])

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

  const handleTierChange = (newTier) => {
    const tierValue = validateDimensionInput('tier', newTier)
    if (tierValue === null) return
    
    setDimensions(prev => ({
      ...prev,
      tier: tierValue
    }))
    
    // Update duct position based on tier using actual geometry
    if (selectedDuct && window.ductworkRendererInstance) {
      const ductworkRenderer = window.ductworkRendererInstance
      const ductData = selectedDuct.userData.ductData
      
      try {
        const snapLineManager = ductworkRenderer.snapLineManager
        const tierSpace = findTierSpace(snapLineManager, tierValue)
        
        if (tierSpace) {
          // Calculate duct dimensions for positioning
          const heightM = (ductData.height || 8) * 0.0254 // Convert inches to meters
          const insulationM = (ductData.insulation || 0) * 0.0254
          const totalHeight = heightM + (2 * insulationM)
          
          const newYPosition = calculateTierYPosition(tierSpace, totalHeight, 'bottom')
          selectedDuct.position.y = newYPosition
          
        } else {
          console.warn(`⚠️ Tier space ${tierValue} not found in geometry, using fallback calculation`)
          // Fallback to original calculation method
          const newYPosition = ductworkRenderer.calculateDuctYPosition(
            { ...ductData, tier: tierValue }, 
            tierValue, 
            'bottom'
          )
          selectedDuct.position.y = newYPosition
        }
        
      } catch (error) {
        console.error('Error positioning duct using geometry:', error)
        
        // Fallback to original method
        const newYPosition = ductworkRenderer.calculateDuctYPosition(
          { ...ductData, tier: tierValue }, 
          tierValue, 
          'bottom'
        )
        selectedDuct.position.y = newYPosition
      }
      
      // Update duct userData with new tier
      selectedDuct.userData.ductData = {
        ...ductData,
        tier: tierValue
      }
      
      // Clear and recreate measurements if ductInteraction exists
      if (ductworkRenderer.ductInteraction) {
        ductworkRenderer.ductInteraction.clearDuctMeasurements()
        ductworkRenderer.ductInteraction.createDuctMeasurements()
      }
    }
  }

  // Generate tier options based on actual geometry from snap lines
  const getTierOptions = () => {
    const snapLineManager = window.ductworkRendererInstance?.snapLineManager
    return getTierOptionsFromGeometry(snapLineManager)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(dimensions)
    } else {
      console.error('❌ onSave callback not provided to DuctEditor')
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (selectedDuct?.userData?.ductData) {
      const ductData = selectedDuct.userData.ductData
      setDimensions({
        width: ductData.width || 12,
        height: ductData.height || 8,
        insulation: ductData.insulation || 0,
        tier: ductData.tier || 1
      })
    }
    if (onCancel) {
      onCancel()
    }
  }

  const handleCopy = () => {
    if (onCopy) {
      onCopy()
    }
  }

  const handleKeyDown = createEditorKeyHandler(handleSave, handleCancel)

  if (!visible || !selectedDuct) return null

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
        minWidth: '400px'
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
          step="0.5"
          min="1"
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
          step="0.5"
          min="1"
        />
      </div>

      {/* Insulation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          I
        </span>
        <input
          type="number"
          value={dimensions.insulation}
          onChange={(e) => handleDimensionChange('insulation', e.target.value)}
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
          step="0.25"
          min="0"
        />
      </div>


      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '6px',
        marginLeft: '8px'
      }}>
        <button
          onClick={handleCopy}
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
          title="Copy Duct"
        >
          📋
        </button>
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
          onClick={handleSave}
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