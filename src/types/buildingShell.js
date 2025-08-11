export const buildingShellDefaults = {
  // Length dimensions - stored as separate feet and inches
  corridorWidth: { feet: 10, inches: 0 },
  corridorHeight: { feet: 15, inches: 0 },
  ceilingHeight: { feet: 9, inches: 0 },
  // Beam depth - stored as feet and inches (can be zero to skip beam)
  beamDepth: { feet: 0, inches: 0 },
  // Thickness dimensions - stored in inches only
  slabDepth: 8, // inches
  ceilingDepth: 4, // inches - thickness of the intermediate ceiling slab
  wallThickness: 6, // inches
  // Generic bay width (not in form)
  bayWidth: { feet: 8, inches: 0 },
};

// Utility to convert feet+inches to total feet for calculations
export const convertToFeet = (feetInches) => {
  if (typeof feetInches === 'number') return feetInches; // backwards compatibility
  return feetInches.feet + (feetInches.inches / 12);
};