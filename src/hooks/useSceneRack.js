/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useRef, useCallback } from 'react';
import { buildRackScene } from '../components/3d/trade-rack/buildRack';
import { TradeRackInteraction } from '../components/3d/trade-rack/TradeRackInteraction';
import { getRackTemporaryState } from '../utils/temporaryState';

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
        const tempRackState = getRackTemporaryState()
        if (tempRackState.temporaryPosition) {
          tempState = { position: tempRackState.temporaryPosition, isDragging: tempRackState.isDragging }
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
      const isUsingPreservedPosition = !!params.isUsingPreservedPosition
      const isRestoringConfig = !!params.position && !isNewRack && !isUsingPreservedPosition
      // Always use temp state if it exists
      const shouldUseTempState = !!tempState
      
      const updatedParams = {
        ...params,
        // Apply temp state clearance if available
        topClearance: shouldUseTempState && tempState?.topClearance !== undefined ? tempState.topClearance : params.topClearance,
        // Don't pass position when temp state should be used - let buildRack handle it
        position: shouldUseTempState ? undefined : params.position
      }
      
      console.log('🔧 useSceneRack: isNewRack:', isNewRack, 'isUsingPreservedPosition:', isUsingPreservedPosition, 'isRestoringConfig:', isRestoringConfig, 'shouldUseTempState:', shouldUseTempState)
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

      // Don't apply temporary state here - buildRack already handled it when position was undefined
      // useSceneRack should not override buildRack's positioning logic
      if (updatedParams.position === undefined) {
        console.log('🔧 useSceneRack: buildRack handled temporary state - not overriding')
      } else if (shouldUseTempState && isRestoringConfig) {
        console.log('🔧 useSceneRack: Applying temporary state - overriding saved position')
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
      } else {
        console.log('🔧 useSceneRack: No position override needed')
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