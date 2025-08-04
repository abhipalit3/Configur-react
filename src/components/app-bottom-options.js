import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-bottom-options.css'

const AppBottomOptions = (props) => {
  return (
    <div className={`app-bottom-options-container ${props.rootClassName} `}>
      <button
        id="2DViewButton"
        type="button"
        className="app-bottom-options-two-d-view-buton button-icon2"
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
        id="BuildingPropButton"
        type="button"
        className="app-bottom-options-three-d-view-button button-icon2"
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
        id="BuildingPropButton"
        type="button"
        className="app-bottom-options-fit-view-button button-icon2"
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
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
      </button>
      <button
        id="BuildingPropButton"
        type="button"
        className="app-bottom-options-measure-button button-icon2"
      >
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          className="app-bottom-options-icon3 button2-icon"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19.875c0 .621-.512 1.125-1.143 1.125H5.143A1.134 1.134 0 0 1 4 19.875V4a1 1 0 0 1 1-1h5.857C11.488 3 12 3.504 12 4.125zM12 9h-2m2-3H9m3 6H9m3 6H9m3-3h-2M21 3h-4m2 0v18m2 0h-4"
          ></path>
        </svg>
      </button>
      <button
        id="BuildingPropButton"
        type="button"
        className="app-bottom-options-templates-button button-icon2"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-bottom-options-icon5 button2-icon"
        >
          <path
            d="M26 6v4H6V6zm0-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M10 16v10H6V16zm0-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2m16 2v10H16V16zm0-2H16a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>
  )
}

AppBottomOptions.defaultProps = {
  text11: undefined,
  text1: undefined,
  rootClassName: '',
}

AppBottomOptions.propTypes = {
  text11: PropTypes.element,
  text1: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default AppBottomOptions
