import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './logo-projects.css'

const LogoProjects = (props) => {
  return (
    <div className={`logo-projects-container ${props.rootClassName} `}>
      <img
        alt={props.image1Alt}
        src={props.image1Src}
        className="logo-projects-image1 thq-button-icon"
      />
      <span className="logo-projects-text1 thq-button-icon">
        {props.text ?? (
          <Fragment>
            <span className="logo-projects-text2">configur.</span>
          </Fragment>
        )}
      </span>
    </div>
  )
}

LogoProjects.defaultProps = {
  text: undefined,
  rootClassName: '',
  image1Src:
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/a95ba6e3-8199-4d17-959b-05cdd404acaf?org_if_sml=1&force_format=original',
  image1Alt: 'Company Logo',
}

LogoProjects.propTypes = {
  text: PropTypes.element,
  rootClassName: PropTypes.string,
  image1Src: PropTypes.string,
  image1Alt: PropTypes.string,
}

export default LogoProjects
