import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import './multi-trade-racks.css'

const MultiTradeRacks = (props) => {
  return (
    <div
      className={`multi-trade-racks-layout226 thq-section-padding ${props.rootClassName} `}
    >
      <Link to="/login" className="multi-trade-racks-navlink">
        <div className="multi-trade-racks-max-width thq-section-max-width">
          <div className="multi-trade-racks-column thq-flex-column">
            <img
              alt={props.feature1ImageAlt}
              src={props.feature1ImageSrc}
              className="multi-trade-racks-icon1 thq-img-ratio-4-3"
            />
            <div className="multi-trade-racks-section-title thq-flex-column">
              <span className="multi-trade-racks-over-title1 thq-body-small">
                {props.feature1Slogan ?? (
                  <Fragment>
                    <span className="multi-trade-racks-text2">
                      Design Modular Multi-Trade Racks for MEP systems.
                    </span>
                  </Fragment>
                )}
              </span>
              <div className="multi-trade-racks-content thq-flex-column">
                <h3 className="multi-trade-racks-title1 thq-heading-3">
                  {props.feature1Title ?? (
                    <Fragment>
                      <span className="multi-trade-racks-text3">
                        Prefabricated Multi Trade Racks
                      </span>
                    </Fragment>
                  )}
                </h3>
                <span className="multi-trade-racks-description1 thq-body-small">
                  {props.feature1Description ?? (
                    <Fragment>
                      <span className="multi-trade-racks-text5">
                        Prefabricated multi-trade racks are modular frames built
                        offsite that integrate HVAC, electrical, and plumbing
                        systems for faster, more efficient construction. They
                        streamline onsite installation, reduce labor costs, and
                        improve safety and quality.
                      </span>
                    </Fragment>
                  )}
                </span>
              </div>
              <div className="thq-flex-row multi-trade-racks-actions">
                <button className="thq-button-filled multi-trade-racks-button1">
                  <span className="multi-trade-racks-action1 thq-body-small">
                    {props.feature1MainAction ?? (
                      <Fragment>
                        <span className="multi-trade-racks-text4">
                          Configure Now
                        </span>
                      </Fragment>
                    )}
                  </span>
                </button>
                <button className="thq-button-outline multi-trade-racks-button2">
                  <span className="multi-trade-racks-action2 thq-body-small">
                    {props.feature1SecondaryAction ?? (
                      <Fragment>
                        <span className="multi-trade-racks-text1">
                          Learn More
                        </span>
                      </Fragment>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

MultiTradeRacks.defaultProps = {
  feature1ImageSrc: '/prefab%20software-1400w.png',
  feature1ImageAlt: 'Tailored Professional Services Image',
  rootClassName: '',
  feature1SecondaryAction: undefined,
  feature1Slogan: undefined,
  feature1Title: undefined,
  feature1MainAction: undefined,
  feature1Description: undefined,
}

MultiTradeRacks.propTypes = {
  feature1ImageSrc: PropTypes.string,
  feature1ImageAlt: PropTypes.string,
  rootClassName: PropTypes.string,
  feature1SecondaryAction: PropTypes.element,
  feature1Slogan: PropTypes.element,
  feature1Title: PropTypes.element,
  feature1MainAction: PropTypes.element,
  feature1Description: PropTypes.element,
}

export default MultiTradeRacks
