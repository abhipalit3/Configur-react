import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './logo-app.css'

const LogoApp = (props) => {
  return (
    <div className={`logo-app-container ${props.rootClassName} `}>
      <img
        alt={props.image1Alt}
        src={props.image1Src}
        className="logo-app-image1 thq-button-icon"
      />
      <span className="logo-app-text1 thq-button-icon">
        {props.text ?? (
          <Fragment>
            <span className="logo-app-text2">configur.</span>
          </Fragment>
        )}
      </span>
    </div>
  )
}

LogoApp.defaultProps = {
  image1Src:
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/a95ba6e3-8199-4d17-959b-05cdd404acaf?org_if_sml=1&force_format=original',
  image1Alt: 'Company Logo',
  text: undefined,
  rootClassName: '',
}

LogoApp.propTypes = {
  image1Src: PropTypes.string,
  image1Alt: PropTypes.string,
  text: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default LogoApp
