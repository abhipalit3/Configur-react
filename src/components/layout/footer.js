/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './footer.css'

const Footer = (props) => {
  return (
    <footer
      className={`footer-footer7 thq-section-padding ${props.rootClassName} `}
    >
      <div className="footer-max-width thq-section-max-width">
        <div className="footer-credits">
          <div className="thq-divider-horizontal"></div>
          <div className="footer-row">
            <div className="footer-container">
              <span className="footer-text1 thq-body-small">
                © 2025 configur.
              </span>
            </div>
            <div className="footer-footer-links">
              <span className="footer-text2 thq-body-small">
                {props.privacyLink ?? (
                  <Fragment>
                    <span className="footer-text6">/privacy</span>
                  </Fragment>
                )}
              </span>
              <span className="footer-text3 thq-body-small">
                {props.termsLink ?? (
                  <Fragment>
                    <span className="footer-text7">/terms</span>
                  </Fragment>
                )}
              </span>
              <span className="footer-text4 thq-body-small">
                {props.cookiesLink ?? (
                  <Fragment>
                    <span className="footer-text5">/cookies</span>
                  </Fragment>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

Footer.defaultProps = {
  cookiesLink: undefined,
  privacyLink: undefined,
  termsLink: undefined,
  rootClassName: '',
}

Footer.propTypes = {
  cookiesLink: PropTypes.element,
  privacyLink: PropTypes.element,
  termsLink: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default Footer
