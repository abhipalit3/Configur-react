import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * DuctEditor - Compact horizontal editor for duct dimensions
 */
export const DuctEditor = ({ 
  selectedDuct, 
  camera, 
  renderer, 
  onSave, 
  onCancel,
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

  // Update dimensions when selectedDuct changes
  useEffect(() => {
    if (selectedDuct?.userData?.ductData) {
      const ductData = selectedDuct.userData.ductData
      console.log('🔵 DuctEditor updating dimensions from selectedDuct:', ductData)
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
      // Get duct position in world coordinates
      const ductWorldPos = new THREE.Vector3()
      selectedDuct.getWorldPosition(ductWorldPos)
      
      // Offset below the duct
      const ductData = selectedDuct.userData.ductData
      const heightM = (ductData.height || 8) * 0.0254 // Convert inches to meters
      const insulationM = (ductData.insulation || 0) * 0.0254
      const totalHeight = heightM + (2 * insulationM)
      
      ductWorldPos.y -= (totalHeight / 2) + 0.3 // Position below duct with some margin
      
      // Project to screen coordinates
      const screenPos = ductWorldPos.clone().project(camera)
      const canvas = renderer.domElement
      
      const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth
      const y = (-screenPos.y * 0.5 + 0.5) * canvas.clientHeight
      
      setPosition({ x, y })
    }

    updatePosition()
    
    // Update position on animation frames
    const animate = () => {
      updatePosition()
      requestAnimationFrame(animate)
    }
    const animationId = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(animationId)
  }, [selectedDuct, camera, renderer, visible])

  const handleDimensionChange = (field, value) => {
    const numValue = parseFloat(value) || 0
    setDimensions(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleKeyDown = (event) => {
    console.log('🔵 DuctEditor keydown event:', event.key)
    if (event.key === 'Enter') {
      console.log('🔵 Enter key pressed - calling handleSave')
      handleSave()
    }
    if (event.key === 'Escape') {
      console.log('🔵 Escape key pressed - calling handleCancel')
      handleCancel()
    }
  }

  const handleTierChange = (newTier) => {
    const tierValue = parseInt(newTier)
    setDimensions(prev => ({
      ...prev,
      tier: tierValue
    }))
    
    // Immediately move the duct to the new tier position
    if (selectedDuct && window.ductworkRendererInstance) {
      const ductworkRenderer = window.ductworkRendererInstance
      const ductData = selectedDuct.userData.ductData
      
      // Calculate new Y position for the tier
      const newYPosition = ductworkRenderer.calculateDuctYPosition(
        { ...ductData, tier: tierValue }, 
        tierValue, 
        'bottom'
      )
      
      // Update duct position
      selectedDuct.position.y = newYPosition
      
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
      
      console.log(`🎯 Moved duct to tier ${tierValue} at Y position: ${newYPosition.toFixed(3)}`)
    }
  }

  // Generate tier options based on rack data
  const getTierOptions = () => {
    const tierCount = rackParams.tierCount || 2
    return Array.from({ length: tierCount }, (_, i) => i + 1)
  }

  const handleSave = () => {
    console.log('🔵 DuctEditor handleSave called with dimensions:', dimensions)
    console.log('🔵 onSave callback exists:', !!onSave)
    if (onSave) {
      console.log('🔵 Calling onSave callback...')
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