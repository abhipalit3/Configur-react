/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-conduits.css'

const AppConduits = (props) => {
  const [count, setCount] = useState(1)
  const [conduitType, setConduitType] = useState('Select Conduit Type')
  const [diameter, setDiameter] = useState('Select Conduit Outside Diameter')
  const [errors, setErrors] = useState({})
  
  const handleAddConduit = () => {
    const spacingInput = document.querySelector('.app-conduits-input4 input')
    
    // Validation
    const newErrors = {}
    if (conduitType === 'Select Conduit Type') {
      newErrors.conduitType = 'Please select a conduit type'
    }
    if (diameter === 'Select Conduit Outside Diameter') {
      newErrors.diameter = 'Please select a conduit diameter'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const conduitData = {
      type: 'conduit',
      conduitType: conduitType,
      diameter: diameter,
      spacing: spacingInput?.value || '0',
      count: count
    }
    
    if (props.onAddConduit) {
      props.onAddConduit(conduitData)
    }
    
    // Clear inputs
    if (spacingInput) spacingInput.value = ''
    setConduitType('Select Conduit Type')
    setDiameter('Select Conduit Outside Diameter')
    setErrors({})
    setCount(1)
  }
  
  const incrementCount = () => setCount(prev => prev + 1)
  const decrementCount = () => setCount(prev => Math.max(1, prev - 1))
  
  return (
    <div className={`app-conduits-container1 ${props.rootClassName} `}>
      <div className="app-conduits-heading">
        <h1 className="heading"> Add Conduit Group</h1>
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
        <div className="app-conduits-input1">
          <div className="app-conduits-input2">
            <div
              data-thq="thq-dropdown"
              className="app-conduits-thq-dropdown1 list-item"
            >
              <div
                data-thq="thq-dropdown-toggle"
                className="app-conduits-dropdown-toggle1"
              >
                <span className="app-conduits-text11">
                  {conduitType}
                </span>
                <div
                  data-thq="thq-dropdown-arrow"
                  className="app-conduits-dropdown-arrow1"
                >
                  <svg viewBox="0 0 1024 1024" className="app-conduits-icon12">
                    <path d="M426 726v-428l214 214z"></path>
                  </svg>
                </div>
              </div>
              <ul
                data-thq="thq-dropdown-list"
                className="app-conduits-dropdown-list1"
              >
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown1 list-item"
                  onClick={() => {setConduitType('EMT'); setErrors({...errors, conduitType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle2"
                  >
                    <span className="app-conduits-text12">EMT</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown2 list-item"
                  onClick={() => {setConduitType('Rigid'); setErrors({...errors, conduitType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle3"
                  >
                    <span className="app-conduits-text13">Rigid</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown3 list-item"
                  onClick={() => {setConduitType('Flexible'); setErrors({...errors, conduitType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle4"
                  >
                    <span className="app-conduits-text14">Flexible</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {errors.conduitType && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.conduitType}</span>}
          
          <div className="app-conduits-input3">
            <div
              data-thq="thq-dropdown"
              className="app-conduits-thq-dropdown2 list-item"
            >
              <div
                data-thq="thq-dropdown-toggle"
                className="app-conduits-dropdown-toggle5"
              >
                <span className="app-conduits-text15">
                  {diameter}
                </span>
                <div
                  data-thq="thq-dropdown-arrow"
                  className="app-conduits-dropdown-arrow2"
                >
                  <svg viewBox="0 0 1024 1024" className="app-conduits-icon14">
                    <path d="M426 726v-428l214 214z"></path>
                  </svg>
                </div>
              </div>
              <ul
                data-thq="thq-dropdown-list"
                className="app-conduits-dropdown-list2"
              >
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown4 list-item"
                  onClick={() => {setDiameter('1"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle6"
                  >
                    <span className="app-conduits-text16">1"</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown5 list-item"
                  onClick={() => {setDiameter('2"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle7"
                  >
                    <span className="app-conduits-text17">2"</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown6 list-item"
                  onClick={() => {setDiameter('3"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle8"
                  >
                    <span className="app-conduits-text18">3"</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {errors.diameter && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.diameter}</span>}
          
          <div className="app-conduits-input4">
            <input
              type="number"
              placeholder="Enter conduit spacing (center to center)"
              className="input-form"
            />
            <span className="app-conduits-text19">inches</span>
          </div>
        </div>
        <div className="app-conduits-save">
          <button type="button" className="app-conduits-button save-button" onClick={handleAddConduit}>
            <span className="app-conduits-text20">
              {props.addConduitButton ?? (
                <Fragment>
                  <span className="app-conduits-text25">Add Conduits</span>
                </Fragment>
              )}
            </span>
          </button>
          <div className="app-conduits-container2">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="app-conduits-icon16"
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
            <span className="app-conduits-text21">{count}</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-conduits-icon19"
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

AppConduits.defaultProps = {
  conduitDia1: undefined,
  conduitType: undefined,
  conduitType3: undefined,
  addConduitButton: undefined,
  rootClassName: '',
  conduitDia2: undefined,
  conduitType1: undefined,
  conduitDiameter: undefined,
  conduitDia3: undefined,
  conduitType2: undefined,
  onClose: () => {},
  onAddConduit: () => {},
}

AppConduits.propTypes = {
  conduitDia1: PropTypes.element,
  conduitType: PropTypes.element,
  conduitType3: PropTypes.element,
  addConduitButton: PropTypes.element,
  rootClassName: PropTypes.string,
  conduitDia2: PropTypes.element,
  conduitType1: PropTypes.element,
  conduitDiameter: PropTypes.element,
  conduitDia3: PropTypes.element,
  conduitType2: PropTypes.element,
  onClose: PropTypes.func,
  onAddConduit: PropTypes.func,
}

export default AppConduits