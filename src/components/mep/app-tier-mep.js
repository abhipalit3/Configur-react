/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './app-tier-mep.css'

const AppTierMEP = (props) => {
  const { mepItems = [], onRemoveItem, onItemClick, onColorChange, onToggleAddMEP, onDeleteAll } = props
  const [searchTerm, setSearchTerm] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(null) // Track which item's color picker is open
  const [collapsedSections, setCollapsedSections] = useState({}) // Track which tier sections are collapsed
  
  // Color palette options
  const colorPalette = [
    { name: 'Pink', value: '#d05e8f' },
    { name: 'Blue', value: '#4A90E2' },
    { name: 'Green', value: '#27AE60' },
    { name: 'Orange', value: '#E67E22' },
    { name: 'Red', value: '#E74C3C' },
    { name: 'Purple', value: '#9B59B6' },
    { name: 'Teal', value: '#1ABC9C' },
    { name: 'Gray', value: '#95A5A6' },
    { name: 'Dark Blue', value: '#2C3E50' },
    { name: 'Lime', value: '#2ECC71' },
    { name: 'Yellow', value: '#F1C40F' },
    { name: 'Deep Orange', value: '#D35400' },
    { name: 'Maroon', value: '#8E44AD' },
    { name: 'Cyan', value: '#3498DB' },
    { name: 'Brown', value: '#A0522D' },
    { name: 'Black', value: '#34495E' }
  ]

  // Handle click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any color picker
      if (!event.target.closest('.color-picker-container')) {
        setShowColorPicker(null)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showColorPicker])

  // Position color picker dropdown dynamically
  const positionColorPicker = (buttonElement, dropdownElement) => {
    if (!buttonElement || !dropdownElement) return
    
    const buttonRect = buttonElement.getBoundingClientRect()
    const dropdownHeight = 120 // Approximate height of the dropdown
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    
    // Position dropdown below if there's enough space, otherwise above
    if (spaceBelow >= dropdownHeight + 10) {
      // Position below
      dropdownElement.style.top = `${buttonRect.bottom + 4}px`
    } else if (spaceAbove >= dropdownHeight + 10) {
      // Position above
      dropdownElement.style.top = `${buttonRect.top - dropdownHeight - 4}px`
    } else {
      // If no space, position it in the center of viewport
      dropdownElement.style.top = `${(viewportHeight - dropdownHeight) / 2}px`
    }
    
    dropdownElement.style.left = `${buttonRect.left}px`
  }

  // Display text per item with detailed information (no tier info since it's shown in sections)
  function getItemDisplayText(item) {
    if (!item || typeof item !== 'object') return ''

    if (item.type === 'duct') {
      const name = item.name || 'Duct'
      const w = item.width ?? 0
      const h = item.height ?? 0
      const insulation = item.insulation ?? 0
      const insulationText = insulation > 0 ? ` | Ins: ${insulation}"` : ''
      return `${name} - ${w}" x ${h}"${insulationText}`
    }

    if (item.type === 'pipe') {
      const name = item.name || 'Pipe'
      const typ = item.pipeType || 'Pipe'
      const dia = item.diameter ?? 0
      const insulation = item.insulation ?? 0
      const insulationText = insulation > 0 ? ` | Ins: ${insulation}"` : ''
      return `Pipe - ${name} - ${typ} ${dia}" Ø${insulationText}`
    }

    if (item.type === 'conduit') {
      const name = item.name || 'Conduit'
      const typ = item.conduitType || 'EMT'
      const dia = item.diameter ?? 0
      const count = item.count ?? 1
      return `Conduits - ${name} - ${typ} - ${dia}" x ${count}`
    }

    if (item.type === 'cableTray') {
      const name = item.name || 'Cable Tray'
      const w = item.width ?? 0
      const h = item.height ?? 0
      const trayType = item.trayType || 'ladder'
      return `${name} - ${trayType} - ${w}" x ${h}"`
    }

    return ''
  }

  // Get the number of tiers available from rack parameters or geometry
  const getAvailableTiers = () => {
    try {
      // Try to get from ductwork renderer geometry first
      if (window.ductworkRendererInstance?.snapLineManager) {
        const snapLines = window.ductworkRendererInstance.snapLineManager.getSnapLinesFromRackGeometry()
        const allHorizontalLines = snapLines.horizontal.sort((a, b) => b.y - a.y)
        const allBeamPositions = [...allHorizontalLines].map(b => b.y).sort((a, b) => b - a)
        
        const tierSpaces = []
        const minTierHeight = 0.3
        
        for (let i = 0; i < allBeamPositions.length - 1; i++) {
          const topY = allBeamPositions[i]
          const bottomY = allBeamPositions[i + 1]
          const gap = topY - bottomY
          
          if (gap >= minTierHeight) {
            tierSpaces.push(tierSpaces.length + 1)
          }
        }
        
        if (tierSpaces.length > 0) {
          return tierSpaces
        }
      }
      
      // Fallback to localStorage
      const rackParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      if (rackParams.tierCount && rackParams.tierCount > 0) {
        return Array.from({ length: rackParams.tierCount }, (_, i) => i + 1)
      }
    } catch (error) {
      console.error('Error getting available tiers:', error)
    }
    
    // Default fallback
    return [1, 2]
  }

  // Group items by tier
  const groupItemsByTier = () => {
    const availableTiers = getAvailableTiers()
    const tierGroups = {}
    
    // Initialize tier groups
    availableTiers.forEach(tierNum => {
      tierGroups[`Tier ${tierNum}`] = []
    })
    tierGroups['No Tier'] = []
    tierGroups['Above Rack'] = []
    tierGroups['Below Rack'] = []
    
    // Filter and group items
    const searchLower = searchTerm.toLowerCase()
    
    mepItems.forEach(item => {
      // Apply search filter
      const itemText = (getItemDisplayText(item) || '').toLowerCase()
      if (searchTerm && !itemText.includes(searchLower)) {
        return // Skip items that don't match search
      }
      
      // Group by tier
      if (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit' || item.type === 'cableTray') {
        const tierKey = item.tierName || 'No Tier'
        if (tierGroups[tierKey]) {
          tierGroups[tierKey].push(item)
        } else {
          // Handle any unexpected tier names
          tierGroups['No Tier'].push(item)
        }
      } else {
        // Non-MEP items go to a general section
        if (!tierGroups['Other MEP']) {
          tierGroups['Other MEP'] = []
        }
        tierGroups['Other MEP'].push(item)
      }
    })
    
    return tierGroups
  }

  const tierGroups = groupItemsByTier()

  // Toggle section collapse
  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  // Handle delete all MEP items
  const handleDeleteAll = () => {
    if (mepItems.length === 0) {
      alert('No MEP elements to delete.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all MEP elements? This will remove ${mepItems.length} item(s) and cannot be undone.`
    )
    
    if (confirmed && onDeleteAll) {
      onDeleteAll()
    }
  }

  return (
    <div className={`mep-panel-container ${props.rootClassName} `}>
      <div className="mep-panel-header">
        <input
          type="text"
          placeholder="Search MEP items..."
          className="mep-search-input input-form"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mep-items-scroll-container">
        {mepItems.length === 0 ? (
          <div className="mep-item-row">
            <span className="mep-item-text">No MEP items added yet</span>
          </div>
        ) : (
          Object.keys(tierGroups).map((sectionName, index) => {
            const sectionItems = tierGroups[sectionName]
            const isCollapsed = collapsedSections[sectionName]
            const hasItems = sectionItems.length > 0
            
            // Don't show empty sections except for tiers
            if (!hasItems && !sectionName.startsWith('Tier ')) {
              return null
            }
            
            return (
              <div key={sectionName} className="tier-section">
                {/* Top separator line - only for sections after the first */}
                {index > 0 && (
                  <div className="tier-section-separator" />
                )}
                
                {/* Section Header with built-in bottom border */}
                <div
                  className="tier-section-header"
                >
                  <span>{sectionName} ({sectionItems.length})</span>
                </div>
                
                {/* Section Content - Same styling as original items */}
                {hasItems && (
                  <div className="tier-section-content">
                    {sectionItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`mep-item-row ${(item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit' || item.type === 'cableTray') ? 'clickable' : ''}`}
                      >
                        {/* Color Picker for Ducts */}
                        {item.type === 'duct' && (
                          <div className="color-picker-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              className="color-picker-button"
                              style={{
                                background: item.color || '#d05e8f'
                              }}
                              title="Change duct color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div 
                                className="color-picker-dropdown"
                                ref={(dropdown) => {
                                  if (dropdown) {
                                    const button = dropdown.previousElementSibling
                                    positionColorPicker(button, dropdown)
                                  }
                                }}
                              >
                                {colorPalette.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onColorChange) {
                                        onColorChange(item.id, color.value)
                                      }
                                      setShowColorPicker(null)
                                    }}
                                    className={`color-picker-option ${(item.color || '#d05e8f') === color.value ? 'selected' : ''}`}
                                    style={{
                                      background: color.value
                                    }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Color Picker for Pipes */}
                        {item.type === 'pipe' && (
                          <div className="color-picker-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              className="color-picker-button"
                              style={{
                                background: item.color || (item.pipeType === 'copper' ? '#B87333' : item.pipeType === 'pvc' ? '#F5F5F5' : '#708090')
                              }}
                              title="Change pipe color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div 
                                className="color-picker-dropdown"
                                ref={(dropdown) => {
                                  if (dropdown) {
                                    const button = dropdown.previousElementSibling
                                    positionColorPicker(button, dropdown)
                                  }
                                }}
                              >
                                {colorPalette.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onColorChange) {
                                        onColorChange(item.id, color.value)
                                      }
                                      setShowColorPicker(null)
                                    }}
                                    className="color-picker-option"
                                    style={{
                                      background: color.value
                                    }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Color Picker for Conduits */}
                        {item.type === 'conduit' && (
                          <div className="color-picker-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              className="color-picker-button"
                              style={{
                                background: item.color || (item.conduitType === 'EMT' ? '#C0C0C0' : item.conduitType === 'Rigid' ? '#808080' : item.conduitType === 'PVC' ? '#F5F5F5' : '#FFD700')
                              }}
                              title="Change conduit color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div 
                                className="color-picker-dropdown"
                                ref={(dropdown) => {
                                  if (dropdown) {
                                    const button = dropdown.previousElementSibling
                                    positionColorPicker(button, dropdown)
                                  }
                                }}
                              >
                                {colorPalette.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onColorChange) {
                                        onColorChange(item.id, color.value)
                                      }
                                      setShowColorPicker(null)
                                    }}
                                    className="color-picker-option"
                                    style={{
                                      background: color.value
                                    }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Color Picker for Cable Trays */}
                        {item.type === 'cableTray' && (
                          <div className="color-picker-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              className="color-picker-button"
                              style={{
                                background: item.color || '#808080'
                              }}
                              title="Change cable tray color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div 
                                className="color-picker-dropdown"
                                ref={(dropdown) => {
                                  if (dropdown) {
                                    const button = dropdown.previousElementSibling
                                    positionColorPicker(button, dropdown)
                                  }
                                }}
                              >
                                {colorPalette.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onColorChange) {
                                        onColorChange(item.id, color.value)
                                      }
                                      setShowColorPicker(null)
                                    }}
                                    className={`color-picker-option ${(item.color || '#808080') === color.value ? 'selected' : ''}`}
                                    style={{
                                      background: color.value
                                    }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <span 
                          className="mep-item-text" 
                          onClick={() => {
                            if ((item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit' || item.type === 'cableTray') && onItemClick) {
                              onItemClick(item)
                            }
                          }}
                          className={`mep-item-text ${(item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit' || item.type === 'cableTray') ? 'clickable' : ''}`}
                        >
                          {getItemDisplayText(item)}
                        </span>
                        
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 32 32"
                          className="mep-item-remove-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveItem(item.id)
                          }}
                        >
                          <path
                            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Empty tier placeholder - Cleaner */}
                {!hasItems && sectionName.startsWith('Tier ') && (
                  <div className="tier-section-empty">
                    No MEP elements in this tier
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mep-panel-footer">
        <span className="mep-item-count">
          Total items: {mepItems.length}
        </span>

        <button
          className="mep-add-button"
          onClick={() => {
            if (onToggleAddMEP) {
              onToggleAddMEP()
            }
          }}
        >
          <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
            className="mep-add-icon"
          >
            <path
              fill="currentColor"
              d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"
            />
          </svg>
        </button>

        <button
          className="mep-delete-all-button"
          onClick={handleDeleteAll}
          title={`Delete all ${mepItems.length} MEP element(s)`}
        >
          <svg
            height="14"
            width="14"
            viewBox="0 0 48 48"
            className="mep-delete-all-icon"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="4"
            >
              <path d="M9 10v34h30V10z"></path>
              <path strokeLinecap="round" d="M20 20v13m8-13v13M4 10h40"></path>
              <path d="m16 10 3.289-6h9.488L32 10z"></path>
            </g>
          </svg>
        </button>
      </div>
    </div>
  )
}

AppTierMEP.defaultProps = {
  rootClassName: '',
  mepItems: [],
  onRemoveItem: () => {},
  onItemClick: () => {},
  onColorChange: () => {},
  onToggleAddMEP: () => {},
  onDeleteAll: () => {},
}

AppTierMEP.propTypes = {
  rootClassName: PropTypes.string,
  mepItems: PropTypes.array,
  onRemoveItem: PropTypes.func,
  onItemClick: PropTypes.func,
  onColorChange: PropTypes.func,
  onToggleAddMEP: PropTypes.func,
  onDeleteAll: PropTypes.func,
}

export default AppTierMEP
