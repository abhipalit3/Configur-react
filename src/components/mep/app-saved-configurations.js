/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getProjectManifest, setActiveConfiguration, updateTradeRackConfiguration, deleteTradeRackConfiguration, saveConfigurationToList } from '../../utils/projectManifest'
import { getRackTemporaryState } from '../../utils/temporaryState'
import { calculateTotalHeight } from '../../types/tradeRack'
import './app-saved-configurations.css'

const AppSavedConfigurations = (props) => {
  const [savedConfigs, setSavedConfigs] = useState([])
  const [activeConfigId, setActiveConfigId] = useState(null)
  const [configurationName, setConfigurationName] = useState('')
  const [editingConfigId, setEditingConfigId] = useState(null)
  const [editingName, setEditingName] = useState('')

  // Load saved configurations from manifest on mount and when refreshTrigger changes
  useEffect(() => {
    try {
      const manifest = getProjectManifest()
      const configs = manifest.tradeRacks?.configurations || []
      
      // Sort by updatedAt (if exists) or savedAt date, newest first
      const sortedConfigs = configs.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.savedAt)
        const dateB = new Date(b.updatedAt || b.savedAt)
        return dateB - dateA
      })
      setSavedConfigs(sortedConfigs)
      
      // Get active configuration ID from manifest
      setActiveConfigId(manifest.tradeRacks?.activeConfigurationId)
    } catch (error) {
      console.error('Error loading saved configurations:', error)
      setSavedConfigs([])
    }
  }, [props.refreshTrigger])

  const handleConfigClick = (config) => {
    console.log('🔧 CONFIG CLICK: Attempting to restore config:', JSON.stringify(config, null, 2))
    if (props.onRestoreConfiguration) {
      props.onRestoreConfiguration(config)
      setActiveConfigId(config.id) // Update local state immediately for better UX
    }
  }

  const handleSaveConfiguration = () => {
    if (!configurationName.trim()) {
      alert('Please enter a configuration name')
      return
    }
    
    // Get the current rack configuration from manifest
    const manifest = getProjectManifest()
    if (!manifest.tradeRacks?.active) {
      alert('No rack configuration to save. Please add a rack first.')
      return
    }
    
    let rackConfig = { ...manifest.tradeRacks.active }
    delete rackConfig.lastApplied // Remove metadata
    
    // Get current effective top clearance from temporary state if available
    try {
      const tempState = getRackTemporaryState()
      if (tempState.topClearance !== undefined) {
        // Update rackConfig with current effective top clearance
        rackConfig.topClearance = tempState.topClearance
        rackConfig.topClearanceInches = tempState.topClearanceInches
        console.log('🔧 Saving with current top clearance:', tempState.topClearance)
      }
    } catch (error) {
      console.warn('Could not retrieve current top clearance from temporary state:', error)
    }
    
    // Get current rack position from the scene if available
    let currentPosition = null
    try {
      // Try to get position from the current rack in scene
      console.log('🔧 SAVE CONFIG: Checking for tradeRackInteractionInstance:', !!window.tradeRackInteractionInstance)
      if (window.tradeRackInteractionInstance) {
        currentPosition = window.tradeRackInteractionInstance.getCurrentRackPosition()
        console.log('🔧 SAVE CONFIG: Got position from interaction:', currentPosition)
      }
      
      // Fallback: check for existing position in manifest active config
      if (!currentPosition && rackConfig.position) {
        currentPosition = rackConfig.position
      }
    } catch (error) {
      console.warn('Could not retrieve current rack position:', error)
    }
    
    // Clean up the config and use only one position field
    const { currentPosition: oldPosition, ...cleanRackConfig } = rackConfig
    
    const newConfig = {
      ...cleanRackConfig,
      id: Date.now(),
      name: configurationName.trim(),
      savedAt: new Date().toISOString(),
      totalHeight: calculateTotalHeight(rackConfig),
      // Use current position from scene, fallback to old position
      position: currentPosition || oldPosition || { x: 0, y: 0, z: 0 }
    }
    
    console.log('🔧 SAVE CONFIG DEBUG:')
    console.log('- rackConfig:', rackConfig)
    console.log('- currentPosition:', currentPosition)
    console.log('- newConfig.position:', newConfig.position)
    console.log('- newConfig.topClearance:', newConfig.topClearance)
    
    
    // Add new config at the beginning so newest is first
    const updatedConfigs = [newConfig, ...savedConfigs]
    setSavedConfigs(updatedConfigs)
    
    try {
      console.log('🔧 SAVE CONFIG: Saving to manifest:', JSON.stringify(newConfig, null, 2))
      
      // Save to configurations list only (no active config update)
      saveConfigurationToList(newConfig)
      console.log('🔧 SAVE CONFIG: Configuration saved to list only')
      
      // Clear the name input after saving
      setConfigurationName('')
      
      // Notify parent component if callback exists
      if (props.onConfigurationSaved) {
        props.onConfigurationSaved(newConfig)
}
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  const handleUpdateConfig = (configId, event) => {
    event.stopPropagation() // Prevent triggering the card click
    
    // Get the current rack configuration from localStorage (the actual scene state)
    const currentRackParams = localStorage.getItem('rackParameters')
    if (!currentRackParams) {
      alert('No rack configuration in scene to update with.')
      return
    }
    
    let rackConfig = JSON.parse(currentRackParams)
    
    // Get current effective top clearance from temporary state if available
    try {
      const tempStateStr = localStorage.getItem('rackTemporaryState')
      if (tempStateStr) {
        const tempState = JSON.parse(tempStateStr)
        if (tempState.topClearance !== undefined) {
          // Update rackConfig with current effective top clearance
          rackConfig.topClearance = tempState.topClearance
          rackConfig.topClearanceInches = tempState.topClearanceInches
          console.log('🔧 Updated rackConfig with current top clearance:', tempState.topClearance)
        }
      }
    } catch (error) {
      console.warn('Could not retrieve current top clearance from temporary state:', error)
    }
    
    // Find the existing configuration
    const configIndex = savedConfigs.findIndex(config => config.id === configId)
    if (configIndex === -1) {
      alert('Configuration not found.')
      return
    }
    
    const existingConfig = savedConfigs[configIndex]
    
    // Confirm update
    if (!window.confirm(`Update "${existingConfig.name}" with the current rack configuration?`)) {
      return
    }
    
    // Get current rack position from the scene if available
    let currentPosition = null
    try {
      // Try to get position from the current rack in scene
      if (window.tradeRackInteractionInstance) {
        currentPosition = window.tradeRackInteractionInstance.getCurrentRackPosition()
      }
      
      // Fallback: check for existing position in stored racks or keep existing position
      if (!currentPosition) {
        const storedRacks = JSON.parse(localStorage.getItem('configurTradeRacks') || '[]')
        if (storedRacks.length > 0) {
          // Get the most recent rack position
          const latestRack = storedRacks[storedRacks.length - 1]
          if (latestRack.position) {
            currentPosition = latestRack.position
          }
        }
        
        // If still no position, preserve the existing config's position
        if (!currentPosition && existingConfig.position) {
          currentPosition = existingConfig.position
        }
      }
    } catch (error) {
      console.warn('Could not retrieve current rack position for update:', error)
      // Preserve existing position if available
      if (existingConfig.position) {
        currentPosition = existingConfig.position
      }
    }

    // Create updated configuration preserving original metadata
    const updatedConfig = {
      ...rackConfig,
      id: existingConfig.id,
      name: existingConfig.name,
      savedAt: existingConfig.savedAt, // Keep original save time
      updatedAt: new Date().toISOString(), // Add update timestamp
      totalHeight: calculateTotalHeight(rackConfig),
      // Include position if available
      ...(currentPosition && { position: currentPosition })
    }
    
    // Update the configuration in the array
    const updatedConfigs = [...savedConfigs]
    updatedConfigs[configIndex] = updatedConfig
    
    // Sort to maintain newest first order
    const sortedConfigs = updatedConfigs.sort((a, b) => {
      // Sort by updatedAt if it exists, otherwise by savedAt
      const dateA = new Date(a.updatedAt || a.savedAt)
      const dateB = new Date(b.updatedAt || b.savedAt)
      return dateB - dateA
    })
    
    setSavedConfigs(sortedConfigs)
    
    try {
      // Update manifest with updated configuration
      updateTradeRackConfiguration(updatedConfig, false)
      
      // If this was the active configuration, update it
      if (activeConfigId === configId) {
        setActiveConfiguration(configId)
      }
    } catch (error) {
      console.error('Error updating configuration:', error)
      alert('Failed to update configuration. Please try again.')
    }
  }

  const handleStartRename = (config, event) => {
    event.stopPropagation()
    setEditingConfigId(config.id)
    setEditingName(config.name)
  }

  const handleCancelRename = () => {
    setEditingConfigId(null)
    setEditingName('')
  }

  const handleSaveRename = (configId) => {
    if (!editingName.trim()) {
      alert('Configuration name cannot be empty')
      return
    }

    // Find the configuration to rename
    const configIndex = savedConfigs.findIndex(config => config.id === configId)
    if (configIndex === -1) {
      alert('Configuration not found.')
      return
    }

    // Update the configuration with new name
    const updatedConfigs = [...savedConfigs]
    updatedConfigs[configIndex] = {
      ...updatedConfigs[configIndex],
      name: editingName.trim(),
      updatedAt: new Date().toISOString()
    }

    // Sort to maintain order
    const sortedConfigs = updatedConfigs.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.savedAt)
      const dateB = new Date(b.updatedAt || b.savedAt)
      return dateB - dateA
    })

    setSavedConfigs(sortedConfigs)

    try {
      const manifest = getProjectManifest()
      const configIndex = manifest.tradeRacks.configurations.findIndex(config => config.id === configId)
      if (configIndex !== -1) {
        manifest.tradeRacks.configurations[configIndex].name = editingName.trim()
        manifest.tradeRacks.configurations[configIndex].updatedAt = new Date().toISOString()
        
        // Save updated manifest
        require('../../utils/projectManifest').saveProjectManifest(manifest)
        
        // Update local state
        const sortedConfigs = [...manifest.tradeRacks.configurations].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.savedAt)
          const dateB = new Date(b.updatedAt || b.savedAt)
          return dateB - dateA
        })
        setSavedConfigs(sortedConfigs)
        
        // Clear editing state
        setEditingConfigId(null)
        setEditingName('')
      }
    } catch (error) {
      console.error('Error renaming configuration:', error)
      alert('Failed to rename configuration. Please try again.')
    }
  }

  const handleDeleteConfig = (configId, event) => {
    event.stopPropagation() // Prevent triggering the card click
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId)
    setSavedConfigs(updatedConfigs)
    
    try {
      // Delete configuration from manifest
      deleteTradeRackConfiguration(configId)
    } catch (error) {
      console.error('Error deleting configuration:', error)
    }
  }

  const formatDimension = (dimension) => {
    if (!dimension) return "0'"
    if (typeof dimension === 'number') return `${dimension}'`
    return `${dimension.feet}'${dimension.inches}"`
  }

  const formatTopClearance = (topClearance) => {
    if (!topClearance) return "0'"
    if (typeof topClearance === 'number') {
      const feet = Math.floor(topClearance)
      const inches = Math.round((topClearance - feet) * 12)
      if (inches === 0) return `${feet}'`
      if (inches === 12) return `${feet + 1}'`
      return `${feet}'${inches}"`
    }
    if (topClearance.feet === 0 && topClearance.inches === 0) return "0'"
    return `${topClearance.feet}'${topClearance.inches || 0}"`
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

      {/* Save Configuration Section */}
      <div className="app-saved-configurations-save-section">
        <div className="app-saved-configurations-save-input-group">
          <input
            type="text"
            placeholder="Enter configuration name..."
            value={configurationName}
            onChange={(e) => setConfigurationName(e.target.value)}
            className="app-saved-configurations-name-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveConfiguration()
              }
            }}
          />
          <button
            type="button"
            onClick={handleSaveConfiguration}
            className="app-saved-configurations-save-btn"
            disabled={!configurationName.trim()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V6h10v3z"/>
            </svg>
            Save Configuration
          </button>
        </div>
      </div>

      <div className="app-saved-configurations-content">
        {savedConfigs.length === 0 ? (
          <div className="app-saved-configurations-empty">
            <p className="app-saved-configurations-empty-text">
              No saved configurations yet. Add a rack and save the configuration to see it here.
            </p>
          </div>
        ) : (
          <div className="app-saved-configurations-list">
            {savedConfigs
              .sort((a, b) => {
                // Sort by updatedAt if it exists, otherwise by savedAt
                const dateA = new Date(a.updatedAt || a.savedAt)
                const dateB = new Date(b.updatedAt || b.savedAt)
                return dateB - dateA
              })
              .map((config, index) => (
              <div
                key={config.id}
                className={`app-saved-configurations-card ${activeConfigId === config.id ? 'active' : ''}`}
                onClick={() => handleConfigClick(config)}
              >
                <div className="app-saved-configurations-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {editingConfigId === config.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: 'calc(100% - 30px)' }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(config.id)
                          } else if (e.key === 'Escape') {
                            handleCancelRename()
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '14px',
                          fontWeight: 'normal',
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          flex: 1
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveRename(config.id)
                        }}
                        title="Save name"
                        style={{
                          background: '#4CAF50',
                          border: '1px solid #45a049',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '22px',
                          height: '22px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#45a049'
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#4CAF50'
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelRename()
                        }}
                        title="Cancel"
                        style={{
                          background: '#f44336',
                          border: '1px solid #d32f2f',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '22px',
                          height: '22px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#d32f2f'
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f44336'
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: 'calc(100% - 30px)' }}>
                      <h3 className="app-saved-configurations-card-title" style={{ margin: 0, fontSize: '14px', fontWeight: 'normal', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {config.name || `Rack Configuration ${config.id}`}
                      </h3>
                      <button
                        onClick={(e) => handleStartRename(config, e)}
                        title="Rename configuration"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.6,
                          transition: 'opacity 0.2s',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </div>
                  )}
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
                      {formatDimension(config.rackLength)} × {formatDimension(config.rackWidth)} × {config.tierCount} tiers
                    </span>
                  </div>
                  <div className="app-saved-configurations-detail-row">
                    <span className="app-saved-configurations-detail-label">
                      Total height: {config.totalHeight || calculateTotalHeight(config)}
                    </span>
                  </div>
                  <div className="app-saved-configurations-detail-row">
                    <span className="app-saved-configurations-detail-label">
                      Top clearance: {formatTopClearance(config.topClearance)}
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
                      {config.updatedAt ? `Updated ${formatDate(config.updatedAt)}` : `Saved ${formatDate(config.savedAt)}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="app-saved-configurations-update-btn"
                      onClick={(e) => handleUpdateConfig(config.id, e)}
                      title="Update configuration with current rack"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                      </svg>
                    </button>
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
  onConfigurationSaved: () => {},
}

AppSavedConfigurations.propTypes = {
  rootClassName: PropTypes.string,
  onRestoreConfiguration: PropTypes.func,
  refreshTrigger: PropTypes.number,
  onConfigurationSaved: PropTypes.func,
}

export default AppSavedConfigurations