/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Manifest Exporter - Utility for debugging and data migration
 * Use in browser console: window.exportManifest()
 */

import { exportProjectManifest, getProjectStatistics } from './projectManifest'

/**
 * Export current manifest to browser console
 */
export const logManifestToConsole = () => {
  const manifest = exportProjectManifest()
  const stats = getProjectStatistics()
  
  console.group('📋 Project Manifest')
  
  console.group('📊 Statistics')
  console.groupEnd()
  
  console.group('🏗️ Current Building Shell')
  if (manifest.buildingShell.parameters) {
  } else {
  }
  console.groupEnd()
  
  console.group('🔧 Current Trade Rack')
  if (manifest.tradeRacks.activeConfigurationId) {
    console.log('Active Configuration ID:', manifest.tradeRacks.activeConfigurationId)
    const activeConfig = manifest.tradeRacks.configurations.find(
      c => c.id === manifest.tradeRacks.activeConfigurationId
    )
    if (activeConfig) {
      console.log('Active Configuration:', activeConfig)
    }
  } else {
    console.log('No active configuration selected')
  }
  console.log('Total Configurations:', manifest.tradeRacks.totalCount)
  console.groupEnd()
  
  console.group('🚰 MEP Items')
  console.groupEnd()
  
  console.group('📏 Measurements')
  console.groupEnd()
  
  console.group('🎛️ UI State')
  console.groupEnd()
  
  console.group('📝 Recent Changes (Last 10)')
  manifest.changeHistory.slice(0, 10).forEach((change, index) => {
    console.log({
      timestamp: new Date(change.timestamp).toLocaleString(),
      details: change.details
    })
  })
  console.groupEnd()
  
  console.groupEnd()
  
  return manifest
}

/**
 * Download manifest as JSON file for backup/migration
 */
export const downloadManifest = () => {
  try {
    const manifest = exportProjectManifest()
    const jsonString = JSON.stringify(manifest, null, 2)
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0]
    
    const filename = `project-manifest_${timestamp}.json`
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = filename
    downloadLink.style.display = 'none'
    
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    
    URL.revokeObjectURL(url)
    
    return { success: true, filename }
  } catch (error) {
    console.error('❌ Failed to download manifest:', error)
    return { success: false, error }
  }
}

/**
 * Get manifest size and storage information
 */
export const getManifestInfo = () => {
  const manifest = exportProjectManifest()
  const jsonString = JSON.stringify(manifest)
  const sizeInBytes = new Blob([jsonString]).size
  const sizeInKB = (sizeInBytes / 1024).toFixed(2)
  
  const info = {
    sizeBytes: sizeInBytes,
    sizeKB: sizeInKB,
    changeHistoryCount: manifest.changeHistory.length,
    totalComponents: 
      manifest.tradeRacks.totalCount + 
      manifest.mepItems.totalCount + 
      manifest.measurements.totalCount,
    lastActivity: manifest.lastUpdated,
    storageKey: 'projectManifest'
  }
  
  return info
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.exportManifest = logManifestToConsole
  window.downloadManifest = downloadManifest
  window.getManifestInfo = getManifestInfo
  
}