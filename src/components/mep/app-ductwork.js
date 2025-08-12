/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-ductwork.css'

const AppDuctwork = (props) => {
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    width: { feet: 0, inches: 0 },
    height: { feet: 0, inches: 0 },
    insulation: { feet: 0, inches: 0 }
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
  
  const handleAddDuct = () => {
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
    
    const ductData = {
      type: 'duct',
      name: formData.name || 'Duct',
      width: widthInches,
      height: heightInches,
      insulation: convertToInches(formData.insulation),
      tier: 1, // Default to tier 1
      position: 'bottom', // Default to bottom position
      color: '#d05e8f' // Default pink color
    }
    
    // Call the parent's add handler
    if (props.onAddDuct) {
      props.onAddDuct(ductData)
    }
    
    // Clear form data and errors after adding
    setFormData({
      name: '',
      width: { feet: 0, inches: 0 },
      height: { feet: 0, inches: 0 },
      insulation: { feet: 0, inches: 0 }
    })
    setErrors({})
  }
  
  
  return (
    <div className={`app-ductwork-container ${props.rootClassName} `}>
      <div className="app-ductwork-heading">
        <h1 id="AddDuctHeading" className="heading">
          {' '}
          Add Ductwork
        </h1>
        <svg
          id="CloseButton"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-ductwork-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-ductwork-ductwork">
        <div className="app-ductwork-inputs">
          <div className="app-ductwork-title1">
            <span className="app-ductwork-text13 title">Duct Name</span>
          </div>
          <div className="app-ductwork-input1">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter duct name"
              className="input-form"
            />
          </div>
          
          <div className="app-ductwork-title2">
            <span className="app-ductwork-text15 title">Width</span>
          </div>
          <div className="app-ductwork-input2">
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
                step="1"
                placeholder="0"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.width && <span className="error-text">{errors.width}</span>}
          </div>
          
          <div className="app-ductwork-title3">
            <span className="app-ductwork-text16 title">Height</span>
          </div>
          <div className="app-ductwork-input3">
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
                step="1"
                placeholder="0"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.height && <span className="error-text">{errors.height}</span>}
          </div>
          
          <div className="app-ductwork-title4">
            <span className="app-ductwork-text17 title">Insulation Thickness</span>
          </div>
          <div className="app-ductwork-input4">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.insulation.feet}
                onChange={(e) => handleFeetInchesChange('insulation', 'feet', e.target.value)}
                className="input-form"
                min="0"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.insulation.inches}
                onChange={(e) => handleFeetInchesChange('insulation', 'inches', e.target.value)}
                className="input-form"
                min="0"
                max="11"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">in</span>
            </div>
          </div>
        </div>
        <div className="app-ductwork-save">
          <button type="button" className="app-ductwork-button save-button" onClick={handleAddDuct}>
            <span id="AddDuct" className="app-ductwork-add-duct">
              {props.addDuctButton ?? (
                <Fragment>
                  <span className="app-ductwork-text2">Add Duct</span>
                </Fragment>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

AppDuctwork.defaultProps = {
  addDuctButton: undefined,
  unit: undefined,
  rootClassName: '',
  onClose: () => {},
  onAddDuct: () => {},
}

AppDuctwork.propTypes = {
  addDuctButton: PropTypes.element,
  unit: PropTypes.element,
  rootClassName: PropTypes.string,
  onClose: PropTypes.func,
  onAddDuct: PropTypes.func,
}

export default AppDuctwork