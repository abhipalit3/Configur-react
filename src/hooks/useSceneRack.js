import { useRef, useCallback } from 'react';
import { buildRackScene } from '../components/3d/trade-rack/buildRack';

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
      console.log('🏗️ Scene not ready yet, skipping rack build');
      return null;
    }

    try {
      // Clear existing rack-specific snap points
      currentSnapPointsRef.current = [];
      
      // Build rack scene and collect new snap points
      const rackSnapPoints = buildRackScene(scene, params, materials);
      
      if (rackSnapPoints && snapPoints) {
        // Add rack snap points to global collection
        snapPoints.push(...rackSnapPoints);
        currentSnapPointsRef.current = rackSnapPoints;
      }
      
      return true;
    } catch (error) {
      console.error('Error building rack:', error);
      return false;
    }
  }, []);

  const update = useCallback((params) => {
    console.log('🏗️ Updating trade rack...');
    
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