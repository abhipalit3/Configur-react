/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
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
          />
        </svg>
        <hr className="app-top-main-menu-separator1" />
      </div>

      <label className="app-top-main-menu-product-type" title="Product type">
        <span className="app-top-main-menu-product-label">Product</span>
        <select
          className="app-top-main-menu-product-select"
          value={props.productType || 'mtr'}
          onChange={(event) => props.onProductTypeChange?.(event.target.value)}
        >
          <option value="mtr">MTR</option>
          <option value="bathroomPod">Bathroom Pod</option>
        </select>
      </label>

      <hr className="app-top-main-menu-separator-product" />

      <div className="app-top-main-menu-project-name" title={props.projectName || 'Project'}>
        {props.projectName || 'Project'}
      </div>

      <hr className="app-top-main-menu-separator2" />

      <div className="app-top-main-menu-actions">
        <button
          type="button"
          className="app-top-main-menu-project-button"
          onClick={props.onSelectProject}
        >
          Select Project
        </button>
      </div>
    </div>
  )
}

AppTopMainMenu.defaultProps = {
  rootClassName: '',
  projectName: 'Project',
  productType: 'mtr',
  onProductTypeChange: undefined,
  onSelectProject: undefined
}

AppTopMainMenu.propTypes = {
  rootClassName: PropTypes.string,
  projectName: PropTypes.string,
  productType: PropTypes.oneOf(['mtr', 'bathroomPod']),
  onProductTypeChange: PropTypes.func,
  onSelectProject: PropTypes.func
}

export default AppTopMainMenu
