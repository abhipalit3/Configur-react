/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-cable-trays.css'

const AppCableTrays = (props) => {
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    trayType: 'ladder',
    width: { feet: 0, inches: 12 },
    height: { feet: 0, inches: 4 },
    tier: 1
  })
  
  // Helper to convert feet+inches to total inches
  const convertToInches = (feetInches) => {
    return (feetInches.feet * 12) + feetInches.inches
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
  
  const handleAddCableTray = () => {
    // Validation
    const newErrors = {}
    const widthInches = convertToInches(formData.width)
    const heightInches = convertToInches(formData.height)
    
    if (widthInches <= 0) {
      newErrors.width = 'Width is required and must be greater than 0'
    }
    
    if (heightInches <= 0) {
      newErrors.height = 'Height is required and must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const cableTrayData = {
      type: 'cableTray',
      name: formData.name || 'Cable Tray',
      trayType: formData.trayType,
      width: widthInches,
      height: heightInches,
      tier: formData.tier,
      color: getCableTrayColor(formData.trayType)
    }
    
    if (props.onAddCableTray) {
      props.onAddCableTray(cableTrayData)
    }
    
    // Clear form data and errors after adding
    setFormData({
      name: '',
      trayType: 'ladder',
      width: { feet: 0, inches: 12 },
      height: { feet: 0, inches: 4 },
      tier: 1
    })
    setErrors({})
  }

  // Get default color based on cable tray type
  const getCableTrayColor = (type) => {
    switch (type) {
      case 'ladder': return '#A0A0A0' // Light gray
      case 'solid bottom': return '#707070' // Medium gray
      case 'wire mesh': return '#909090' // Gray
      default: return '#A0A0A0'
    }
  }
  
  
  return (
    <div className={`app-cable-trays-container1 ${props.rootClassName} `}>
      <div className="app-cable-trays-heading">
        <h1 className="heading">Add Cable Trays</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-cable-trays-icon10 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-cable-trays-cable-trays">
        <div className="app-cable-trays-inputs">
          <div className="app-cable-trays-title1">
            <span className="app-cable-trays-text13 title">Cable Tray Name</span>
          </div>
          <div className="app-cable-trays-input1">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter cable tray name"
              className="input-form"
            />
          </div>

          <div className="app-cable-trays-title2">
            <span className="app-cable-trays-text15 title">Cable Tray Type</span>
          </div>
          <div className="app-cable-trays-input2">
            <select
              value={formData.trayType}
              onChange={(e) => setFormData({...formData, trayType: e.target.value})}
              className="input-form"
            >
              <option value="ladder">Ladder</option>
              <option value="solid bottom">Solid Bottom</option>
              <option value="wire mesh">Wire Mesh</option>
            </select>
          </div>
          
          <div className="app-cable-trays-title3">
            <span className="app-cable-trays-text16 title">Width</span>
          </div>
          <div className="app-cable-trays-input3">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.width.feet}
                onChange={(e) => handleFeetInchesChange('width', 'feet', e.target.value)}
                className={`input-form ${errors.width ? 'error' : ''}`}
                min="0"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.width.inches}
                onChange={(e) => handleFeetInchesChange('width', 'inches', e.target.value)}
                className={`input-form ${errors.width ? 'error' : ''}`}
                min="0"
                max="11"
                step="0.25"
                placeholder="12"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.width && <span className="error-text">{errors.width}</span>}
          </div>
          
          <div className="app-cable-trays-title4">
            <span className="app-cable-trays-text17 title">Height</span>
          </div>
          <div className="app-cable-trays-input4">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.height.feet}
                onChange={(e) => handleFeetInchesChange('height', 'feet', e.target.value)}
                className={`input-form ${errors.height ? 'error' : ''}`}
                min="0"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.height.inches}
                onChange={(e) => handleFeetInchesChange('height', 'inches', e.target.value)}
                className={`input-form ${errors.height ? 'error' : ''}`}
                min="0"
                max="11"
                step="0.25"
                placeholder="4"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.height && <span className="error-text">{errors.height}</span>}
          </div>
          
        </div>
        <div className="app-cable-trays-save">
          <button type="button" className="app-cable-trays-button save-button" onClick={handleAddCableTray}>
            <span className="app-cable-trays-add-cable-trays">
              {props.button11 ?? (
                <Fragment>
                  <span className="app-cable-trays-text32">Add Cable Tray</span>
                </Fragment>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

AppCableTrays.defaultProps = {
  cableTrayOption2: undefined,
  addCableTrayButton: undefined,
  cableTrayOption3: undefined,
  cableTrayOption1: undefined,
  rootClassName: '',
  cableTrayType: undefined,
  onClose: () => {},
  onAddCableTray: () => {},
}

AppCableTrays.propTypes = {
  cableTrayOption2: PropTypes.element,
  addCableTrayButton: PropTypes.element,
  cableTrayOption3: PropTypes.element,
  cableTrayOption1: PropTypes.element,
  rootClassName: PropTypes.string,
  cableTrayType: PropTypes.element,
  onClose: PropTypes.func,
  onAddCableTray: PropTypes.func,
}

export default AppCableTrays