/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { tradeRackDefaults, convertToFeet, calculateBayConfiguration } from '../../types/tradeRack'
import './app-rack-properties.css'

const AppRackProperties = (props) => {
  // State for form data with defaults
  const [formData, setFormData] = useState({
    ...tradeRackDefaults,
    ...props.initial
  })
  
  const [errors, setErrors] = useState({})
  const [bayInfo, setBayInfo] = useState({ bayCount: 1, lastBayWidth: 3 })

  // Update form when initial props change
  useEffect(() => {
    // Preserve current position when opening properties panel
    const preservedPosition = props.initial?.currentPosition
    
    setFormData({
      ...tradeRackDefaults,
      ...props.initial,
      // Ensure we don't lose the current position when opening properties
      currentPosition: preservedPosition
    })
  }, [props.initial])

  // Calculate bay configuration when lengths change
  useEffect(() => {
    const config = calculateBayConfiguration(formData.rackLength, formData.bayWidth)
    setBayInfo(config)
  }, [formData.rackLength, formData.bayWidth])

  // Re-validate when form data changes
  useEffect(() => {
    const newErrors = {}
    
    // Helper function for conversion
    const convertToFeet = (feetInches) => {
      if (typeof feetInches === 'number') return feetInches;
      return feetInches.feet + (feetInches.inches / 12);
    }
    
    const rackLengthTotal = convertToFeet(formData.rackLength)
    const rackWidthTotal = convertToFeet(formData.rackWidth)  
    const bayWidthTotal = convertToFeet(formData.bayWidth)
    
    if (rackLengthTotal <= 0) newErrors.rackLength = 'Must be greater than 0'
    if (rackWidthTotal <= 0) newErrors.rackWidth = 'Must be greater than 0'
    if (bayWidthTotal <= 0) newErrors.bayWidth = 'Must be greater than 0'
    if (bayWidthTotal > rackLengthTotal) newErrors.bayWidth = 'Cannot exceed rack length'
    if (formData.tierCount < 1) newErrors.tierCount = 'Must have at least 1 tier'
    
    setErrors(newErrors)
  }, [formData])

  const validateForm = () => {
    const newErrors = {}
    
    const rackLengthTotal = convertToFeet(formData.rackLength)
    const rackWidthTotal = convertToFeet(formData.rackWidth)  
    const bayWidthTotal = convertToFeet(formData.bayWidth)
    
    if (rackLengthTotal <= 0) newErrors.rackLength = 'Must be greater than 0'
    if (rackWidthTotal <= 0) newErrors.rackWidth = 'Must be greater than 0'
    if (bayWidthTotal <= 0) newErrors.bayWidth = 'Must be greater than 0'
    if (bayWidthTotal > rackLengthTotal) newErrors.bayWidth = 'Cannot exceed rack length'
    if (formData.tierCount < 1) newErrors.tierCount = 'Must have at least 1 tier'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handler for feet+inches input changes
  const handleFeetInchesChange = (field, type, value) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: numValue
      }
    }))
  }

  const handleMountTypeChange = (type) => {
    setFormData(prev => ({ ...prev, mountType: type }))
    props.onMountTypeChange?.(type)
  }

  const handleTierCountChange = (event) => {
    const count = parseInt(event.target.value)
    setFormData(prev => {
      // Update tier heights array to match new count
      const newTierHeights = [...prev.tierHeights]
      while (newTierHeights.length < count) {
        newTierHeights.push({ feet: 2, inches: 0 }) // default height
      }
      newTierHeights.length = count // trim if needed
      
      return {
        ...prev,
        tierCount: count,
        tierHeights: newTierHeights
      }
    })
  }

  const handleTierHeightChange = (tierIndex, type, value) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => {
      const newTierHeights = [...prev.tierHeights]
      newTierHeights[tierIndex] = {
        ...newTierHeights[tierIndex],
        [type]: numValue
      }
      return {
        ...prev,
        tierHeights: newTierHeights
      }
    })
  }

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddRack = () => {
    if (validateForm() && props.onAddRack) {
      // Add calculated bay info to form data
      const rackData = {
        ...formData,
        calculatedBays: bayInfo,
        // Pass along the preserved position if it exists
        preservedPosition: formData.currentPosition
      }
      props.onAddRack(rackData)
    }
  }

  // Generate tier height inputs based on tier count
  const renderTierHeightInputs = () => {
    const tierInputs = []
    for (let i = 0; i < formData.tierCount; i++) {
      const tierHeight = formData.tierHeights[i] || { feet: 2, inches: 0 }
      tierInputs.push(
        <div key={i} className="app-rack-properties-tier-height">
          <span className="app-rack-properties-tier-label">Tier {i + 1}</span>
          <div className="app-rack-properties-tier-inputs">
            <div className="feet-inches-input">
              <input
                type="number"
                value={tierHeight.feet || 0}
                onChange={(e) => handleTierHeightChange(i, 'feet', e.target.value)}
                className="input-form"
                min="0"
                step="1"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={tierHeight.inches || 0}
                onChange={(e) => handleTierHeightChange(i, 'inches', e.target.value)}
                className="input-form"
                min="0"
                max="11"
                step="1"
                style={{ width: '80px', marginLeft: '8px' }}
              />
              <span className="unit-label">in</span>
            </div>
          </div>
        </div>
      )
    }
    return tierInputs
  }

  return (
    <div className={`app-rack-properties-container ${props.rootClassName} `}>
      <div className="app-rack-properties-heading">
        <h1 className="heading"> Trade Rack Properties</h1>
        <svg
          id="CloseButton"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-rack-properties-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      <div className="app-rack-properties-trade-rack">
        {/* Mount type: one always selected, default deck */}
        <div className="app-rack-properties-mount-type">
          <button
            type="button"
            aria-pressed={formData.mountType === 'deck'}
            className={`app-rack-properties-button1 save-button ${formData.mountType === 'deck' ? 'selected' : ''}`}
            onClick={() => handleMountTypeChange('deck')}
          >
            <span className="app-rack-properties-text11">Deck Mounted</span>
          </button>
          <button
            type="button"
            aria-pressed={formData.mountType === 'floor'}
            className={`app-rack-properties-button2 save-button ${formData.mountType === 'floor' ? 'selected' : ''}`}
            onClick={() => handleMountTypeChange('floor')}
          >
            <span className="app-rack-properties-text12">Floor Mounted</span>
          </button>
        </div>

        {/* Scrollable inputs container */}
        <div className="app-rack-properties-inputs">
          <div className="app-rack-properties-title1">
            <span className="title">Rack Length</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="The total length of the trade rack from end to end">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input1">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.rackLength ? formData.rackLength.feet : 0}
                onChange={(e) => handleFeetInchesChange('rackLength', 'feet', e.target.value)}
                className={`input-form ${errors.rackLength ? 'error' : ''}`}
                min="0"
                step="1"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.rackLength ? formData.rackLength.inches : 0}
                onChange={(e) => handleFeetInchesChange('rackLength', 'inches', e.target.value)}
                className={`input-form ${errors.rackLength ? 'error' : ''}`}
                min="0"
                max="11"
                step="1"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.rackLength && <span className="error-text">{errors.rackLength}</span>}
          </div>

          <div className="app-rack-properties-title2">
            <span className="title">Rack Width</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="The width of the trade rack from front to back">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input2">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.rackWidth ? formData.rackWidth.feet : 0}
                onChange={(e) => handleFeetInchesChange('rackWidth', 'feet', e.target.value)}
                className={`input-form ${errors.rackWidth ? 'error' : ''}`}
                min="0"
                step="1"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.rackWidth ? formData.rackWidth.inches : 0}
                onChange={(e) => handleFeetInchesChange('rackWidth', 'inches', e.target.value)}
                className={`input-form ${errors.rackWidth ? 'error' : ''}`}
                min="0"
                max="11"
                step="1"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.rackWidth && <span className="error-text">{errors.rackWidth}</span>}
          </div>

          {/* Bay Configuration Section */}
          <div className="app-rack-properties-title3">
            <span className="title">Bay Configuration</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="Configuration of structural bays that divide the rack lengthwise">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          
          {/* Bay Width Input */}
          <div className="app-rack-properties-title3-sub">
            <span className="title sub-title">Bay Width</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="The standard width of each structural bay along the rack length">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input3">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.bayWidth ? formData.bayWidth.feet : 0}
                onChange={(e) => handleFeetInchesChange('bayWidth', 'feet', e.target.value)}
                className={`input-form ${errors.bayWidth ? 'error' : ''}`}
                min="0"
                step="1"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.bayWidth ? formData.bayWidth.inches : 0}
                onChange={(e) => handleFeetInchesChange('bayWidth', 'inches', e.target.value)}
                className={`input-form ${errors.bayWidth ? 'error' : ''}`}
                min="0"
                max="11"
                step="1"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.bayWidth && <span className="error-text">{errors.bayWidth}</span>}
          </div>

          {/* Bay Configuration Result */}
          <div className="app-rack-properties-bay-display">
            <span className="app-rack-properties-bay-text">
              {bayInfo.bayCount} bay{bayInfo.bayCount !== 1 ? 's' : ''}
              {bayInfo.hasCustomLastBay && ` (last bay: ${bayInfo.lastBayWidth.toFixed(1)}ft)`}
            </span>
          </div>

          <div className="app-rack-properties-title7">
            <span className="title">Top Clearance</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="Distance between the top of the rack and the beam/joist above (0 = attached directly below beam)">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input7">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.topClearance?.feet ?? 0}
                onChange={(e) => handleFeetInchesChange('topClearance', 'feet', e.target.value)}
                className="input-form"
                min="0"
                step="1"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.topClearance?.inches ?? 0}
                onChange={(e) => handleFeetInchesChange('topClearance', 'inches', e.target.value)}
                className="input-form"
                min="0"
                max="11"
                step="1"
              />
              <span className="unit-label">in</span>
            </div>
          </div>

          <div className="app-rack-properties-title4">
            <span className="title">Number of Tiers</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="The number of horizontal levels in the trade rack for storing equipment">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input4">
            <select 
              id="TierCountSelect" 
              className="input-form"
              value={formData.tierCount}
              onChange={handleTierCountChange}
            >
              <option value="1">1 Tier</option>
              <option value="2">2 Tiers</option>
              <option value="3">3 Tiers</option>
              <option value="4">4 Tiers</option>
              <option value="5">5 Tiers</option>
            </select>
          </div>

          <div className="app-rack-properties-title5">
            <span className="title">Column Type</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="Type and size of vertical structural columns supporting the rack">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input5">
            <select 
              id="ColumnTypeSelect" 
              className="input-form"
              value={formData.columnType}
              onChange={(e) => handleSelectChange('columnType', e.target.value)}
            >
              <option value="standard">Standard Column (3")</option>
              <option value="heavy">Heavy Duty Column (4")</option>
              <option value="light">Light Column (2")</option>
            </select>
          </div>

          <div className="app-rack-properties-title6">
            <span className="title">Beam Type</span>
            <span className="app-rack-properties-info-wrapper" data-tooltip="Type and size of horizontal structural beams connecting the columns">
              <svg 
                className="app-rack-properties-info-icon"
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="app-rack-properties-input6">
            <select 
              id="BeamTypeSelect" 
              className="input-form"
              value={formData.beamType}
              onChange={(e) => handleSelectChange('beamType', e.target.value)}
            >
              <option value="standard">Standard Beam (3")</option>
              <option value="heavy">Heavy Duty Beam (4")</option>
              <option value="light">Light Beam (2")</option>
            </select>
          </div>


          {/* Tier Heights Heading */}
          {formData.tierCount > 0 && (
            <div className="app-rack-properties-tier-heights-heading">
              <div className="app-rack-properties-title8">
                <span className="title">Tier Heights</span>
                <span className="app-rack-properties-info-wrapper" data-tooltip="Individual height of each tier level for equipment placement">
                  <svg 
                    className="app-rack-properties-info-icon"
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                  </svg>
                </span>
              </div>
            </div>
          )}

          {/* Dynamic tier height inputs based on tier count */}
          {renderTierHeightInputs()}
        </div>

        {/* Add Rack section */}
        <div className="app-rack-properties-save">
          <button 
            type="button" 
            className="app-rack-properties-button save-button"
            onClick={handleAddRack}
            disabled={Object.keys(errors).length > 0}
          >
            <span className="app-rack-properties-save-text">Add Rack</span>
          </button>
        </div>
      </div>
    </div>
  )
}

AppRackProperties.defaultProps = {
  rackLength: undefined,
  numberTiers: undefined,
  unit: undefined,
  deckMounted: undefined,
  floorMounted: undefined,
  saveButton: undefined,
  downloadRvtButton: undefined,
  bayWidth: undefined,
  rackWidth: undefined,
  rootClassName: '',
  numberTiers1: undefined,
  numberTiers2: undefined,
  initialMountType: 'deck', // default deck
  onMountTypeChange: undefined,
}

AppRackProperties.propTypes = {
  rackLength: PropTypes.element,
  numberTiers: PropTypes.element,
  unit: PropTypes.element,
  deckMounted: PropTypes.element,
  floorMounted: PropTypes.element,
  saveButton: PropTypes.element,
  downloadRvtButton: PropTypes.element,
  bayWidth: PropTypes.element,
  rackWidth: PropTypes.element,
  rootClassName: PropTypes.string,
  numberTiers1: PropTypes.element,
  numberTiers2: PropTypes.element,
  initialMountType: PropTypes.oneOf(['deck', 'floor']),
  onMountTypeChange: PropTypes.func,
  onAddRack: PropTypes.func,
  initial: PropTypes.object,
  onClose: PropTypes.func,
}

export default AppRackProperties
