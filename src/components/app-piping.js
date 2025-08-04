import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-piping.css'

const AppPiping = (props) => {
  return (
    <div className={`app-piping-container1 ${props.rootClassName} `}>
      <div className="app-piping-heading">
        <h1 className="heading"> Add Piping</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-piping-icon10 button-icon"
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
                  {props.text ?? (
                    <Fragment>
                      <span className="app-piping-text24">
                        Select Pipe Type
                      </span>
                    </Fragment>
                  )}
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
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle2"
                  >
                    <span className="app-piping-text12">
                      {props.text1 ?? (
                        <Fragment>
                          <span className="app-piping-text31">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown2 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle3"
                  >
                    <span className="app-piping-text13">
                      {props.text2 ?? (
                        <Fragment>
                          <span className="app-piping-text23">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown3 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle4"
                  >
                    <span className="app-piping-text14">
                      {props.text3 ?? (
                        <Fragment>
                          <span className="app-piping-text30">
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
                  {props.text4 ?? (
                    <Fragment>
                      <span className="app-piping-text29">
                        Select Pipe Outside Diameter
                      </span>
                    </Fragment>
                  )}
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
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle6"
                  >
                    <span className="app-piping-text16">
                      {props.text11 ?? (
                        <Fragment>
                          <span className="app-piping-text28">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown5 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle7"
                  >
                    <span className="app-piping-text17">
                      {props.text21 ?? (
                        <Fragment>
                          <span className="app-piping-text27">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-piping-dropdown6 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-piping-dropdown-toggle8"
                  >
                    <span className="app-piping-text18">
                      {props.text31 ?? (
                        <Fragment>
                          <span className="app-piping-text33">
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
          <div className="app-piping-input4">
            <input
              type="text"
              placeholder="Enter pipe insulation thickness"
              className="input-form"
            />
            <span className="app-piping-text19">
              {props.unit112 ?? (
                <Fragment>
                  <span className="app-piping-text25">meters</span>
                </Fragment>
              )}
            </span>
          </div>
          <div className="app-piping-input5">
            <input
              type="text"
              placeholder="Enter pipe spacing (center to center)"
              className="input-form"
            />
            <span className="app-piping-text20">
              {props.unit1121 ?? (
                <Fragment>
                  <span className="app-piping-text26">meters</span>
                </Fragment>
              )}
            </span>
          </div>
        </div>
        <div className="app-piping-save">
          <button type="button" className="app-piping-button save-button">
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
            >
              <path
                d="M30 17H19V6a1 1 0 1 0-2 0v11H6a1 1 0 0 0-1 1a.91.91 0 0 0 1 .94h11V30a1 1 0 1 0 2 0V19h11a1 1 0 0 0 1-1a1 1 0 0 0-1-1"
                fill="currentColor"
                className="clr-i-outline clr-i-outline-path-1"
              ></path>
              <path d="M0 0h36v36H0z" fill="none"></path>
            </svg>
            <span className="app-piping-text22">1</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-piping-icon19"
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
}

export default AppPiping
