import { useState, useEffect, useCallback } from 'react';
import manifestSyncService from '../services/manifestSync';

export const useManifest = () => {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeManifest = async () => {
      try {
        setLoading(true);
        const manifestData = await manifestSyncService.initializeManifest();
        setManifest(manifestData);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error initializing manifest:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeManifest();
  }, []);

  const updateManifest = useCallback((newData) => {
    try {
      manifestSyncService.setLocalManifest(newData);
      setManifest(newData);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error updating manifest:', err);
    }
  }, []);

  const syncToCloud = useCallback(async () => {
    try {
      await manifestSyncService.uploadManifestToCloud();
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error syncing to cloud:', err);
    }
  }, []);

  const refreshFromCloud = useCallback(async () => {
    try {
      setLoading(true);
      const cloudManifest = await manifestSyncService.downloadManifestFromCloud();
      if (cloudManifest) {
        setManifest(cloudManifest);
      }
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error refreshing from cloud:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    manifest,
    loading,
    error,
    updateManifest,
    syncToCloud,
    refreshFromCloud,
  };
};