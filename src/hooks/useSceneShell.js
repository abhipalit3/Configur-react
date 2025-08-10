import { useRef, useCallback } from 'react';
import { buildShell, buildFloorOnly } from '../components/3d/trade-rack/utils';

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
      console.log(`🏗️ Building shell visibility: ${visible ? 'shown' : 'hidden'}`);
    }
  }, []);

  const disposeGroup = useCallback((group) => {
    const scene = sceneRef.current;
    if (!group || !scene) return;
    
    console.log('🧹 Disposing building shell group');
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
      console.log('🏗️ Scene not ready yet, skipping build');
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
        console.log('🏗️ Floor-only shell built for floor-mounted rack');
      } else {
        shellGroup = buildShell(
          params,
          materials.wallMaterial,
          materials.ceilingMaterial,
          materials.floorMaterial,
          materials.roofMaterial,
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
    console.log(`🏗️ Updating building shell... (${floorOnly ? 'floor-only' : 'full'})`);
    
    if (currentGroupRef.current) {
      disposeGroup(currentGroupRef.current);
      currentGroupRef.current = null;
    }
    
    return build(params, floorOnly);
  }, [build, disposeGroup]);

  const switchMode = useCallback((params, floorOnly) => {
    console.log(`🏗️ Switching building shell mode to: ${floorOnly ? 'floor-only' : 'full'}`);
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