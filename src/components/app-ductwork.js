import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-ductwork.css'

const AppDuctwork = (props) => {
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
              type="text"
              id="DuctWidthInput"
              name="DuctWidthInput"
              placeholder="Enter duct width"
              className="input-form"
            />
            <span id="Unit" className="app-ductwork-unit1">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">meters</span>
                </Fragment>
              )}
            </span>
          </div>
          <div className="app-ductwork-duct-height">
            <input
              type="text"
              id="DuctHeightInput"
              name="DuctHeightInput"
              placeholder="Enter duct height"
              className="input-form"
            />
            <span id="Unit" className="app-ductwork-unit2">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">meters</span>
                </Fragment>
              )}
            </span>
          </div>
          <div className="app-ductwork-duct-insulation">
            <input
              type="text"
              id="DuctInsulationInput"
              name="DuctInsulationInput"
              placeholder="Enter duct insulation thickness"
              className="input-form"
            />
            <span id="Unit" className="app-ductwork-unit3">
              {props.unit ?? (
                <Fragment>
                  <span className="app-ductwork-text3">meters</span>
                </Fragment>
              )}
            </span>
          </div>
        </div>
        <div className="app-ductwork-save">
          <button type="button" className="app-ductwork-button save-button">
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
            >
              <path
                d="M30 17H19V6a1 1 0 1 0-2 0v11H6a1 1 0 0 0-1 1a.91.91 0 0 0 1 .94h11V30a1 1 0 1 0 2 0V19h11a1 1 0 0 0 1-1a1 1 0 0 0-1-1"
                fill="currentColor"
                className="clr-i-outline clr-i-outline-path-1"
              ></path>
              <path d="M0 0h36v36H0z" fill="none"></path>
            </svg>
            <span id="Count" className="app-ductwork-count">
              1
            </span>
            <svg
              id="Minus"
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-ductwork-minus"
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
}

AppDuctwork.propTypes = {
  addDuctButton: PropTypes.element,
  unit: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default AppDuctwork
