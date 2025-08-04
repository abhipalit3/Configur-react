import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-ductwork.css'

const AppDuctwork = (props) => {
  const [count, setCount] = useState(1)
  const [errors, setErrors] = useState({})
  
  const handleAddDuct = () => {
    // Get values from inputs
    const nameInput = document.getElementById('DuctNameInput')
    const widthInput = document.getElementById('DuctWidthInput')
    const heightInput = document.getElementById('DuctHeightInput')
    const insulationInput = document.getElementById('DuctInsulationInput')
    
    // Validation
    const newErrors = {}
    if (!widthInput.value || parseFloat(widthInput.value) <= 0) {
      newErrors.width = 'Width is required and must be greater than 0'
    }
    if (!heightInput.value || parseFloat(heightInput.value) <= 0) {
      newErrors.height = 'Height is required and must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const ductData = {
      type: 'duct',
      name: nameInput.value || 'Duct',
      width: widthInput.value,
      height: heightInput.value,
      insulation: insulationInput.value || '0',
      count: count
    }
    
    // Call the parent's add handler
    if (props.onAddDuct) {
      props.onAddDuct(ductData)
    }
    
    // Clear inputs and errors after adding
    nameInput.value = ''
    widthInput.value = ''
    heightInput.value = ''
    insulationInput.value = ''
    setErrors({})
    setCount(1)
  }
  
  const incrementCount = () => setCount(prev => prev + 1)
  const decrementCount = () => setCount(prev => Math.max(1, prev - 1))
  
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
          <div className="app-ductwork-duct-name">
            <input
              type="text"
              id="DuctNameInput"
              name="DuctNameInput"
              placeholder="Enter duct name"
              className="input-form"
            />
          </div>
          <div className="app-ductwork-duct-width">
            <input
              type="number"
              id="DuctWidthInput"
              name="DuctWidthInput"
              placeholder="Enter duct width"
              className={`input-form ${errors.width ? 'error' : ''}`}
              onChange={() => setErrors({...errors, width: ''})}
            />
            <span id="Unit" className="app-ductwork-unit1">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">inches</span>
                </Fragment>
              )}
            </span>
          </div>
          {errors.width && <span className="error-message" style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.width}</span>}
          
          <div className="app-ductwork-duct-height">
            <input
              type="number"
              id="DuctHeightInput"
              name="DuctHeightInput"
              placeholder="Enter duct height"
              className={`input-form ${errors.height ? 'error' : ''}`}
              onChange={() => setErrors({...errors, height: ''})}
            />
            <span id="Unit" className="app-ductwork-unit2">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">inches</span>
                </Fragment>
              )}
            </span>
          </div>
          {errors.height && <span className="error-message" style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.height}</span>}
          
          <div className="app-ductwork-duct-insulation">
            <input
              type="number"
              id="DuctInsulationInput"
              name="DuctInsulationInput"
              placeholder="Enter duct insulation thickness"
              className="input-form"
            />
            <span id="Unit" className="app-ductwork-unit3">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">inches</span>
                </Fragment>
              )}
            </span>
          </div>
        </div>
        <div className="app-ductwork-save">
          <button type="button" className="app-ductwork-button save-button" onClick={handleAddDuct}>
            <span id="AddDuct" className="app-ductwork-add-duct">
              {props.addDuctButton ?? (
                <Fragment>
                  <span className="app-ductwork-text2">Add Ducts</span>
                </Fragment>
              )}
            </span>
          </button>
          <div className="app-ductwork-counter">
            <svg
              id="Plus"
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="app-ductwork-plus"
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
            <span id="Count" className="app-ductwork-count">
              {count}
            </span>
            <svg
              id="Minus"
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-ductwork-minus"
              onClick={decrementCount}
              style={{cursor: 'pointer', opacity: count === 1 ? 0.5 : 1}}
            >
              <path
                d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8"
                fill="currentColor"
              ></path>
            </svg>
          </div>
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