/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

export const tradeRackDefaults = {
  // Mount type
  mountType: 'deck', // 'deck' or 'floor'
  
  // Length dimensions - stored as separate feet and inches  
  rackLength: { feet: 15, inches: 0 }, // Total rack length
  rackWidth: { feet: 4, inches: 0 },   // Rack depth/width
  bayWidth: { feet: 3, inches: 0 },    // Standard bay width
  
  // Tier configuration
  tierCount: 2,
  tierHeights: [
    { feet: 2, inches: 0 }, // Tier 1 height
    { feet: 2, inches: 0 }  // Tier 2 height
  ],
  
  // Top clearance - distance from top of rack to beam/joist above
  topClearance: { feet: 0, inches: 0 }, // 0 = attached directly below beam
  
  // Column and beam types with default sizes
  columnType: 'standard', // 'standard', 'heavy', 'light'
  beamType: 'standard',   // 'standard', 'heavy', 'light'
  
  // Default sizes based on types (in inches)
  columnSizes: {
    standard: 3,  // 3" x 3"
    heavy: 4,     // 4" x 4" 
    light: 2      // 2" x 2"
  },
  beamSizes: {
    standard: 3,  // 3" x 3"
    heavy: 4,     // 4" x 4"
    light: 2      // 2" x 2"
  }
};

// Utility to convert feet+inches to total feet for calculations
export const convertToFeet = (feetInches) => {
  if (typeof feetInches === 'number') return feetInches; // backwards compatibility
  return feetInches.feet + (feetInches.inches / 12);
};

// Calculate total rack height from tier configuration and beam sizes
export const calculateTotalHeight = (config) => {
  try {
    // Get tier heights array
    const tierHeights = config.tierHeights || []
    if (tierHeights.length === 0) {
      return 'N/A'
    }
    
    // Sum all tier heights (convert to feet)
    let totalTierHeight = 0
    tierHeights.forEach(tierHeight => {
      totalTierHeight += convertToFeet(tierHeight)
    })
    
    // Get beam size (convert inches to feet)
    const beamSize = config.beamSizes && config.beamType 
      ? config.beamSizes[config.beamType] || 3
      : (config.beamSize || 3)
    const beamSizeInFeet = beamSize / 12 // Convert inches to feet
    
    // Total height = tier heights + (tier count + 1) * beam size
    // Structure: bottom beam + tier + intermediate beam + tier + ... + tier + top beam
    // So for N tiers, we have N+1 beams
    const tierCount = config.tierCount || tierHeights.length
    const totalBeamHeight = (tierCount + 1) * beamSizeInFeet
    
    const totalHeight = totalTierHeight + totalBeamHeight
    
    // Format as feet and inches
    const feet = Math.floor(totalHeight)
    const inches = Math.round((totalHeight - feet) * 12)
    
    if (inches === 0) {
      return `${feet}'0"`
    } else if (inches === 12) {
      return `${feet + 1}'0"`
    } else {
      return `${feet}'${inches}"`
    }
  } catch (error) {
    console.error('Error calculating total height:', error)
    return 'N/A'
  }
};

// Calculate number of bays and last bay width from total length and standard bay width
export const calculateBayConfiguration = (totalLength, standardBayWidth) => {
  const totalLengthFeet = convertToFeet(totalLength);
  const bayWidthFeet = convertToFeet(standardBayWidth);
  
  if (bayWidthFeet <= 0) return { bayCount: 1, lastBayWidth: totalLengthFeet };
  
  const fullBays = Math.floor(totalLengthFeet / bayWidthFeet);
  const remainder = totalLengthFeet - (fullBays * bayWidthFeet);
  
  if (remainder < 0.1) { // Less than ~1 inch remainder
    return { 
      bayCount: fullBays, 
      lastBayWidth: bayWidthFeet,
      hasCustomLastBay: false 
    };
  } else {
    return { 
      bayCount: fullBays + 1, 
      lastBayWidth: remainder,
      hasCustomLastBay: true 
    };
  }
};