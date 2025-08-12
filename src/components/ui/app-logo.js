/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-logo.css'

const AppLogo = (props) => {
  return (
    <div className={`app-logo-container ${props.rootClassName} `}>
      <img
        alt={props.image1Alt}
        src={props.image1Src}
        className="app-logo-image1 thq-button-icon"
      />
      <span className="app-logo-text1 thq-button-icon">
        {props.text ?? (
          <Fragment>
            <span className="app-logo-text2">configur.</span>
          </Fragment>
        )}
      </span>
    </div>
  )
}

AppLogo.defaultProps = {
  image1Src:
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/a95ba6e3-8199-4d17-959b-05cdd404acaf?org_if_sml=1&force_format=original',
  image1Alt: 'Company Logo',
  text: undefined,
  rootClassName: '',
}

AppLogo.propTypes = {
  image1Src: PropTypes.string,
  image1Alt: PropTypes.string,
  text: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default AppLogo
