# Codebase Documentation

## Summary

- **Total Files**: 76
- **Total Functions**: 278
- **Total Imports**: 180
- **Total Exports**: 174

## File Overview

### src/components/3d/cable-trays/CableTrayEditor.js
- **Functions**: 9
- **Imports**: 2
- **Exports**: 1
- **Lines**: 442
- **Function List**: CableTrayEditor, updatePosition, handleDimensionChange, handleTrayTypeChange, handleTierChange, getTierOptions, handleSave, handleCancel, handleCopy
- **Import Sources**: ../utils/common3dHelpers, three

### src/components/3d/cable-trays/CableTrayGeometry.js
- **Functions**: 16
- **Imports**: 2
- **Exports**: 1
- **Lines**: 475
- **Function List**: constructor, setSnapPoints, createMaterials, createCableTrayGeometry, createLadderTray, createSolidBottomTray, createWireMeshTray, getMaterial, createCableTrayGroup, addTransparentCover, addCableTraySnapPoints, calculateCableTrayLength, updateCableTrayAppearance, in2m, m2in, dispose
- **Import Sources**: ../core/extractGeometrySnapPoints.js, three

### src/components/3d/cable-trays/CableTrayInteraction.js
- **Functions**: 35
- **Imports**: 4
- **Exports**: 1
- **Lines**: 1080
- **Function List**: onTransformChange, onDragEnd, fallbackSetup, constructor, setupTransformControls, setupCentralizedEventHandler, registerWithMepManager, handleClick, handleMouseMove, handleTransformKeys, selectCableTray, deselectCableTray, setHoverCableTray, clearHoverCableTray, updateCableTrayDimensions, getSelectedCableTray, getSelectedCableTrayGroup, triggerSelectionEvent, setSnapLineManager, setTransformControlsEnabled, setTransformMode, updateAllCableTrayTierInfo, forEach, map, calculateCableTrayTierFromPosition, updateCableTrayTierInfo, applyRealTimeSnapping, updateCableTrayPosition, saveCableTrayPosition, createCableTrayMeasurements, clearCableTrayMeasurements, updateCableTrayMeasurements, deleteSelectedCableTray, duplicateSelectedCableTray, dispose
- **Import Sources**: ../core/MepSelectionManager.js, ../utils/common3dHelpers.js, ../utils/mepEventHandler.js, three

### src/components/3d/cable-trays/CableTrayRenderer.js
- **Functions**: 15
- **Imports**: 3
- **Exports**: 1
- **Lines**: 336
- **Function List**: constructor, getCableTraysGroup, setupInteractions, updateCableTrays, createCableTray, calculateCableTrayPosition, calculateRackLength, clearCableTrays, getCableTrayById, getAllCableTrays, updateCableTrayColor, setVisible, getStats, getColumnDepth, dispose
- **Import Sources**: ./CableTrayGeometry, ../core/utils, three

### src/components/3d/cable-trays/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 3
- **Lines**: 9

### src/components/3d/conduits/ConduitEditorUI.js
- **Functions**: 9
- **Imports**: 1
- **Exports**: 2
- **Lines**: 628
- **Function List**: ConduitEditorUI, getTierOptions, updatePosition, onCameraChange, handleSave, handleCancel, handleCopy, handleInputChange, handleKeyDown
- **Import Sources**: three

### src/components/3d/conduits/ConduitGeometry.js
- **Functions**: 10
- **Imports**: 1
- **Exports**: 1
- **Lines**: 643
- **Function List**: constructor, setSnapPoints, in2m, createConduitGeometry, createMultiConduitGroup, createConduitGroup, updateConduitMaterial, getMaterialType, updateConduitAppearance, createCustomMaterial
- **Import Sources**: three

### src/components/3d/conduits/ConduitInteraction.js
- **Functions**: 34
- **Imports**: 4
- **Exports**: 1
- **Lines**: 1314
- **Function List**: onTransformChange, onDragEnd, fallbackSetup, constructor, setupTransformControls, setupCentralizedEventHandler, registerWithMepManager, handleMouseMove, handleClick, handleTransformKeys, selectConduit, updateGroupAppearance, forEach, deselectConduit, deleteSelectedConduit, copySelectedConduit, pasteConduit, displayConduitInfo, clearInfoDisplay, updateConduitTierInfo, calculateConduitTier, updateSnapGuides, applyRealTimeSnapping, saveConduitPosition, updateAllConduitTierInfo, map, createConduitMeasurements, clearConduitMeasurements, updateConduitMeasurements, getSelectedConduit, findConduitGroup, updateConduitDimensions, saveConduitDataToStorage, dispose
- **Import Sources**: ../core/MepSelectionManager.js, ../utils/common3dHelpers.js, ../utils/mepEventHandler.js, three

### src/components/3d/conduits/ConduitRenderer.js
- **Functions**: 14
- **Imports**: 4
- **Exports**: 1
- **Lines**: 392
- **Function List**: constructor, setupInteractions, updateConduits, createConduit, calculateConduitPosition, calculateTierPosition, calculateRackLength, getRackWidth, getColumnDepth, updateRackParams, clearConduits, getConduitsGroup, recalculateTierInfo, dispose
- **Import Sources**: ./ConduitGeometry.js, ./ConduitInteraction.js, ../core/utils, three

### src/components/3d/conduits/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 4
- **Lines**: 10

### src/components/3d/controls/MeasurementTool.js
- **Functions**: 50
- **Imports**: 1
- **Exports**: 1
- **Lines**: 1638
- **Function List**: animate, constructor, createHoverMarkers, createVertexMarker, createEdgeMarker, createPreviewLine, animateHover, setAxisLock, toggleAxisLock, toggleButtonAndAxis, clearAxisLocks, updateAxisLockVisuals, enable, disable, onKeyDown, isIn2DView, filterSnapPointsFor2D, findClosestSnapPoint, onMouseDown, onMouseUp, onPointerMove, getWorldPositionFromMouse, updatePreviewLabel, hidePreviewLabel, drawMeasurement, createMeasurementLine, createEndMarkers, createMeasurementLabel, formatDistance, decimalToFraction, calculateOptimalLabelPosition, updateLabels, dispose, clearAll, removeMeasurement, findMeasurementAtClick, forEach, updateMeasurementHighlight, traverse, clearSelection, selectAll, deleteSelectedMeasurements, updateManifestMeasurements, restoreFromManifest, createControlsPanel, createAxisButton, updateControlsPanelState, updateAxisButtonState, modifyExistingControlsPanel, hideControlsPanel
- **Import Sources**: three

### src/components/3d/controls/ViewCube.js
- **Functions**: 14
- **Imports**: 1
- **Exports**: 1
- **Lines**: 283
- **Function List**: createLabelMaterial, animate, constructor, setupClickHandler, onViewCubeClick, getBoundingBox, centerOrbitOnContent, animateToView, calculateOptimalZoom, resetOrbitAxis, updateOrientation, easeInOutCubic, enableClickHandling, disableClickHandling
- **Import Sources**: three

### src/components/3d/core/MepSelectionManager.js
- **Functions**: 18
- **Imports**: 1
- **Exports**: 3
- **Lines**: 514
- **Function List**: initializeMepSelectionManager, getMepSelectionManager, constructor, registerHandler, setupEventListeners, isMeasurementToolActive, handleClick, handleMouseMove, findClosestMepObject, selectMep, setHoverMep, findMepGroupFromObject, deselectAllExcept, deselectAll, clearHoverAllExcept, forEach, clearHoverAll, dispose
- **Import Sources**: three

### src/components/3d/core/RackSnapLineManager.js
- **Functions**: 16
- **Imports**: 1
- **Exports**: 1
- **Lines**: 491
- **Function List**: constructor, convertToFeet, ft2m, in2m, getRackLength, getPostSize, getAvailableDuctLength, getSnapLinesFromRackGeometry, getBuildingShellParams, createPersistentSnapLines, createPersistentHorizontalLine, createPersistentVerticalLine, clearPersistentSnapLines, clearSnapGuides, updateRackParams, dispose
- **Import Sources**: three

### src/components/3d/core/extractGeometrySnapPoints.js
- **Functions**: 4
- **Imports**: 1
- **Exports**: 1
- **Lines**: 94
- **Function List**: extractSnapPoints, dedupe, getKey, toVec3
- **Import Sources**: three

### src/components/3d/core/utils.js
- **Functions**: 10
- **Imports**: 2
- **Exports**: 12
- **Lines**: 795
- **Function List**: convertToFeet, getColumnSize, addEdges, buildRack, createIBeamGeometry, buildShell, buildFloorOnly, tierHeightFt, bottomBeamCenterY, buildPipesFlexible
- **Import Sources**: ./extractGeometrySnapPoints.js, three

### src/components/3d/ductwork/DuctEditor.js
- **Functions**: 8
- **Imports**: 2
- **Exports**: 1
- **Lines**: 436
- **Function List**: DuctEditor, updatePosition, handleDimensionChange, handleTierChange, getTierOptions, handleSave, handleCancel, handleCopy
- **Import Sources**: ../utils/common3dHelpers, three

### src/components/3d/ductwork/DuctGeometry.js
- **Functions**: 8
- **Imports**: 2
- **Exports**: 1
- **Lines**: 262
- **Function List**: constructor, setSnapPoints, ft2m, in2m, createRectangularDuctGeometry, createDuctGroup, updateDuctAppearance, dispose
- **Import Sources**: ../core/extractGeometrySnapPoints.js, three

### src/components/3d/ductwork/DuctInteraction.js
- **Functions**: 30
- **Imports**: 4
- **Exports**: 1
- **Lines**: 964
- **Function List**: onTransformChange, onDragEnd, fallbackSetup, constructor, setupTransformControls, setupCentralizedEventHandler, registerWithMepManager, handleClick, handleMouseMove, handleTransformKeys, applyRealTimeSnapping, selectDuct, deselectDuct, createDuctMeasurements, clearDuctMeasurements, updateDuctMeasurements, findDuctGroup, updateMousePosition, setDuctEditorCallbacks, calculateDuctTier, updateAllDuctTierInfo, forEach, map, calculateDuctTierFromPosition, saveDuctPosition, getSelectedDuct, updateDuctDimensions, deleteSelectedDuct, duplicateSelectedDuct, dispose
- **Import Sources**: ../core/MepSelectionManager.js, ../utils/common3dHelpers.js, ../utils/mepEventHandler.js, three

### src/components/3d/ductwork/DuctworkRenderer.js
- **Functions**: 14
- **Imports**: 2
- **Exports**: 1
- **Lines**: 312
- **Function List**: constructor, setupInteractions, updateRackParams, recalculateTierInfo, refreshDuctwork, updateDuctwork, createDuct, map, calculateDuctYPosition, clearDuctwork, getColumnDepth, getDuctworkGroup, setVisible, dispose
- **Import Sources**: ../ductwork, three

### src/components/3d/ductwork/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 5
- **Lines**: 11

### src/components/3d/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 3
- **Lines**: 11

### src/components/3d/materials/index.js
- **Functions**: 4
- **Imports**: 1
- **Exports**: 3
- **Lines**: 131
- **Function List**: createMaterials, loadTextures, disposeMaterials, forEach
- **Import Sources**: three

### src/components/3d/piping/PipeEditor.js
- **Functions**: 9
- **Imports**: 2
- **Exports**: 1
- **Lines**: 468
- **Function List**: PipeEditor, getTierOptions, updatePosition, onCameraChange, handleDimensionChange, handleStringChange, handleSave, handleCancel, handleCopy
- **Import Sources**: ../utils/common3dHelpers, three

### src/components/3d/piping/PipeGeometry.js
- **Functions**: 9
- **Imports**: 2
- **Exports**: 1
- **Lines**: 468
- **Function List**: constructor, setSnapPoints, in2m, createPipeGeometry, createPipeGroup, updatePipeMaterial, getMaterialType, updatePipeAppearance, createCustomMaterial
- **Import Sources**: ../core/extractGeometrySnapPoints.js, three

### src/components/3d/piping/PipeInteraction.js
- **Functions**: 31
- **Imports**: 4
- **Exports**: 1
- **Lines**: 928
- **Function List**: onTransformChange, onDragEnd, fallbackSetup, constructor, setupTransformControls, setupCentralizedEventHandler, registerWithMepManager, handleTransformKeys, handleClick, handleMouseMove, updateMousePosition, findPipeGroup, selectPipe, deselectPipe, updateSnapGuides, applyRealTimeSnapping, updatePipeMeasurements, savePipePosition, updatePipeTierInfo, calculatePipeTier, updateAllPipeTierInfo, forEach, map, updatePipeDimensions, createPipeMeasurements, clearPipeMeasurements, getSelectedPipe, deleteSelectedPipe, filter, duplicateSelectedPipe, dispose
- **Import Sources**: ../core/MepSelectionManager.js, ../utils/common3dHelpers.js, ../utils/mepEventHandler.js, three

### src/components/3d/piping/PipingRenderer.js
- **Functions**: 14
- **Imports**: 4
- **Exports**: 1
- **Lines**: 392
- **Function List**: constructor, setupInteractions, updatePiping, createPipe, calculatePipePosition, calculateTierPosition, calculateRackLength, getRackWidth, getColumnDepth, updateRackParams, clearPiping, getPipingGroup, recalculateTierInfo, dispose
- **Import Sources**: ./PipeGeometry.js, ./PipeInteraction.js, ../core/utils, three

### src/components/3d/piping/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 4
- **Lines**: 10

### src/components/3d/scene/ThreeScene.jsx
- **Functions**: 31
- **Imports**: 18
- **Exports**: 1
- **Lines**: 1781
- **Function List**: ThreeScene, createBackgroundGrid, updateOrthoCamera, animate, onControlsChange, onKeyDown, logCamera, onLog, centerOrbitOnContent, saveCameraState, loadCameraState, handleDuctSelection, handlePipeSelection, handleConduitSelection, handleCableTraySelection, handleDuctEditorSave, handleDuctEditorCancel, handlePipeEditorSave, handlePipeEditorCancel, handleConduitEditorSave, handleConduitEditorCancel, handleCableTrayEditorSave, handleCableTrayEditorCancel, onViewCubeClick, onResize, handleTradeRackSelected, handleTradeRackDeselected, handleAxisToggle, handleClearMeasurements, map, setAxisLock
- **Import Sources**: three/addons/controls/OrbitControls.js, three/addons/environments/RoomEnvironment.js, ../core/utils.js, three/addons/controls/TransformControls.js, ../controls/ViewCube.js, ../trade-rack/buildRack.js, ../controls/MeasurementTool.js, ../ductwork, ../piping, ../piping, ../conduits, ../cable-trays, ../cable-trays/CableTrayEditor, ../materials, ../core/MepSelectionManager.js, ../trade-rack/TradeRackInteraction.js, three, ../styles/measurement-styles.css

### src/components/3d/trade-rack/TradeRackInteraction.js
- **Functions**: 32
- **Imports**: 3
- **Exports**: 1
- **Lines**: 582
- **Function List**: constructor, setupEventListeners, setupTransformControls, registerWithMepManager, isMeasurementToolActive, handleMouseClick, selectRack, deselectRack, applySelectionFeedback, removeSelectionFeedback, setHoverRack, clearHoverRack, applyHoverFeedback, removeHoverFeedback, onTransformChange, applyZAxisConstraints, applyZAxisConstraintsToRack, updateTransformVisuals, saveRackPosition, map, calculateRackCenter, positionGizmoAtCenter, notifyRackSelected, notifyRackDeselected, selectObject, deselectAll, setHover, clearHover, getSelectedRack, getCurrentRackPosition, forceSelectRack, dispose
- **Import Sources**: three/examples/jsm/controls/TransformControls.js, ../core/MepSelectionManager.js, three

### src/components/3d/trade-rack/buildRack.js
- **Functions**: 4
- **Imports**: 2
- **Exports**: 1
- **Lines**: 132
- **Function List**: ensureArrays, syncArrays, buildRackScene, forEach
- **Import Sources**: ../core/utils.js, three

### src/components/3d/ui/chatInterface.js
- **Functions**: 2
- **Imports**: 0
- **Exports**: 1
- **Lines**: 257
- **Function List**: initChatInterface, append

### src/components/3d/utils/common3dHelpers.js
- **Functions**: 19
- **Imports**: 2
- **Exports**: 17
- **Lines**: 607
- **Function List**: calculateScreenPosition, validateDimensionInput, getTierOptionsFromGeometry, findTierSpace, calculateTierYPosition, calculateTierPosition, disposeObject3D, createButtonHoverHandlers, convertToFeet, calculateRackLength, createAnimationLoop, createEditorKeyHandler, setupTransformControls, registerWithMepManager, setupRaycaster, updateMouseCoordinates, createMepKeyboardHandler, animate, tryRegister
- **Import Sources**: three/addons/controls/TransformControls.js, three

### src/components/3d/utils/mepEventHandler.js
- **Functions**: 23
- **Imports**: 2
- **Exports**: 2
- **Lines**: 490
- **Function List**: createMepEventHandler, constructor, setupEventListeners, removeEventListeners, isMeasurementToolActive, onMouseClick, onMouseMove, onKeyDown, findIntersectedObject, findParentObjectOfType, checkObjectType, selectObject, deselectObject, getSelectedObject, getHoveredObject, setCallbacks, setCallback, updateConfig, forceSelect, forceDeselect, isSelected, isHovered, dispose
- **Import Sources**: ./common3dHelpers.js, three

### src/components/forms/app-manual-building.js
- **Functions**: 7
- **Imports**: 3
- **Exports**: 1
- **Lines**: 277
- **Function List**: AppManualBuilding, convertToFeet, validateForm, handleInputChange, handleFeetInchesChange, handleSave, getUnitLabel
- **Import Sources**: ../../types/buildingShell, prop-types, ./app-manual-building.css

### src/components/forms/app-manual-rack.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 191
- **Function List**: AppManualRack
- **Import Sources**: prop-types, ./app-manual-rack.css

### src/components/forms/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 4
- **Lines**: 10

### src/components/forms/sign-in.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 149
- **Function List**: SignIn
- **Import Sources**: react-router-dom, prop-types, ./sign-in.css

### src/components/forms/sign-up.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 163
- **Function List**: SignUp
- **Import Sources**: react-router-dom, prop-types, ./sign-up.css

### src/components/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 0
- **Lines**: 26

### src/components/layout/app-bottom-options.js
- **Functions**: 2
- **Imports**: 2
- **Exports**: 1
- **Lines**: 154
- **Function List**: AppBottomOptions, handleViewModeChange
- **Import Sources**: prop-types, ./app-bottom-options.css

### src/components/layout/app-top-main-menu.js
- **Functions**: 5
- **Imports**: 2
- **Exports**: 1
- **Lines**: 267
- **Function List**: AppTopMainMenu, handleEditStart, handleEditSave, handleEditCancel, handleKeyDown
- **Import Sources**: prop-types, ./app-top-main-menu.css

### src/components/layout/footer.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 72
- **Function List**: Footer
- **Import Sources**: prop-types, ./footer.css

### src/components/layout/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 3
- **Lines**: 9

### src/components/mep/app-add-mep.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 115
- **Function List**: AppAddMEP
- **Import Sources**: react, prop-types, ./app-add-mep.css

### src/components/mep/app-cable-trays.js
- **Functions**: 5
- **Imports**: 2
- **Exports**: 1
- **Lines**: 241
- **Function List**: AppCableTrays, convertToInches, handleFeetInchesChange, handleAddCableTray, getCableTrayColor
- **Import Sources**: prop-types, ./app-cable-trays.css

### src/components/mep/app-conduits.js
- **Functions**: 7
- **Imports**: 2
- **Exports**: 1
- **Lines**: 288
- **Function List**: AppConduits, convertToInches, handleFeetInchesChange, handleAddConduit, getConduitColor, incrementCount, decrementCount
- **Import Sources**: prop-types, ./app-conduits.css

### src/components/mep/app-ductwork.js
- **Functions**: 4
- **Imports**: 2
- **Exports**: 1
- **Lines**: 241
- **Function List**: AppDuctwork, convertToInches, handleFeetInchesChange, handleAddDuct
- **Import Sources**: prop-types, ./app-ductwork.css

### src/components/mep/app-piping.js
- **Functions**: 4
- **Imports**: 2
- **Exports**: 1
- **Lines**: 233
- **Function List**: AppPiping, convertToInches, handleFeetInchesChange, handleAddPipe
- **Import Sources**: prop-types, ./app-piping.css

### src/components/mep/app-rack-properties.js
- **Functions**: 11
- **Imports**: 3
- **Exports**: 1
- **Lines**: 516
- **Function List**: AppRackProperties, convertToFeet, validateForm, handleFeetInchesChange, handleMountTypeChange, handleTierCountChange, handleTierHeightChange, handleSelectChange, handleAddRack, renderTierHeightInputs, setFormData
- **Import Sources**: ../../types/tradeRack, prop-types, ./app-rack-properties.css

### src/components/mep/app-saved-configurations.js
- **Functions**: 11
- **Imports**: 5
- **Exports**: 1
- **Lines**: 650
- **Function List**: AppSavedConfigurations, handleConfigClick, handleSaveConfiguration, handleUpdateConfig, handleStartRename, handleCancelRename, handleSaveRename, handleDeleteConfig, formatDimension, formatDate, getConfigColor
- **Import Sources**: react, ../../utils/projectManifest, ../../types/tradeRack, prop-types, ./app-saved-configurations.css

### src/components/mep/app-tier-mep.js
- **Functions**: 8
- **Imports**: 2
- **Exports**: 1
- **Lines**: 587
- **Function List**: getItemDisplayText, AppTierMEP, handleClickOutside, positionColorPicker, getAvailableTiers, groupItemsByTier, toggleSection, handleDeleteAll
- **Import Sources**: prop-types, ./app-tier-mep.css

### src/components/mep/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 8
- **Lines**: 14

### src/components/navigation/app-button-left-menu.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 203
- **Function List**: AppButtonLeftMenu
- **Import Sources**: prop-types, ./app-button-left-menu.css

### src/components/navigation/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 6
- **Lines**: 12

### src/components/navigation/navbar.js
- **Functions**: 1
- **Imports**: 4
- **Exports**: 1
- **Lines**: 205
- **Function List**: Navbar
- **Import Sources**: react-router-dom, ../ui, prop-types, ./navbar.css

### src/components/navigation/project-dashboard-navbar.js
- **Functions**: 1
- **Imports**: 4
- **Exports**: 1
- **Lines**: 240
- **Function List**: ProjectDashboardNavbar
- **Import Sources**: react-router-dom, ../ui, prop-types, ./project-dashboard-navbar.css

### src/components/navigation/project-dashboard-sidebar.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 211
- **Function List**: ProjectDashboardSidebar
- **Import Sources**: prop-types, ./project-dashboard-sidebar.css

### src/components/navigation/projects-navbar.js
- **Functions**: 1
- **Imports**: 4
- **Exports**: 1
- **Lines**: 179
- **Function List**: ProjectsNavbar
- **Import Sources**: react-router-dom, ../ui, prop-types, ./projects-navbar.css

### src/components/navigation/projects-sidebar.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 199
- **Function List**: ProjectsSidebar
- **Import Sources**: prop-types, ./projects-sidebar.css

### src/components/projects/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 2
- **Lines**: 8

### src/components/projects/multi-trade-racks.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 116
- **Function List**: MultiTradeRacks
- **Import Sources**: react-router-dom, prop-types, ./multi-trade-racks.css

### src/components/projects/projects-main.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 332
- **Function List**: ProjectsMain
- **Import Sources**: ../ui, prop-types, ./projects-main.css

### src/components/ui/app-ai-chat-panel.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 77
- **Function List**: AppAIChatPanel
- **Import Sources**: prop-types, ./app-ai-chat-panel.css

### src/components/ui/app-logo.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 48
- **Function List**: AppLogo
- **Import Sources**: prop-types, ./app-logo.css

### src/components/ui/assembly-card.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 80
- **Function List**: AssemblyCard
- **Import Sources**: prop-types, ./assembly-card.css

### src/components/ui/hero.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 85
- **Function List**: Hero
- **Import Sources**: react-router-dom, prop-types, ./hero.css

### src/components/ui/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 7
- **Lines**: 13

### src/components/ui/logo-projects.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 48
- **Function List**: LogoProjects
- **Import Sources**: prop-types, ./logo-projects.css

### src/components/ui/logo.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 50
- **Function List**: Logo
- **Import Sources**: react-router-dom, prop-types, ./logo.css

### src/components/ui/project-card.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 87
- **Function List**: ProjectCard
- **Import Sources**: prop-types, ./project-card.css

### src/handlers/configurationHandlers.js
- **Functions**: 5
- **Imports**: 1
- **Exports**: 1
- **Lines**: 189
- **Function List**: createConfigurationHandlers, handleBuildingSave, handleAddRack, handleConfigurationSaved, handleRestoreConfiguration
- **Import Sources**: ../utils/projectManifest

### src/handlers/mepHandlers.js
- **Functions**: 15
- **Imports**: 1
- **Exports**: 1
- **Lines**: 362
- **Function List**: selectDuct, selectPipe, selectConduit, selectCableTray, updateDuctColor, updatePipeColor, updateConduitColor, updateCableTrayColor, createMEPHandlers, handleAddMepItem, handleRemoveMepItem, handleDeleteAllMepItems, handleMepItemClick, handleDuctColorChange, forEach
- **Import Sources**: ../utils/projectManifest

### src/handlers/uiHandlers.js
- **Functions**: 7
- **Imports**: 1
- **Exports**: 1
- **Lines**: 74
- **Function List**: createUIHandlers, handleMeasurementToggle, handleClearMeasurements, handleViewModeChange, handleFitView, handleToggleAddMEP, createMEPPanelHandler
- **Import Sources**: ../utils/projectManifest

### src/hooks/useAppState.js
- **Functions**: 4
- **Imports**: 4
- **Exports**: 1
- **Lines**: 197
- **Function List**: useAppState, getInitialUIState, handleProjectNameChange, handlePanelClick
- **Import Sources**: react, ../types/buildingShell, ../types/tradeRack, ../utils/projectManifest

### src/hooks/useBuildingRackSync.js
- **Functions**: 1
- **Imports**: 1
- **Exports**: 1
- **Lines**: 55
- **Function List**: useBuildingRackSync
- **Import Sources**: react

### src/hooks/useEventListeners.js
- **Functions**: 8
- **Imports**: 2
- **Exports**: 1
- **Lines**: 247
- **Function List**: useEventListeners, handleMeasurementToolDeactivated, handleMepItemsUpdated, handleStorageChange, handleGlobalKeyDown, handleClickOutside, handleClickOutsidePanels, handleClickOutsideRackProperties
- **Import Sources**: react, ../utils/projectManifest

### src/hooks/useInitialization.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 90
- **Function List**: useInitialization
- **Import Sources**: react, ../utils/projectManifest

### src/hooks/useSceneRack.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 68
- **Function List**: useSceneRack
- **Import Sources**: react, ../components/3d/trade-rack/buildRack

### src/hooks/useSceneShell.js
- **Functions**: 1
- **Imports**: 2
- **Exports**: 1
- **Lines**: 107
- **Function List**: useSceneShell
- **Import Sources**: react, ../components/3d/core/utils

### src/index.js
- **Functions**: 1
- **Imports**: 5
- **Exports**: 0
- **Lines**: 45
- **Function List**: App
- **Import Sources**: react-router-dom, ./pages, react, react-dom, ./style.css

### src/pages/app-page.js
- **Functions**: 2
- **Imports**: 18
- **Exports**: 1
- **Lines**: 357
- **Function List**: AppPage, handleAddRack
- **Import Sources**: react-helmet, ../components/layout, ../components/navigation, ../components/mep, ../components/ui, ../components/forms, ../components/3d, ../hooks/useSceneShell, ../hooks/useSceneRack, ../hooks/useAppState, ../hooks/useInitialization, ../hooks/useBuildingRackSync, ../hooks/useEventListeners, ../handlers/mepHandlers, ../handlers/configurationHandlers, ../handlers/uiHandlers, ../utils/manifestExporter, ./app-page.css

### src/pages/home.js
- **Functions**: 1
- **Imports**: 6
- **Exports**: 1
- **Lines**: 187
- **Function List**: Home
- **Import Sources**: react-helmet, ../components/navigation, ../components/ui, ../components/projects, ../components/layout, ./home.css

### src/pages/index.js
- **Functions**: 0
- **Imports**: 0
- **Exports**: 7
- **Lines**: 13

### src/pages/login.js
- **Functions**: 1
- **Imports**: 5
- **Exports**: 1
- **Lines**: 136
- **Function List**: Login
- **Import Sources**: react-helmet, ../components/navigation, ../components/forms, ../components/layout, ./login.css

### src/pages/not-found.js
- **Functions**: 1
- **Imports**: 3
- **Exports**: 1
- **Lines**: 33
- **Function List**: NotFound
- **Import Sources**: react-helmet, react, ./not-found.css

### src/pages/project-dashboard.js
- **Functions**: 1
- **Imports**: 5
- **Exports**: 1
- **Lines**: 293
- **Function List**: ProjectDashboard
- **Import Sources**: react-router-dom, react-helmet, ../components/navigation, ../components/ui, ./project-dashboard.css

### src/pages/projects.js
- **Functions**: 1
- **Imports**: 5
- **Exports**: 1
- **Lines**: 414
- **Function List**: Projects
- **Import Sources**: react-router-dom, react-helmet, ../components/navigation, ../components/ui, ./projects.css

### src/pages/signup-page.js
- **Functions**: 1
- **Imports**: 5
- **Exports**: 1
- **Lines**: 134
- **Function List**: SignupPage
- **Import Sources**: react-helmet, ../components/navigation, ../components/forms, ../components/layout, ./signup-page.css

### src/types/buildingShell.js
- **Functions**: 1
- **Imports**: 0
- **Exports**: 2
- **Lines**: 26
- **Function List**: convertToFeet

### src/types/tradeRack.js
- **Functions**: 3
- **Imports**: 0
- **Exports**: 4
- **Lines**: 115
- **Function List**: convertToFeet, calculateTotalHeight, calculateBayConfiguration

### src/utils/fileOperations.js
- **Functions**: 5
- **Imports**: 0
- **Exports**: 5
- **Lines**: 188
- **Function List**: exportConfigurationsToFile, importConfigurationsFromFile, saveConfigurationsToLocalStorage, loadConfigurationsFromLocalStorage, generateExportFilename

### src/utils/manifestExporter.js
- **Functions**: 3
- **Imports**: 1
- **Exports**: 3
- **Lines**: 138
- **Function List**: logManifestToConsole, downloadManifest, getManifestInfo
- **Import Sources**: ./projectManifest

### src/utils/projectManifest.js
- **Functions**: 21
- **Imports**: 0
- **Exports**: 17
- **Lines**: 580
- **Function List**: createInitialManifest, getProjectManifest, saveProjectManifest, updateBuildingShell, updateTradeRackConfiguration, deleteTradeRackConfiguration, setActiveConfiguration, syncManifestWithLocalStorage, mapTypeToCategory, updateMEPItems, syncMEPItemsWithLocalStorage, addMEPItem, removeMEPItem, updateUIState, updateMeasurements, addChangeToHistory, validateAndMigrateManifest, getSessionId, exportProjectManifest, getProjectStatistics, initializeProject

