import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-conduits.css'

const AppConduits = (props) => {
  return (
    <div className={`app-conduits-container1 ${props.rootClassName} `}>
      <div className="app-conduits-heading">
        <h1 className="heading"> Add Conduit Group</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-conduits-icon10 button-icon"
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
                  {props.conduitType ?? (
                    <Fragment>
                      <span className="app-conduits-text23">
                        Select Conduit Type
                      </span>
                    </Fragment>
                  )}
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
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle2"
                  >
                    <span className="app-conduits-text12">
                      {props.conduitType1 ?? (
                        <Fragment>
                          <span className="app-conduits-text27">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown2 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle3"
                  >
                    <span className="app-conduits-text13">
                      {props.conduitType2 ?? (
                        <Fragment>
                          <span className="app-conduits-text30">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown3 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle4"
                  >
                    <span className="app-conduits-text14">
                      {props.conduitType3 ?? (
                        <Fragment>
                          <span className="app-conduits-text24">
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
                  {props.conduitDiameter ?? (
                    <Fragment>
                      <span className="app-conduits-text28">
                        Select Conduit Outside Diameter
                      </span>
                    </Fragment>
                  )}
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
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle6"
                  >
                    <span className="app-conduits-text16">
                      {props.conduitDia1 ?? (
                        <Fragment>
                          <span className="app-conduits-text22">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown5 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle7"
                  >
                    <span className="app-conduits-text17">
                      {props.conduitDia2 ?? (
                        <Fragment>
                          <span className="app-conduits-text26">
                            Sub-menu Item
                          </span>
                        </Fragment>
                      )}
                    </span>
                  </div>
                </li>
                <li
                  data-thq="thq-dropdown"
                  className="app-conduits-dropdown6 list-item"
                >
                  <div
                    data-thq="thq-dropdown-toggle"
                    className="app-conduits-dropdown-toggle8"
                  >
                    <span className="app-conduits-text18">
                      {props.conduitDia3 ?? (
                        <Fragment>
                          <span className="app-conduits-text29">
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
          <div className="app-conduits-input4">
            <input
              type="text"
              placeholder="Enter conduit spacing (center to center)"
              className="input-form"
            />
            <span className="app-conduits-text19">meters</span>
          </div>
        </div>
        <div className="app-conduits-save">
          <button type="button" className="app-conduits-button save-button">
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
            >
              <path
                d="M30 17H19V6a1 1 0 1 0-2 0v11H6a1 1 0 0 0-1 1a.91.91 0 0 0 1 .94h11V30a1 1 0 1 0 2 0V19h11a1 1 0 0 0 1-1a1 1 0 0 0-1-1"
                fill="currentColor"
                className="clr-i-outline clr-i-outline-path-1"
              ></path>
              <path d="M0 0h36v36H0z" fill="none"></path>
            </svg>
            <span className="app-conduits-text21">1</span>
            <svg
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
              className="app-conduits-icon19"
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
}

export default AppConduits
