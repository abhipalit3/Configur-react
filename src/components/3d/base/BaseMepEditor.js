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
 * Base MEP Editor Component
 * Provides common editor functionality for all MEP types
 */
export const BaseMepEditor = ({
  selectedObject,
  camera,
  renderer,
  onSave,
  onCancel,
  onCopy,
  visible = true,
  mepType = 'mep',
  fields = [],
  getInitialDimensions,
  getOffsetY = () => 0.3,
  minWidth = '400px'
}) => {
  const [dimensions, setDimensions] = useState(() => getInitialDimensions(selectedObject))
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [forceUpdate, setForceUpdate] = useState(0)
  const editorRef = useRef(null)
  const mountedRef = useRef(true)

  // Update dimensions when selected object changes
  useEffect(() => {
    if (selectedObject?.userData?.[`${mepType}Data`]) {
      const newDimensions = getInitialDimensions(selectedObject)
      console.log(`✅ ${mepType} editor: Loading properties:`, newDimensions)
      console.log(`✅ ${mepType} editor: Object userData:`, selectedObject.userData)
      setDimensions(newDimensions)
    } else {
      console.warn(`⚠️ ${mepType} editor: No data found, using defaults`)
      console.log(`⚠️ ${mepType} editor: Object userData:`, selectedObject?.userData)
      console.log(`⚠️ ${mepType} editor: Expected key:`, `${mepType}Data`)
    }
  }, [selectedObject, mepType])

  // Update screen position
  useEffect(() => {
    if (!selectedObject || !camera || !renderer || !visible) return

    const updatePosition = () => {
      const offset = getOffsetY(selectedObject)
      const screenPos = calculateScreenPosition(selectedObject, camera, renderer, offset)
      if (screenPos && mountedRef.current) {
        setPosition(screenPos)
      }
    }

    updatePosition()
    const cleanup = createAnimationLoop(updatePosition, mountedRef)
    
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [selectedObject, camera, renderer, visible, forceUpdate, getOffsetY])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleFieldChange = (field, value, processor) => {
    // Handle tier changes specially
    if (field === 'tier') {
      handleTierChange(value)
      return
    }

    // Process the value if processor provided
    const processedValue = processor ? processor(value) : value
    
    // For number fields, always validate and convert
    const numValue = parseFloat(processedValue)
    if (!isNaN(numValue) && isFinite(numValue)) {
      const validValue = validateDimensionInput(field, numValue)
      if (validValue !== null) {
        setDimensions(prev => ({ ...prev, [field]: validValue }))
      }
    } else if (typeof processedValue === 'string') {
      // For non-numeric values (like select options)
      setDimensions(prev => ({ ...prev, [field]: processedValue }))
    }
  }

  const handleTierChange = (newTier) => {
    const tierValue = validateDimensionInput('tier', newTier)
    if (tierValue === null) return
    
    setDimensions(prev => ({ ...prev, tier: tierValue }))
    
    // Update object position based on tier
    // Map mepType to actual window renderer instance names
    const rendererInstanceMap = {
      'duct': 'ductworkRendererInstance',
      'pipe': 'pipingRendererInstance', 
      'conduit': 'conduitRendererInstance',
      'cableTray': 'cableTrayRendererInstance'
    }
    
    const rendererInstanceName = rendererInstanceMap[mepType]
    if (selectedObject && rendererInstanceName && window[rendererInstanceName]) {
      const rendererInstance = window[rendererInstanceName]
      const objectData = selectedObject.userData[`${mepType}Data`]
      
      try {
        const snapLineManager = rendererInstance.snapLineManager
        const tierSpace = findTierSpace(snapLineManager, tierValue)
        
        if (tierSpace) {
          const dims = calculateObjectDimensions(objectData, mepType)
          const newYPosition = calculateTierYPosition(tierSpace, dims.height, 'bottom')
          
          selectedObject.position.y = newYPosition
          selectedObject.userData[`${mepType}Data`].tier = tierValue
          
          // Update measurements if interaction exists
          // Map mepType to actual interaction property names  
          const interactionMap = {
            'duct': 'ductInteraction',
            'pipe': 'pipeInteraction',
            'conduit': 'conduitInteraction', 
            'cableTray': 'cableTrayInteraction'
          }
          
          const interactionName = interactionMap[mepType]
          if (interactionName && rendererInstance[interactionName]) {
            const interaction = rendererInstance[interactionName]
            interaction.clearMeasurements?.()
            interaction.createMeasurements?.()
          }
          
          // Force position update
          setTimeout(() => {
            if (mountedRef.current) {
              setForceUpdate(prev => prev + 1)
            }
          }, 50)
        }
      } catch (error) {
        console.error(`❌ ${mepType} editor: Error updating tier:`, error)
      }
    } else {
      console.error(`❌ ${mepType} editor: No renderer instance found (looking for ${rendererInstanceName})`)
    }
  }

  // Helper to calculate object dimensions
  const calculateObjectDimensions = (objectData, type) => {
    switch (type) {
      case 'duct':
        return {
          height: (objectData.height || 8) * 0.0254 + (objectData.insulation || 0) * 2 * 0.0254,
          width: (objectData.width || 12) * 0.0254 + (objectData.insulation || 0) * 2 * 0.0254
        }
      case 'pipe':
        const diameter = (objectData.diameter || 2) * 0.0254
        const insulation = (objectData.insulation || 0) * 0.0254
        return {
          height: diameter + 2 * insulation,
          width: diameter + 2 * insulation
        }
      case 'conduit':
        const conduitDiam = (objectData.diameter || 1) * 0.0254
        return { height: conduitDiam, width: conduitDiam }
      case 'cableTray':
        return {
          height: (objectData.height || 4) * 0.0254,
          width: (objectData.width || 12) * 0.0254
        }
      default:
        return { height: 0.2, width: 0.3 }
    }
  }

  const getTierOptions = () => {
    // Map mepType to actual window renderer instance names
    const rendererInstanceMap = {
      'duct': 'ductworkRendererInstance',
      'pipe': 'pipingRendererInstance', 
      'conduit': 'conduitRendererInstance',
      'cableTray': 'cableTrayRendererInstance'
    }
    
    const rendererInstanceName = rendererInstanceMap[mepType]
    const snapLineManager = rendererInstanceName ? window[rendererInstanceName]?.snapLineManager : null
    return getTierOptionsFromGeometry(snapLineManager)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(dimensions)
    }
  }

  const handleCancel = () => {
    if (selectedObject?.userData?.[`${mepType}Data`]) {
      setDimensions(getInitialDimensions(selectedObject))
    }
    if (onCancel) {
      onCancel()
    }
  }

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy()
    }
  }

  const handleKeyDown = createEditorKeyHandler(handleSave, handleCancel)

  if (!visible || !selectedObject) return null

  return (
    <div
      ref={editorRef}
      style={{
        position: 'fixed',
        left: position.x - 200,
        top: position.y,
        zIndex: 10000,
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
        minWidth
      }}
    >
      {/* Render fields dynamically */}
      {fields.map((field) => {
        if (field.type === 'tier') {
          return (
            <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                minWidth: field.labelWidth || '40px'
              }}>
                {field.label}
              </span>
              <select
                value={dimensions[field.name]}
                onChange={(e) => handleFieldChange(field.name, e.target.value, field.processor)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 6px',
                  width: field.width || '50px',
                  outline: 'none'
                }}
              >
                {getTierOptions().map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>
          )
        }

        if (field.type === 'select') {
          return (
            <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                minWidth: field.labelWidth || '35px'
              }}>
                {field.label}
              </span>
              <select
                value={dimensions[field.name]}
                onChange={(e) => handleFieldChange(field.name, e.target.value, field.processor)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 6px',
                  width: field.width || '80px',
                  outline: 'none'
                }}
              >
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        if (field.type === 'number') {
          return (
            <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.8)',
                minWidth: field.labelWidth || '15px'
              }}>
                {field.label}
              </span>
              <input
                type="number"
                value={dimensions[field.name]}
                onChange={(e) => handleFieldChange(field.name, e.target.value, field.processor)}
                onKeyDown={handleKeyDown}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 6px',
                  textAlign: 'center',
                  width: field.width || '50px',
                  outline: 'none'
                }}
                step={field.step || '0.5'}
                min={field.min || '0'}
                max={field.max}
              />
            </div>
          )
        }

        return null
      })}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginLeft: '8px'
      }}>
        <button
          onClick={handleCopyClick}
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
          title={`Copy ${mepType}`}
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

export default BaseMepEditor