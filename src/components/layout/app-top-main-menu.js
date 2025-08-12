/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-top-main-menu.css'

const AppTopMainMenu = (props) => {
  return (
    <div className={`app-top-main-menu-container ${props.rootClassName} `}>
      <div className="app-top-main-menu-menu">
        <svg
          id="MenuIcon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="app-top-main-menu-menu-icon"
        >
          <path
            d="M3 5h18M3 12h18M3 19h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <hr className="app-top-main-menu-separator1"></hr>
      </div>
      <h1 id="projectName" className="app-top-main-menu-project-name">
        {props.projectName ?? (
          <Fragment>
            <span className="app-top-main-menu-text16">Office Building</span>
          </Fragment>
        )}
      </h1>
      <hr className="app-top-main-menu-separator2"></hr>
      <div
        data-thq="thq-dropdown"
        className="app-top-main-menu-design-options list-item"
      >
        <div
          data-thq="thq-dropdown-toggle"
          className="app-top-main-menu-dropdown-toggle1"
        >
          <span className="app-top-main-menu-text10">
            {props.selectedOption ?? (
              <Fragment>
                <span className="app-top-main-menu-text18">Option 1</span>
              </Fragment>
            )}
          </span>
          <div
            data-thq="thq-dropdown-arrow"
            className="app-top-main-menu-dropdown-arrow"
          >
            <svg viewBox="0 0 1024 1024" className="app-top-main-menu-icon2">
              <path d="M426 726v-428l214 214z"></path>
            </svg>
          </div>
        </div>
        <ul
          data-thq="thq-dropdown-list"
          className="app-top-main-menu-dropdown-list"
        >
          <li
            data-thq="thq-dropdown"
            className="app-top-main-menu-design-option1 list-item"
          >
            <div
              data-thq="thq-dropdown-toggle"
              className="app-top-main-menu-dropdown-toggle2"
            >
              <span className="app-top-main-menu-text11">
                {props.designOption1 ?? (
                  <Fragment>
                    <span className="app-top-main-menu-text20">
                      Design Option 1
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </li>
          <li
            data-thq="thq-dropdown"
            className="app-top-main-menu-dropdown1 list-item"
          >
            <div
              data-thq="thq-dropdown-toggle"
              className="app-top-main-menu-dropdown-toggle3"
            >
              <span className="app-top-main-menu-text12">
                {props.designOption2 ?? (
                  <Fragment>
                    <span className="app-top-main-menu-text15">
                      Design Option 2
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </li>
          <li
            data-thq="thq-dropdown"
            className="app-top-main-menu-dropdown2 list-item"
          >
            <div
              data-thq="thq-dropdown-toggle"
              className="app-top-main-menu-dropdown-toggle4"
            >
              <span className="app-top-main-menu-text13">
                {props.designOption3 ?? (
                  <Fragment>
                    <span className="app-top-main-menu-text19">
                      Design Option 3
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </li>
          <li
            data-thq="thq-dropdown"
            className="app-top-main-menu-dropdown3 list-item"
          >
            <div
              data-thq="thq-dropdown-toggle"
              className="app-top-main-menu-dropdown-toggle5"
            >
              <span className="app-top-main-menu-text14">
                {props.addNewOption ?? (
                  <Fragment>
                    <span className="app-top-main-menu-text17">+ Add New</span>
                  </Fragment>
                )}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

AppTopMainMenu.defaultProps = {
  designOption2: undefined,
  rootClassName: '',
  projectName: undefined,
  addNewOption: undefined,
  selectedOption: undefined,
  designOption3: undefined,
  designOption1: undefined,
}

AppTopMainMenu.propTypes = {
  designOption2: PropTypes.element,
  rootClassName: PropTypes.string,
  projectName: PropTypes.element,
  addNewOption: PropTypes.element,
  selectedOption: PropTypes.element,
  designOption3: PropTypes.element,
  designOption1: PropTypes.element,
}

export default AppTopMainMenu
