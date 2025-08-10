import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import './hero.css'

const Hero = (props) => {
  return (
    <div className={`hero-header1 thq-section-padding ${props.rootClassName} `}>
      <div className="hero-max-width thq-section-max-width">
        <div className="hero-container1 thq-flex-row">
          <div className="hero-column">
            <div className="hero-content">
              <h1 className="hero-heading1 thq-heading-1">
                {props.heading1 ?? (
                  <Fragment>
                    <span className="hero-text1">
                      Interactive Configurator for Prefabricated Assemblies.
                    </span>
                  </Fragment>
                )}
              </h1>
              <p className="hero-content1 thq-body-large">
                {props.content1 ?? (
                  <Fragment>
                    <span className="hero-text3">
                      Configure prefabricated assemblies using AI and Natural
                      language.
                    </span>
                  </Fragment>
                )}
              </p>
            </div>
            <div className="hero-actions">
              <Link to="/login" className="hero-button thq-button-filled">
                <span className="hero-action1 thq-body-small">
                  {props.action1 ?? (
                    <Fragment>
                      <span className="hero-text2">Learn More</span>
                    </Fragment>
                  )}
                </span>
              </Link>
            </div>
          </div>
          <div className="hero-container2">
            <img
              alt={props.image1Alt}
              src={props.image1Src}
              className="hero-image1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

Hero.defaultProps = {
  heading1: undefined,
  action1: undefined,
  content1: undefined,
  image1Src: `${process.env.PUBLIC_URL}/prefab%20software-1400w.png`,
  rootClassName: '',
  image1Alt: 'Image of our team providing services',
}

Hero.propTypes = {
  heading1: PropTypes.element,
  action1: PropTypes.element,
  content1: PropTypes.element,
  image1Src: PropTypes.string,
  rootClassName: PropTypes.string,
  image1Alt: PropTypes.string,
}

export default Hero
