import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { deleteTradeRackConfiguration, syncManifestWithLocalStorage } from '../../utils/projectManifest'
import './app-saved-configurations.css'

const AppSavedConfigurations = (props) => {
  const [savedConfigs, setSavedConfigs] = useState([])

  // Load saved configurations from localStorage on mount and when refreshTrigger changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradeRackConfigurations')
      if (saved) {
        setSavedConfigs(JSON.parse(saved))
      } else {
        setSavedConfigs([])
      }
    } catch (error) {
      console.error('Error loading saved configurations:', error)
      setSavedConfigs([])
    }
  }, [props.refreshTrigger])

  const handleConfigClick = (config) => {
    if (props.onRestoreConfiguration) {
      props.onRestoreConfiguration(config)
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
    if (typeof dimension === 'number') return `${dimension}'`
    return `${dimension.feet}'${dimension.inches}"`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
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
            {savedConfigs.map((config) => (
              <div
                key={config.id}
                className="app-saved-configurations-card"
                onClick={() => handleConfigClick(config)}
              >
                <div className="app-saved-configurations-card-header">
                  <h3 className="app-saved-configurations-card-title">
                    {config.name || `Rack Configuration ${config.id}`}
                  </h3>
                  <div className="app-saved-configurations-card-status">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className="app-saved-configurations-status-icon"
                    >
                      <path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        fill="#4CAF50"
                      />
                    </svg>
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
                      Total height: {config.totalHeight || 'N/A'}
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
                      width="14"
                      height="14"
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