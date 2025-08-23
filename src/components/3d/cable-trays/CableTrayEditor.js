/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

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
      try {
        // Get cable tray position in world coordinates
        const cableTrayWorldPos = new THREE.Vector3()
        selectedCableTray.getWorldPosition(cableTrayWorldPos)
        
        // Validate world position
        if (!isFinite(cableTrayWorldPos.x) || !isFinite(cableTrayWorldPos.y) || !isFinite(cableTrayWorldPos.z)) {
          console.warn('⚠️ Invalid cable tray world position:', cableTrayWorldPos)
          return
        }
        
        // Offset below the cable tray
        const cableTrayData = selectedCableTray.userData.cableTrayData
        const height = cableTrayData.height || 4
        
        // Validate dimensions
        if (!isFinite(height)) {
          console.warn('⚠️ Invalid cable tray height:', height)
          return
        }
        
        const heightM = height * 0.0254 // Convert inches to meters
        
        if (!isFinite(heightM)) {
          console.warn('⚠️ Invalid total height:', heightM)
          return
        }
        
        cableTrayWorldPos.y -= (heightM / 2) + 0.3 // Position below cable tray with some margin
        
        // Project to screen coordinates
        const screenPos = cableTrayWorldPos.clone().project(camera)
        
        // Validate projection
        if (!isFinite(screenPos.x) || !isFinite(screenPos.y) || !isFinite(screenPos.z)) {
          console.warn('⚠️ Invalid screen projection:', screenPos)
          return
        }
        
        const canvas = renderer.domElement
        if (!canvas || !canvas.clientWidth || !canvas.clientHeight) {
          console.warn('⚠️ Invalid canvas dimensions')
          return
        }
        
        const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth
        const y = (-screenPos.y * 0.5 + 0.5) * canvas.clientHeight
        
        // Validate final screen coordinates
        if (!isFinite(x) || !isFinite(y)) {
          console.warn('⚠️ Invalid screen coordinates:', { x, y })
          return
        }
        
        // Only update state if component is still mounted
        if (mountedRef.current) {
          setPosition({ x, y })
        }
      } catch (error) {
        console.error('❌ Error updating cable tray editor position:', error)
      }
    }

    updatePosition()
    
    // Update position on animation frames with proper cleanup
    let isAnimating = true
    let animationId
    
    const animate = () => {
      if (!isAnimating) return
      updatePosition()
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      isAnimating = false
      mountedRef.current = false
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [selectedCableTray, camera, renderer, visible])

  // Cleanup on unmount
  useEffect(() => {
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
    
    // Ensure positive values for dimensions
    const validValue = field === 'tier' ? Math.max(1, Math.floor(numValue)) : Math.max(0, numValue)
    
    setDimensions(prev => ({
      ...prev,
      [field]: validValue
    }))
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave()
    }
    if (event.key === 'Escape') {
      handleCancel()
    }
  }

  const handleTierChange = (newTier) => {
    const tierValue = parseInt(newTier)
    if (isNaN(tierValue) || tierValue < 1) {
      console.warn(`❌ Invalid tier value: ${newTier}`)
      return
    }
    
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
          const snapLines = snapLineManager.getSnapLinesFromRackGeometry()
          
          const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
          const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
          
          // Find tier spaces - same logic as duct editor
          const tierSpaces = []
          const minTierHeight = 0.3 // Minimum 30cm tier height in meters
          
          for (let i = 0; i < allBeamPositions.length - 1; i++) {
            const topY = allBeamPositions[i]
            const bottomY = allBeamPositions[i + 1]
            
            // Validate beam positions
            if (!isFinite(topY) || !isFinite(bottomY)) {
              console.warn('❌ Invalid beam position:', { topY, bottomY })
              continue
            }
            
            const gap = topY - bottomY
            
            if (gap >= minTierHeight && isFinite(gap)) {
              tierSpaces.push({
                tierIndex: tierSpaces.length + 1,
                top: topY,
                bottom: bottomY,
                height: gap,
                centerY: isFinite(topY + bottomY) ? (topY + bottomY) / 2 : topY
              })
            }
          }
          
          // Find the tier space that corresponds to the selected tier number
          const selectedTierSpace = tierSpaces.find(space => space.tierIndex === tierValue)
          
          if (selectedTierSpace) {
            // Calculate cable tray dimensions for positioning
            const heightM = (cableTrayData.height || 4) * 0.0254 // Convert inches to meters
            
            // Position cable tray so its bottom sits on the bottom beam of the tier space
            const newYPosition = selectedTierSpace.bottom + (heightM / 2)
            
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
    try {
      const ductworkRenderer = window.ductworkRendererInstance
      if (ductworkRenderer && ductworkRenderer.snapLineManager) {
        const snapLines = ductworkRenderer.snapLineManager.getSnapLinesFromRackGeometry()
        
        // Get all horizontal snap lines and sort them by Y position (top to bottom)
        const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
        
        // Group beam_top and beam_bottom pairs to identify tiers
        const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')
        const beamBottoms = allHorizontalLines.filter(line => line.type === 'beam_bottom')
        
        // Combine all beam positions and group them to find tier spaces
        const allBeamPositions = [...beamTops, ...beamBottoms].map(b => b.y).sort((a, b) => b - a)
        
        // Find tier spaces - look for gaps between beams that are large enough for cable trays
        const tierSpaces = []
        const minTierHeight = 0.3 // Minimum 30cm tier height in meters
        
        for (let i = 0; i < allBeamPositions.length - 1; i++) {
          const topY = allBeamPositions[i]
          const bottomY = allBeamPositions[i + 1]
          const gap = topY - bottomY
          
          // If gap is large enough, it's a potential tier space
          if (gap >= minTierHeight) {
            tierSpaces.push({
              tierIndex: tierSpaces.length + 1,
              top: topY,
              bottom: bottomY,
              height: gap
            })
          }
        }
        
        if (tierSpaces.length > 0) {
          const tierCount = tierSpaces.length
          return Array.from({ length: tierCount }, (_, i) => i + 1)
        }
        
        // Fallback: if we can't identify tier spaces, use beam count heuristic
        if (beamTops.length > 0) {
          const tierCount = Math.max(1, Math.ceil(beamTops.length / 2))
          return Array.from({ length: tierCount }, (_, i) => i + 1)
        }
      }
    } catch (error) {
      console.error('Error getting tier options from geometry:', error)
    }
    
    // Final fallback
    return [1, 2]
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