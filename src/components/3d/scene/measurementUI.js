/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'

/**
 * Measurement Controls Panel Component
 */
export function MeasurementControlsPanel({ 
  isMeasurementActive, 
  axisLock, 
  onAxisToggle, 
  onClearMeasurements 
}) {
  if (!isMeasurementActive) {
    return null
  }

  return (
    <div className="measurement-controls-panel" style={{
      position: 'absolute',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #E1E8ED',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backdropFilter: 'blur(8px)',
      minWidth: '260px'
    }}>
      <div style={{ 
        fontSize: '13px', 
        fontWeight: '600', 
        marginBottom: '8px', 
        color: '#2C3E50', 
        textAlign: 'center' 
      }}>
        Measurement Controls
      </div>
      
      {/* Axis Lock Section */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '500', 
          marginBottom: '4px', 
          color: '#555', 
          textAlign: 'center' 
        }}>
          Axis Lock:
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          justifyContent: 'center', 
          marginBottom: '8px' 
        }}>
          {['X', 'Y', 'Z'].map(axis => (
            <button
              key={axis}
              onClick={() => onAxisToggle(axis.toLowerCase())}
              style={{
                width: '30px',
                height: '30px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: axisLock[axis.toLowerCase()] ? '#00D4FF' : 'white',
                color: axisLock[axis.toLowerCase()] ? 'white' : '#333',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '12px',
                borderColor: axisLock[axis.toLowerCase()] ? '#00D4FF' : '#ddd'
              }}
            >
              {axis}
            </button>
          ))}
        </div>
        
        {/* Clear Button */}
        <div style={{ textAlign: 'center' }}>
          <ClearMeasurementsButton onClear={onClearMeasurements} />
        </div>
      </div>
    </div>
  )
}

/**
 * Clear Measurements Button Component
 */
function ClearMeasurementsButton({ onClear }) {
  return (
    <button
      onClick={onClear}
      style={{
        padding: '6px 12px',
        border: '1px solid #ff4444',
        borderRadius: '4px',
        background: 'white',
        color: '#ff4444',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '11px'
      }}
      onMouseOver={(e) => {
        e.target.style.background = '#ff4444'
        e.target.style.color = 'white'
      }}
      onMouseOut={(e) => {
        e.target.style.background = 'white'
        e.target.style.color = '#ff4444'
      }}
    >
      Clear All
    </button>
  )
}