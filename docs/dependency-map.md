# Dependency Map

## External Dependencies

### three
Used in:
- src/components/3d/cable-trays/CableTrayEditor.js (THREE)
- src/components/3d/conduits/ConduitEditorUI.js (THREE)
- src/components/3d/core/extractGeometrySnapPoints.js (THREE)
- src/components/3d/core/utils.js (THREE)
- src/components/3d/ductwork/DuctEditor.js (THREE)
- src/components/3d/materials/index.js (THREE)
- src/components/3d/piping/PipeEditor.js (THREE)
- src/components/3d/scene/ThreeScene.jsx (THREE)
- src/components/3d/trade-rack/buildRack.js (THREE)
- src/components/3d/utils/common3dHelpers.js (THREE)

### three/addons/controls/OrbitControls.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (OrbitControls)

### three/addons/environments/RoomEnvironment.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (RoomEnvironment)

### three/addons/controls/TransformControls.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (TransformControls)
- src/components/3d/utils/common3dHelpers.js (TransformControls)

### prop-types
Used in:
- src/components/forms/app-manual-building.js (PropTypes)
- src/components/forms/app-manual-rack.js (PropTypes)
- src/components/forms/sign-in.js (PropTypes)
- src/components/forms/sign-up.js (PropTypes)
- src/components/layout/app-bottom-options.js (PropTypes)
- src/components/layout/app-top-main-menu.js (PropTypes)
- src/components/layout/footer.js (PropTypes)
- src/components/mep/app-add-mep.js (PropTypes)
- src/components/mep/app-cable-trays.js (PropTypes)
- src/components/mep/app-conduits.js (PropTypes)
- src/components/mep/app-ductwork.js (PropTypes)
- src/components/mep/app-piping.js (PropTypes)
- src/components/mep/app-rack-properties.js (PropTypes)
- src/components/mep/app-saved-configurations.js (PropTypes)
- src/components/mep/app-tier-mep.js (PropTypes)
- src/components/navigation/app-button-left-menu.js (PropTypes)
- src/components/navigation/navbar.js (PropTypes)
- src/components/navigation/project-dashboard-navbar.js (PropTypes)
- src/components/navigation/project-dashboard-sidebar.js (PropTypes)
- src/components/navigation/projects-navbar.js (PropTypes)
- src/components/navigation/projects-sidebar.js (PropTypes)
- src/components/projects/multi-trade-racks.js (PropTypes)
- src/components/projects/projects-main.js (PropTypes)
- src/components/ui/app-ai-chat-panel.js (PropTypes)
- src/components/ui/app-logo.js (PropTypes)
- src/components/ui/assembly-card.js (PropTypes)
- src/components/ui/hero.js (PropTypes)
- src/components/ui/logo-projects.js (PropTypes)
- src/components/ui/logo.js (PropTypes)
- src/components/ui/project-card.js (PropTypes)

### react-router-dom
Used in:
- src/components/forms/sign-in.js (Link)
- src/components/forms/sign-up.js (Link)
- src/components/navigation/navbar.js (Link)
- src/components/navigation/project-dashboard-navbar.js (Link)
- src/components/navigation/projects-navbar.js (Link)
- src/components/projects/multi-trade-racks.js (Link)
- src/components/ui/hero.js (Link)
- src/components/ui/logo.js (Link)
- src/index.js (BrowserRouter as Router, Route, Switch, Redirect, )
- src/pages/project-dashboard.js (Link)
- src/pages/projects.js (Link)

### react
Used in:
- src/components/mep/app-add-mep.js (React)
- src/components/mep/app-saved-configurations.js (useState, useEffect)
- src/hooks/useAppState.js (useState, useEffect)
- src/hooks/useBuildingRackSync.js (useEffect)
- src/hooks/useEventListeners.js (useEffect)
- src/hooks/useInitialization.js (useEffect)
- src/hooks/useSceneRack.js (useRef, useCallback)
- src/hooks/useSceneShell.js (useRef, useCallback)
- src/index.js (React)
- src/pages/not-found.js (React)

### react-dom
Used in:
- src/index.js (ReactDOM)

### react-helmet
Used in:
- src/pages/app-page.js (Helmet)
- src/pages/home.js (Helmet)
- src/pages/login.js (Helmet)
- src/pages/not-found.js (Helmet)
- src/pages/project-dashboard.js (Helmet)
- src/pages/projects.js (Helmet)
- src/pages/signup-page.js (Helmet)

## Internal Dependencies

### ../utils/common3dHelpers
Used in:
- src/components/3d/cable-trays/CableTrayEditor.js (calculateScreenPosition, validateDimensionInput, getTierOptionsFromGeometry, findTierSpace, calculateTierYPosition, createAnimationLoop, createEditorKeyHandler)
- src/components/3d/ductwork/DuctEditor.js (calculateScreenPosition, validateDimensionInput, getTierOptionsFromGeometry, findTierSpace, calculateTierYPosition, createAnimationLoop, createEditorKeyHandler)
- src/components/3d/piping/PipeEditor.js (validateDimensionInput, getTierOptionsFromGeometry, findTierSpace, calculateTierYPosition, createEditorKeyHandler)

### ./extractGeometrySnapPoints.js
Used in:
- src/components/3d/core/utils.js (extractSnapPoints)

### ../core/utils.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (dispose)
- src/components/3d/trade-rack/buildRack.js (dispose, buildRack, buildShell, buildPipesFlexible)

### ../controls/ViewCube.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (ViewCube)

### ../trade-rack/buildRack.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (buildRackScene)

### ../controls/MeasurementTool.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (MeasurementTool)

### ../ductwork
Used in:
- src/components/3d/scene/ThreeScene.jsx (DuctworkRenderer, DuctEditor)

### ../piping
Used in:
- src/components/3d/scene/ThreeScene.jsx (PipingRenderer)
- src/components/3d/scene/ThreeScene.jsx (PipeEditor)

### ../conduits
Used in:
- src/components/3d/scene/ThreeScene.jsx (ConduitRenderer, ConduitEditorUI)

### ../cable-trays
Used in:
- src/components/3d/scene/ThreeScene.jsx (CableTrayRenderer)

### ../cable-trays/CableTrayEditor
Used in:
- src/components/3d/scene/ThreeScene.jsx (CableTrayEditor)

### ../materials
Used in:
- src/components/3d/scene/ThreeScene.jsx (createMaterials, loadTextures, disposeMaterials)

### ../core/MepSelectionManager.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (initializeMepSelectionManager)

### ../trade-rack/TradeRackInteraction.js
Used in:
- src/components/3d/scene/ThreeScene.jsx (TradeRackInteraction)

### ../styles/measurement-styles.css
Used in:
- src/components/3d/scene/ThreeScene.jsx (side-effect)

### ../../types/buildingShell
Used in:
- src/components/forms/app-manual-building.js (buildingShellDefaults)

### ./app-manual-building.css
Used in:
- src/components/forms/app-manual-building.js (side-effect)

### ./app-manual-rack.css
Used in:
- src/components/forms/app-manual-rack.js (side-effect)

### ./sign-in.css
Used in:
- src/components/forms/sign-in.js (side-effect)

### ./sign-up.css
Used in:
- src/components/forms/sign-up.js (side-effect)

### ./app-bottom-options.css
Used in:
- src/components/layout/app-bottom-options.js (side-effect)

### ./app-top-main-menu.css
Used in:
- src/components/layout/app-top-main-menu.js (side-effect)

### ./footer.css
Used in:
- src/components/layout/footer.js (side-effect)

### ./app-add-mep.css
Used in:
- src/components/mep/app-add-mep.js (side-effect)

### ./app-cable-trays.css
Used in:
- src/components/mep/app-cable-trays.js (side-effect)

### ./app-conduits.css
Used in:
- src/components/mep/app-conduits.js (side-effect)

### ./app-ductwork.css
Used in:
- src/components/mep/app-ductwork.js (side-effect)

### ./app-piping.css
Used in:
- src/components/mep/app-piping.js (side-effect)

### ../../types/tradeRack
Used in:
- src/components/mep/app-rack-properties.js (tradeRackDefaults, convertToFeet, calculateBayConfiguration)
- src/components/mep/app-saved-configurations.js (calculateTotalHeight)

### ./app-rack-properties.css
Used in:
- src/components/mep/app-rack-properties.js (side-effect)

### ../../utils/projectManifest
Used in:
- src/components/mep/app-saved-configurations.js (syncManifestWithLocalStorage, getProjectManifest, setActiveConfiguration)

### ./app-saved-configurations.css
Used in:
- src/components/mep/app-saved-configurations.js (side-effect)

### ./app-tier-mep.css
Used in:
- src/components/mep/app-tier-mep.js (side-effect)

### ./app-button-left-menu.css
Used in:
- src/components/navigation/app-button-left-menu.js (side-effect)

### ../ui
Used in:
- src/components/navigation/navbar.js (Logo)
- src/components/navigation/project-dashboard-navbar.js (LogoProjects, Logo)
- src/components/navigation/projects-navbar.js (LogoProjects, Logo)
- src/components/projects/projects-main.js (ProjectCard)

### ./navbar.css
Used in:
- src/components/navigation/navbar.js (side-effect)

### ./project-dashboard-navbar.css
Used in:
- src/components/navigation/project-dashboard-navbar.js (side-effect)

### ./project-dashboard-sidebar.css
Used in:
- src/components/navigation/project-dashboard-sidebar.js (side-effect)

### ./projects-navbar.css
Used in:
- src/components/navigation/projects-navbar.js (side-effect)

### ./projects-sidebar.css
Used in:
- src/components/navigation/projects-sidebar.js (side-effect)

### ./multi-trade-racks.css
Used in:
- src/components/projects/multi-trade-racks.js (side-effect)

### ./projects-main.css
Used in:
- src/components/projects/projects-main.js (side-effect)

### ./app-ai-chat-panel.css
Used in:
- src/components/ui/app-ai-chat-panel.js (side-effect)

### ./app-logo.css
Used in:
- src/components/ui/app-logo.js (side-effect)

### ./assembly-card.css
Used in:
- src/components/ui/assembly-card.js (side-effect)

### ./hero.css
Used in:
- src/components/ui/hero.js (side-effect)

### ./logo-projects.css
Used in:
- src/components/ui/logo-projects.js (side-effect)

### ./logo.css
Used in:
- src/components/ui/logo.js (side-effect)

### ./project-card.css
Used in:
- src/components/ui/project-card.js (side-effect)

### ../utils/projectManifest
Used in:
- src/handlers/configurationHandlers.js (updateBuildingShell, updateTradeRackConfiguration, setActiveConfiguration)
- src/handlers/mepHandlers.js (updateMEPItems, addMEPItem, removeMEPItem)
- src/handlers/uiHandlers.js (updateMeasurements)
- src/hooks/useAppState.js (updateUIState, setActiveConfiguration, updateBuildingShell, updateTradeRackConfiguration)
- src/hooks/useEventListeners.js (updateMeasurements, updateMEPItems)
- src/hooks/useInitialization.js (initializeProject, syncManifestWithLocalStorage, syncMEPItemsWithLocalStorage, updateMEPItems)

### ../types/buildingShell
Used in:
- src/hooks/useAppState.js (buildingShellDefaults)

### ../types/tradeRack
Used in:
- src/hooks/useAppState.js (tradeRackDefaults)

### ../components/3d/trade-rack/buildRack
Used in:
- src/hooks/useSceneRack.js (buildRackScene)

### ../components/3d/core/utils
Used in:
- src/hooks/useSceneShell.js (buildShell, buildFloorOnly)

### ./pages
Used in:
- src/index.js (ProjectDashboard, Projects, Home, AppPage, SignupPage, Login, NotFound)

### ./style.css
Used in:
- src/index.js (side-effect)

### ../components/layout
Used in:
- src/pages/app-page.js (AppTopMainMenu, AppBottomOptions)
- src/pages/home.js (Footer)
- src/pages/login.js (Footer)
- src/pages/signup-page.js (Footer)

### ../components/navigation
Used in:
- src/pages/app-page.js (AppButtonLeftMenu)
- src/pages/home.js (Navbar)
- src/pages/login.js (Navbar)
- src/pages/project-dashboard.js (ProjectDashboardNavbar, ProjectDashboardSidebar)
- src/pages/projects.js (ProjectsNavbar, ProjectsSidebar)
- src/pages/signup-page.js (Navbar)

### ../components/mep
Used in:
- src/pages/app-page.js (AppRackProperties, AppSavedConfigurations, AppTierMEP, AppAddMEP, AppDuctwork, AppPiping, AppConduits, AppCableTrays)

### ../components/ui
Used in:
- src/pages/app-page.js (AppAIChatPanel)
- src/pages/home.js (Hero)
- src/pages/project-dashboard.js (AssemblyCard)
- src/pages/projects.js (ProjectCard)

### ../components/forms
Used in:
- src/pages/app-page.js (AppManualBuilding)
- src/pages/login.js (SignIn)
- src/pages/signup-page.js (SignUp)

### ../components/3d
Used in:
- src/pages/app-page.js (ThreeScene)

### ../hooks/useSceneShell
Used in:
- src/pages/app-page.js (useSceneShell)

### ../hooks/useSceneRack
Used in:
- src/pages/app-page.js (useSceneRack)

### ../hooks/useAppState
Used in:
- src/pages/app-page.js (useAppState)

### ../hooks/useInitialization
Used in:
- src/pages/app-page.js (useInitialization)

### ../hooks/useBuildingRackSync
Used in:
- src/pages/app-page.js (useBuildingRackSync)

### ../hooks/useEventListeners
Used in:
- src/pages/app-page.js (useEventListeners)

### ../handlers/mepHandlers
Used in:
- src/pages/app-page.js (createMEPHandlers)

### ../handlers/configurationHandlers
Used in:
- src/pages/app-page.js (createConfigurationHandlers)

### ../handlers/uiHandlers
Used in:
- src/pages/app-page.js (createUIHandlers)

### ../utils/manifestExporter
Used in:
- src/pages/app-page.js (side-effect)

### ./app-page.css
Used in:
- src/pages/app-page.js (side-effect)

### ../components/projects
Used in:
- src/pages/home.js (MultiTradeRacks)

### ./home.css
Used in:
- src/pages/home.js (side-effect)

### ./login.css
Used in:
- src/pages/login.js (side-effect)

### ./not-found.css
Used in:
- src/pages/not-found.js (side-effect)

### ./project-dashboard.css
Used in:
- src/pages/project-dashboard.js (side-effect)

### ./projects.css
Used in:
- src/pages/projects.js (side-effect)

### ./signup-page.css
Used in:
- src/pages/signup-page.js (side-effect)

### ./projectManifest
Used in:
- src/utils/manifestExporter.js (exportProjectManifest, getProjectStatistics)

