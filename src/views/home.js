import React, { Fragment } from 'react'

import { Helmet } from 'react-helmet'

import Navbar from '../components/navbar'
import Hero from '../components/hero'
import MultiTradeRacks from '../components/multi-trade-racks'
import Footer from '../components/footer'
import './home.css'

const Home = (props) => {
  return (
    <div className="home-container1">
      <Helmet>
        <title>Configur.</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="Configur." />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta
          property="og:image"
          content="https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/65daf58c-299d-42d6-82f6-b73359b022f2/cd7ee566-11a6-499f-98d9-1e6af02dbe3e?org_if_sml=1&amp;force_format=original"
        />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="home-container2">
        <Navbar
          login2={
            <Fragment>
              <span className="home-text10">Login</span>
            </Fragment>
          }
          login3={
            <Fragment>
              <span className="home-text11">Login</span>
            </Fragment>
          }
          text10={
            <Fragment>
              <span className="home-text12">Home</span>
            </Fragment>
          }
          text11={
            <Fragment>
              <span className="home-text13">Features</span>
            </Fragment>
          }
          text12={
            <Fragment>
              <span className="home-text14">About</span>
            </Fragment>
          }
          text15={
            <Fragment>
              <span className="home-text15">About</span>
            </Fragment>
          }
          text16={
            <Fragment>
              <span className="home-text16">Features</span>
            </Fragment>
          }
          text17={
            <Fragment>
              <span className="home-text17">Pricing</span>
            </Fragment>
          }
          text18={
            <Fragment>
              <span className="home-text18">Team</span>
            </Fragment>
          }
          text19={
            <Fragment>
              <span className="home-text19">Blog</span>
            </Fragment>
          }
          register2={
            <Fragment>
              <span className="home-text20">Register</span>
            </Fragment>
          }
          register3={
            <Fragment>
              <span className="home-text21">Register</span>
            </Fragment>
          }
          rootClassName="navbarroot-class-name"
        ></Navbar>
        <Hero
          action1={
            <Fragment>
              <span className="home-text22">Learn More</span>
            </Fragment>
          }
          content1={
            <Fragment>
              <span className="home-text23">
                Configure prefabricated assemblies using AI and Natural
                language.
              </span>
            </Fragment>
          }
          heading1={
            <Fragment>
              <span className="home-text24">
                Interactive Configurator for Prefabricated Assemblies.
              </span>
            </Fragment>
          }
          rootClassName="heroroot-class-name"
        ></Hero>
        <MultiTradeRacks
          feature1Title={
            <Fragment>
              <span className="home-text25">
                Prefabricated Multi Trade Racks
              </span>
            </Fragment>
          }
          rootClassName="multi-trade-racksroot-class-name"
          feature1Slogan={
            <Fragment>
              <span className="home-text26">
                Design Modular Multi-Trade Racks for MEP systems.
              </span>
            </Fragment>
          }
          feature1ImageSrc="/mtricon-800w.png"
          feature1MainAction={
            <Fragment>
              <span className="home-text27">Configure Now</span>
            </Fragment>
          }
          feature1Description={
            <Fragment>
              <span className="home-text28">
                Prefabricated multi-trade racks are modular frames built offsite
                that integrate HVAC, electrical, and plumbing systems for
                faster, more efficient construction. They streamline onsite
                installation, reduce labor costs, and improve safety and
                quality.
              </span>
            </Fragment>
          }
          feature1SecondaryAction={
            <Fragment>
              <span className="home-text29">Learn More</span>
            </Fragment>
          }
        ></MultiTradeRacks>
        <Footer
          termsLink={
            <Fragment>
              <span className="home-text30">/terms</span>
            </Fragment>
          }
          cookiesLink={
            <Fragment>
              <span className="home-text31">/cookies</span>
            </Fragment>
          }
          privacyLink={
            <Fragment>
              <span className="home-text32">/privacy</span>
            </Fragment>
          }
          rootClassName="footerroot-class-name"
        ></Footer>
      </div>
    </div>
  )
}

export default Home
