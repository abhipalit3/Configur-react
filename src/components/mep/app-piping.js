import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-piping.css'

const AppPiping = (props) => {
  const [count, setCount] = useState(1)
  const [pipeType, setPipeType] = useState('Select Pipe Type')
  const [diameter, setDiameter] = useState('Select Pipe Outside Diameter')
  const [errors, setErrors] = useState({})
  
  const handleAddPipe = () => {
    // Get values
    const insulationInput = document.querySelector('.app-piping-input4 input')
    const spacingInput = document.querySelector('.app-piping-input5 input')
    
    // Validation
    const newErrors = {}
    if (pipeType === 'Select Pipe Type') {
      newErrors.pipeType = 'Please select a pipe type'
    }
    if (diameter === 'Select Pipe Outside Diameter') {
      newErrors.diameter = 'Please select a pipe diameter'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    const pipeData = {
      type: 'pipe',
      pipeType: pipeType,
      diameter: diameter,
      insulation: insulationInput?.value || '0',
      spacing: spacingInput?.value || '0',
      count: count
    }
    
    if (props.onAddPipe) {
      props.onAddPipe(pipeData)
    }
    
    // Clear inputs
    if (insulationInput) insulationInput.value = ''
    if (spacingInput) spacingInput.value = ''
    setPipeType('Select Pipe Type')
    setDiameter('Select Pipe Outside Diameter')
    setErrors({})
    setCount(1)
  }
  
  const incrementCount = () => setCount(prev => prev + 1)
  const decrementCount = () => setCount(prev => Math.max(1, prev - 1))
  
  return (
    <div className={`app-piping-container1 ${props.rootClassName} `}>
      <div className="app-piping-heading">
        <h1 className="heading"> Add Piping</h1>
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
        <div className="app-piping-input1">
          <div className="app-piping-input2">
            <div
              data-thq="thq-dropdown"
              className="app-piping-thq-dropdown1 list-item"
            >
              <div
                data-thq="thq-dropdown-toggle"
                className="app-piping-dropdown-toggle1"
              >
                <span className="app-piping-text11">
                  {pipeType}
                </span>
                <div
                  data-thq="thq-dropdown-arrow"
                  className="app-piping-dropdown-arrow1"
                >
                  <svg viewBox="0 0 1024 1024" className="app-piping-icon12">
                    <path d="M426 726v-428l214 214z"></path>
                  </svg>
                </div>
              </div>
              <ul
                data-thq="thq-dropdown-list"
                className="app-piping-dropdown-list1"
              >
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown1 list-item"
                  onClick={() => {setPipeType('Copper'); setErrors({...errors, pipeType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle2"
                  >
                    <span className="app-piping-text12">Copper</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown2 list-item"
                  onClick={() => {setPipeType('PVC'); setErrors({...errors, pipeType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle3"
                  >
                    <span className="app-piping-text13">PVC</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown3 list-item"
                  onClick={() => {setPipeType('Steel'); setErrors({...errors, pipeType: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle4"
                  >
                    <span className="app-piping-text14">Steel</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {errors.pipeType && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.pipeType}</span>}
          
          <div className="app-piping-input3">
            <div
              data-thq="thq-dropdown"
              className="app-piping-thq-dropdown2 list-item"
            >
              <div
                data-thq="thq-dropdown-toggle"
                className="app-piping-dropdown-toggle5"
              >
                <span className="app-piping-text15">
                  {diameter}
                </span>
                <div
                  data-thq="thq-dropdown-arrow"
                  className="app-piping-dropdown-arrow2"
                >
                  <svg viewBox="0 0 1024 1024" className="app-piping-icon14">
                    <path d="M426 726v-428l214 214z"></path>
                  </svg>
                </div>
              </div>
              <ul
                data-thq="thq-dropdown-list"
                className="app-piping-dropdown-list2"
              >
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown4 list-item"
                  onClick={() => {setDiameter('2"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle6"
                  >
                    <span className="app-piping-text16">2"</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown5 list-item"
                  onClick={() => {setDiameter('4"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle7"
                  >
                    <span className="app-piping-text17">4"</span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown6 list-item"
                  onClick={() => {setDiameter('6"'); setErrors({...errors, diameter: ''})}}
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle8"
                  >
                    <span className="app-piping-text18">6"</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {errors.diameter && <span style={{color: 'red', fontSize: '11px', paddingLeft: '16px'}}>{errors.diameter}</span>}
          
          <div className="app-piping-input4">
            <input
              type="number"
              placeholder="Enter pipe insulation thickness"
              className="input-form"
            />
            <span className="app-piping-text19">
              {props.unit112 ?? (
                <Fragment>
                  <span className="app-piping-text25">inches</span>
                </Fragment>
              )}
            </span>
          </div>
          <div className="app-piping-input5">
            <input
              type="number"
              placeholder="Enter pipe spacing (center to center)"
              className="input-form"
            />
            <span className="app-piping-text20">
              {props.unit1121 ?? (
                <Fragment>
                  <span className="app-piping-text26">inches</span>
                </Fragment>
              )}
            </span>
          </div>
        </div>
        <div className="app-piping-save">
          <button type="button" className="app-piping-button save-button" onClick={handleAddPipe}>
            <span className="app-piping-text21">
              {props.button11 ?? (
                <Fragment>
                  <span className="app-piping-text32">Add Piping</span>
                </Fragment>
              )}
            </span>
          </button>
          <div className="app-piping-container2">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="app-piping-icon16"
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
            <span className="app-piping-text22">{count}</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-piping-icon19"
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