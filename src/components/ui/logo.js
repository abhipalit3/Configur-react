import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import './logo.css'

const Logo = (props) => {
  return (
    <Link to="/" className="logo-navlink">
      <div className={`logo-container ${props.rootClassName} `}>
        <img
          alt={props.image1Alt}
          src={props.image1Src}
          className="logo-image1 thq-button-icon"
        />
        <span className="logo-text1 thq-button-icon">
          {props.text ?? (
            <Fragment>
              <span className="logo-text2">configur.</span>
            </Fragment>
          )}
        </span>
      </div>
    </Link>
  )
}

Logo.defaultProps = {
  image1Alt: 'Company Logo',
  text: undefined,
  image1Src: `${process.env.PUBLIC_URL}/external/3d-cube-1500h-200h.png`,
  rootClassName: '',
}

Logo.propTypes = {
  image1Alt: PropTypes.string,
  text: PropTypes.element,
  image1Src: PropTypes.string,
  rootClassName: PropTypes.string,
}

export default Logo
