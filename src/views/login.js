import React, { Fragment } from 'react'

import { Helmet } from 'react-helmet'

import Navbar from '../components/navbar'
import SignIn from '../components/sign-in'
import Footer from '../components/footer'
import './login.css'

const Login = (props) => {
  return (
    <div className="login-container">
      <Helmet>
        <title>Login - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="Login - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta
          property="og:image"
          content="https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/c2f523c4-1052-4b1f-a02c-6092fc874a71?org_if_sml=1&amp;force_format=original"
        />
      </Helmet>
      <Navbar
        login2={
          <Fragment>
            <span className="login-text10">Login</span>
          </Fragment>
        }
        login3={
          <Fragment>
            <span className="login-text11">Login</span>
          </Fragment>
        }
        text10={
          <Fragment>
            <span className="login-text12">Home</span>
          </Fragment>
        }
        text11={
          <Fragment>
            <span className="login-text13">Features</span>
          </Fragment>
        }
        text12={
          <Fragment>
            <span className="login-text14">About</span>
          </Fragment>
        }
        text15={
          <Fragment>
            <span className="login-text15">About</span>
          </Fragment>
        }
        text16={
          <Fragment>
            <span className="login-text16">Features</span>
          </Fragment>
        }
        text17={
          <Fragment>
            <span className="login-text17">Pricing</span>
          </Fragment>
        }
        text18={
          <Fragment>
            <span className="login-text18">Team</span>
          </Fragment>
        }
        text19={
          <Fragment>
            <span className="login-text19">Blog</span>
          </Fragment>
        }
        register2={
          <Fragment>
            <span className="login-text20">Register</span>
          </Fragment>
        }
        register3={
          <Fragment>
            <span className="login-text21">Register</span>
          </Fragment>
        }
        rootClassName="navbarroot-class-name1"
      ></Navbar>
      <SignIn
        action1={
          <Fragment>
            <span className="login-text22">Sign In</span>
          </Fragment>
        }
        heading1={
          <Fragment>
            <span className="login-text23">
              Sign In to Start Designing Your Prefabricated Assembly
            </span>
          </Fragment>
        }
        image1Src="/prefab%20software-1400w.png"
      ></SignIn>
      <Footer
        termsLink={
          <Fragment>
            <span className="login-text24">/terms</span>
          </Fragment>
        }
        cookiesLink={
          <Fragment>
            <span className="login-text25">/cookies</span>
          </Fragment>
        }
        privacyLink={
          <Fragment>
            <span className="login-text26">/privacy</span>
          </Fragment>
        }
        rootClassName="footerroot-class-name1"
      ></Footer>
    </div>
  )
}

export default Login
