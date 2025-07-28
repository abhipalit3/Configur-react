import React, { Fragment } from 'react'

import { Helmet } from 'react-helmet'

import Navbar from '../components/navbar'
import SignUp from '../components/sign-up'
import Footer from '../components/footer'
import './signup-page.css'

const SignupPage = (props) => {
  return (
    <div className="signup-page-container">
      <Helmet>
        <title>SignupPage - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="SignupPage - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta
          property="og:image"
          content="https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/e1776285-66ee-46b5-85d0-48da31429f87?org_if_sml=1&amp;force_format=original"
        />
      </Helmet>
      <Navbar
        login2={
          <Fragment>
            <span className="signup-page-text10">Login</span>
          </Fragment>
        }
        login3={
          <Fragment>
            <span className="signup-page-text11">Login</span>
          </Fragment>
        }
        text10={
          <Fragment>
            <span className="signup-page-text12">Home</span>
          </Fragment>
        }
        text11={
          <Fragment>
            <span className="signup-page-text13">Features</span>
          </Fragment>
        }
        text12={
          <Fragment>
            <span className="signup-page-text14">About</span>
          </Fragment>
        }
        text15={
          <Fragment>
            <span className="signup-page-text15">About</span>
          </Fragment>
        }
        text16={
          <Fragment>
            <span className="signup-page-text16">Features</span>
          </Fragment>
        }
        text17={
          <Fragment>
            <span className="signup-page-text17">Pricing</span>
          </Fragment>
        }
        text18={
          <Fragment>
            <span className="signup-page-text18">Team</span>
          </Fragment>
        }
        text19={
          <Fragment>
            <span className="signup-page-text19">Blog</span>
          </Fragment>
        }
        register2={
          <Fragment>
            <span className="signup-page-text20">Register</span>
          </Fragment>
        }
        register3={
          <Fragment>
            <span className="signup-page-text21">Register</span>
          </Fragment>
        }
        rootClassName="navbarroot-class-name2"
      ></Navbar>
      <SignUp
        action1={
          <Fragment>
            <span className="signup-page-text22">Create an account</span>
          </Fragment>
        }
        heading1={
          <Fragment>
            <span className="signup-page-text23">Create an account</span>
          </Fragment>
        }
        rootClassName="sign-uproot-class-name"
      ></SignUp>
      <Footer
        termsLink={
          <Fragment>
            <span className="signup-page-text24">/terms</span>
          </Fragment>
        }
        cookiesLink={
          <Fragment>
            <span className="signup-page-text25">/cookies</span>
          </Fragment>
        }
        privacyLink={
          <Fragment>
            <span className="signup-page-text26">/privacy</span>
          </Fragment>
        }
        rootClassName="footerroot-class-name2"
      ></Footer>
    </div>
  )
}

export default SignupPage
