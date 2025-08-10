export const tradeRackDefaults = {
  // Mount type
  mountType: 'deck', // 'deck' or 'floor'
  
  // Length dimensions - stored as separate feet and inches  
  rackLength: { feet: 20, inches: 0 }, // Total rack length
  rackWidth: { feet: 4, inches: 0 },   // Rack depth/width
  bayWidth: { feet: 3, inches: 0 },    // Standard bay width
  
  // Tier configuration
  tierCount: 2,
  tierHeights: [
    { feet: 2, inches: 0 }, // Tier 1 height
    { feet: 2, inches: 0 }  // Tier 2 height
  ],
  
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