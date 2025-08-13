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
      const w = item.width ?? 0
      const h = item.height ?? 0
      return `Cable Tray - ${w}"x${h}"`
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
      if (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') {
        const tierKey = item.tierName || 'No Tier'
        if (tierGroups[tierKey]) {
          tierGroups[tierKey].push(item)
        } else {
          // Handle any unexpected tier names
          tierGroups['No Tier'].push(item)
        }
      } else {
        // Non-duct/pipe/conduit items go to a general section
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
    <div className={`app-tier-mep-container1 ${props.rootClassName} `}>
      <div className="app-tier-mep-heading">
        <input
          type="text"
          placeholder="Search MEP items..."
          className="app-tier-mep-textinput input-form"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="app-tier-mep-container2" style={{ padding: '0' }}>
        {mepItems.length === 0 ? (
          <div className="app-tier-mep-added-mep1">
            <span className="app-tier-mep-text10">No MEP items added yet</span>
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
                  <div style={{
                    height: '1px',
                    backgroundColor: '#e8e8e8',
                    margin: '6px 0',
                    width: '100%'
                  }} />
                )}
                
                {/* Section Header with built-in bottom border */}
                <div
                  className="tier-section-header"
                  style={{
                    padding: '4px 16px 6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#888',
                    backgroundColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #e8e8e8',
                    marginBottom: '2px'
                  }}
                >
                  <span>{sectionName} ({sectionItems.length})</span>
                </div>
                
                {/* Section Content - Same styling as original items */}
                {hasItems && (
                  <div className="tier-section-content" style={{ width: '100%', padding: '0' }}>
                    {sectionItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="app-tier-mep-added-mep1"
                        style={{
                          cursor: (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          position: 'relative',
                          width: '100%',
                          minWidth: 0, // Prevents flex items from overflowing
                          padding: '4px 16px', // Reduced padding for more compact look
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                          if (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') {
                            e.currentTarget.style.backgroundColor = '#f0f8ff'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        {/* Color Picker for Ducts */}
                        {item.type === 'duct' && (
                          <div className="color-picker-container" style={{ position: 'relative', marginRight: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '1px solid #ccc',
                                background: item.color || '#d05e8f',
                                cursor: 'pointer',
                                position: 'relative',
                                minWidth: '16px',
                                flexShrink: 0
                              }}
                              title="Change duct color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '0',
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                padding: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '4px',
                                zIndex: 1001,
                                minWidth: '120px'
                              }}>
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
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '3px',
                                      border: (item.color || '#d05e8f') === color.value ? '2px solid #333' : '1px solid #ccc',
                                      background: color.value,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
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
                          <div className="color-picker-container" style={{ position: 'relative', marginRight: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '1px solid #ccc',
                                background: item.color || (item.pipeType === 'copper' ? '#B87333' : item.pipeType === 'pvc' ? '#F5F5F5' : '#708090'),
                                cursor: 'pointer',
                                position: 'relative',
                                minWidth: '16px',
                                flexShrink: 0
                              }}
                              title="Change pipe color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '0',
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                padding: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '4px',
                                zIndex: 1001,
                                minWidth: '120px'
                              }}>
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
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '1px solid #ccc',
                                      borderRadius: '2px',
                                      background: color.value,
                                      cursor: 'pointer',
                                      fontSize: '0'
                                    }}
                                    title={color.name}
                                  >
                                    {color.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Color Picker for Conduits */}
                        {item.type === 'conduit' && (
                          <div className="color-picker-container" style={{ position: 'relative', marginRight: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowColorPicker(showColorPicker === item.id ? null : item.id)
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '1px solid #ccc',
                                background: item.color || (item.conduitType === 'EMT' ? '#C0C0C0' : item.conduitType === 'Rigid' ? '#808080' : item.conduitType === 'PVC' ? '#F5F5F5' : '#FFD700'),
                                cursor: 'pointer',
                                position: 'relative',
                                minWidth: '16px',
                                flexShrink: 0
                              }}
                              title="Change conduit color"
                            />
                            
                            {showColorPicker === item.id && (
                              <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '0',
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                padding: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '4px',
                                zIndex: 1001,
                                minWidth: '120px'
                              }}>
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
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '1px solid #ccc',
                                      borderRadius: '2px',
                                      background: color.value,
                                      cursor: 'pointer',
                                      fontSize: '0'
                                    }}
                                    title={color.name}
                                  >
                                    {color.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <span 
                          className="app-tier-mep-text10" 
                          onClick={() => {
                            if ((item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') && onItemClick) {
                              onItemClick(item)
                            }
                          }}
                          style={{ 
                            flex: 1, 
                            cursor: (item.type === 'duct' || item.type === 'pipe' || item.type === 'conduit') ? 'pointer' : 'default',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0 // Important for flexbox text truncation
                          }}
                        >
                          {getItemDisplayText(item)}
                        </span>
                        
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 32 32"
                          className="app-tier-mep-remove-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveItem(item.id)
                          }}
                          style={{
                            cursor: 'pointer',
                            minWidth: '16px',
                            flexShrink: 0,
                            marginLeft: '8px'
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
                  <div style={{ 
                    fontStyle: 'italic', 
                    color: '#bbb', 
                    fontSize: '11px',
                    padding: '6px 16px',
                    textAlign: 'center'
                  }}>
                    No MEP elements in this tier
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="app-tier-mep-title">
        <span style={{ fontSize: '11px', color: '#666', padding: '4px' }}>
          Total items: {mepItems.length}
        </span>

        <button
          className="app-tier-mep-plus-button"
          onClick={() => {
            if (onToggleAddMEP) {
              onToggleAddMEP()
            }
          }}
          style={{
            marginLeft: 'auto'
          }}
        >
          <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
            className="app-tier-mep-plus-icon"
          >
            <path
              fill="currentColor"
              d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"
            />
          </svg>
        </button>

        <button
          className="app-tier-mep-delete-all-button"
          onClick={handleDeleteAll}
          title={`Delete all ${mepItems.length} MEP element(s)`}
        >
          <svg
            height="14"
            width="14"
            viewBox="0 0 48 48"
            className="app-tier-mep-delete-all-icon"
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
