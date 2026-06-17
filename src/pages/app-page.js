/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState } from 'react'
import { Helmet } from 'react-helmet'

import {
  AppTopMainMenu,
  AppBottomOptions
} from '../components/layout'
import { AppButtonLeftMenu } from '../components/navigation'
import {
  AppRackProperties,
  AppSavedConfigurations,
  AppTierMEP,
  AppAddMEP,
  AppDuctwork,
  AppPiping,
  AppConduits,
  AppCableTrays
} from '../components/mep'
import { AppAIChatPanel } from '../components/ui'
import { AppManualBuilding } from '../components/forms'
import { ThreeScene } from '../components/3d'
import { BathroomPodPreconPanel, BathroomPodWorkspace } from '../components/bathroom-pod'

// Custom hooks
import { useSceneShell } from '../hooks/useSceneShell'
import { useSceneRack } from '../hooks/useSceneRack'
import { useAppState } from '../hooks/useAppState'
import { useInitialization } from '../hooks/useInitialization'
import { useBuildingRackSync } from '../hooks/useBuildingRackSync'
import { useEventListeners } from '../hooks/useEventListeners'

// Handlers
import { createMEPHandlers } from '../handlers/mepHandlers'
import { createConfigurationHandlers } from '../handlers/configurationHandlers'
import { createUIHandlers } from '../handlers/uiHandlers'

// Import debugging and testing tools (available in browser console)
import '../utils/manifestExporter'
import { initializeStorageSystem, getStorageSystemStatus } from '../utils/initializeStorage'
import { testStorageSystem } from '../utils/testStorage'
import {
  updateBathroomPodConfiguration,
  updateBathroomPodProjectLocation
} from '../utils/projectManifest'
import { chooseLocalProjectDirectory } from '../utils/localProjectFiles'
import './app-page.css'

const AppPage = (props) => {
  const [projectRepositoryRefreshKey, setProjectRepositoryRefreshKey] = useState(0)
  // Application state management
  const {
    projectName,
    activePanel,
    isRackPropertiesVisible,
    isSavedConfigsVisible,
    savedConfigsRefresh,
    isMeasurementActive,
    viewMode,
    isConfigLoaded,
    isAddMEPVisible,
    buildingParams,
    rackParams,
    mepItems,
    productType,
    bathroomPod,
    setActivePanel,
    setIsRackPropertiesVisible,
    setSavedConfigsRefresh,
    setIsMeasurementActive,
    setViewMode,
    setIsAddMEPVisible,
    setBuildingParams,
    setRackParams,
    setMepItems,
    setBathroomPod,
    handleProjectNameChange,
    handleProductTypeChange,
    handlePanelClick
  } = useAppState()

  // Building shell and trade rack controllers
  const buildingShell = useSceneShell()
  const tradeRack = useSceneRack()

  // Initialize project and setup
  useInitialization(
    rackParams,
    buildingParams,
    buildingShell,
    tradeRack,
    mepItems
  )

  // Sync building and rack parameters
  useBuildingRackSync(
    buildingParams,
    rackParams,
    isConfigLoaded,
    buildingShell,
    tradeRack
  )

  // Setup event listeners
  useEventListeners(
    isMeasurementActive,
    setIsMeasurementActive,
    setMepItems,
    isAddMEPVisible,
    setIsAddMEPVisible,
    activePanel,
    setActivePanel,
    isRackPropertiesVisible,
    setIsRackPropertiesVisible
  )

  // Create handlers
  const mepHandlers = createMEPHandlers(mepItems, setMepItems)
  const configHandlers = createConfigurationHandlers(
    buildingParams,
    setBuildingParams,
    rackParams,
    setRackParams,
    setSavedConfigsRefresh,
    buildingShell,
    tradeRack
  )
  const uiHandlers = createUIHandlers(
    isMeasurementActive,
    setIsMeasurementActive,
    viewMode,
    setViewMode,
    isAddMEPVisible,
    setIsAddMEPVisible,
    activePanel,
    setActivePanel
  )

  // Handler for adding rack (wrapper to pass setIsRackPropertiesVisible)
  const handleAddRack = (params) => {
    configHandlers.handleAddRack(params, setIsRackPropertiesVisible)
  }

  const handleBathroomPodChange = (nextPod) => {
    setBathroomPod(nextPod)
    updateBathroomPodConfiguration(nextPod, false)
  }

  const handleProjectRepositoryUpdated = (projectNameOverride) => {
    if (projectNameOverride) {
      handleProjectNameChange(projectNameOverride)
    }
    setProjectRepositoryRefreshKey(previous => previous + 1)
  }

  const handleSelectProject = async () => {
    try {
      const handle = await chooseLocalProjectDirectory()
      if (!handle) return
      updateBathroomPodProjectLocation({
        mode: 'directory',
        label: handle.name
      })
      handleProjectRepositoryUpdated(handle.name)
    } catch (error) {
      console.error('Project selection cancelled or failed:', error)
    }
  }

  const isMtrProduct = productType === 'mtr'
  const isBathroomPodProduct = productType === 'bathroomPod'

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

      <AppTopMainMenu 
        rootClassName="app-top-main-menuroot-class-name1" 
        projectName={projectName}
        productType={productType}
        onProductTypeChange={handleProductTypeChange}
        onSelectProject={handleSelectProject}
      />
      
      {isMtrProduct && (
        <AppButtonLeftMenu 
          rootClassName="app-button-left-menuroot-class-name1"
          onPanelClick={handlePanelClick}
          activePanel={activePanel}
          isRackPropertiesVisible={isRackPropertiesVisible}
        />
      )}

      <div className={`app-page-right-menus ${isBathroomPodProduct ? 'bathroom-pod' : ''}`}>
        {isMtrProduct && isRackPropertiesVisible && (
          <AppRackProperties 
            rootClassName="app-rack-propertiesroot-class-name2" 
            initial={rackParams}
            onAddRack={handleAddRack}
            onClose={() => setIsRackPropertiesVisible(false)}
          />
        )}
        <AppSavedConfigurations 
          rootClassName="app-saved-configurationsroot-class-name" 
          productType={productType}
          currentBathroomPod={bathroomPod}
          onRestoreConfiguration={configHandlers.handleRestoreConfiguration}
          onRestoreBathroomPodConfiguration={handleBathroomPodChange}
          onProjectRepositoryUpdated={handleProjectRepositoryUpdated}
          refreshTrigger={savedConfigsRefresh}
          onConfigurationSaved={configHandlers.handleConfigurationSaved}
        />
        {isBathroomPodProduct && (
          <BathroomPodPreconPanel
            pod={bathroomPod}
            onChange={handleBathroomPodChange}
          />
        )}
        {isMtrProduct && (
          <AppTierMEP 
            rootClassName="app-tier-me-proot-class-name" 
            mepItems={mepItems}
            onRemoveItem={mepHandlers.handleRemoveMepItem}
            onItemClick={mepHandlers.handleMepItemClick}
            onColorChange={mepHandlers.handleDuctColorChange}
            onToggleAddMEP={uiHandlers.handleToggleAddMEP}
            onDeleteAll={mepHandlers.handleDeleteAllMepItems}
          />
        )}
        {isMtrProduct && isAddMEPVisible && (
          <AppAddMEP 
            rootClassName="app-add-me-proot-class-name"
            onDuctworkClick={uiHandlers.createMEPPanelHandler('ductwork')}
            onPipingClick={uiHandlers.createMEPPanelHandler('piping')}
            onConduitsClick={uiHandlers.createMEPPanelHandler('conduits')}
            onCableTraysClick={uiHandlers.createMEPPanelHandler('cableTrays')}
          />
        )}
      </div>
      
      {/* Conditionally render panels based on activePanel state */}
      {isMtrProduct && activePanel === 'aiChat' && (
        <AppAIChatPanel 
          rootClassName="app-ai-chat-panelroot-class-name1" 
          onClose={() => setActivePanel(null)}
        />
      )}

      {isMtrProduct && activePanel === 'building' && (
        <AppManualBuilding 
          rootClassName="app-manual-buildingroot-class-name1" 
          initial={buildingParams}
          onSave={configHandlers.handleBuildingSave}
          onClose={() => setActivePanel(null)}
        />
      )}

      {isMtrProduct && activePanel === 'ductwork' && (
        <AppDuctwork 
          rootClassName="app-ductworkroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddDuct={mepHandlers.handleAddMepItem}
        />
      )}

      {isMtrProduct && activePanel === 'piping' && (
        <AppPiping 
          rootClassName="app-pipingroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddPipe={mepHandlers.handleAddMepItem}
        />
      )}

      {isMtrProduct && activePanel === 'conduits' && (
        <AppConduits 
          rootClassName="app-conduitsroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddConduit={mepHandlers.handleAddMepItem}
        />
      )}

      {isMtrProduct && activePanel === 'cableTrays' && (
        <AppCableTrays 
          rootClassName="app-cable-traysroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddCableTray={mepHandlers.handleAddMepItem}
        />
      )}

      {isMtrProduct && (
        <AppBottomOptions 
          rootClassName="app-bottom-optionsroot-class-name" 
          onMeasurementClick={uiHandlers.handleMeasurementToggle}
          isMeasurementActive={isMeasurementActive}
          onClearMeasurements={uiHandlers.handleClearMeasurements}
          onViewModeChange={uiHandlers.handleViewModeChange}
          onFitView={uiHandlers.handleFitView}
          initialViewMode={viewMode}
        />
      )}
      
      {isConfigLoaded && isMtrProduct ? (
        <ThreeScene 
          isMeasurementActive={isMeasurementActive}
          mepItems={mepItems}
          initialRackParams={rackParams}
          initialBuildingParams={buildingParams}
          initialViewMode={viewMode}
          onSceneReady={(scene, materials, snapPoints) => {
            // Set references in the building shell hook
            buildingShell.setReferences(scene, materials, snapPoints)
            
            // Set references in the trade rack hook
            tradeRack.setReferences(scene, materials, snapPoints)
            
            // Initialize building shell with actual loaded parameters based on mount type
            const initialMountType = rackParams?.mountType || 'deck'
            const isInitialFloorMounted = initialMountType === 'floor'
            buildingShell.build(buildingParams, isInitialFloorMounted)
            
            // Initialize trade rack with actual parameters and building context
            const initialRackParams = {
              ...rackParams,
              buildingContext: {
                corridorHeight: buildingParams.corridorHeight,
                beamDepth: buildingParams.beamDepth
              }
            }
            tradeRack.build(initialRackParams)
            
            // Update ductwork renderer with actual rack parameters
            if (window.ductworkRendererInstance) {
              window.ductworkRendererInstance.updateRackParams(initialRackParams)
            }
          }}
        />
      ) : isConfigLoaded && isBathroomPodProduct ? (
        <BathroomPodWorkspace
          podData={bathroomPod}
          onChange={handleBathroomPodChange}
          projectRefreshKey={projectRepositoryRefreshKey}
          onProjectRepositoryUpdated={handleProjectRepositoryUpdated}
        />
      ) : (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
          color: '#333333',
          fontSize: '16px',
          zIndex: 1000,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              border: '3px solid rgba(0, 0, 0, 0.1)', 
              borderTop: '3px solid #00D4FF',
              borderRight: '3px solid #00A8CC',
              borderRadius: '50%',
              animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              margin: '0 auto 24px'
            }}></div>
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#333333',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              Loading Configuration
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
              fontWeight: '400'
            }}>
              Setting up your workspace...
            </div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

export default AppPage
