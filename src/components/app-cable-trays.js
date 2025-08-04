import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-cable-trays.css'

const AppCableTrays = (props) => {
  const [count, setCount] = useState(1)
  const [trayType, setTrayType] = useState('Select Cable Tray Type')
  const [errors, setErrors] = useState({})
  
  const handleAddCableTray = () => {
    const widthInput = document.querySelector('.app-cable-trays-input3 input')
    const heightInput = document.querySelector('.app-cable-trays-input4 input')
    
    // Validation
    const newErrors = {}
    if (trayType === 'Select Cable Tray Type') {
      newErrors.trayType = 'Please select a cable tray type'
    }
    if (!widthInput?.value || parseFloat(widthInput.value) <= 0) {
      newErrors.width = 'Width is required and must be greater than 0'
    }
    if (!heightInput?.value || parseFloat(heightInput.value) <= 0) {
      newErrors.height = 'Height is required and must be greater than 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const cableTrayData = {
      type: 'cableTray',
      trayType: trayType,
      width: widthInput.value,
      height: heightInput.value,
      count: count
    }
    
    if (props.onAddCableTray) {
      props.onAddCableTray(cableTrayData)
    }
    
    // Clear inputs
    if (widthInput) widthInput.value = ''
    if (heightInput) heightInput.value = ''
    setTrayType('Select Cable Tray Type')
    setErrors({})
    setCount(1)
  }
  
  const incrementCount = () => setCount(prev => prev + 1)
  const decrementCount = () => setCount(prev => Math.max(1, prev - 1))
  
  return (
    <div className={`app-cable-trays-container1 ${props.rootClassName} `}>
      <div className="app-cable-trays-heading">
        <h1 className="heading"> Add Cable Tray</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-cable-trays-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-cable-trays-cable-tray">
        <div className="app-cable-trays-input1">
          <div className="app-cable-trays-input2">
            <div
              data-thq="thq-dropdown"
              className="app-cable-trays-thq-dropdown list-item"
            >
              <div
                data-thq="thq-dropdown-toggle"
                className="app-cable-trays-dropdown-toggle1"
              >
                <span className="app-cable-trays-text11">
                  {trayType}
                </span>
                <div
                  data-thq="thq-dropdown-arrow"
                  className="app-cable-trays-dropdown-arrow"
                >
                  <svg
                    viewBox="0 0 1024 1024"
                    className="app-cable-trays-icon3"
                  >
                    <path d="M426 726v-428l214 214z"></path>
                  </svg>
                </div>
              </div>
              <ul
                data-thq="thq-dropdown-list"
                className="app-cable-trays-dropdown-list"
              >
                <li
                  data-thq="thq-dropdown"
                  className="app-cable-trays-dropdown1 list-item"
                  onClick={() => {setTrayType('Ladder'); setErrors({...errors, trayType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle2"
                  >
                    <span className="app-cable-trays-text12">Ladder</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-cable-trays-dropdown2 list-item"
                  onClick={() => {setTrayType('Solid Bottom'); setErrors({...errors, trayType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle3"
                  >
                    <span className="app-cable-trays-text13">Solid Bottom</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-cable-trays-dropdown3 list-item"
                  onClick={() => {setTrayType('Wire Mesh'); setErrors({...errors, trayType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle4"
                  >
                    <span className="app-cable-trays-text14">Wire Mesh</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {errors.trayType && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.trayType}</span>}
          
          <div className="app-cable-trays-input3">
            <input
              type="number"
              placeholder="Enter cable tray width"
              className={`input-form ${errors.width ? 'error' : ''}`}
              onChange={() => setErrors({...errors, width: ''})}
            />
            <span className="app-cable-trays-text15">inches</span>
          </div>
          {errors.width && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.width}</span>}
          
          <div className="app-cable-trays-input4">
            <input
              type="number"
              placeholder="Enter cable tray height"
              className={`input-form ${errors.height ? 'error' : ''}`}
              onChange={() => setErrors({...errors, height: ''})}
            />
            <span className="app-cable-trays-text16">inches</span>
          </div>
          {errors.height && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.height}</span>}
        </div>
        <div className="app-cable-trays-save">
          <button type="button" className="app-cable-trays-button save-button" onClick={handleAddCableTray}>
            <span className="app-cable-trays-text17">
              {props.addCableTrayButton ?? (
                <Fragment>
                  <span className="app-cable-trays-text20">Add Cable Tray</span>
                </Fragment>
              )}
            </span>
          </button>
          <div className="app-cable-trays-container2">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="app-cable-trays-icon5"
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
            <span className="app-cable-trays-text18">{count}</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-cable-trays-icon8"
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