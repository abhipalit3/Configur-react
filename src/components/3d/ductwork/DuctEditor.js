/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

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
      try {
        // Get duct position in world coordinates
        const ductWorldPos = new THREE.Vector3()
        selectedDuct.getWorldPosition(ductWorldPos)
        
        // Validate world position
        if (!isFinite(ductWorldPos.x) || !isFinite(ductWorldPos.y) || !isFinite(ductWorldPos.z)) {
          console.warn('⚠️ Invalid duct world position:', ductWorldPos)
          return
        }
        
        // Offset below the duct
        const ductData = selectedDuct.userData.ductData
        const height = ductData.height || 8
        const insulation = ductData.insulation || 0
        
        // Validate dimensions
        if (!isFinite(height) || !isFinite(insulation)) {
          console.warn('⚠️ Invalid duct dimensions:', { height, insulation })
          return
        }
        
        const heightM = height * 0.0254 // Convert inches to meters
        const insulationM = insulation * 0.0254
        const totalHeight = heightM + (2 * insulationM)
        
        if (!isFinite(totalHeight)) {
          console.warn('⚠️ Invalid total height:', totalHeight)
          return
        }
        
        ductWorldPos.y -= (totalHeight / 2) + 0.3 // Position below duct with some margin
        
        // Project to screen coordinates
        const screenPos = ductWorldPos.clone().project(camera)
        
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
        console.error('❌ Error updating duct editor position:', error)
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
  }, [selectedDuct, camera, renderer, visible])

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
    
    // Update duct position based on tier using actual geometry
    if (selectedDuct && window.ductworkRendererInstance) {
      const ductworkRenderer = window.ductworkRendererInstance
      const ductData = selectedDuct.userData.ductData
      
      try {
        const snapLines = ductworkRenderer.snapLineManager.getSnapLinesFromRackGeometry()
        
        // Use the same tier space detection logic as getTierOptions()
        const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
        const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
        
        // Find tier spaces - same logic as getTierOptions
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
        
        // console.log(`🔧 Positioning duct for tier ${tierValue}`)
        // console.log('🔧 Available tier spaces:', tierSpaces.map(t => `Tier ${t.tierIndex}: ${t.centerY.toFixed(3)}`))
        
        // Find the tier space that corresponds to the selected tier number
        const selectedTierSpace = tierSpaces.find(space => space.tierIndex === tierValue)
        
        if (selectedTierSpace) {
          // Calculate duct dimensions for positioning
          const heightM = (ductData.height || 8) * 0.0254 // Convert inches to meters
          const insulationM = (ductData.insulation || 0) * 0.0254
          const totalHeight = heightM + (2 * insulationM)
          
          // Position duct so its bottom sits on the bottom beam of the tier space
          const newYPosition = selectedTierSpace.bottom + (totalHeight / 2)
          
          // console.log(`🔧 Moving duct to tier ${tierValue} at Y: ${newYPosition.toFixed(3)} (tier bottom: ${selectedTierSpace.bottom.toFixed(3)})`)
          
          // Update duct position
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
    try {
      const ductworkRenderer = window.ductworkRendererInstance
      if (ductworkRenderer && ductworkRenderer.snapLineManager) {
        const snapLines = ductworkRenderer.snapLineManager.getSnapLinesFromRackGeometry()
        
        // Get all horizontal snap lines and sort them by Y position (top to bottom)
        const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
        
        // console.log('🔧 All horizontal snap lines:', allHorizontalLines.map(h => `${h.type}: ${h.y.toFixed(3)}`))
        
        // Group beam_top and beam_bottom pairs to identify tiers
        const beamTops = allHorizontalLines.filter(line => line.type === 'beam_top')
        const beamBottoms = allHorizontalLines.filter(line => line.type === 'beam_bottom')
        
        // console.log('🔧 Found beam tops:', beamTops.length, 'beam bottoms:', beamBottoms.length)
        
        // Each tier should have a space between two beams where ducts can be placed
        // We need to identify distinct tier levels by analyzing the Y positions
        
        // Combine all beam positions and group them to find tier spaces
        const allBeamPositions = [...beamTops, ...beamBottoms].map(b => b.y).sort((a, b) => b - a)
        // console.log('🔧 All beam Y positions:', allBeamPositions.map(y => y.toFixed(3)))
        
        // Find tier spaces - look for gaps between beams that are large enough for ducts
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
        
        // console.log('🔧 Found tier spaces:', tierSpaces.map(t => `Tier ${t.tierIndex}: ${t.height.toFixed(3)}m height`))
        
        if (tierSpaces.length > 0) {
          const tierCount = tierSpaces.length
          // console.log('🔧 DuctEditor - Calculated tierCount from tier spaces:', tierCount)
          return Array.from({ length: tierCount }, (_, i) => i + 1)
        }
        
        // Fallback: if we can't identify tier spaces, use beam count heuristic
        if (beamTops.length > 0) {
          // For multi-tier racks, typically each tier has 2 beams, but there might be shared beams
          // Use a more conservative estimate
          const tierCount = Math.max(1, Math.ceil(beamTops.length / 2))
          // console.log('🔧 DuctEditor - Fallback tierCount from beam count:', tierCount, 'from', beamTops.length, 'beam tops')
          return Array.from({ length: tierCount }, (_, i) => i + 1)
        }
      }
    } catch (error) {
      console.error('Error getting tier options from geometry:', error)
    }
    
    // Final fallback
    // console.log('🔧 DuctEditor - Using default tierCount: 2')
    return [1, 2]
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