/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * ConduitEditorUI - Compact horizontal editor for conduit dimensions
 */
export const ConduitEditorUI = ({ 
  selectedConduit, 
  camera, 
  renderer, 
  onSave, 
  onCancel,
  visible = true,
  rackParams = {}
}) => {
  const [dimensions, setDimensions] = useState({
    diameter: 1,
    conduitType: 'EMT',
    fillPercentage: 0,
    spacing: 4,
    count: 1,
    tier: 1,
    color: ''
  })
  
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [forceUpdate, setForceUpdate] = useState(0)
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

  // Get available tier options from scene geometry
  const getTierOptions = () => {
    try {
      // Try to get tier options from the snap line manager
      if (window.conduitRendererInstance?.snapLineManager) {
        const snapLines = window.conduitRendererInstance.snapLineManager.getSnapLinesFromRackGeometry()
        
        if (snapLines && snapLines.horizontal) {
          const horizontalLines = snapLines.horizontal.filter(line => isFinite(line.y))
          const beamTops = horizontalLines.filter(line => line.type === 'beam_top').sort((a, b) => b.y - a.y)
          
          // Find tier spaces
          const tierSpaces = []
          const minTierHeight = 0.3 // Minimum tier height in meters
          
          for (let i = 0; i < beamTops.length - 1; i++) {
            const topBeam = beamTops[i]
            const bottomBeam = beamTops[i + 1]
            
            if (topBeam && bottomBeam) {
              const gap = topBeam.y - bottomBeam.y
              if (gap >= minTierHeight && isFinite(gap)) {
                tierSpaces.push({
                  value: tierSpaces.length + 1,
                  label: `${tierSpaces.length + 1}`
                })
              }
            }
          }
          
          if (tierSpaces.length > 0) {
            return tierSpaces
          }
        }
      }
      
      // Fallback to rack parameters
      const tierCount = rackParams.tierCount || 2
      return Array.from({ length: tierCount }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}`
      }))
      
    } catch (error) {
      console.error('Error getting tier options:', error)
      return [{ value: 1, label: '1' }, { value: 2, label: '2' }]
    }
  }

  // Update dimensions when selectedConduit changes
  useEffect(() => {
    if (selectedConduit?.userData?.conduitData) {
      const conduitData = selectedConduit.userData.conduitData
      
      // Get group information from conduit interaction
      const conduitInteraction = window.conduitRendererInstance?.conduitInteraction
      const groupSize = conduitInteraction?.selectedConduitGroup?.length || 1
      
      setDimensions({
        diameter: conduitData.diameter || 1,
        conduitType: conduitData.conduitType || 'EMT',
        fillPercentage: conduitData.fillPercentage || 0,
        spacing: conduitData.spacing || 4,
        count: groupSize,
        tier: conduitData.tier || 1,
        color: conduitData.color || ''
      })
    }
  }, [selectedConduit])

  // Update screen position when conduit moves or camera changes
  useEffect(() => {
    if (!selectedConduit || !camera || !renderer || !visible) return

    const updatePosition = () => {
      try {
        // Get conduit position in world coordinates
        const conduitWorldPos = new THREE.Vector3()
        selectedConduit.getWorldPosition(conduitWorldPos)
        
        // Validate world position
        if (!isFinite(conduitWorldPos.x) || !isFinite(conduitWorldPos.y) || !isFinite(conduitWorldPos.z)) {
          console.warn('⚠️ Invalid conduit world position:', conduitWorldPos)
          return
        }
        
        // Offset below the conduit
        const conduitData = selectedConduit.userData.conduitData
        const diameter = conduitData.diameter || 1
        
        // Validate dimensions
        if (!isFinite(diameter)) {
          console.warn('⚠️ Invalid conduit dimensions:', { diameter })
          return
        }
        
        const diameterM = diameter * 0.0254 // Convert inches to meters
        const radius = diameterM / 2
        
        if (!isFinite(radius)) {
          console.warn('⚠️ Invalid radius:', radius)
          return
        }
        
        conduitWorldPos.y -= radius + 0.3 // Position below conduit with some margin
        
        // Project to screen coordinates
        const screenPos = conduitWorldPos.clone()
        screenPos.project(camera)
        
        // Validate screen position 
        if (!isFinite(screenPos.x) || !isFinite(screenPos.y)) {
          console.warn('❌ Invalid conduit screen position:', screenPos)
          return
        }

        // Convert from normalized device coordinates (-1 to 1) to screen pixels
        const canvas = renderer.domElement
        const rect = canvas.getBoundingClientRect()
        const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left
        const y = (-screenPos.y * 0.5 + 0.5) * rect.height + rect.top

        if (mountedRef.current) {
          setPosition({ x, y })
        }
        
      } catch (error) {
        console.error('❌ Error updating conduit editor position:', error)
      }
    }

    updatePosition()
    
    // Update position when camera moves
    const onCameraChange = () => {
      if (mountedRef.current) {
        updatePosition()
      }
    }

    // Listen for camera changes
    const controls = camera.userData?.orbitControls
    if (controls) {
      controls.addEventListener('change', onCameraChange)
      
      return () => {
        controls.removeEventListener('change', onCameraChange)
      }
    }
    
    // Fallback: update position periodically
    const interval = setInterval(onCameraChange, 100)
    return () => clearInterval(interval)
  }, [selectedConduit, camera, renderer, visible, forceUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleSave = () => {
    console.log(`⚡ ConduitEditor: handleSave called with dimensions:`, dimensions)
    if (onSave) {
      onSave(dimensions)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const handleInputChange = (field, value) => {
    // For count field, use parseInt; for others, use parseFloat
    const numValue = field === 'count' ? parseInt(value) || 1 : parseFloat(value)
    
    console.log(`⚡ ConduitEditor: handleInputChange called with field=${field}, value=${value}, numValue=${numValue}`)
    
    // For tier changes, handle immediately like pipe editor
    if (field === 'tier') {
      const validValue = Math.max(1, Math.floor(numValue))
      
      setDimensions(prev => ({
        ...prev,
        [field]: validValue
      }))
      
      // If tier changed, immediately move the conduit to the new tier position
      if (selectedConduit && window.conduitRendererInstance) {
        const tierValue = validValue
        const conduitData = selectedConduit.userData.conduitData
        
        try {
          // Get snap lines to find tier spaces
          const snapLines = window.conduitRendererInstance.snapLineManager?.getSnapLinesFromRackGeometry()
          
          if (snapLines && snapLines.horizontal) {
            const horizontalLines = snapLines.horizontal.filter(line => isFinite(line.y))
            const beamTops = horizontalLines.filter(line => line.type === 'beam_top').sort((a, b) => b.y - a.y)
            
            // Find tier spaces
            const tierSpaces = []
            const minTierHeight = 0.3
            
            for (let i = 0; i < beamTops.length - 1; i++) {
              const topBeam = beamTops[i]
              const bottomBeam = beamTops[i + 1]
              
              if (topBeam && bottomBeam) {
                const gap = topBeam.y - bottomBeam.y
                if (gap >= minTierHeight && isFinite(gap)) {
                  tierSpaces.push({
                    tierIndex: tierSpaces.length + 1,
                    top: topBeam.y,
                    bottom: bottomBeam.y,
                    centerY: (topBeam.y + bottomBeam.y) / 2
                  })
                }
              }
            }
            
            console.log(`🔧 Positioning conduit for tier ${tierValue}`)
            console.log('🔧 Available tier spaces:', tierSpaces.map(t => `Tier ${t.tierIndex}: ${t.centerY.toFixed(3)}`))
            
            // Find the tier space that corresponds to the selected tier number
            const selectedTierSpace = tierSpaces.find(space => space.tierIndex === tierValue)
            
            if (selectedTierSpace) {
              // Calculate conduit dimensions for positioning
              const diameterM = (conduitData.diameter || 1) * 0.0254 // Convert inches to meters
              const radius = diameterM / 2
              
              // Position conduit so its bottom sits on the bottom beam of the tier space
              const newYPosition = selectedTierSpace.bottom + radius
              
              console.log(`🔧 Moving conduit to tier ${tierValue} at Y: ${newYPosition.toFixed(3)} (tier bottom: ${selectedTierSpace.bottom.toFixed(3)})`)
              
              // Update conduit position
              selectedConduit.position.y = newYPosition
              
              // Update conduit userData
              selectedConduit.userData.tier = tierValue
              selectedConduit.userData.tierName = `Tier ${tierValue}`
              selectedConduit.userData.conduitData.tier = tierValue
              
              // If transform controls are attached, update them
              if (window.conduitRendererInstance.conduitInteraction?.transformControls) {
                window.conduitRendererInstance.conduitInteraction.transformControls.update()
              }
              
              // Save the updated position and tier info
              if (window.conduitRendererInstance.conduitInteraction?.saveConduitPosition) {
                window.conduitRendererInstance.conduitInteraction.saveConduitPosition(selectedConduit)
              }
              
              // Update MEP items in localStorage and refresh the right panel
              if (window.refreshMepPanel) {
                window.refreshMepPanel()
              }
              
              // Force update of conduit tier info
              if (window.conduitRendererInstance.conduitInteraction?.updateAllConduitTierInfo) {
                window.conduitRendererInstance.conduitInteraction.updateAllConduitTierInfo()
              }
              
              // Force editor position update after a small delay to allow conduit position to settle
              setTimeout(() => {
                if (mountedRef.current) {
                  // Trigger position recalculation by incrementing force update counter
                  setForceUpdate(prev => prev + 1)
                }
              }, 50)
            } else {
              console.warn(`⚠️ Tier space ${tierValue} not found in geometry`)
            }
          }
        } catch (error) {
          console.error('❌ Error updating conduit tier position:', error)
        }
      }
    } else {
      // For non-tier fields, handle normally
      setDimensions(prev => ({
        ...prev,
        [field]: numValue
      }))
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave()
    }
  }

  if (!visible || !selectedConduit) {
    return null
  }

  const tierOptions = getTierOptions()

  // Position the editor next to the selected conduit (similar to ducts)
  const editorStyle = {
    position: 'fixed',
    left: `${position.x - 200}px`, // Position to the left of the conduit like ducts
    top: `${position.y}px`, // At the same level as the conduit
    background: 'rgba(40, 44, 52, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    pointerEvents: 'all',
    padding: '8px 12px',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    minWidth: '400px'
  }

  return (
    <div ref={editorRef} style={editorStyle}>
      {/* Tier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '30px'
        }}>
          Tier
        </span>
        <select
          value={dimensions.tier}
          onChange={(e) => handleInputChange('tier', parseInt(e.target.value))}
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
          {tierOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '30px'
        }}>
          Type
        </span>
        <select
          value={dimensions.conduitType}
          onChange={(e) => handleInputChange('conduitType', e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            padding: '4px 6px',
            width: '70px',
            outline: 'none'
          }}
        >
          <option value="EMT">EMT</option>
          <option value="Rigid">Rigid</option>
          <option value="PVC">PVC</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>

      {/* Diameter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          Ø
        </span>
        <input
          type="number"
          value={dimensions.diameter}
          onChange={(e) => handleInputChange('diameter', parseFloat(e.target.value) || 0)}
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

      {/* Spacing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          S
        </span>
        <input
          type="number"
          value={dimensions.spacing}
          onChange={(e) => handleInputChange('spacing', parseFloat(e.target.value) || 0)}
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

      {/* Count (Group Size) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          #
        </span>
        <input
          type="number"
          value={dimensions.count}
          onChange={(e) => handleInputChange('count', parseInt(e.target.value) || 1)}
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
          min="1"
          max="20"
        />
      </div>

      {/* Fill Percentage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '15px'
        }}>
          F
        </span>
        <input
          type="number"
          value={dimensions.fillPercentage}
          onChange={(e) => handleInputChange('fillPercentage', parseFloat(e.target.value) || 0)}
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
          step="5"
          min="0"
          max="100"
        />
      </div>

      {/* Buttons */}
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
            fontSize: '12px',
            cursor: 'pointer',
            outline: 'none'
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
            fontSize: '12px',
            cursor: 'pointer',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#5BA0F2'
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

export default ConduitEditorUI