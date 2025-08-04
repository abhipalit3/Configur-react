import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-cable-trays.css'

const AppCableTrays = (props) => {
  return (
    <div className={`app-cable-trays-container1 ${props.rootClassName} `}>
      <div className="app-cable-trays-heading">
        <h1 className="heading"> Add Cable Tray</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-cable-trays-icon1 button-icon"
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
                  {props.cableTrayType ?? (
                    <Fragment>
                      <span className="app-cable-trays-text23">
                        Select Cable Tray Type
                      </span>
                    </Fragment>
                  )}
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
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle2"
                  >
                    <span className="app-cable-trays-text12">
                      {props.cableTrayOption1 ?? (
                        <Fragment>
                          <span className="app-cable-trays-text22">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-cable-trays-dropdown2 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle3"
                  >
                    <span className="app-cable-trays-text13">
                      {props.cableTrayOption2 ?? (
                        <Fragment>
                          <span className="app-cable-trays-text19">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-cable-trays-dropdown3 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-cable-trays-dropdown-toggle4"
                  >
                    <span className="app-cable-trays-text14">
                      {props.cableTrayOption3 ?? (
                        <Fragment>
                          <span className="app-cable-trays-text21">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="app-cable-trays-input3">
            <input
              type="text"
              placeholder="Enter cable tray width"
              className="input-form"
            />
            <span className="app-cable-trays-text15">meters</span>
          </div>
          <div className="app-cable-trays-input4">
            <input
              type="text"
              placeholder="Enter cable tray height"
              className="input-form"
            />
            <span className="app-cable-trays-text16">meters</span>
          </div>
        </div>
        <div className="app-cable-trays-save">
          <button type="button" className="app-cable-trays-button save-button">
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
            >
              <path
                d="M30 17H19V6a1 1 0 1 0-2 0v11H6a1 1 0 0 0-1 1a.91.91 0 0 0 1 .94h11V30a1 1 0 1 0 2 0V19h11a1 1 0 0 0 1-1a1 1 0 0 0-1-1"
                fill="currentColor"
                className="clr-i-outline clr-i-outline-path-1"
              ></path>
              <path d="M0 0h36v36H0z" fill="none"></path>
            </svg>
            <span className="app-cable-trays-text18">1</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-cable-trays-icon8"
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
}

AppCableTrays.propTypes = {
  cableTrayOption2: PropTypes.element,
  addCableTrayButton: PropTypes.element,
  cableTrayOption3: PropTypes.element,
  cableTrayOption1: PropTypes.element,
  rootClassName: PropTypes.string,
  cableTrayType: PropTypes.element,
}

export default AppCableTrays
