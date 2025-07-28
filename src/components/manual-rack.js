import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import './manual-rack.css'

const ManualRack = ({
  rootClassName,
  floortodeck,
  beamDepth,
  ceilingHeight1,
  ceilingHeight,
  corridorWidth1,
  corridorWidth,
  unit,
  button,
  onClose
}) => {
  return (
    <div className={`manual-rack-container ${rootClassName}`}> 
      <div className="manual-rack-heading">
        <h1 className="heading">Trade Rack</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="manual-rack-icon1 button-icon"
          onClick={onClose}
          style={{ cursor: 'pointer' }}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="manual-rack-title1">
        <span className="title">
          {floortodeck ?? (
            <Fragment>
              <span className="manual-rack-text21">Rack Length</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input1">
        <input
          type="text"
          placeholder="Enter floor to deck height"
          className="input-form"
        />
        <span className="manual-rack-text12">
          {unit ?? (
            <Fragment>
              <span className="manual-rack-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>

      <div className="manual-rack-title2">
        <span className="manual-rack-text13 title">
          {beamDepth ?? (
            <Fragment>
              <span className="manual-rack-text23">Rack Width</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input2">
        <input
          type="text"
          placeholder="Enter beam/joist depth"
          className="manual-rack-textinput2 input-form"
        />
        <span className="manual-rack-text14">
          {unit ?? (
            <Fragment>
              <span className="manual-rack-text25">meters</span>
            </Fragment>
          )}
        </span>
      </div>

      <div className="manual-rack-title3">
        <span className="manual-rack-text15 title">
          {ceilingHeight1 ?? (
            <Fragment>
              <span className="manual-rack-text26">Column Support Type</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input3">
        <select className="manual-rack-select1">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>

      <div className="manual-rack-title4">
        <span className="manual-rack-text16 title">
          {ceilingHeight ?? (
            <Fragment>
              <span className="manual-rack-text24">Beam Support Type</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input4">
        <select className="manual-rack-select2">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
      </div>

      <div className="manual-rack-title5">
        <span className="manual-rack-text17 title">
          {corridorWidth1 ?? (
            <Fragment>
              <span className="manual-rack-text27">Number of Vertical Tiers</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input5">
        <input
          type="text"
          placeholder="Enter number of vertical tiers"
          className="manual-rack-textinput3 input-form"
        />
      </div>

      <div className="manual-rack-title6">
        <span className="manual-rack-text18 title">
          {corridorWidth ?? (
            <Fragment>
              <span className="manual-rack-text20">Input Properties for each tier</span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="manual-rack-input6">
        <select className="manual-rack-select3">
          <option value="Option 1">Option 1</option>
          <option value="Option 2">Option 2</option>
          <option value="Option 3">Option 3</option>
        </select>
        <input
          type="text"
          placeholder="Enter number of vertical tiers"
          className="manual-rack-textinput4 input-form"
        />
      </div>

      <div className="manual-rack-save">
        <button type="button" className="save-button">
          <span className="manual-rack-text19">
            {button ?? (
              <Fragment>
                <span className="manual-rack-text22">Save</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

ManualRack.propTypes = {
  rootClassName: PropTypes.string,
  floortodeck:  PropTypes.element,
  beamDepth:    PropTypes.element,
  ceilingHeight1: PropTypes.element,
  ceilingHeight: Element,
  corridorWidth1: PropTypes.element,
  corridorWidth:  PropTypes.element,
  unit:         PropTypes.element,
  button:       PropTypes.element,
  onClose:      PropTypes.func.isRequired
}

ManualRack.defaultProps = {
  rootClassName:    '',
  floortodeck:      undefined,
  beamDepth:        undefined,
  ceilingHeight1:   undefined,
  ceilingHeight:    undefined,
  corridorWidth1:   undefined,
  corridorWidth:    undefined,
  unit:             undefined,
  button:           undefined
}

export default ManualRack
