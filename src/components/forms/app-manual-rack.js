/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-manual-rack.css'

const AppManualRack = (props) => {
  return (
    <div className={`app-manual-rack-container ${props.rootClassName} `}>
      <div className="app-manual-rack-heading">
        <h1 className="heading"> Trade Rack</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-manual-rack-icon1 button-icon"
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-manual-rack-title1">
        <span className="title">
          {props.floortodeck ?? (
            <Fragment>
              <span className="app-manual-rack-text24">Rack Length</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input1">
        <input
          type="text"
          placeholder="Enter floor to deck height"
          className="input-form"
        />
        <span className="app-manual-rack-text12">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-rack-text23">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-title2">
        <span className="app-manual-rack-text13 title">
          {props.beamDepth ?? (
            <Fragment>
              <span className="app-manual-rack-text26">Rack Width</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input2">
        <input
          type="text"
          placeholder="Enter beam/joist depth"
          className="app-manual-rack-textinput2 input-form"
        />
        <span className="app-manual-rack-text14">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-rack-text23">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-title3">
        <span className="app-manual-rack-text15 title">
          {props.ceilingHeight1 ?? (
            <Fragment>
              <span className="app-manual-rack-text20">
                Column Support Type
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input3">
        <select className="app-manual-rack-select1">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>
      <div className="app-manual-rack-title4">
        <span className="app-manual-rack-text16 title">
          {props.ceilingHeight ?? (
            <Fragment>
              <span className="app-manual-rack-text27">Beam Support Type</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input4">
        <select className="app-manual-rack-select2">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>
      <div className="app-manual-rack-title5">
        <span className="app-manual-rack-text17 title">
          {props.corridorWidth1 ?? (
            <Fragment>
              <span className="app-manual-rack-text22">
                Number of Vertical Tiers
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input5">
        <input
          type="text"
          placeholder="Enter number of vertical tiers"
          className="app-manual-rack-textinput3 input-form"
        />
      </div>
      <div className="app-manual-rack-title6">
        <span className="app-manual-rack-text18 title">
          {props.corridorWidth ?? (
            <Fragment>
              <span className="app-manual-rack-text21">
                Input Properties for each tier
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-rack-input6">
        <select className="app-manual-rack-select3">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
        <input
          type="text"
          placeholder="Enter number of vertical tiers"
          className="app-manual-rack-textinput4 input-form"
        />
      </div>
      <div className="app-manual-rack-save">
        <button type="button" className="save-button">
          <span className="app-manual-rack-text19">
            {props.button ?? (
              <Fragment>
                <span className="app-manual-rack-text25">Save</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

AppManualRack.defaultProps = {
  ceilingHeight1: undefined,
  corridorWidth: undefined,
  corridorWidth1: undefined,
  unit: undefined,
  floortodeck: undefined,
  button: undefined,
  rootClassName: '',
  beamDepth: undefined,
  ceilingHeight: undefined,
}

AppManualRack.propTypes = {
  ceilingHeight1: PropTypes.element,
  corridorWidth: PropTypes.element,
  corridorWidth1: PropTypes.element,
  unit: PropTypes.element,
  floortodeck: PropTypes.element,
  button: PropTypes.element,
  rootClassName: PropTypes.string,
  beamDepth: PropTypes.element,
  ceilingHeight: PropTypes.element,
}

export default AppManualRack
