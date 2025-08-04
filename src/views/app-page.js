import React, { Fragment } from 'react'

import { Helmet } from 'react-helmet'

import AppTopMainMenu from '../components/app-top-main-menu'
import AppButtonLeftMenu from '../components/app-button-left-menu'
import AppRackProperties from '../components/app-rack-properties'
import AppTierMEP from '../components/app-tier-mep'
import AppAddMEP from '../components/app-add-mep'
import AppAIChatPanel from '../components/app-ai-chat-panel'
import AppManualBuilding from '../components/app-manual-building'
import AppDuctwork from '../components/app-ductwork'
import AppPiping from '../components/app-piping'
import AppConduits from '../components/app-conduits'
import AppCableTrays from '../components/app-cable-trays'
import AppBottomOptions from '../components/app-bottom-options'
import ThreeScene from '../components/trade-rack/three-scene'
import './app-page.css'

const AppPage = (props) => {
  return (
    <div className="app-page-container">
      <Helmet>
        <title>AppPage - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="AppPage - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
      </Helmet>

      <AppTopMainMenu rootClassName="app-top-main-menuroot-class-name1" />
      
      <AppButtonLeftMenu rootClassName="app-button-left-menuroot-class-name1" />

      <div className="app-page-right-menus">
        <AppRackProperties rootClassName="app-rack-propertiesroot-class-name2" />
        <AppTierMEP rootClassName="app-tier-me-proot-class-name" />
        <AppAddMEP rootClassName="app-add-me-proot-class-name" />
      </div>
      
      <AppAIChatPanel rootClassName="app-ai-chat-panelroot-class-name1" />

      <AppManualBuilding rootClassName="app-manual-buildingroot-class-name1" />

      <AppDuctwork rootClassName="app-ductworkroot-class-name" />

      <AppPiping rootClassName="app-pipingroot-class-name" />

      <AppConduits rootClassName="app-conduitsroot-class-name" />

      <AppCableTrays rootClassName="app-cable-traysroot-class-name" />

      <AppBottomOptions rootClassName="app-bottom-optionsroot-class-name" />
      
      <ThreeScene />
    </div>
  )
}

export default AppPage
