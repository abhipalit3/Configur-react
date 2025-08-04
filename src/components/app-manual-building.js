import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-manual-building.css'

const AppManualBuilding = (props) => {
  return (
    <div className={`app-manual-building-container ${props.rootClassName} `}>
      <div className="app-manual-building-heading">
        <h1 className="heading"> Building Shell Properties</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-manual-building-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-manual-building-title1">
        <span className="title">
          {props.floortodeck ?? (
            <Fragment>
              <span className="app-manual-building-text20">
                Floor to Deck Height
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-input1">
        <input
          type="text"
          placeholder="Enter floor to deck height"
          className="app-manual-building-textinput1 input-form"
        />
        <span className="app-manual-building-text12">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-title2">
        <span className="app-manual-building-text13 title">
          {props.beamDepth ?? (
            <Fragment>
              <span className="app-manual-building-text23">
                Beam/Joist Depth
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-input2">
        <input
          type="text"
          placeholder="Enter beam/joist depth"
          className="app-manual-building-textinput2 input-form"
        />
        <span className="app-manual-building-text14">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-title3">
        <span className="app-manual-building-text15 title">
          {props.corridorWidth ?? (
            <Fragment>
              <span className="app-manual-building-text22">Corridor Width</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-input3">
        <input
          type="text"
          placeholder="Enter corridor width"
          className="app-manual-building-textinput3 input-form"
        />
        <span className="app-manual-building-text16">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-title4">
        <span className="app-manual-building-text17 title">
          {props.ceilingHeight ?? (
            <Fragment>
              <span className="app-manual-building-text21">Ceiling Height</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-input4">
        <input
          type="text"
          placeholder="Enter ceiling height"
          className="app-manual-building-textinput4 input-form"
        />
        <span className="app-manual-building-text18">
          {props.unit ?? (
            <Fragment>
              <span className="app-manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-manual-building-save">
        <button
          type="button"
          className="app-manual-building-button save-button"
        >
          <span className="app-manual-building-text19">
            {props.saveButton ?? (
              <Fragment>
                <span className="app-manual-building-text24">Save</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

AppManualBuilding.defaultProps = {
  floortodeck: undefined,
  rootClassName: '',
  ceilingHeight: undefined,
  corridorWidth: undefined,
  beamDepth: undefined,
  saveButton: undefined,
  unit: undefined,
}

AppManualBuilding.propTypes = {
  floortodeck: PropTypes.element,
  rootClassName: PropTypes.string,
  ceilingHeight: PropTypes.element,
  corridorWidth: PropTypes.element,
  beamDepth: PropTypes.element,
  saveButton: PropTypes.element,
  unit: PropTypes.element,
}

export default AppManualBuilding
