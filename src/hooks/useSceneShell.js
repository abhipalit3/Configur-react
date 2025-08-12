/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useRef, useCallback } from 'react';
import { buildShell, buildFloorOnly } from '../components/3d/core/utils';

export function useSceneShell() {
  const currentGroupRef = useRef(null);
  const sceneRef = useRef(null);
  const materialsRef = useRef(null);
  const snapPointsRef = useRef(null);

  const setReferences = useCallback((scene, materials, snapPoints) => {
    sceneRef.current = scene;
    materialsRef.current = materials;
    snapPointsRef.current = snapPoints;
  }, []);

  const setVisibility = useCallback((visible) => {
    if (currentGroupRef.current) {
      currentGroupRef.current.visible = visible;
    }
  }, []);

  const disposeGroup = useCallback((group) => {
    const scene = sceneRef.current;
    if (!group || !scene) return;
    
    scene.remove(group);
    group.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.dispose();
      }
    });
  }, []);

  const build = useCallback((params, floorOnly = false) => {
    const scene = sceneRef.current;
    const materials = materialsRef.current;
    const snapPoints = snapPointsRef.current;
    
    if (!scene || !materials || !snapPoints) {
      return null;
    }

    // Clear existing snap points
    snapPoints.length = 0;
    
    try {
      let shellGroup;
      
      if (floorOnly) {
        shellGroup = buildFloorOnly(
          params,
          materials.floorMaterial,
          snapPoints
        );
      } else {
        shellGroup = buildShell(
          params,
          materials.wallMaterial,
          materials.ceilingMaterial,
          materials.floorMaterial,
          materials.roofMaterial,
          materials.shellBeamMaterial,
          snapPoints
        );
      }
      
      if (shellGroup) {
        scene.add(shellGroup);
        currentGroupRef.current = shellGroup;
        return shellGroup;
      }
    } catch (error) {
      console.error('Error building shell:', error);
    }
    
    return null;
  }, []);

  const update = useCallback((params, floorOnly = false) => {
    
    if (currentGroupRef.current) {
      disposeGroup(currentGroupRef.current);
      currentGroupRef.current = null;
    }
    
    return build(params, floorOnly);
  }, [build, disposeGroup]);

  const switchMode = useCallback((params, floorOnly) => {
    return update(params, floorOnly);
  }, [update]);

  const dispose = useCallback(() => {
    if (currentGroupRef.current) {
      disposeGroup(currentGroupRef.current);
      currentGroupRef.current = null;
    }
  }, [disposeGroup]);

  return { build, update, dispose, setReferences, setVisibility, switchMode };
}