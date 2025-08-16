/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { deleteTradeRackConfiguration, syncManifestWithLocalStorage, getProjectManifest } from '../../utils/projectManifest'
import { calculateTotalHeight } from '../../types/tradeRack'
import './app-saved-configurations.css'

const AppSavedConfigurations = (props) => {
  const [savedConfigs, setSavedConfigs] = useState([])
  const [activeConfigId, setActiveConfigId] = useState(null)

  // Load saved configurations from localStorage on mount and when refreshTrigger changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradeRackConfigurations')
      if (saved) {
        setSavedConfigs(JSON.parse(saved))
      } else {
        setSavedConfigs([])
      }
      
      // Get active configuration ID from manifest
      const manifest = getProjectManifest()
      setActiveConfigId(manifest.tradeRacks.activeConfigurationId)
    } catch (error) {
      console.error('Error loading saved configurations:', error)
      setSavedConfigs([])
    }
  }, [props.refreshTrigger])

  const handleConfigClick = (config) => {
    if (props.onRestoreConfiguration) {
      props.onRestoreConfiguration(config)
      setActiveConfigId(config.id) // Update local state immediately for better UX
    }
  }

  const handleDeleteConfig = (configId, event) => {
    event.stopPropagation() // Prevent triggering the card click
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId)
    setSavedConfigs(updatedConfigs)
    
    try {
      // Update localStorage
      localStorage.setItem('tradeRackConfigurations', JSON.stringify(updatedConfigs))
      
      // Update manifest by syncing with localStorage (this ensures consistency)
      syncManifestWithLocalStorage()
    } catch (error) {
      console.error('Error saving configurations:', error)
    }
  }

  const formatDimension = (dimension) => {
    // Handle null, undefined, or falsy values
    if (!dimension) return '0.0\''
    
    // Handle numeric values
    if (typeof dimension === 'number') {
      return `${dimension.toFixed(1)}'`
    }
    
    // Handle object with feet/inches properties
    if (typeof dimension === 'object' && dimension !== null) {
      const feet = dimension.feet || 0
      const inches = dimension.inches || 0
      
      // Ensure both values are numbers
      if (typeof feet === 'number' && typeof inches === 'number') {
        return `${feet}'${inches.toFixed(1)}"`
      }
    }
    
    // Fallback for any other case
    return '0.0\''
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Generate a color for each configuration based on its index
  const getConfigColor = (index) => {
    const colors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#E91E63'  // Pink
    ]
    return colors[index % colors.length]
  }

  return (
    <div className={`app-saved-configurations-container ${props.rootClassName}`}>
      <div className="app-saved-configurations-heading">
        <div className="app-saved-configurations-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="app-saved-configurations-icon"
          >
            <path
              d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V6h10v3z"
              fill="currentColor"
            />
          </svg>
          <h1 className="heading">Saved Configurations</h1>
        </div>
      </div>

      <div className="app-saved-configurations-content">
        {savedConfigs.length === 0 ? (
          <div className="app-saved-configurations-empty">
            <p className="app-saved-configurations-empty-text">
              No saved configurations yet. Save a rack configuration to see it here.
            </p>
          </div>
        ) : (
          <div className="app-saved-configurations-list">
            {savedConfigs.map((config, index) => (
              <div
                key={config.id}
                className={`app-saved-configurations-card ${activeConfigId === config.id ? 'active' : ''}`}
                onClick={() => handleConfigClick(config)}
              >
                <div className="app-saved-configurations-card-header">
                  <h3 className="app-saved-configurations-card-title">
                    {config.name || `Rack Configuration ${config.id}`}
                  </h3>
                  <div className="app-saved-configurations-card-status">
                    <div 
                      className="app-saved-configurations-status-circle"
                      style={{ 
                        backgroundColor: getConfigColor(index),
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {activeConfigId === config.id && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          className="app-saved-configurations-tick-icon"
                        >
                          <path
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                            fill="white"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="app-saved-configurations-card-details">
                  <div className="app-saved-configurations-detail-row">
                    <span className="app-saved-configurations-detail-label">
                      {formatDimension(config.rackLength || config.bayWidth)} × {formatDimension(config.rackWidth || config.depth)} × {config.tierCount || 1} tiers
                    </span>
                  </div>
                  <div className="app-saved-configurations-detail-row">
                    <span className="app-saved-configurations-detail-label">
                      Total height: {(() => {
                        try {
                          const height = config.totalHeight || calculateTotalHeight(config) || 0
                          return typeof height === 'number' ? height.toFixed(1) : '0.0'
                        } catch (error) {
                          return '0.0'
                        }
                      })()}'
                    </span>
                  </div>
                </div>

                <div className="app-saved-configurations-card-footer">
                  <div className="app-saved-configurations-mount-type">
                    <span className="app-saved-configurations-mount-badge">
                      {config.mountType === 'deck' ? 'Deck' : 'Floor'} mounted
                    </span>
                  </div>
                  <div className="app-saved-configurations-date">
                    <span className="app-saved-configurations-date-text">
                      Saved {formatDate(config.savedAt)}
                    </span>
                  </div>
                  <button
                    className="app-saved-configurations-delete-btn"
                    onClick={(e) => handleDeleteConfig(config.id, e)}
                    title="Delete configuration"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

AppSavedConfigurations.defaultProps = {
  rootClassName: '',
  onRestoreConfiguration: () => {},
  refreshTrigger: 0,
}

AppSavedConfigurations.propTypes = {
  rootClassName: PropTypes.string,
  onRestoreConfiguration: PropTypes.func,
  refreshTrigger: PropTypes.number,
}

export default AppSavedConfigurations