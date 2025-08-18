/**
 * Complete Genetic Algorithm for Rack Optimization
 * Single file implementation to avoid import issues
 */

// Chromosome representation for rack and MEP configuration
class RackChromosome {
  constructor(genes = null, constraints = {}) {
    this.constraints = constraints;
    
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = this.generateRandomGenes();
    }
  }

  generateRandomGenes() {
    const { mepSystems = [], buildingConstraints = {} } = this.constraints;

    // Get fixed rack length from constraints or use default
    const fixedRackLength = this.constraints.fixedRackLength || 20; // Default 20 feet
    
    // Calculate minimum dimensions needed for all MEP systems
    const mepRequirements = this.calculateMEPRequirements(mepSystems);
    
    // Generate rack dimensions - optimize for MEP system requirements
    const genes = {
      rackLength: fixedRackLength, // FIXED - not optimized
      bayWidth: Math.max(4, mepRequirements.minBayWidth),
      bayCount: Math.max(1, Math.floor(fixedRackLength / Math.max(4, mepRequirements.minBayWidth))),
      tierCount: Math.max(mepRequirements.minTiers, Math.min(5, Math.ceil(mepRequirements.totalDepthNeeded / 8))), // Based on depth needed
      rackDepth: Math.max(mepRequirements.minDepth, 4), // Ensure enough depth for systems across width
      tierHeights: [],
      mepPlacements: [],
      // Add mount type and building context for proper positioning
      mountType: buildingConstraints.mountType || 'deck',
      buildingContext: buildingConstraints.buildingContext || {},
      topClearance: buildingConstraints.topClearance || 10
    };

    // Ensure bay count fits within fixed length
    genes.bayCount = Math.max(1, Math.floor(fixedRackLength / genes.bayWidth));

    // Ensure we don't exceed building constraints for width (which is depth in this case)
    if (buildingConstraints.corridorWidth) {
      const maxWidth = this.convertToFeet(buildingConstraints.corridorWidth);
      if (genes.rackDepth > maxWidth) {
        genes.rackDepth = Math.max(2, maxWidth - 1);
      }
    }

    // Generate tier heights based on MEP requirements
    for (let i = 0; i < genes.tierCount; i++) {
      const tierMEP = mepRequirements.tierRequirements[i] || { minHeight: 1.5 };
      genes.tierHeights.push({
        feet: Math.max(1, Math.floor(tierMEP.minHeight) + Math.floor(Math.random() * 2)),
        inches: Math.floor(Math.random() * 12)
      });
    }

    // Place MEP systems optimally
    genes.mepPlacements = this.placeMEPSystems(mepSystems, genes);

    return genes;
  }

  calculateMEPRequirements(mepSystems) {
    let totalDepthNeeded = 0; // Total depth across rack width
    let maxWidth = 0; // Maximum width (along rack length)
    let totalVolume = 0;
    const tierRequirements = [];
    const spacing = 0.5; // 6 inches spacing between systems

    // Group MEP systems by type and calculate space requirements
    const systemsByType = {};
    mepSystems.forEach(system => {
      if (!systemsByType[system.type]) {
        systemsByType[system.type] = [];
      }
      systemsByType[system.type].push(system);

      // Calculate bounding box for each system
      const bbox = this.getMEPBoundingBox(system);
      totalDepthNeeded += (bbox.depth / 12) + spacing; // Add depth (across width) of each system plus spacing
      maxWidth = Math.max(maxWidth, bbox.width); // Track max width (along length)
      totalVolume += bbox.volume;

      // Assign to tiers based on type preferences
      const preferredTier = this.getPreferredTier(system.type);
      if (!tierRequirements[preferredTier]) {
        tierRequirements[preferredTier] = { minHeight: 0, systems: [], totalDepthNeeded: 0 };
      }
      tierRequirements[preferredTier].minHeight = Math.max(
        tierRequirements[preferredTier].minHeight, 
        bbox.height / 12 // Convert to feet
      );
      tierRequirements[preferredTier].totalDepthNeeded += (bbox.depth / 12) + spacing;
      tierRequirements[preferredTier].systems.push(system);
    });

    // Calculate minimum number of tiers needed based on depth across width
    const maxTierDepth = Math.max(...tierRequirements.filter(t => t).map(t => t.totalDepthNeeded || 0));
    const estimatedTiers = Math.max(
      tierRequirements.filter(t => t).length,
      Math.ceil(totalDepthNeeded / 8) // Assume max rack depth of 8 ft
    );

    return {
      minBayWidth: Math.max(4, maxWidth / 12), // Bay width based on system width along length
      minDepth: Math.max(3, Math.ceil(maxTierDepth)), // Minimum depth to fit systems across width
      minTiers: Math.max(1, estimatedTiers),
      totalDepthNeeded: totalDepthNeeded,
      tierRequirements
    };
  }

  getMEPBoundingBox(system) {
    switch(system.type) {
      case 'duct':
        const ductWidth = (system.width || 24) + (system.insulation || 0) * 2; // inches
        const ductHeight = (system.height || 12) + (system.insulation || 0) * 2;
        return {
          width: ductWidth, // Along rack length
          height: ductHeight, // Vertical
          depth: ductWidth + 6, // Space needed across rack width (width + clearance)
          volume: (ductWidth * ductHeight * 12) / 1728 // cubic feet
        };
      case 'pipe':
        const radius = (system.diameter || 4) / 2 + (system.insulation || 0);
        const pipeSpacing = Math.max(radius * 2 + 6, 12); // Pipe diameter + 6" clearance or 12" minimum
        return {
          width: radius * 2,
          height: radius * 2,
          depth: pipeSpacing, // Space needed across rack width
          volume: (Math.PI * Math.pow(radius / 12, 2) * 1) // cubic feet
        };
      case 'conduit':
        const conduitRadius = (system.diameter || 2) / 2;
        const conduitCount = system.count || 1;
        const conduitSpacing = 4; // 4" spacing between conduits
        const totalConduitWidth = (conduitCount * conduitRadius * 2) + ((conduitCount - 1) * conduitSpacing);
        return {
          width: totalConduitWidth,
          height: conduitRadius * 2,
          depth: totalConduitWidth + 6, // Space needed across rack width (width + clearance)
          volume: (Math.PI * Math.pow(conduitRadius / 12, 2) * 1)
        };
      case 'cableTray':
        const trayWidth = system.width || 12;
        return {
          width: trayWidth,
          height: system.height || 4,
          depth: trayWidth + 6, // Space needed across rack width (width + clearance)
          volume: ((system.width || 12) * (system.height || 4) * 12) / 1728
        };
      default:
        return { width: 12, height: 12, depth: 12, volume: 1 };
    }
  }

  getPreferredTier(systemType) {
    // Preferred tier assignment based on typical MEP practices
    switch(systemType) {
      case 'cableTray': return 0; // Top tier
      case 'duct': return 1; // Second tier
      case 'pipe': return 2; // Third tier
      case 'conduit': return 0; // Can share with cable trays
      default: return 0;
    }
  }

  placeMEPSystems(mepSystems, genes) {
    const placements = [];
    const occupiedSpaces = []; // Track occupied spaces per tier

    // Initialize occupied space tracking for both top and bottom of each tier
    for (let tier = 0; tier < genes.tierCount; tier++) {
      occupiedSpaces[tier] = {
        top: [],    // Systems mounted to bottom of top beam
        bottom: []  // Systems mounted to top of bottom beam
      };
    }

    // Sort MEP systems by size (largest first) for better packing
    const sortedSystems = [...mepSystems].sort((a, b) => {
      const bboxA = this.getMEPBoundingBox(a);
      const bboxB = this.getMEPBoundingBox(b);
      return (bboxB.width * bboxB.depth) - (bboxA.width * bboxA.depth);
    });

    // Group systems by type for better organization
    const systemsByType = {};
    sortedSystems.forEach(system => {
      const type = system.type;
      if (!systemsByType[type]) {
        systemsByType[type] = [];
      }
      systemsByType[type].push(system);
    });

    // Place systems type by type for better organization
    Object.keys(systemsByType).forEach(type => {
      const systems = systemsByType[type];
      const preferredTier = Math.min(this.getPreferredTier(type), genes.tierCount - 1);
      
      systems.forEach(system => {
        const bbox = this.getMEPBoundingBox(system);
        
        // Use organized placement instead of random
        const placement = this.findOrganizedPosition(system, bbox, genes, occupiedSpaces, preferredTier);
        if (placement) {
          placements.push(placement);
          // Mark space as occupied (convert from center position to corner for overlap checking)
          const mountSpace = placement.mountPosition === 'top' ? 'top' : 'bottom';
          const systemWidthFt = bbox.width / 12;
          const systemDepthFt = bbox.depth / 12;
          
          occupiedSpaces[placement.tier][mountSpace].push({
            x: placement.x - (systemWidthFt / 2), // Corner position for overlap checking
            y: placement.y - (systemDepthFt / 2),
            width: systemWidthFt,
            depth: systemDepthFt,
            systemId: system.id
          });
        }
      });
    });

    return placements;
  }

  findOrganizedPosition(system, bbox, genes, occupiedSpaces, preferredTier) {
    // Try to place systems across rack width (not length)
    const systemWidthFt = bbox.width / 12;
    const systemDepthFt = bbox.depth / 12;
    const spacing = 0.5; // 6 inches spacing between systems
    
    // Account for structural elements (beams and posts)
    // No structural clearances - use full rack space
    
    // First try the preferred tier
    for (let tierAttempt = 0; tierAttempt < genes.tierCount; tierAttempt++) {
      const tier = tierAttempt === 0 ? preferredTier : 
                   (preferredTier + tierAttempt) % genes.tierCount;
      
      // MEP systems can only mount to beams:
      // 'bottom' = attached to bottom of top beam of tier
      // 'top' = attached to top of bottom beam of tier
      const mountPositions = ['bottom', 'top'];
      
      for (const mountPosition of mountPositions) {
        const mountSpace = occupiedSpaces[tier] ? occupiedSpaces[tier][mountPosition] || [] : [];
        
        // Find the next available center position across the width (Y direction in optimization)
        // The rack spans from -rackDepth/2 to +rackDepth/2, use full rack space
        const availableStart = (-genes.rackDepth / 2);
        const availableEnd = (genes.rackDepth / 2);
        const availableSpace = availableEnd - availableStart;
        
        console.log(`🔍 Placing ${system.type}: depth=${systemDepthFt.toFixed(2)}ft, available=${availableSpace.toFixed(2)}ft, tier=${tier}, beam=${mountPosition === 'top' ? 'bottom-beam' : 'top-beam'}`);
        
        let centerY = availableStart + spacing + (systemDepthFt / 2); // Start from edge
        
        mountSpace.forEach(occupied => {
          // occupied.y is corner position, so occupiedEnd is the far edge
          const occupiedEnd = occupied.y + occupied.depth;
          // Add spacing + half depth of new system for center position
          const nextCenterPosition = occupiedEnd + spacing + (systemDepthFt / 2);
          if (nextCenterPosition > centerY) {
            centerY = nextCenterPosition;
          }
        });
        
        // Check if system fits at this center position across the width
        // Account for posts at rack edges - rack spans from -rackDepth/2 to +rackDepth/2
        if (centerY + (systemDepthFt / 2) <= availableEnd) {
          // Keep systems at a fixed position along length (center at origin)
          // The rack spans from -rackLength/2 to +rackLength/2, so center is at X=0
          const centerX = 0;
          
          // Verify no collision (check from center position)
          const hasCollision = mountSpace.some(occupied => {
            return this.rectanglesOverlap(
              { x: centerX - (systemWidthFt / 2), y: centerY - (systemDepthFt / 2), width: systemWidthFt, depth: systemDepthFt },
              occupied
            );
          });
          
          if (!hasCollision) {
            // Calculate tier position RELATIVE to rack base (not absolute)
            // This will be added to rack base Y in the coordinate transformation
            let tierY = 0;
            
            const mountType = genes.mountType || 'deck';
            
            if (mountType === 'floor') {
              // Floor mounted: tier 0 is at bottom, calculate upward from rack base
              for (let i = 0; i < tier; i++) {
                tierY += (genes.tierHeights[i]?.feet || 2) + (genes.tierHeights[i]?.inches || 0) / 12;
              }
              // Position at beam attachment points:
              // 'top' = top of bottom beam (bottom of tier space)
              // 'bottom' = bottom of top beam (top of tier space)
              if (mountPosition === 'top') {
                tierY += 0; // At bottom beam (bottom of tier)
              } else {
                tierY += (genes.tierHeights[tier]?.feet || 2) + (genes.tierHeights[tier]?.inches || 0) / 12; // At top beam (top of tier)
              }
            } else {
              // Deck mounted: tier 0 is at top, calculate relative position within rack height
              const totalRackHeight = genes.tierHeights.reduce((sum, th) => 
                sum + (th?.feet || 2) + (th?.inches || 0) / 12, 0);
              
              tierY = totalRackHeight; // Start from top of rack (relative to base)
              
              // Move down through tiers to reach target tier
              for (let i = 0; i <= tier; i++) {
                if (i === tier) {
                  // Position at beam attachment points:
                  // 'top' = top of bottom beam (bottom of tier space)
                  // 'bottom' = bottom of top beam (top of tier space)
                  if (mountPosition === 'top') {
                    tierY -= (genes.tierHeights[i]?.feet || 2) + (genes.tierHeights[i]?.inches || 0) / 12; // At bottom beam
                  } else {
                    tierY -= 0; // At top beam
                  }
                  break;
                } else {
                  // Move through this tier
                  tierY -= (genes.tierHeights[i]?.feet || 2) + (genes.tierHeights[i]?.inches || 0) / 12;
                }
              }
            }
            
            const placement = {
              systemId: system.id,
              systemType: system.type,
              tier,
              x: centerX,
              y: centerY, 
              z: tierY,
              mountPosition,
              dimensions: bbox
            };
            
            return placement;
          }
        }
      }
    }
    
    // If no organized position found, return null (don't force placement)
    return null;
  }

  findBestPosition(system, bbox, genes, occupiedSpaces, preferredTier) {
    const maxAttempts = 20;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tier = (attempt < 10) ? preferredTier : Math.floor(Math.random() * genes.tierCount);
      const rackLength = genes.rackLength; // Use fixed rack length
      const rackDepth = genes.rackDepth;
      
      // Try both mounting positions
      const mountPosition = Math.random() < 0.5 ? 'top' : 'bottom';
      
      // Try to place within rack bounds
      const maxX = rackLength - (bbox.width / 12);
      const maxY = rackDepth - (bbox.depth / 12);
      
      if (maxX <= 0 || maxY <= 0) continue; // System too big for this rack
      
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      
      // Check for collisions in the chosen mount position
      const mountSpace = occupiedSpaces[tier] ? occupiedSpaces[tier][mountPosition] || [] : [];
      const hasCollision = mountSpace.some(occupied => {
        return this.rectanglesOverlap(
          { x, y, width: bbox.width / 12, depth: bbox.depth / 12 },
          occupied
        );
      });
      
      if (!hasCollision) {
        // Calculate tier height inline
        let tierHeight = 0;
        for (let i = 0; i < tier && i < genes.tierHeights.length; i++) {
          tierHeight += genes.tierHeights[i].feet + (genes.tierHeights[i].inches || 0) / 12;
        }
        
        return {
          systemId: system.id,
          systemType: system.type,
          tier,
          x,
          y,
          z: tierHeight,
          mountPosition,
          dimensions: bbox
        };
      }
    }
    
    // If no good position found, force place in preferred tier
    let tierHeight = 0;
    for (let i = 0; i < preferredTier && i < genes.tierHeights.length; i++) {
      tierHeight += genes.tierHeights[i].feet + (genes.tierHeights[i].inches || 0) / 12;
    }
    
    return {
      systemId: system.id,
      systemType: system.type,
      tier: preferredTier,
      x: Math.random() * Math.max(1, genes.rackLength - 1),
      y: Math.random() * Math.max(1, genes.rackDepth - 1),
      z: tierHeight,
      mountPosition: 'bottom',  // Default to bottom mount
      dimensions: bbox
    };
  }

  rectanglesOverlap(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.depth < rect2.y || 
             rect2.y + rect2.depth < rect1.y);
  }

  generateMEPDimensions(type) {
    switch(type) {
      case 'duct':
        return {
          width: this.randomInRange(12, 48),
          height: this.randomInRange(8, 36),
          length: 0
        };
      case 'pipe':
        return {
          diameter: this.randomInRange(0.5, 12),
          length: 0
        };
      case 'conduit':
        return {
          diameter: this.randomInRange(0.5, 4),
          length: 0
        };
      case 'cable-tray':
      case 'cableTray':
        return {
          width: this.randomInRange(6, 24),
          height: this.randomInRange(2, 6),
          length: 0
        };
      default:
        return { width: 12, height: 12, length: 0 };
    }
  }

  randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  clone() {
    return new RackChromosome(JSON.parse(JSON.stringify(this.genes)), this.constraints);
  }

  toRackParams() {
    const params = {
      bayCount: this.genes.bayCount,
      bayWidth: this.genes.bayWidth,
      rackLength: this.genes.rackLength, // Include fixed rack length
      depth: this.genes.rackDepth,
      tierCount: this.genes.tierCount,
      // Convert tierHeights from objects to numbers for compatibility
      tierHeights: this.genes.tierHeights.map(th => 
        typeof th === 'object' ? (th.feet + (th.inches || 0) / 12) : th
      ),
      
      ductEnabled: new Array(this.genes.tierCount).fill(false),
      pipeEnabled: new Array(this.genes.tierCount).fill(false),
      conduitEnabled: new Array(this.genes.tierCount).fill(false),
      cableTrayEnabled: new Array(this.genes.tierCount).fill(false),
      
      mepSystems: []
    };

    this.genes.mepPlacements.forEach(placement => {
      const tier = placement.tier;
      
      switch(placement.systemType) {
        case 'duct':
          params.ductEnabled[tier] = true;
          break;
        case 'pipe':
          params.pipeEnabled[tier] = true;
          break;
        case 'conduit':
          params.conduitEnabled[tier] = true;
          break;
        case 'cable-tray':
        case 'cableTray':
          params.cableTrayEnabled[tier] = true;
          break;
      }
      
      params.mepSystems.push({
        id: placement.systemId,
        type: placement.systemType,
        tier: placement.tier,
        position: {
          x: placement.x,
          y: placement.y,
          z: placement.z
        },
        mountPosition: placement.mountPosition,
        dimensions: placement.dimensions
      });
    });

    return params;
  }

  calculateTierHeight(tierIndex) {
    let height = 0;
    for (let i = 0; i < tierIndex && i < this.genes.tierHeights.length; i++) {
      height += this.genes.tierHeights[i].feet + this.genes.tierHeights[i].inches / 12;
    }
    return height;
  }

  calculateTierHeightFromGenes(tierIndex, genes) {
    let height = 0;
    for (let i = 0; i < tierIndex && i < genes.tierHeights.length; i++) {
      height += genes.tierHeights[i].feet + genes.tierHeights[i].inches / 12;
    }
    return height;
  }

  getTotalHeight() {
    return this.calculateTierHeight(this.genes.tierCount);
  }

  getTotalWidth() {
    return this.genes.rackLength; // Use fixed rack length
  }

  getVolume() {
    return this.getTotalWidth() * this.genes.rackDepth * this.getTotalHeight();
  }

  hasCollisions() {
    const placements = this.genes.mepPlacements;
    
    // Group placements by tier for efficient collision checking
    const tierPlacements = {};
    placements.forEach(placement => {
      if (!tierPlacements[placement.tier]) {
        tierPlacements[placement.tier] = [];
      }
      tierPlacements[placement.tier].push(placement);
    });
    
    // Check for collisions within each tier
    for (const tier in tierPlacements) {
      const tierSystems = tierPlacements[tier];
      for (let i = 0; i < tierSystems.length; i++) {
        for (let j = i + 1; j < tierSystems.length; j++) {
          if (this.systemsCollide(tierSystems[i], tierSystems[j])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  systemsCollide(sys1, sys2) {
    // Check if systems are on different mount positions (top vs bottom)
    if (sys1.mountPosition !== sys2.mountPosition) {
      return false; // Systems on different mount positions don't collide
    }
    
    // Create bounding rectangles for each system
    const rect1 = {
      x: sys1.x,
      y: sys1.y,
      width: sys1.dimensions.width / 12, // Convert to feet
      depth: sys1.dimensions.depth / 12
    };
    
    const rect2 = {
      x: sys2.x,
      y: sys2.y,
      width: sys2.dimensions.width / 12,
      depth: sys2.dimensions.depth / 12
    };
    
    return this.rectanglesOverlap(rect1, rect2);
  }

  hasSystemsOutOfBounds() {
    let outOfBounds = 0;
    
    this.genes.mepPlacements.forEach(placement => {
      const systemWidth = placement.dimensions.width / 12;
      const systemDepth = placement.dimensions.depth / 12;
      
      // Calculate usable space boundaries (using full rack space)
      const lengthMin = (-this.genes.rackLength / 2);
      const lengthMax = (this.genes.rackLength / 2);
      const depthMin = (-this.genes.rackDepth / 2);
      const depthMax = (this.genes.rackDepth / 2);
      
      // Check if system exceeds usable rack boundaries (center-based positioning)
      const systemLengthMin = placement.x - (systemWidth / 2);
      const systemLengthMax = placement.x + (systemWidth / 2);
      const systemDepthMin = placement.y - (systemDepth / 2);
      const systemDepthMax = placement.y + (systemDepth / 2);
      
      if (systemLengthMin < lengthMin || 
          systemLengthMax > lengthMax ||
          systemDepthMin < depthMin ||
          systemDepthMax > depthMax) {
        outOfBounds++;
      }
      
      // Check if tier is valid
      if (placement.tier < 0 || placement.tier >= this.genes.tierCount) {
        outOfBounds++;
      }
    });
    
    return outOfBounds;
  }

  // Helper method to add to convertToFeet function
  convertToFeet(value) {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'feet' in value) {
      return value.feet + (value.inches || 0) / 12;
    }
    return 0;
  }
}

// Fitness evaluator
class FitnessEvaluator {
  constructor(config = {}) {
    this.weights = {
      volumeMinimization: config.volumeWeight || 0.3,
      mepFit: config.mepFitWeight || 0.25,
      structuralEfficiency: config.structuralWeight || 0.15,
      constraintViolation: config.constraintWeight || 0.2,
      costOptimization: config.costWeight || 0.1,
      ...config.weights
    };

    this.buildingConstraints = config.buildingConstraints || {};
    this.mepRequirements = config.mepRequirements || [];
    this.costFactors = {
      steelPerFoot: config.steelCostPerFoot || 50,
      laborPerConnection: config.laborPerConnection || 100,
      ...config.costFactors
    };
  }

  evaluate(chromosome) {
    const scores = {
      volume: this.evaluateVolume(chromosome),
      mepFit: this.evaluateMEPFit(chromosome),
      structural: this.evaluateStructural(chromosome),
      constraints: this.evaluateConstraints(chromosome),
      cost: this.evaluateCost(chromosome)
    };

    let totalScore = 0;
    totalScore += scores.volume * this.weights.volumeMinimization;
    totalScore += scores.mepFit * this.weights.mepFit;
    totalScore += scores.structural * this.weights.structuralEfficiency;
    totalScore += scores.constraints * this.weights.constraintViolation;
    totalScore += scores.cost * this.weights.costOptimization;

    return {
      total: totalScore,
      breakdown: scores,
      violations: this.getConstraintViolations(chromosome)
    };
  }

  evaluateVolume(chromosome) {
    const volume = chromosome.getVolume();
    const maxVolume = this.calculateMaxVolume();
    const minVolume = this.calculateMinVolume();
    
    if (volume >= maxVolume) return 0;
    if (volume <= minVolume) return 1;
    
    return 1 - (volume - minVolume) / (maxVolume - minVolume);
  }

  evaluateMEPFit(chromosome) {
    let score = 1.0;
    const placements = chromosome.genes.mepPlacements;
    const mepSystems = this.mepRequirements;
    
    // Heavy penalty for collisions
    if (chromosome.hasCollisions()) {
      score -= 0.5;
    }
    
    // Heavy penalty for out-of-bounds systems
    const outOfBounds = chromosome.hasSystemsOutOfBounds();
    if (outOfBounds > 0) {
      score -= 0.1 * outOfBounds; // Penalty per system out of bounds
    }
    
    // Check if all MEP systems are placed
    const placedSystems = placements.length;
    const requiredSystems = mepSystems.length;
    
    if (placedSystems < requiredSystems) {
      score -= 0.3 * (1 - placedSystems / requiredSystems);
    }
    
    // Reward efficient space utilization
    const spaceEfficiency = this.calculateSpaceEfficiency(chromosome);
    score *= spaceEfficiency;
    
    // Reward proper tier organization
    const tierOrganization = this.calculateTierOrganization(chromosome);
    score *= tierOrganization;
    
    // Penalty for systems that don't fit properly
    const fitPenalty = this.calculateFitPenalty(chromosome);
    score -= fitPenalty;
    
    return Math.max(0, score);
  }

  calculateSpaceEfficiency(chromosome) {
    const totalRackVolume = chromosome.getVolume();
    if (totalRackVolume === 0) return 0;
    
    let usedVolume = 0;
    chromosome.genes.mepPlacements.forEach(placement => {
      usedVolume += placement.dimensions.volume || 0;
    });
    
    const efficiency = usedVolume / totalRackVolume;
    
    // Optimal efficiency is between 0.3 and 0.7
    if (efficiency < 0.1) return efficiency * 5; // Too empty
    if (efficiency > 0.8) return 1 - ((efficiency - 0.8) * 2.5); // Too crowded
    return 1; // Good efficiency
  }

  calculateTierOrganization(chromosome) {
    let score = 1.0;
    const placements = chromosome.genes.mepPlacements;
    
    // Group by tier
    const tierGroups = {};
    placements.forEach(placement => {
      if (!tierGroups[placement.tier]) {
        tierGroups[placement.tier] = [];
      }
      tierGroups[placement.tier].push(placement);
    });
    
    // Check if systems are in appropriate tiers
    Object.values(tierGroups).forEach(tierSystems => {
      const systemTypes = tierSystems.map(s => s.systemType);
      
      // Reward grouping similar systems
      const uniqueTypes = [...new Set(systemTypes)];
      const groupingScore = 1 - (uniqueTypes.length - 1) * 0.1;
      score *= Math.max(0.5, groupingScore);
    });
    
    return score;
  }

  calculateFitPenalty(chromosome) {
    let penalty = 0;
    const rackLength = chromosome.genes.rackLength; // Use fixed rack length
    const rackDepth = chromosome.genes.rackDepth;
    
    chromosome.genes.mepPlacements.forEach(placement => {
      const systemWidth = placement.dimensions.width / 12; // Convert to feet
      const systemDepth = placement.dimensions.depth / 12;
      
      // Check if system extends beyond rack bounds
      if (placement.x + systemWidth > rackLength) {
        penalty += 0.1;
      }
      if (placement.y + systemDepth > rackDepth) {
        penalty += 0.1;
      }
      
      // Check if system height exceeds tier height
      const tierHeightData = chromosome.genes.tierHeights[placement.tier] || {feet: 2, inches: 0};
      const tierHeight = tierHeightData.feet + (tierHeightData.inches || 0) / 12;
      const systemHeight = placement.dimensions.height / 12;
      if (systemHeight > tierHeight * 0.9) { // Allow 10% margin
        penalty += 0.05;
      }
    });
    
    return Math.min(penalty, 0.5); // Cap penalty at 0.5
  }

  evaluateStructural(chromosome) {
    let score = 1.0;
    
    if (chromosome.genes.bayCount > 8) {
      score -= 0.1 * (chromosome.genes.bayCount - 8) / 10;
    }
    
    if (chromosome.genes.tierCount > 4) {
      score -= 0.1 * (chromosome.genes.tierCount - 4) / 4;
    }
    
    const widthHeightRatio = chromosome.getTotalWidth() / chromosome.getTotalHeight();
    const idealRatio = 2.5;
    const ratioDeviation = Math.abs(widthHeightRatio - idealRatio) / idealRatio;
    score *= Math.max(0.5, 1 - ratioDeviation * 0.3);
    
    return Math.max(0, score);
  }

  evaluateConstraints(chromosome) {
    const violations = this.getConstraintViolations(chromosome);
    
    if (violations.length === 0) return 1;
    
    const penaltyPerViolation = 0.2;
    const score = 1 - violations.length * penaltyPerViolation;
    
    return Math.max(0, score);
  }

  getConstraintViolations(chromosome) {
    const violations = [];
    const totalHeight = chromosome.getTotalHeight();
    const totalWidth = chromosome.getTotalWidth();
    
    if (this.buildingConstraints.maxHeight) {
      const maxHeight = this.convertToFeet(this.buildingConstraints.maxHeight);
      if (totalHeight > maxHeight) {
        violations.push({
          type: 'height',
          message: `Height ${totalHeight.toFixed(2)}ft exceeds max ${maxHeight}ft`,
          severity: 'critical'
        });
      }
    }
    
    if (this.buildingConstraints.corridorWidth) {
      const corridorWidth = this.convertToFeet(this.buildingConstraints.corridorWidth);
      if (totalWidth > corridorWidth) {
        violations.push({
          type: 'width',
          message: `Width ${totalWidth.toFixed(2)}ft exceeds corridor ${corridorWidth}ft`,
          severity: 'critical'
        });
      }
    }
    
    if (this.buildingConstraints.ceilingHeight) {
      const ceilingHeight = this.convertToFeet(this.buildingConstraints.ceilingHeight);
      if (totalHeight > ceilingHeight) {
        violations.push({
          type: 'ceiling',
          message: `Height exceeds ceiling ${ceilingHeight}ft`,
          severity: 'critical'
        });
      }
    }
    
    if (chromosome.hasCollisions()) {
      violations.push({
        type: 'collision',
        message: 'MEP systems have collisions',
        severity: 'major'
      });
    }
    
    const outOfBounds = chromosome.hasSystemsOutOfBounds();
    if (outOfBounds > 0) {
      violations.push({
        type: 'bounds',
        message: `${outOfBounds} MEP system(s) exceed rack boundaries`,
        severity: 'critical'
      });
    }
    
    return violations;
  }

  evaluateCost() {
    return 0.8; // Simplified cost evaluation
  }

  convertToFeet(value) {
    if (typeof value === 'number') return value;
    return value.feet + value.inches / 12;
  }

  calculateMaxVolume() {
    const maxHeight = this.convertToFeet(this.buildingConstraints.maxHeight || { feet: 20, inches: 0 });
    const maxWidth = this.convertToFeet(this.buildingConstraints.corridorWidth || { feet: 50, inches: 0 });
    const maxDepth = 8;
    return maxHeight * maxWidth * maxDepth;
  }

  calculateMinVolume() {
    return 50; // Minimum volume
  }
}

// Main Genetic Algorithm class
export class RackOptimizationGA {
  constructor(config = {}) {
    this.populationSize = config.populationSize || 50;
    this.maxGenerations = config.maxGenerations || 100;
    this.targetFitness = config.targetFitness || 0.95;
    this.stagnationLimit = config.stagnationLimit || 20;
    
    this.constraints = {
      minBayWidth: config.minBayWidth || 4,
      maxBayWidth: config.maxBayWidth || 12,
      minBayCount: config.minBayCount || 1,
      maxBayCount: config.maxBayCount || 10,
      minTierCount: config.minTierCount || 1,
      maxTierCount: config.maxTierCount || 5,
      minRackDepth: config.minRackDepth || 2,
      maxRackDepth: config.maxRackDepth || 8,
      mepSystems: config.mepSystems || [],
      buildingConstraints: config.buildingConstraints || {}
    };
    
    this.fitnessEvaluator = new FitnessEvaluator({
      buildingConstraints: this.constraints.buildingConstraints,
      mepRequirements: this.constraints.mepSystems,
      ...config.fitnessConfig
    });
    
    this.mutationRate = config.mutationRate || 0.1;
    this.crossoverRate = config.crossoverRate || 0.8;
    
    this.population = [];
    this.generation = 0;
    this.bestIndividual = null;
    this.bestFitness = 0;
    this.fitnessHistory = [];
    this.stagnationCounter = 0;
    
    this.onGenerationComplete = config.onGenerationComplete || (() => {});
    this.onOptimizationComplete = config.onOptimizationComplete || (() => {});
    this.onImprovement = config.onImprovement || (() => {});
  }

  initializePopulation() {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new RackChromosome(null, this.constraints));
    }
    this.generation = 0;
    this.stagnationCounter = 0;
  }

  async optimize() {
    console.log('🧬 GA: Starting optimization with config:', {
      populationSize: this.populationSize,
      maxGenerations: this.maxGenerations,
      mepSystems: this.constraints.mepSystems.length
    });
    
    this.initializePopulation();
    console.log('🧬 GA: Population initialized with', this.population.length, 'individuals');
    
    while (this.generation < this.maxGenerations) {
      console.log('🧬 GA: Starting generation', this.generation);
      
      const fitnessResults = this.evaluatePopulation();
      console.log('🧬 GA: Fitness evaluation completed for generation', this.generation);
      
      this.updateBestIndividual(fitnessResults);
      
      if (this.shouldTerminate()) {
        console.log('🧬 GA: Terminating optimization');
        break;
      }
      
      this.population = this.evolvePopulation(fitnessResults);
      this.trackStatistics(fitnessResults);
      
      const stats = {
        generation: this.generation,
        bestFitness: this.bestFitness,
        averageFitness: this.getAverageFitness(fitnessResults),
        diversity: this.calculateDiversity(),
        bestIndividual: this.bestIndividual,
        stagnation: this.stagnationCounter
      };
      
      console.log('🧬 GA: Calling onGenerationComplete with stats:', stats);
      await this.onGenerationComplete(stats);
      
      this.generation++;
      await new Promise(resolve => setTimeout(resolve, 10)); // Slightly longer delay for better UI updates
    }
    
    // Get final fitness breakdown
    const finalEvaluation = this.fitnessEvaluator.evaluate(this.bestIndividual);
    
    const finalResult = {
      bestSolution: this.bestIndividual,
      fitness: this.bestFitness,
      generations: this.generation,
      fitnessHistory: this.fitnessHistory,
      rackParams: this.bestIndividual.toRackParams(),
      breakdown: finalEvaluation.breakdown,
      violations: finalEvaluation.violations
    };
    
    await this.onOptimizationComplete(finalResult);
    return finalResult;
  }

  evaluatePopulation() {
    const results = [];
    
    for (const individual of this.population) {
      const fitness = this.fitnessEvaluator.evaluate(individual);
      results.push({
        individual,
        fitness: fitness.total,
        breakdown: fitness.breakdown,
        violations: fitness.violations
      });
    }
    
    results.sort((a, b) => b.fitness - a.fitness);
    return results;
  }

  updateBestIndividual(fitnessResults) {
    const currentBest = fitnessResults[0];
    
    if (currentBest.fitness > this.bestFitness) {
      this.bestFitness = currentBest.fitness;
      this.bestIndividual = currentBest.individual.clone();
      this.stagnationCounter = 0;
      
      this.onImprovement({
        fitness: this.bestFitness,
        individual: this.bestIndividual,
        generation: this.generation,
        breakdown: currentBest.breakdown,
        violations: currentBest.violations
      });
    } else {
      this.stagnationCounter++;
    }
  }

  shouldTerminate() {
    // Always run for at least 10 generations to show progress
    if (this.generation < 10) {
      return false;
    }
    
    if (this.bestFitness >= this.targetFitness) {
      console.log('🧬 GA: Target fitness reached:', this.bestFitness, '>=', this.targetFitness);
      return true;
    }
    
    if (this.stagnationCounter >= this.stagnationLimit) {
      console.log('🧬 GA: Stagnation limit reached:', this.stagnationCounter);
      return true;
    }
    
    return false;
  }

  evolvePopulation(fitnessResults) {
    const newPopulation = [];
    const fitnessScores = fitnessResults.map(r => r.fitness);
    const individuals = fitnessResults.map(r => r.individual);
    
    // Elitism
    const eliteCount = Math.floor(this.populationSize * 0.1);
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push(individuals[i].clone());
    }
    
    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelection(individuals, fitnessScores);
      const parent2 = this.tournamentSelection(individuals, fitnessScores);
      
      const offspring = this.crossover(parent1, parent2);
      const mutatedOffspring = offspring.map(child => this.mutate(child));
      
      newPopulation.push(...mutatedOffspring);
    }
    
    newPopulation.length = this.populationSize;
    return newPopulation;
  }

  tournamentSelection(population, fitnessScores, tournamentSize = 3) {
    const tournamentIndices = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      tournamentIndices.push(Math.floor(Math.random() * population.length));
    }
    
    let bestIndex = tournamentIndices[0];
    let bestFitness = fitnessScores[bestIndex];
    
    for (let i = 1; i < tournamentIndices.length; i++) {
      const index = tournamentIndices[i];
      if (fitnessScores[index] > bestFitness) {
        bestFitness = fitnessScores[index];
        bestIndex = index;
      }
    }
    
    return population[bestIndex];
  }

  crossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1.clone(), parent2.clone()];
    }

    const child1Genes = JSON.parse(JSON.stringify(parent1.genes));
    const child2Genes = JSON.parse(JSON.stringify(parent2.genes));
    
    // Crossover rack dimensions
    if (Math.random() < 0.5) {
      [child1Genes.bayWidth, child2Genes.bayWidth] = [child2Genes.bayWidth, child1Genes.bayWidth];
      // Recalculate bay counts
      child1Genes.bayCount = Math.max(1, Math.floor(child1Genes.rackLength / child1Genes.bayWidth));
      child2Genes.bayCount = Math.max(1, Math.floor(child2Genes.rackLength / child2Genes.bayWidth));
    }
    if (Math.random() < 0.5) {
      [child1Genes.tierCount, child2Genes.tierCount] = [child2Genes.tierCount, child1Genes.tierCount];
      // Adjust tier height arrays
      this.adjustTierHeightsForCrossover(child1Genes);
      this.adjustTierHeightsForCrossover(child2Genes);
    }
    if (Math.random() < 0.5) {
      [child1Genes.rackDepth, child2Genes.rackDepth] = [child2Genes.rackDepth, child1Genes.rackDepth];
    }
    
    // Crossover MEP placements - mix the best arrangements
    this.crossoverMEPPlacements(parent1.genes, parent2.genes, child1Genes, child2Genes);
    
    return [
      new RackChromosome(child1Genes, parent1.constraints),
      new RackChromosome(child2Genes, parent2.constraints)
    ];
  }

  adjustTierHeightsForCrossover(genes) {
    while (genes.tierHeights.length < genes.tierCount) {
      genes.tierHeights.push({ feet: 2, inches: 0 });
    }
    genes.tierHeights.length = genes.tierCount;
  }

  crossoverMEPPlacements(parent1Genes, parent2Genes, child1Genes, child2Genes) {
    // Group MEP placements by system ID to avoid duplicates
    const p1Systems = new Map();
    const p2Systems = new Map();
    
    parent1Genes.mepPlacements.forEach(p => p1Systems.set(p.systemId, p));
    parent2Genes.mepPlacements.forEach(p => p2Systems.set(p.systemId, p));
    
    child1Genes.mepPlacements = [];
    child2Genes.mepPlacements = [];
    
    // For each MEP system, randomly choose placement from either parent
    const allSystemIds = new Set([...p1Systems.keys(), ...p2Systems.keys()]);
    
    allSystemIds.forEach(systemId => {
      const p1Placement = p1Systems.get(systemId);
      const p2Placement = p2Systems.get(systemId);
      
      if (p1Placement && p2Placement) {
        // Both parents have this system - randomly choose
        if (Math.random() < 0.5) {
          child1Genes.mepPlacements.push({...p1Placement});
          child2Genes.mepPlacements.push({...p2Placement});
        } else {
          child1Genes.mepPlacements.push({...p2Placement});
          child2Genes.mepPlacements.push({...p1Placement});
        }
      } else if (p1Placement) {
        // Only parent 1 has this system
        child1Genes.mepPlacements.push({...p1Placement});
        child2Genes.mepPlacements.push({...p1Placement});
      } else if (p2Placement) {
        // Only parent 2 has this system
        child1Genes.mepPlacements.push({...p2Placement});
        child2Genes.mepPlacements.push({...p2Placement});
      }
    });
    
    // Validate placements fit within new rack dimensions
    this.validateMEPPlacements(child1Genes);
    this.validateMEPPlacements(child2Genes);
  }

  validateMEPPlacements(genes) {
    genes.mepPlacements.forEach(placement => {
      // Ensure tier is valid
      placement.tier = Math.min(placement.tier, genes.tierCount - 1);
      
      // Ensure position is within rack bounds
      const maxX = genes.rackLength - (placement.dimensions.width / 12);
      const maxY = genes.rackDepth - (placement.dimensions.depth / 12);
      
      placement.x = Math.min(placement.x, Math.max(0, maxX));
      placement.y = Math.min(placement.y, Math.max(0, maxY));
      
      // Update Z position for new tier structure
      let height = 0;
      for (let i = 0; i < placement.tier && i < genes.tierHeights.length; i++) {
        height += genes.tierHeights[i].feet + genes.tierHeights[i].inches / 12;
      }
      placement.z = height;
      
      // Ensure mount position exists
      if (!placement.mountPosition) {
        placement.mountPosition = Math.random() < 0.5 ? 'top' : 'bottom';
      }
    });
  }

  mutate(chromosome) {
    const mutated = chromosome.clone();
    
    if (Math.random() < this.mutationRate) {
      const mutationType = Math.random();
      
      if (mutationType < 0.4) {
        // 40% chance: Mutate rack dimensions
        const gene = Math.floor(Math.random() * 3);
        switch(gene) {
          case 0: // Bay width
            mutated.genes.bayWidth = this.mutateValue(
              mutated.genes.bayWidth,
              this.constraints.minBayWidth || 4,
              this.constraints.maxBayWidth || 12
            );
            mutated.genes.bayCount = Math.max(1, Math.floor(mutated.genes.rackLength / mutated.genes.bayWidth));
            break;
          case 1: // Tier count
            mutated.genes.tierCount = Math.floor(this.mutateValue(
              mutated.genes.tierCount,
              this.constraints.minTierCount || 2,
              this.constraints.maxTierCount || 5
            ));
            this.syncTierHeights(mutated.genes);
            break;
          case 2: // Rack depth
            mutated.genes.rackDepth = this.mutateValue(
              mutated.genes.rackDepth,
              this.constraints.minRackDepth || 4,
              this.constraints.maxRackDepth || 8
            );
            break;
        }
      } else if (mutationType < 0.8) {
        // 40% chance: Mutate MEP placements
        this.mutateMEPPlacements(mutated);
      } else {
        // 20% chance: Completely reorganize all MEP systems
        this.reorganizeMEPSystems(mutated);
      }
    }
    
    return mutated;
  }

  mutateMEPPlacements(chromosome) {
    if (chromosome.genes.mepPlacements.length === 0) return;
    
    const numMutations = Math.floor(Math.random() * chromosome.genes.mepPlacements.length) + 1;
    
    for (let i = 0; i < numMutations; i++) {
      const systemIndex = Math.floor(Math.random() * chromosome.genes.mepPlacements.length);
      const placement = chromosome.genes.mepPlacements[systemIndex];
      
      const mutationType = Math.floor(Math.random() * 4);
      switch(mutationType) {
        case 0: // Move to different tier
          placement.tier = Math.floor(Math.random() * chromosome.genes.tierCount);
          break;
        case 1: // Change position using organized placement
        case 2: // Change position using organized placement  
        case 3: // Move to completely new position
          // Re-place this system using organized placement
          const system = this.constraints.mepSystems.find(s => s.id === placement.systemId);
          if (system) {
            const tempChromosome = new RackChromosome(null, this.constraints);
            const bbox = tempChromosome.getMEPBoundingBox(system);
            const occupiedSpaces = this.getOccupiedSpaces(chromosome.genes, placement.systemId);
            const newPos = tempChromosome.findOrganizedPosition(system, bbox, chromosome.genes, occupiedSpaces, placement.tier);
            if (newPos) {
              Object.assign(placement, newPos);
            }
          }
          break;
      }
    }
  }

  reorganizeMEPSystems(chromosome) {
    // Completely rearrange all MEP systems for better organization
    const mepSystems = this.constraints.mepSystems || [];
    if (mepSystems.length === 0) return;
    
    console.log('🔄 Reorganizing all MEP systems...');
    
    // Create a temporary chromosome instance to use its placement method
    const tempChromosome = new RackChromosome(null, this.constraints);
    
    // Clear current placements and re-place all systems using organized placement
    chromosome.genes.mepPlacements = [];
    chromosome.genes.mepPlacements = tempChromosome.placeMEPSystems(mepSystems, chromosome.genes);
  }

  getPreferredTier(systemType) {
    // Preferred tier assignment based on typical MEP practices
    switch(systemType) {
      case 'cableTray': return 0; // Top tier
      case 'duct': return 1; // Second tier
      case 'pipe': return 2; // Third tier
      case 'conduit': return 0; // Can share with cable trays
      default: return 0;
    }
  }

  rectanglesOverlap(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.depth < rect2.y || 
             rect2.y + rect2.depth < rect1.y);
  }

  findBestPositionForSystem(placement, genes) {
    // Try to find a better position for a specific MEP system
    const bbox = placement.dimensions;
    const preferredTier = this.getPreferredTier(placement.systemType);
    const occupiedSpaces = this.getOccupiedSpaces(genes, placement.systemId);
    
    for (let attempt = 0; attempt < 15; attempt++) {
      const tier = (attempt < 8) ? 
        Math.min(preferredTier, genes.tierCount - 1) : 
        Math.floor(Math.random() * genes.tierCount);
      
      const maxX = genes.rackLength - (bbox.width / 12);
      const maxY = genes.rackDepth - (bbox.depth / 12);
      
      if (maxX <= 0 || maxY <= 0) continue;
      
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      
      // Try both mounting positions
      const mountPosition = Math.random() < 0.5 ? 'top' : 'bottom';
      const tierMountSpaces = occupiedSpaces[tier] && occupiedSpaces[tier][mountPosition] ? 
        occupiedSpaces[tier][mountPosition] : [];
      
      const hasCollision = tierMountSpaces.some(occupied => {
        return this.rectanglesOverlap(
          { x, y, width: bbox.width / 12, depth: bbox.depth / 12 },
          occupied
        );
      });
      
      if (!hasCollision) {
        // Calculate tier height inline
        let tierHeight = 0;
        for (let i = 0; i < tier && i < genes.tierHeights.length; i++) {
          tierHeight += genes.tierHeights[i].feet + (genes.tierHeights[i].inches || 0) / 12;
        }
        
        return {
          tier,
          x,
          y,
          z: tierHeight,
          mountPosition: Math.random() < 0.5 ? 'top' : 'bottom'
        };
      }
    }
    
    return null; // Keep current position if no better one found
  }

  getOccupiedSpaces(genes, excludeSystemId) {
    const occupiedSpaces = [];
    
    // Initialize for each tier with mounting positions
    for (let tier = 0; tier < genes.tierCount; tier++) {
      occupiedSpaces[tier] = {
        top: [],    // Systems mounted to bottom of top beam
        bottom: []  // Systems mounted to top of bottom beam
      };
    }
    
    // Add all placements except the one we're trying to move
    genes.mepPlacements.forEach(placement => {
      if (placement.systemId !== excludeSystemId) {
        // Ensure tier is within bounds
        const tier = Math.min(placement.tier, genes.tierCount - 1);
        if (tier >= 0 && occupiedSpaces[tier]) {
          const mountSpace = placement.mountPosition === 'top' ? 'top' : 'bottom';
          occupiedSpaces[tier][mountSpace].push({
            x: placement.x,
            y: placement.y,
            width: placement.dimensions.width / 12,
            depth: placement.dimensions.depth / 12,
            systemId: placement.systemId
          });
        }
      }
    });
    
    return occupiedSpaces;
  }

  syncTierHeights(genes) {
    // Adjust tier heights array to match tier count
    while (genes.tierHeights.length < genes.tierCount) {
      genes.tierHeights.push({ feet: 2, inches: 0 });
    }
    genes.tierHeights.length = genes.tierCount;
  }

  mutateValue(value, min, max) {
    const range = max - min;
    const mutation = (Math.random() - 0.5) * range * 0.1;
    return Math.max(min, Math.min(max, value + mutation));
  }

  calculateDiversity() {
    if (this.population.length < 2) return 0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < Math.min(10, this.population.length); i++) {
      for (let j = i + 1; j < Math.min(10, this.population.length); j++) {
        totalDistance += this.chromosomeDistance(this.population[i], this.population[j]);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  chromosomeDistance(chrom1, chrom2) {
    let distance = 0;
    
    distance += Math.abs(chrom1.genes.bayWidth - chrom2.genes.bayWidth) / 8;
    distance += Math.abs(chrom1.genes.bayCount - chrom2.genes.bayCount) / 10;
    distance += Math.abs(chrom1.genes.tierCount - chrom2.genes.tierCount) / 5;
    distance += Math.abs(chrom1.genes.rackDepth - chrom2.genes.rackDepth) / 6;
    
    return distance / 4;
  }

  trackStatistics(fitnessResults) {
    const avgFitness = this.getAverageFitness(fitnessResults);
    
    this.fitnessHistory.push({
      generation: this.generation,
      best: this.bestFitness,
      average: avgFitness,
      worst: fitnessResults[fitnessResults.length - 1].fitness
    });
  }

  getAverageFitness(fitnessResults) {
    const sum = fitnessResults.reduce((acc, r) => acc + r.fitness, 0);
    return sum / fitnessResults.length;
  }
}

// Export the convenience function
export function createRackOptimizer(config = {}) {
  return new RackOptimizationGA(config);
}