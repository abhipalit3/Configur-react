/**
 * File operations utility for saving/loading trade rack configurations
 * This will be replaced with Azure database operations later
 */

/**
 * Export configurations to a JSON file
 * @param {Array} configurations - Array of configuration objects
 * @param {string} filename - Name of the file to save
 */
export const exportConfigurationsToFile = (configurations, filename = 'trade-rack-configurations.json') => {
  try {
    // Create the data object with metadata
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      application: 'DPR Configur - Trade Rack Properties',
      configurations: configurations,
      count: configurations.length
    }

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2)

    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create temporary download link
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = filename
    downloadLink.style.display = 'none'

    // Trigger download
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    // Clean up URL
    URL.revokeObjectURL(url)

    return { success: true, message: `Exported ${configurations.length} configurations to ${filename}` }
  } catch (error) {
    console.error('❌ Error exporting configurations:', error)
    return { success: false, message: 'Failed to export configurations', error }
  }
}

/**
 * Import configurations from a JSON file
 * @param {File} file - The file object to import
 * @returns {Promise} - Promise that resolves with the imported configurations
 */
export const importConfigurationsFromFile = (file) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        reject(new Error('Invalid file type. Please select a JSON file.'))
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        reject(new Error('File is too large. Maximum size is 10MB.'))
        return
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result)

          // Validate the imported data structure
          if (!jsonData.configurations || !Array.isArray(jsonData.configurations)) {
            reject(new Error('Invalid file format. Missing configurations array.'))
            return
          }

          // Validate each configuration has required fields
          const validConfigurations = jsonData.configurations.filter(config => {
            return config && 
                   typeof config === 'object' &&
                   config.rackLength &&
                   config.rackWidth &&
                   config.mountType
          })

          if (validConfigurations.length === 0) {
            reject(new Error('No valid configurations found in the file.'))
            return
          }

          // Add import metadata to each configuration
          const importedConfigurations = validConfigurations.map((config, index) => ({
            ...config,
            id: Date.now() + index, // Generate new unique IDs
            importedAt: new Date().toISOString(),
            originalId: config.id // Keep reference to original ID
          }))

          
          resolve({
            success: true,
            configurations: importedConfigurations,
            metadata: {
              originalVersion: jsonData.version,
              originalExportDate: jsonData.exportDate,
              originalCount: jsonData.count,
              importedCount: importedConfigurations.length
            }
          })
        } catch (parseError) {
          reject(new Error('Invalid JSON file. Please check the file format.'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read the file.'))
      }

      reader.readAsText(file)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Save configurations to browser's local storage as backup
 * @param {Array} configurations - Array of configuration objects
 */
export const saveConfigurationsToLocalStorage = (configurations) => {
  try {
    const backupData = {
      configurations,
      lastBackup: new Date().toISOString(),
      count: configurations.length
    }
    
    localStorage.setItem('tradeRackConfigurationsBackup', JSON.stringify(backupData))
    return { success: true }
  } catch (error) {
    console.error('❌ Error backing up to localStorage:', error)
    return { success: false, error }
  }
}

/**
 * Load configurations from browser's local storage
 * @returns {Array} - Array of configuration objects
 */
export const loadConfigurationsFromLocalStorage = () => {
  try {
    const backupData = localStorage.getItem('tradeRackConfigurationsBackup')
    if (backupData) {
      const parsed = JSON.parse(backupData)
      return parsed.configurations || []
    }
    return []
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error)
    return []
  }
}

/**
 * Generate a filename with timestamp for exports
 * @param {string} prefix - Prefix for the filename
 * @returns {string} - Generated filename
 */
export const generateExportFilename = (prefix = 'trade-rack-configurations') => {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0]
  
  return `${prefix}_${timestamp}.json`
}