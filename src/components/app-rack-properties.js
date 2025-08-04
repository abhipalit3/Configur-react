import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-rack-properties.css'

const AppRackProperties = (props) => {
  return (
    <div className={`app-rack-properties-container ${props.rootClassName} `}>
      <div className="app-rack-properties-heading">
        <h1 className="heading"> Trade Rack Properties</h1>
        <svg
          id="CloseButton"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-rack-properties-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-rack-properties-input">
        <button
          type="button"
          className="app-rack-properties-button1 save-button"
        >
          <span className="app-rack-properties-text11">
            {props.deckMounted ?? (
              <Fragment>
                <span className="app-rack-properties-text27">Deck Mounted</span>
              </Fragment>
            )}
          </span>
        </button>
        <button
          type="button"
          className="app-rack-properties-button2 save-button"
        >
          <span className="app-rack-properties-text12">
            {props.floorMounted ?? (
              <Fragment>
                <span className="app-rack-properties-text28">
                  Floor Mounted
                </span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
      <div className="app-rack-properties-title1">
        <span className="app-rack-properties-text13">
          {props.rackLength ?? (
            <Fragment>
              <span className="app-rack-properties-text24">Rack Length</span>
            </Fragment>
          )}
        </span>
        <input
          type="text"
          placeholder="Input"
          className="app-rack-properties-textinput1 input-form"
        />
        <span className="app-rack-properties-text14">
          {props.unit ?? (
            <Fragment>
              <span className="app-rack-properties-text26">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-rack-properties-title2">
        <span className="app-rack-properties-text15">
          {props.rackWidth ?? (
            <Fragment>
              <span className="app-rack-properties-text32">Rack Width</span>
            </Fragment>
          )}
        </span>
        <input
          type="text"
          placeholder="Input"
          className="app-rack-properties-textinput2 input-form"
        />
        <span className="app-rack-properties-text16">
          {props.unit ?? (
            <Fragment>
              <span className="app-rack-properties-text26">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-rack-properties-title3">
        <span className="app-rack-properties-text17">
          {props.bayWidth ?? (
            <Fragment>
              <span className="app-rack-properties-text31">Bay Width</span>
            </Fragment>
          )}
        </span>
        <input
          type="text"
          placeholder="Input"
          className="app-rack-properties-textinput3 input-form"
        />
        <span className="app-rack-properties-text18">
          {props.unit ?? (
            <Fragment>
              <span className="app-rack-properties-text26">meters</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="app-rack-properties-title4">
        <span className="app-rack-properties-text19">
          {props.numberTiers ?? (
            <Fragment>
              <span className="app-rack-properties-text25">
                Number of Tiers
              </span>
            </Fragment>
          )}
        </span>
        <select className="app-rack-properties-select1">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>
      <div className="app-rack-properties-title5">
        <span className="app-rack-properties-text20">
          {props.numberTiers2 ?? (
            <Fragment>
              <span className="app-rack-properties-text34">Support Type</span>
            </Fragment>
          )}
        </span>
        <select className="app-rack-properties-select2">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>
      <div className="app-rack-properties-title6">
        <span className="app-rack-properties-text21">
          {props.numberTiers1 ?? (
            <Fragment>
              <span className="app-rack-properties-text33"> Tier Height</span>
            </Fragment>
          )}
        </span>
        <input
          type="text"
          placeholder="Input"
          className="app-rack-properties-textinput4 input-form"
        />
        <select className="app-rack-properties-select3">
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>
      </div>
      <div className="app-rack-properties-save1">
        <button type="button" className="save-button">
          <span className="app-rack-properties-text22">
            {props.saveButton ?? (
              <Fragment>
                <span className="app-rack-properties-text29">Save</span>
              </Fragment>
            )}
          </span>
        </button>
        <button
          type="button"
          className="app-rack-properties-download-rvt save-button"
        >
          <span className="app-rack-properties-text23">
            {props.downloadRvtButton ?? (
              <Fragment>
                <span className="app-rack-properties-text30">
                  Download Revit Family
                </span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

AppRackProperties.defaultProps = {
  rackLength: undefined,
  numberTiers: undefined,
  unit: undefined,
  deckMounted: undefined,
  floorMounted: undefined,
  saveButton: undefined,
  downloadRvtButton: undefined,
  bayWidth: undefined,
  rackWidth: undefined,
  rootClassName: '',
  numberTiers1: undefined,
  numberTiers2: undefined,
}

AppRackProperties.propTypes = {
  rackLength: PropTypes.element,
  numberTiers: PropTypes.element,
  unit: PropTypes.element,
  deckMounted: PropTypes.element,
  floorMounted: PropTypes.element,
  saveButton: PropTypes.element,
  downloadRvtButton: PropTypes.element,
  bayWidth: PropTypes.element,
  rackWidth: PropTypes.element,
  rootClassName: PropTypes.string,
  numberTiers1: PropTypes.element,
  numberTiers2: PropTypes.element,
}

export default AppRackProperties
