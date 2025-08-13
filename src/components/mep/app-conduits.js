/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-conduits.css'

const AppConduits = (props) => {
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    conduitType: 'emt',
    diameter: { feet: 0, inches: 1 }, // Use feet/inches like piping
    spacing: { feet: 0, inches: 4 }, // Use feet/inches like piping
    count: 1,
    fillPercentage: 0, // percentage
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
  
  const handleAddConduit = () => {
    // Validation
    const newErrors = {}
    const diameterInches = convertToInches(formData.diameter)
    const spacingInches = convertToInches(formData.spacing)
    
    if (diameterInches <= 0) {
      newErrors.diameter = 'Diameter is required and must be greater than 0'
    }
    
    if (formData.fillPercentage < 0 || formData.fillPercentage > 100) {
      newErrors.fillPercentage = 'Fill percentage must be between 0 and 100'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const conduitData = {
      type: 'conduit',
      name: formData.name || 'Conduit',
      conduitType: formData.conduitType,
      diameter: diameterInches,
      spacing: spacingInches,
      count: formData.count,
      fillPercentage: formData.fillPercentage,
      tier: formData.tier,
      color: getConduitColor(formData.conduitType)
    }
    
    if (props.onAddConduit) {
      props.onAddConduit(conduitData)
    }
    
    // Clear form data and errors after adding
    setFormData({
      name: '',
      conduitType: 'emt',
      diameter: { feet: 0, inches: 1 },
      spacing: { feet: 0, inches: 4 },
      count: 1,
      fillPercentage: 0,
      tier: 1
    })
    setErrors({})
  }

  // Get default color based on conduit type
  const getConduitColor = (type) => {
    switch (type) {
      case 'emt': return '#C0C0C0' // Silver
      case 'rigid': return '#505050' // Dark gray
      case 'pvc': return '#808080' // Gray
      case 'flexible': return '#FFA500' // Orange
      default: return '#C0C0C0'
    }
  }
  
  const incrementCount = () => setFormData(prev => ({...prev, count: prev.count + 1}))
  const decrementCount = () => setFormData(prev => ({...prev, count: Math.max(1, prev.count - 1)}))
  
  return (
    <div className={`app-conduits-container1 ${props.rootClassName} `}>
      <div className="app-conduits-heading">
        <h1 className="heading">Add Conduits</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-conduits-icon10 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-conduits-conduits">
        <div className="app-conduits-inputs">
          <div className="app-conduits-title1">
            <span className="app-conduits-text13 title">Conduit Name</span>
          </div>
          <div className="app-conduits-input1">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter conduit name"
              className="input-form"
            />
          </div>

          <div className="app-conduits-title2">
            <span className="app-conduits-text15 title">Conduit Type</span>
          </div>
          <div className="app-conduits-input2">
            <select
              value={formData.conduitType}
              onChange={(e) => setFormData({...formData, conduitType: e.target.value})}
              className="input-form"
            >
              <option value="emt">EMT</option>
              <option value="rigid">Rigid</option>
              <option value="pvc">PVC</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          
          <div className="app-conduits-title3">
            <span className="app-conduits-text16 title">Diameter</span>
          </div>
          <div className="app-conduits-input3">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.diameter.feet}
                onChange={(e) => handleFeetInchesChange('diameter', 'feet', e.target.value)}
                className={`input-form ${errors.diameter ? 'error' : ''}`}
                min="0"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.diameter.inches}
                onChange={(e) => handleFeetInchesChange('diameter', 'inches', e.target.value)}
                className={`input-form ${errors.diameter ? 'error' : ''}`}
                min="0"
                max="11"
                step="0.25"
                placeholder="1"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.diameter && <span className="error-text">{errors.diameter}</span>}
          </div>
          
          <div className="app-conduits-title4">
            <span className="app-conduits-text17 title">Spacing (Center to Center)</span>
          </div>
          <div className="app-conduits-input4">
            <div className="feet-inches-input">
              <input
                type="number"
                value={formData.spacing.feet}
                onChange={(e) => handleFeetInchesChange('spacing', 'feet', e.target.value)}
                className="input-form"
                min="0"
                step="1"
                placeholder="0"
              />
              <span className="unit-label">ft</span>
              <input
                type="number"
                value={formData.spacing.inches}
                onChange={(e) => handleFeetInchesChange('spacing', 'inches', e.target.value)}
                className="input-form"
                min="0"
                max="11"
                step="0.5"
                placeholder="4"
              />
              <span className="unit-label">in</span>
            </div>
          </div>
        </div>
        <div className="app-conduits-save">
          <div className="app-conduits-counter">
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-conduits-minus"
              onClick={decrementCount}
              style={{cursor: 'pointer', opacity: formData.count === 1 ? 0.5 : 1}}
            >
              <path
                d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8"
                fill="currentColor"
              ></path>
            </svg>
            <span className="app-conduits-count">{formData.count}</span>
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="app-conduits-plus"
              onClick={incrementCount}
              style={{cursor: 'pointer'}}
            >
              <path
                d="M30 17H19V6a1 1 0 1 0-2 0v11H6a1 1 0 0 0-1 1a.91.91 0 0 0 1 .94h11V30a1 1 0 1 0 2 0V19h11a1 1 0 0 0 1-1a1 1 0 0 0-1-1"
                fill="currentColor"
                className="clr-i-outline clr-i-outline-path-1"
              ></path>
              <path d="M0 0h36v36H0z" fill="none"></path>
            </svg>
          </div>
          <button type="button" className="app-conduits-button save-button" onClick={handleAddConduit}>
            <span className="app-conduits-add-conduits">
              {props.button11 ?? (
                <Fragment>
                  <span className="app-conduits-text32">Add Conduits</span>
                </Fragment>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

AppConduits.defaultProps = {
  text2: undefined,
  text: undefined,
  text21: undefined,
  text11: undefined,
  text4: undefined,
  text3: undefined,
  text1: undefined,
  button11: undefined,
  text31: undefined,
  rootClassName: '',
  onClose: () => {},
  onAddConduit: () => {},
}

AppConduits.propTypes = {
  text2: PropTypes.element,
  text: PropTypes.element,
  text21: PropTypes.element,
  text11: PropTypes.element,
  text4: PropTypes.element,
  text3: PropTypes.element,
  text1: PropTypes.element,
  button11: PropTypes.element,
  text31: PropTypes.element,
  rootClassName: PropTypes.string,
  onClose: PropTypes.func,
  onAddConduit: PropTypes.func,
}

export default AppConduits