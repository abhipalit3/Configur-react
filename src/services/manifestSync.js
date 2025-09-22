import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient();

class ManifestSyncService {
  constructor() {
    this.localStorageKey = 'appManifestData';
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('beforeunload', () => {
      this.uploadManifestToCloud();
    });

    window.addEventListener('unload', () => {
      this.uploadManifestToCloud();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.uploadManifestToCloud();
      }
    });
  }

  async downloadManifestFromCloud() {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      const user = await getCurrentUser();

      const manifestRecords = await client.models.ManifestData.list({
        filter: {
          userId: {
            eq: user.userId
          }
        },
        limit: 1
      });

      if (manifestRecords.data && manifestRecords.data.length > 0) {
        const latestManifest = manifestRecords.data[0];
        localStorage.setItem(this.localStorageKey, JSON.stringify(latestManifest.manifestData));
        console.log('Manifest downloaded from cloud');
        return latestManifest.manifestData;
      } else {
        console.log('No manifest found in cloud');
        return null;
      }
    } catch (error) {
      console.error('Error downloading manifest:', error);
      return null;
    } finally {
      this.syncInProgress = false;
    }
  }

  async uploadManifestToCloud() {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      const user = await getCurrentUser();
      const localManifest = localStorage.getItem(this.localStorageKey);

      if (!localManifest) {
        console.log('No local manifest to upload');
        return;
      }

      const manifestData = JSON.parse(localManifest);

      const existingRecords = await client.models.ManifestData.list({
        filter: {
          userId: {
            eq: user.userId
          }
        },
        limit: 1
      });

      if (existingRecords.data && existingRecords.data.length > 0) {
        await client.models.ManifestData.update({
          id: existingRecords.data[0].id,
          manifestData: manifestData,
          lastModified: new Date().toISOString()
        });
        console.log('Manifest updated in cloud');
      } else {
        await client.models.ManifestData.create({
          userId: user.userId,
          manifestData: manifestData,
          lastModified: new Date().toISOString()
        });
        console.log('Manifest created in cloud');
      }
    } catch (error) {
      console.error('Error uploading manifest:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  getLocalManifest() {
    const manifest = localStorage.getItem(this.localStorageKey);
    return manifest ? JSON.parse(manifest) : null;
  }

  setLocalManifest(data) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
  }

  async initializeManifest() {
    const cloudManifest = await this.downloadManifestFromCloud();
    const localManifest = this.getLocalManifest();

    if (cloudManifest && (!localManifest || new Date(cloudManifest.lastModified) > new Date(localManifest.lastModified))) {
      this.setLocalManifest(cloudManifest);
      return cloudManifest;
    }

    return localManifest;
  }
}

export default new ManifestSyncService();