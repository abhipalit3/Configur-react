/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * PipeEditor - Compact horizontal editor for pipe dimensions
 */
export const PipeEditor = ({ 
  selectedPipe, 
  camera, 
  renderer, 
  onSave, 
  onCancel,
  visible = true,
  rackParams = {}
}) => {
  const [dimensions, setDimensions] = useState({
    diameter: 2,
    insulation: 0,
    pipeType: 'copper',
    tier: 1,
    color: ''
  })
  
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [forceUpdate, setForceUpdate] = useState(0) // Force position recalculation
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

  // Get available tier options from scene geometry (same logic as DuctEditor)
  const getTierOptions = () => {
    try {
      // Try to get tier options from the snap line manager
      if (window.pipingRendererInstance?.snapLineManager) {
        const snapLines = window.pipingRendererInstance.snapLineManager.getSnapLinesFromRackGeometry()
        
        if (snapLines && snapLines.horizontal) {
          const horizontalLines = snapLines.horizontal.filter(line => isFinite(line.y))
          const beamTops = horizontalLines.filter(line => line.type === 'beam_top')
          
          // Find tier spaces
          const tierSpaces = []
          const minTierHeight = 0.3 // Minimum tier height in meters
          
          for (let i = 0; i < beamTops.length - 1; i++) {
            const topBeam = beamTops[i]
            const bottomBeam = beamTops[i + 1]
            
            if (topBeam && bottomBeam) {
              const gap = topBeam.y - bottomBeam.y
              if (gap >= minTierHeight && isFinite(gap)) {
                tierSpaces.push(tierSpaces.length + 1)
              }
            }
          }
          
          if (tierSpaces.length > 0) {
            const tierCount = tierSpaces.length
            console.log('🔧 PipeEditor - Calculated tierCount from tier spaces:', tierCount)
            return Array.from({ length: tierCount }, (_, i) => i + 1)
          }
          
          // Fallback: if we can't identify tier spaces, use beam count heuristic
          if (beamTops.length > 0) {
            const tierCount = Math.max(1, Math.ceil(beamTops.length / 2))
            console.log('🔧 PipeEditor - Fallback tierCount from beam count:', tierCount)
            return Array.from({ length: tierCount }, (_, i) => i + 1)
          }
        }
      }
    } catch (error) {
      console.error('Error getting tier options from geometry:', error)
    }
    
    // Final fallback - use rackParams or default
    const tierCount = rackParams?.tierCount || 2
    console.log('🔧 PipeEditor - Using fallback tierCount:', tierCount)
    return Array.from({ length: tierCount }, (_, i) => i + 1)
  }

  // Update dimensions when selectedPipe changes
  useEffect(() => {
    if (selectedPipe?.userData?.pipeData) {
      const pipeData = selectedPipe.userData.pipeData
      setDimensions({
        diameter: pipeData.diameter || 2,
        insulation: pipeData.insulation || 0,
        pipeType: pipeData.pipeType || 'copper',
        tier: pipeData.tier || 1,
        color: pipeData.color || ''
      })
    }
  }, [selectedPipe])

  // Update screen position when pipe moves or camera changes
  useEffect(() => {
    if (!selectedPipe || !camera || !renderer || !visible) return

    const updatePosition = () => {
      try {
        // Get pipe position in world coordinates
        const pipeWorldPos = new THREE.Vector3()
        selectedPipe.getWorldPosition(pipeWorldPos)
        
        // Validate world position
        if (!isFinite(pipeWorldPos.x) || !isFinite(pipeWorldPos.y) || !isFinite(pipeWorldPos.z)) {
          console.warn('❌ Invalid pipe world position:', pipeWorldPos)
          return
        }
        
        // Project to screen coordinates
        const screenPos = pipeWorldPos.clone()
        screenPos.project(camera)
        
        // Validate screen position 
        if (!isFinite(screenPos.x) || !isFinite(screenPos.y)) {
          console.warn('❌ Invalid pipe screen position:', screenPos)
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
        console.error('❌ Error updating pipe editor position:', error)
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
  }, [selectedPipe, camera, renderer, visible, forceUpdate])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleDimensionChange = (field, value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || !isFinite(numValue)) {
      console.warn(`❌ Invalid ${field} value: ${value}`)
      return // Don't update with invalid values
    }
    
    // Ensure positive values for dimensions (same logic as ducts)
    const validValue = field === 'tier' ? Math.max(1, Math.floor(numValue)) : Math.max(0, numValue)
    
    setDimensions(prev => ({
      ...prev,
      [field]: validValue
    }))
    
    // If tier changed, immediately move the pipe to the new tier position
    if (field === 'tier' && selectedPipe && window.pipingRendererInstance) {
      const tierValue = Math.max(1, Math.floor(numValue))
      const pipeData = selectedPipe.userData.pipeData
      
      try {
        // Get snap lines to find tier spaces
        const snapLines = window.pipingRendererInstance.snapLineManager?.getSnapLinesFromRackGeometry()
        
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
          
          console.log(`🔧 Positioning pipe for tier ${tierValue}`)
          console.log('🔧 Available tier spaces:', tierSpaces.map(t => `Tier ${t.tierIndex}: ${t.centerY.toFixed(3)}`))
          
          // Find the tier space that corresponds to the selected tier number
          const selectedTierSpace = tierSpaces.find(space => space.tierIndex === tierValue)
          
          if (selectedTierSpace) {
            // Calculate pipe dimensions for positioning
            const diameterM = (pipeData.diameter || 2) * 0.0254 // Convert inches to meters
            const insulationM = (pipeData.insulation || 0) * 0.0254
            const totalDiameter = diameterM + (2 * insulationM)
            const radius = totalDiameter / 2
            
            // Position pipe so its bottom sits on the bottom beam of the tier space
            const newYPosition = selectedTierSpace.bottom + radius
            
            console.log(`🔧 Moving pipe to tier ${tierValue} at Y: ${newYPosition.toFixed(3)} (tier bottom: ${selectedTierSpace.bottom.toFixed(3)})`)
            
            // Update pipe position
            selectedPipe.position.y = newYPosition
            
            // Update pipe userData
            selectedPipe.userData.tier = tierValue
            selectedPipe.userData.tierName = `Tier ${tierValue}`
            selectedPipe.userData.pipeData.tier = tierValue
            
            // If transform controls are attached, update them
            if (window.pipingRendererInstance.pipeInteraction?.transformControls) {
              window.pipingRendererInstance.pipeInteraction.transformControls.update()
            }
            
            // Save the updated position and tier info
            if (window.pipingRendererInstance.pipeInteraction?.savePipePosition) {
              window.pipingRendererInstance.pipeInteraction.savePipePosition(selectedPipe)
            }
            
            // Update MEP items in localStorage and refresh the right panel
            if (window.refreshMepPanel) {
              window.refreshMepPanel()
            }
            
            // Force update of pipe tier info
            if (window.pipingRendererInstance.pipeInteraction?.updateAllPipeTierInfo) {
              window.pipingRendererInstance.pipeInteraction.updateAllPipeTierInfo()
            }
            
            // Force editor position update after a small delay to allow pipe position to settle
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
        console.error('❌ Error updating pipe tier position:', error)
      }
    }
  }

  const handleStringChange = (field, value) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave()
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(dimensions)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  if (!visible || !selectedPipe) {
    return null
  }

  // Position the editor centered below the selected pipe with more padding
  const editorStyle = {
    position: 'fixed',
    left: `${position.x - 210}px`, // Better centering for 420px effective width with padding
    top: `${position.y + 80}px`, // More padding below the pipe
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
          onChange={(e) => handleDimensionChange('tier', e.target.value)}
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
          value={dimensions.pipeType}
          onChange={(e) => handleStringChange('pipeType', e.target.value)}
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
          <option value="copper">Copper</option>
          <option value="pvc">PVC</option>
          <option value="steel">Steel</option>
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
          onChange={(e) => handleDimensionChange('diameter', e.target.value)}
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
          step="0.1"
          min="0"
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
          step="0.1"
          min="0"
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