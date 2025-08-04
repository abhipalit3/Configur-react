import React, { Fragment, useState } from 'react'

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
  // State to track which panel is currently active
  const [activePanel, setActivePanel] = useState(null)
  // State to track if rack properties is visible - default to true
  const [isRackPropertiesVisible, setIsRackPropertiesVisible] = useState(true)
  
  // State to track MEP items - initialize from localStorage
  const [mepItems, setMepItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem('configurMepItems')
      return savedItems ? JSON.parse(savedItems) : []
    } catch (error) {
      console.error('Error loading MEP items:', error)
      return []
    }
  })
  
  // Save to localStorage whenever mepItems changes
  React.useEffect(() => {
    try {
      localStorage.setItem('configurMepItems', JSON.stringify(mepItems))
    } catch (error) {
      console.error('Error saving MEP items:', error)
    }
  }, [mepItems])
  
  // Handler for panel button clicks
  const handlePanelClick = (panelName) => {
    // If clicking the same panel, close it. Otherwise, open the new panel
    setActivePanel(activePanel === panelName ? null : panelName)
  }
  
  // Handler for templates/rack properties toggle
  const handleTemplatesClick = () => {
    setIsRackPropertiesVisible(!isRackPropertiesVisible)
  }
  
  // Handler for adding MEP items
  const handleAddMepItem = (item) => {
    setMepItems([...mepItems, { ...item, id: Date.now() + Math.random() }])
    // Optionally close the panel after adding
    setActivePanel(null)
  }
  
  // Handler for removing MEP items
  const handleRemoveMepItem = (itemId) => {
    setMepItems(mepItems.filter(item => item.id !== itemId))
  }
  
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
      
      <AppButtonLeftMenu 
        rootClassName="app-button-left-menuroot-class-name1"
        onPanelClick={handlePanelClick}
        activePanel={activePanel}
      />

      <div className="app-page-right-menus">
        {isRackPropertiesVisible && (
          <AppRackProperties 
            rootClassName="app-rack-propertiesroot-class-name2" 
            onClose={() => setIsRackPropertiesVisible(false)}
          />
        )}
        <AppTierMEP 
          rootClassName="app-tier-me-proot-class-name" 
          mepItems={mepItems}
          onRemoveItem={handleRemoveMepItem}
        />
        <AppAddMEP rootClassName="app-add-me-proot-class-name" />
      </div>
      
      {/* Conditionally render panels based on activePanel state */}
      {activePanel === 'aiChat' && (
        <AppAIChatPanel 
          rootClassName="app-ai-chat-panelroot-class-name1" 
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'building' && (
        <AppManualBuilding 
          rootClassName="app-manual-buildingroot-class-name1" 
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'ductwork' && (
        <AppDuctwork 
          rootClassName="app-ductworkroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddDuct={handleAddMepItem}
        />
      )}

      {activePanel === 'piping' && (
        <AppPiping 
          rootClassName="app-pipingroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddPipe={handleAddMepItem}
        />
      )}

      {activePanel === 'conduits' && (
        <AppConduits 
          rootClassName="app-conduitsroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddConduit={handleAddMepItem}
        />
      )}

      {activePanel === 'cableTrays' && (
        <AppCableTrays 
          rootClassName="app-cable-traysroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddCableTray={handleAddMepItem}
        />
      )}

      <AppBottomOptions 
        rootClassName="app-bottom-optionsroot-class-name" 
        onTemplatesClick={handleTemplatesClick}
        isTemplatesActive={isRackPropertiesVisible}
      />
      
      <ThreeScene />
    </div>
  )
}

export default AppPage