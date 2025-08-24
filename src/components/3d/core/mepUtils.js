/**
 * Utility functions for MEP components
 */

/**
 * Get the column/post size from rack parameters
 * Handles both old format (postSize/columnSize) and new format (columnSizes with columnType)
 * @param {Object} rackParams - The rack parameters object
 * @returns {number} - Column size in inches
 */
export function getColumnSize(rackParams) {
  let columnSize = null
  
  try {
    // Check for old format first (postSize or columnSize directly)
    if (rackParams?.postSize && rackParams.postSize > 0) {
      columnSize = rackParams.postSize
    } else if (rackParams?.columnSize && rackParams.columnSize > 0) {
      columnSize = rackParams.columnSize
    } 
    // Check for new format (columnSizes object with columnType)
    else if (rackParams?.columnSizes && rackParams?.columnType) {
      columnSize = rackParams.columnSizes[rackParams.columnType]
    }
    
    // If still not found, try localStorage as backup
    if (!columnSize) {
      const storedParams = JSON.parse(localStorage.getItem('rackParameters') || '{}')
      if (storedParams?.columnSizes && storedParams?.columnType) {
        columnSize = storedParams.columnSizes[storedParams.columnType]
      }
    }
  } catch (error) {
    console.error('Error reading column size:', error)
  }
  
  // Default to 3 inches if not found
  return columnSize || 3
}

/**
 * Convert feet and inches object to total feet
 * @param {Object|number} value - Either a {feet, inches} object or a number
 * @returns {number} - Total feet
 */
export function convertToFeet(value) {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    return value.feet + (value.inches / 12)
  }
  return 0
}

/**
 * Convert inches to meters
 * @param {number} inches - Value in inches
 * @returns {number} - Value in meters
 */
export function inchesToMeters(inches) {
  return inches * 0.0254
}

/**
 * Convert feet to meters
 * @param {number} feet - Value in feet
 * @returns {number} - Value in meters
 */
export function feetToMeters(feet) {
  return feet * 0.3048
}