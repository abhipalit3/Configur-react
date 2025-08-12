/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-bottom-options.css'

const AppBottomOptions = (props) => {
  const { onMeasurementClick, isMeasurementActive, onClearMeasurements, onViewModeChange, onFitView, initialViewMode = '3D' } = props
  const [viewMode, setViewMode] = useState(initialViewMode) // Use passed initial view mode
  
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    if (onViewModeChange) {
      onViewModeChange(mode)
    }
  }
  
  return (
    <div className={`app-bottom-options-wrapper ${props.rootClassName}`}>
      {/* Clear measurements button - appears above measurement tool when active */}
      {isMeasurementActive && (
        <button
          type="button"
          className="app-bottom-options-clear-measurements-button"
          onClick={onClearMeasurements}
          title="Clear all measurements"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="app-bottom-options-clear-icon"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6"
            />
          </svg>
        </button>
      )}
      
      <div className="app-bottom-options-container">
        <button
        id="2DViewButton"
        type="button"
        className={`app-bottom-options-two-d-view-buton button-icon2 ${viewMode === '2D' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('2D')}
      >
        <span className="app-bottom-options-text1">
          {props.text1 ?? (
            <Fragment>
              <span className="app-bottom-options-text4">2D</span>
            </Fragment>
          )}
        </span>
      </button>
      <button
        id="3DViewButton"
        type="button"
        className={`app-bottom-options-three-d-view-button button-icon2 ${viewMode === '3D' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('3D')}
      >
        <span className="app-bottom-options-text2">
          {props.text11 ?? (
            <Fragment>
              <span className="app-bottom-options-text3">3D</span>
            </Fragment>
          )}
        </span>
      </button>
      <button
        id="FitViewButton"
        type="button"
        className="app-bottom-options-fit-view-button button-icon2"
        onClick={onFitView}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="app-bottom-options-icon1 button2-icon"
        >
          <path
            d="M8 4H4m0 0v4m0-4l5 5m7-5h4m0 0v4m0-4l-5 5M8 20H4m0 0v-4m0 4l5-5m7 5h4m0 0v-4m0 4l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
      <button
        id="MeasureButton"
        type="button"
        className={`app-bottom-options-measure-button button-icon2 ${isMeasurementActive ? 'active' : ''}`}
        onClick={onMeasurementClick}
      >
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          className={`app-bottom-options-icon3 button2-icon ${isMeasurementActive ? 'active' : ''}`}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 19.875c0 .621-.512 1.125-1.143 1.125H5.143A1.134 1.134 0 0 1 4 19.875V4a1 1 0 0 1 1-1h5.857C11.488 3 12 3.504 12 4.125zM12 9h-2m2-3H9m3 6H9m3 6H9m3-3h-2M21 3h-4m2 0v18m2 0h-4"
          ></path>
        </svg>
      </button>
      </div>
    </div>
  )
}

AppBottomOptions.defaultProps = {
  text11: undefined,
  text1: undefined,
  rootClassName: '',
  onMeasurementClick: () => {},
  isMeasurementActive: false,
  onClearMeasurements: () => {},
  onViewModeChange: () => {},
  onFitView: () => {},
  initialViewMode: '3D',
}

AppBottomOptions.propTypes = {
  text11: PropTypes.element,
  text1: PropTypes.element,
  rootClassName: PropTypes.string,
  onMeasurementClick: PropTypes.func,
  isMeasurementActive: PropTypes.bool,
  onClearMeasurements: PropTypes.func,
  onViewModeChange: PropTypes.func,
  onFitView: PropTypes.func,
  initialViewMode: PropTypes.string,
}

export default AppBottomOptions