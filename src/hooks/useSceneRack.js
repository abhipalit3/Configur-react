/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useRef, useCallback } from 'react';
import { buildRackScene } from '../components/3d/trade-rack/buildRack';
import { TradeRackInteraction } from '../components/3d/trade-rack/TradeRackInteraction';

export function useSceneRack() {
  const sceneRef = useRef(null);
  const materialsRef = useRef(null);
  const snapPointsRef = useRef(null);
  const currentSnapPointsRef = useRef([]);

  const setReferences = useCallback((scene, materials, snapPoints) => {
    sceneRef.current = scene;
    materialsRef.current = materials;
    snapPointsRef.current = snapPoints;
  }, []);

  const build = useCallback((params) => {
    const scene = sceneRef.current;
    const materials = materialsRef.current;
    const snapPoints = snapPointsRef.current;
    
    if (!scene || !materials) {
      return null;
    }

    try {
      // Load temporary state FIRST to override any configuration values
      let tempState = null
      try {
        const tempStateStr = localStorage.getItem('rackTemporaryState')
        if (tempStateStr) {
          tempState = JSON.parse(tempStateStr)
          console.log('🔧 useSceneRack: Loading temporary state:', tempState)
        }
      } catch (error) {
        console.error('Error loading temporary state in useSceneRack:', error)
      }

      // Apply temporary state to params if available, but only for restoration, not new rack creation
      // If params.isNewRack is true, we're creating a fresh rack - ignore temp state
      // If params already has a position, it means we're restoring a saved config
      // If params has no position but tempState exists, we might be using temp state
      // If neither exist, we're creating a fresh rack
      const isNewRack = !!params.isNewRack
      const isRestoringConfig = !!params.position
      const shouldUseTempState = tempState && !isRestoringConfig && !isNewRack
      
      const updatedParams = {
        ...params,
        // Only apply temp state if we're not restoring a config and temp state exists
        topClearance: shouldUseTempState && tempState?.topClearance !== undefined ? tempState.topClearance : params.topClearance,
        position: isRestoringConfig ? params.position : (shouldUseTempState ? tempState?.position : undefined)
      }
      
      console.log('🔧 useSceneRack: isNewRack:', isNewRack, 'isRestoringConfig:', isRestoringConfig, 'shouldUseTempState:', shouldUseTempState)
      console.log('🔧 useSceneRack: Updated params position:', updatedParams.position)

      // Clear existing rack-specific snap points
      currentSnapPointsRef.current = [];
      
      // Build rack scene and collect new snap points
      const rackSnapPoints = buildRackScene(scene, updatedParams, materials);
      
      if (rackSnapPoints && snapPoints) {
        // Add rack snap points to global collection
        snapPoints.push(...rackSnapPoints);
        currentSnapPointsRef.current = rackSnapPoints;
      }

      // Update rack position with temporary state values after building (same as ThreeScene.jsx)
      // But only if we should use temp state (not for new racks or restored configs)
      if (shouldUseTempState) {
        console.log('🔧 useSceneRack: Applying temporary state since no saved position exists')
        scene.traverse((child) => {
          if (child.userData?.type === 'tradeRack') {
            // Update position if temporary state has different position than what was built
            if (tempState.position) {
              child.position.set(
                tempState.position.x || child.position.x,
                tempState.position.y || child.position.y,
                tempState.position.z || child.position.z
              )
              console.log('🔧 useSceneRack: Applied temp state position to rack:', child.position)
            }
            
            // Update configuration with temporary state values
            if (child.userData.configuration) {
              child.userData.configuration.topClearance = tempState.topClearance || 0
              
              // Update position in configuration as well for editor consistency
              if (tempState.position) {
                child.userData.configuration.position = {
                  x: tempState.position.x || 0,
                  y: tempState.position.y || 0,
                  z: tempState.position.z || 0
                }
              }
            }
          }
        })
      } else if (isRestoringConfig) {
        console.log('🔧 useSceneRack: Skipping temporary state - using saved position:', params.position)
      } else if (isNewRack) {
        console.log('🔧 useSceneRack: Creating NEW rack - no temp state applied')
      } else {
        console.log('🔧 useSceneRack: Creating fresh rack - no temp state applied')
      }
      
      return true;
    } catch (error) {
      console.error('Error building rack:', error);
      return false;
    }
  }, []);

  const update = useCallback((params) => {
    
    // Remove previous rack snap points from global collection
    const snapPoints = snapPointsRef.current;
    if (snapPoints && currentSnapPointsRef.current.length > 0) {
      currentSnapPointsRef.current.forEach(rackPoint => {
        const index = snapPoints.indexOf(rackPoint);
        if (index > -1) {
          snapPoints.splice(index, 1);
        }
      });
    }
    
    return build(params);
  }, [build]);

  return { build, update, setReferences };
}