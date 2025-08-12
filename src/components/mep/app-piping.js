import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-piping.css'

const AppPiping = (props) => {
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    pipeType: 'copper',
    diameter: { feet: 0, inches: 2 },
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
  
  const handleAddPipe = () => {
    // Validation
    const newErrors = {}
    const diameterInches = convertToInches(formData.diameter)
    
    if (diameterInches <= 0) {
      newErrors.diameter = 'Diameter is required and must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const pipeData = {
      type: 'pipe',
      name: formData.name || 'Pipe',
      pipeType: formData.pipeType,
      diameter: diameterInches,
      insulation: convertToInches(formData.insulation),
      tier: 1, // Default to tier 1
      color: formData.pipeType === 'copper' ? '#B87333' : formData.pipeType === 'pvc' ? '#F5F5F5' : '#708090'
    }
    
    if (props.onAddPipe) {
      props.onAddPipe(pipeData)
    }
    
    // Clear form data and errors after adding
    setFormData({
      name: '',
      pipeType: 'copper',
      diameter: { feet: 0, inches: 2 },
      insulation: { feet: 0, inches: 0 }
    })
    setErrors({})
  }
  
  return (
    <div className={`app-piping-container1 ${props.rootClassName} `}>
      <div className="app-piping-heading">
        <h1 className="heading">Add Piping</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-piping-icon10 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-piping-piping">
        <div className="app-piping-inputs">
          <div className="app-piping-title1">
            <span className="app-piping-text13 title">Pipe Name</span>
          </div>
          <div className="app-piping-input1">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter pipe name"
              className="input-form"
            />
          </div>
          
          <div className="app-piping-title2">
            <span className="app-piping-text15 title">Pipe Type</span>
          </div>
          <div className="app-piping-input2">
            <select
              value={formData.pipeType}
              onChange={(e) => setFormData({...formData, pipeType: e.target.value})}
              className="input-form"
            >
              <option value="copper">Copper</option>
              <option value="pvc">PVC</option>
              <option value="steel">Steel</option>
            </select>
          </div>
          
          <div className="app-piping-title3">
            <span className="app-piping-text16 title">Diameter</span>
          </div>
          <div className="app-piping-input3">
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
                step="0.5"
                placeholder="0"
              />
              <span className="unit-label">in</span>
            </div>
            {errors.diameter && <span className="error-text">{errors.diameter}</span>}
          </div>
          
          <div className="app-piping-title4">
            <span className="app-piping-text17 title">Insulation Thickness</span>
          </div>
          <div className="app-piping-input4">
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
        <div className="app-piping-save">
          <button type="button" className="app-piping-button save-button" onClick={handleAddPipe}>
            <span className="app-piping-text21">
              {props.button11 ?? (
                <Fragment>
                  <span className="app-piping-text32">Add Pipe</span>
                </Fragment>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

AppPiping.defaultProps = {
  text2: undefined,
  text: undefined,
  unit112: undefined,
  unit1121: undefined,
  text21: undefined,
  text11: undefined,
  text4: undefined,
  text3: undefined,
  text1: undefined,
  button11: undefined,
  text31: undefined,
  rootClassName: '',
  onClose: () => {},
  onAddPipe: () => {},
}

AppPiping.propTypes = {
  text2: PropTypes.element,
  text: PropTypes.element,
  unit112: PropTypes.element,
  unit1121: PropTypes.element,
  text21: PropTypes.element,
  text11: PropTypes.element,
  text4: PropTypes.element,
  text3: PropTypes.element,
  text1: PropTypes.element,
  button11: PropTypes.element,
  text31: PropTypes.element,
  rootClassName: PropTypes.string,
  onClose: PropTypes.func,
  onAddPipe: PropTypes.func,
}

export default AppPiping