/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import './sign-in.css'

const SignIn = (props) => {
  return (
    <div className="sign-in-container1">
      <div className="sign-in-max-width thq-section-max-width">
        <div className="sign-in-container2">
          <img
            alt={props.image1Alt}
            src={props.image1Src}
            className="sign-in-sign-up-image thq-img-ratio-4-6"
          />
        </div>
        <div className="sign-in-form-root thq-section-padding">
          <div className="sign-in-container3">
            <p className="sign-in-text10 thq-body-large">
              <span>
                Don&apos;t have an account?
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
              <Link to="/signup-page" className="sign-in-navlink">
                Sign up
              </Link>
            </p>
          </div>
          <div className="sign-in-form1">
            <h2 className="sign-in-text12 thq-heading-2">
              {props.heading1 ?? (
                <Fragment>
                  <span className="sign-in-text21">
                    Sign In to Start Designing Your Prefabricated Assembly
                  </span>
                </Fragment>
              )}
            </h2>
            <form className="sign-in-form2">
              <div className="sign-in-email">
                <label htmlFor="thq-sign-in-6-email" className="thq-body-large">
                  Email
                </label>
                <input
                  type="email"
                  id="thq-sign-in-6-email"
                  required="true"
                  placeholder="Email address"
                  className="sign-in-textinput1 thq-body-large thq-input"
                />
              </div>
              <div className="sign-in-password">
                <div className="sign-in-textfield">
                  <div className="sign-in-container4">
                    <label
                      htmlFor="thq-sign-in-6-password"
                      className="thq-body-large"
                    >
                      Password
                    </label>
                    <div className="sign-in-hide-password teleport-show">
                      <svg viewBox="0 0 1024 1024" className="sign-in-icon1">
                        <path d="M317.143 762.857l44.571-80.571c-66.286-48-105.714-125.143-105.714-206.857 0-45.143 12-89.714 34.857-128.571-89.143 45.714-163.429 117.714-217.714 201.714 59.429 92 143.429 169.143 244 214.286zM539.429 329.143c0-14.857-12.571-27.429-27.429-27.429-95.429 0-173.714 78.286-173.714 173.714 0 14.857 12.571 27.429 27.429 27.429s27.429-12.571 27.429-27.429c0-65.714 53.714-118.857 118.857-118.857 14.857 0 27.429-12.571 27.429-27.429zM746.857 220c0 1.143 0 4-0.571 5.143-120.571 215.429-240 432-360.571 647.429l-28 50.857c-3.429 5.714-9.714 9.143-16 9.143-10.286 0-64.571-33.143-76.571-40-5.714-3.429-9.143-9.143-9.143-16 0-9.143 19.429-40 25.143-49.714-110.857-50.286-204-136-269.714-238.857-7.429-11.429-11.429-25.143-11.429-39.429 0-13.714 4-28 11.429-39.429 113.143-173.714 289.714-289.714 500.571-289.714 34.286 0 69.143 3.429 102.857 9.714l30.857-55.429c3.429-5.714 9.143-9.143 16-9.143 10.286 0 64 33.143 76 40 5.714 3.429 9.143 9.143 9.143 15.429zM768 475.429c0 106.286-65.714 201.143-164.571 238.857l160-286.857c2.857 16 4.571 32 4.571 48zM1024 548.571c0 14.857-4 26.857-11.429 39.429-17.714 29.143-40 57.143-62.286 82.857-112 128.571-266.286 206.857-438.286 206.857l42.286-75.429c166.286-14.286 307.429-115.429 396.571-253.714-42.286-65.714-96.571-123.429-161.143-168l36-64c70.857 47.429 142.286 118.857 186.857 192.571 7.429 12.571 11.429 24.571 11.429 39.429z"></path>
                      </svg>
                      <span className="thq-body-small">Hide</span>
                    </div>
                  </div>
                  <input
                    type="password"
                    id="thq-sign-in-6-password"
                    required="true"
                    placeholder="Password"
                    className="sign-in-textinput2 thq-body-large thq-input"
                  />
                </div>
                <span className="sign-in-text16 thq-body-small">
                  Forgot password
                </span>
              </div>
            </form>
            <Link to="/projects" className="sign-in-button1 thq-button-filled">
              <span className="sign-in-text17 thq-body-small">
                {props.action1 ?? (
                  <Fragment>
                    <span className="sign-in-text22">Sign In</span>
                  </Fragment>
                )}
              </span>
            </Link>
            <div className="sign-in-divider1">
              <div className="sign-in-divider2"></div>
              <p className="thq-body-large">OR</p>
              <div className="sign-in-divider3"></div>
            </div>
            <div className="sign-in-container5">
              <button className="sign-in-button2 thq-button-outline">
                <svg
                  viewBox="0 0 877.7142857142857 1024"
                  className="sign-in-icon3"
                >
                  <path d="M713.143 73.143c90.857 0 164.571 73.714 164.571 164.571v548.571c0 90.857-73.714 164.571-164.571 164.571h-107.429v-340h113.714l17.143-132.571h-130.857v-84.571c0-38.286 10.286-64 65.714-64l69.714-0.571v-118.286c-12-1.714-53.714-5.143-101.714-5.143-101.143 0-170.857 61.714-170.857 174.857v97.714h-114.286v132.571h114.286v340h-304c-90.857 0-164.571-73.714-164.571-164.571v-548.571c0-90.857 73.714-164.571 164.571-164.571h548.571z"></path>
                </svg>
                <span className="thq-body-small">Continue with Facebook</span>
              </button>
              <button className="sign-in-button3 thq-button-outline">
                <svg
                  viewBox="0 0 860.0137142857142 1024"
                  className="sign-in-icon5"
                >
                  <path d="M438.857 449.143h414.286c4 22.286 6.857 44 6.857 73.143 0 250.286-168 428.571-421.143 428.571-242.857 0-438.857-196-438.857-438.857s196-438.857 438.857-438.857c118.286 0 217.714 43.429 294.286 114.857l-119.429 114.857c-32.571-31.429-89.714-68-174.857-68-149.714 0-272 124-272 277.143s122.286 277.143 272 277.143c173.714 0 238.857-124.571 249.143-189.143h-249.143v-150.857z"></path>
                </svg>
                <span className="thq-body-small">Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

SignIn.defaultProps = {
  heading1: undefined,
  image1Alt: 'Sign In Image',
  image1Src: `${process.env.PUBLIC_URL}/public/prefab software1.png`,
  action1: undefined,
}

SignIn.propTypes = {
  heading1: PropTypes.element,
  image1Alt: PropTypes.string,
  image1Src: PropTypes.string,
  action1: PropTypes.element,
}

export default SignIn
