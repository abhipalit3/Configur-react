/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState, useRef, useEffect } from 'react'

import PropTypes from 'prop-types'

import './app-top-main-menu.css'

const AppTopMainMenu = (props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(props.projectName || 'Office Building')
  const inputRef = useRef(null)

  // Update tempName when projectName prop changes
  useEffect(() => {
    setTempName(props.projectName || 'Office Building')
  }, [props.projectName])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEditStart = () => {
    setIsEditing(true)
    setTempName(props.projectName || 'Office Building')
  }

  const handleEditSave = () => {
    const trimmedName = tempName.trim()
    if (trimmedName && props.onProjectNameChange) {
      props.onProjectNameChange(trimmedName)
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setTempName(props.projectName || 'Office Building')
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

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
      {isEditing ? (
        <div className="app-top-main-menu-edit-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 8px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEditSave}
            className="app-top-main-menu-edit-input"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '4px 8px',
              outline: 'none',
              minWidth: '150px',
              fontFamily: 'inherit'
            }}
          />
        </div>
      ) : (
        <h1 
          id="projectName" 
          className="app-top-main-menu-project-name"
          onClick={handleEditStart}
          style={{
            cursor: 'pointer',
            position: 'relative'
          }}
          title="Click to edit project name"
        >
          {props.projectName || 'Office Building'}
          <svg
            style={{
              marginLeft: '8px',
              width: '16px',
              height: '16px',
              verticalAlign: 'middle',
              opacity: 0.5
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </h1>
      )}
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
  projectName: 'Office Building',
  addNewOption: undefined,
  selectedOption: undefined,
  designOption3: undefined,
  designOption1: undefined,
  onProjectNameChange: undefined,
}

AppTopMainMenu.propTypes = {
  designOption2: PropTypes.element,
  rootClassName: PropTypes.string,
  projectName: PropTypes.string,
  addNewOption: PropTypes.element,
  selectedOption: PropTypes.element,
  designOption3: PropTypes.element,
  designOption1: PropTypes.element,
  onProjectNameChange: PropTypes.func,
}

export default AppTopMainMenu
