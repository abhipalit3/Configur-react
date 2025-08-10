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
  console.log('Project ID:', manifest.projectId)
  console.log('Version:', manifest.version)
  console.log('Created:', new Date(manifest.createdAt).toLocaleString())
  console.log('Last Updated:', new Date(manifest.lastUpdated).toLocaleString())
  
  console.group('📊 Statistics')
  console.log('Trade Rack Configurations:', stats.totalComponents.tradeRacks)
  console.log('MEP Items:', stats.totalComponents.mepItems)
  console.log('Measurements:', stats.totalComponents.measurements)
  console.log('Configurations Saved:', stats.configurationsSaved)
  console.log('MEP Items Added:', stats.mepItemsAdded)
  console.groupEnd()
  
  console.group('🏗️ Current Building Shell')
  if (manifest.buildingShell.parameters) {
    console.log('Parameters:', manifest.buildingShell.parameters)
    console.log('Last Modified:', new Date(manifest.buildingShell.lastModified).toLocaleString())
  } else {
    console.log('No building shell configured')
  }
  console.groupEnd()
  
  console.group('🔧 Current Trade Rack')
  if (manifest.tradeRacks.active) {
    console.log('Active Configuration:', manifest.tradeRacks.active)
    console.log('Saved Configurations:', manifest.tradeRacks.totalCount)
  } else {
    console.log('No active trade rack configuration')
  }
  console.groupEnd()
  
  console.group('🚰 MEP Items')
  console.log('Ductwork:', manifest.mepItems.ductwork.length)
  console.log('Piping:', manifest.mepItems.piping.length)  
  console.log('Conduits:', manifest.mepItems.conduits.length)
  console.log('Cable Trays:', manifest.mepItems.cableTrays.length)
  console.log('Total:', manifest.mepItems.totalCount)
  console.groupEnd()
  
  console.group('📏 Measurements')
  console.log('Total Measurements:', manifest.measurements.totalCount)
  console.groupEnd()
  
  console.group('🎛️ UI State')
  console.log('Active Panel:', manifest.uiState.activePanel)
  console.log('Rack Properties Visible:', manifest.uiState.isRackPropertiesVisible)
  console.log('Measurement Tool Active:', manifest.uiState.isMeasurementActive)
  console.groupEnd()
  
  console.group('📝 Recent Changes (Last 10)')
  manifest.changeHistory.slice(0, 10).forEach((change, index) => {
    console.log(`${index + 1}. [${change.component}] ${change.action}`, {
      timestamp: new Date(change.timestamp).toLocaleString(),
      details: change.details
    })
  })
  console.groupEnd()
  
  console.log('Full Manifest:', manifest)
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
    
    console.log(`✅ Manifest downloaded: ${filename}`)
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
  
  console.log('📊 Manifest Info:', info)
  return info
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.exportManifest = logManifestToConsole
  window.downloadManifest = downloadManifest
  window.getManifestInfo = getManifestInfo
  
}