// src/pages/app-page.jsx
import React, { Fragment, useState } from 'react'
import { Helmet } from 'react-helmet'
import AppNavbar   from '../components/app-navbar'
import LeftMenu    from '../components/left-menu'
import ManualRack  from '../components/manual-rack'
import ThreeScene  from '../components/trade-rack/three-scene'
import AIChatPanel from '../components/ai-chat-panel'
import './app-page.css'

export default function AppPage() {
  const [showChat, setShowChat] = useState(false)
  const [showRack, setShowRack] = useState(false)

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

      <AppNavbar />

      <LeftMenu
        rootClassName="left-menuroot-class-name"
        onChatClick={() => setShowChat(true)}
        onRackClick={() => setShowRack(true)}
        activeChat={showChat}
        activeRack={showRack}
      />

      {showChat && (
        <AIChatPanel
          rootClassName="ai-chat-panel-root-class-name"
          onClose={() => setShowChat(false)}
        />
      )}

      {showRack && (
        <ManualRack
          rootClassName="manual-rackroot-class-name"
          onClose={() => setShowRack(false)}
        />
      )}

      <ThreeScene />
    </div>
  )
}
