import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './manual-building.css'

const ManualBuilding = (props) => {
  return (
    <div className={`manual-building-container ${props.rootClassName} `}>
      <div className="manual-building-heading">
        <h1 className="heading"> Building Shell</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="manual-building-icon1 button-icon"
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="manual-building-title1">
        <span className="title">
          {props.floortodeck ?? (
            <Fragment>
              <span className="manual-building-text20">
                Floor to Deck Height
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-input1">
        <input
          type="text"
          placeholder="Enter floor to deck height"
          className="input-form"
        />
        <span className="manual-building-text12">
          {props.unit ?? (
            <Fragment>
              <span className="manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-title2">
        <span className="manual-building-text13 title">
          {props.beamDepth ?? (
            <Fragment>
              <span className="manual-building-text23">Beam/Joist Depth</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-input2">
        <input
          type="text"
          placeholder="Enter beam/joist depth"
          className="manual-building-textinput2 input-form"
        />
        <span className="manual-building-text14">
          {props.unit ?? (
            <Fragment>
              <span className="manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-title3">
        <span className="manual-building-text15 title">
          {props.corridorWidth ?? (
            <Fragment>
              <span className="manual-building-text22">Corridor Width</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-input3">
        <input
          type="text"
          placeholder="Enter corridor width"
          className="manual-building-textinput3 input-form"
        />
        <span className="manual-building-text16">
          {props.unit ?? (
            <Fragment>
              <span className="manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-title4">
        <span className="manual-building-text17 title">
          {props.ceilingHeight ?? (
            <Fragment>
              <span className="manual-building-text21">Ceiling Height</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-input4">
        <input
          type="text"
          placeholder="Enter ceiling height"
          className="manual-building-textinput4 input-form"
        />
        <span className="manual-building-text18">
          {props.unit ?? (
            <Fragment>
              <span className="manual-building-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-building-save">
        <button type="button" className="save-button">
          <span className="manual-building-text19">
            {props.button ?? (
              <Fragment>
                <span className="manual-building-text24">Save</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

ManualBuilding.defaultProps = {
  floortodeck: undefined,
  rootClassName: '',
  ceilingHeight: undefined,
  corridorWidth: undefined,
  beamDepth: undefined,
  button: undefined,
  unit: undefined,
}

ManualBuilding.propTypes = {
  floortodeck: PropTypes.element,
  rootClassName: PropTypes.string,
  ceilingHeight: PropTypes.element,
  corridorWidth: PropTypes.element,
  beamDepth: PropTypes.element,
  button: PropTypes.element,
  unit: PropTypes.element,
}

export default ManualBuilding
