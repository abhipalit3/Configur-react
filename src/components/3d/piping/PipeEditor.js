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
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

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
  }, [selectedPipe, camera, renderer, visible])

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

  // Position the editor near the selected pipe
  const editorStyle = {
    position: 'fixed',
    left: `${position.x + 20}px`,
    top: `${position.y - 60}px`,
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
    gap: '12px',
    fontSize: '12px',
    minWidth: '400px'
  }

  const inputStyle = {
    width: '50px',
    padding: '4px 6px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '11px',
    textAlign: 'center'
  }

  const selectStyle = {
    ...inputStyle,
    width: '70px'
  }

  const colorInputStyle = {
    ...inputStyle,
    width: '60px',
    height: '24px',
    padding: '0',
    border: 'none'
  }

  const buttonStyle = {
    padding: '4px 8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    background: 'rgba(74, 144, 226, 0.8)',
    color: 'white',
    fontSize: '11px',
    cursor: 'pointer'
  }

  const cancelButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255, 68, 68, 0.8)'
  }

  return (
    <div ref={editorRef} style={editorStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '30px'
        }}>
          Ø
        </span>
        <input
          type="number"
          value={dimensions.diameter}
          onChange={(e) => handleDimensionChange('diameter', e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          step="0.1"
          min="0"
        />
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px' }}>in</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '30px'
        }}>
          Ins
        </span>
        <input
          type="number"
          value={dimensions.insulation}
          onChange={(e) => handleDimensionChange('insulation', e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          step="0.1"
          min="0"
        />
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '10px' }}>in</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '35px'
        }}>
          Type
        </span>
        <select
          value={dimensions.pipeType}
          onChange={(e) => handleStringChange('pipeType', e.target.value)}
          style={selectStyle}
        >
          <option value="copper">Copper</option>
          <option value="pvc">PVC</option>
          <option value="steel">Steel</option>
        </select>
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          minWidth: '30px'
        }}>
          Tier
        </span>
        <input
          type="number"
          value={dimensions.tier}
          onChange={(e) => handleDimensionChange('tier', e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          step="1"
          min="1"
          max={rackParams.tierCount || 10}
        />
      </div>

      <button onClick={handleSave} style={buttonStyle}>
        Save
      </button>
      <button onClick={handleCancel} style={cancelButtonStyle}>
        Cancel
      </button>
    </div>
  )
}