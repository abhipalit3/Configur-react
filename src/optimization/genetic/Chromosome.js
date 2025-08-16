/**
 * Chromosome representation for rack and MEP configuration
 * Encodes rack dimensions and MEP placements as genes
 */

export class RackChromosome {
  constructor(genes = null, constraints = {}) {
    this.constraints = constraints;
    
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = this.generateRandomGenes();
    }
  }

  generateRandomGenes() {
    const {
      minBayWidth = 4,
      maxBayWidth = 12,
      minBayCount = 1,
      maxBayCount = 10,
      minTierCount = 1,
      maxTierCount = 5,
      minRackDepth = 2,
      maxRackDepth = 8,
      mepSystems = [],
      buildingConstraints = {}
    } = this.constraints;

    const genes = {
      // Rack structural genes
      bayWidth: this.randomInRange(minBayWidth, maxBayWidth),
      bayCount: Math.floor(this.randomInRange(minBayCount, maxBayCount)),
      tierCount: Math.floor(this.randomInRange(minTierCount, maxTierCount)),
      rackDepth: this.randomInRange(minRackDepth, maxRackDepth),
      
      // Tier heights (feet)
      tierHeights: [],
      
      // MEP placement genes
      mepPlacements: []
    };

    // Generate tier heights
    for (let i = 0; i < genes.tierCount; i++) {
      genes.tierHeights.push({
        feet: Math.floor(this.randomInRange(1.5, 4)),
        inches: Math.floor(Math.random() * 12)
      });
    }

    // Generate MEP placements for each system
    mepSystems.forEach((system, index) => {
      genes.mepPlacements.push({
        systemId: system.id,
        systemType: system.type,
        tier: Math.floor(Math.random() * genes.tierCount),
        bayStart: Math.floor(Math.random() * genes.bayCount),
        bayEnd: Math.min(genes.bayCount - 1, 
          Math.floor(Math.random() * genes.bayCount) + Math.floor(Math.random() * 3)),
        xOffset: this.randomInRange(0, genes.bayWidth * 0.8),
        yOffset: this.randomInRange(0, genes.rackDepth * 0.8),
        zOffset: 0,
        dimensions: this.generateMEPDimensions(system.type)
      });
    });

    return genes;
  }

  generateMEPDimensions(type) {
    switch(type) {
      case 'duct':
        return {
          width: this.randomInRange(12, 48),  // inches
          height: this.randomInRange(8, 36),  // inches
          length: 0  // calculated based on bay span
        };
      case 'pipe':
        return {
          diameter: this.randomInRange(0.5, 12),  // inches
          length: 0  // calculated based on bay span
        };
      case 'conduit':
        return {
          diameter: this.randomInRange(0.5, 4),  // inches
          length: 0  // calculated based on bay span
        };
      case 'cable-tray':
        return {
          width: this.randomInRange(6, 24),  // inches
          height: this.randomInRange(2, 6),   // inches
          length: 0  // calculated based on bay span
        };
      default:
        return { width: 12, height: 12, length: 0 };
    }
  }

  randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  // Deep copy chromosome
  clone() {
    return new RackChromosome(JSON.parse(JSON.stringify(this.genes)), this.constraints);
  }

  // Convert chromosome to rack parameters
  toRackParams() {
    const params = {
      bayCount: this.genes.bayCount,
      bayWidth: this.genes.bayWidth,
      depth: this.genes.rackDepth,
      tierCount: this.genes.tierCount,
      tierHeights: this.genes.tierHeights,
      
      // MEP enable flags per tier
      ductEnabled: new Array(this.genes.tierCount).fill(false),
      pipeEnabled: new Array(this.genes.tierCount).fill(false),
      conduitEnabled: new Array(this.genes.tierCount).fill(false),
      cableTrayEnabled: new Array(this.genes.tierCount).fill(false),
      
      // MEP configurations
      mepSystems: []
    };

    // Process MEP placements
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
          params.cableTrayEnabled[tier] = true;
          break;
      }
      
      params.mepSystems.push({
        ...placement,
        position: {
          x: placement.bayStart * this.genes.bayWidth + placement.xOffset,
          y: placement.yOffset,
          z: this.calculateTierHeight(tier) + placement.zOffset
        }
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

  getTotalHeight() {
    return this.calculateTierHeight(this.genes.tierCount);
  }

  getTotalWidth() {
    return this.genes.bayCount * this.genes.bayWidth;
  }

  getVolume() {
    return this.getTotalWidth() * this.genes.rackDepth * this.getTotalHeight();
  }

  // Check if MEP systems fit without collision
  hasCollisions() {
    const placements = this.genes.mepPlacements;
    
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        if (this.systemsCollide(placements[i], placements[j])) {
          return true;
        }
      }
    }
    return false;
  }

  systemsCollide(sys1, sys2) {
    // Check if on same tier
    if (sys1.tier !== sys2.tier) return false;
    
    // Check bay overlap
    if (sys1.bayEnd < sys2.bayStart || sys2.bayEnd < sys1.bayStart) return false;
    
    // Simplified collision check - can be made more sophisticated
    const dist = Math.sqrt(
      Math.pow(sys1.xOffset - sys2.xOffset, 2) +
      Math.pow(sys1.yOffset - sys2.yOffset, 2)
    );
    
    const minDist = this.getSystemRadius(sys1) + this.getSystemRadius(sys2);
    return dist < minDist;
  }

  getSystemRadius(system) {
    switch(system.systemType) {
      case 'duct':
        return Math.max(system.dimensions.width, system.dimensions.height) / 24; // Convert to feet
      case 'pipe':
      case 'conduit':
        return system.dimensions.diameter / 24;
      case 'cable-tray':
        return system.dimensions.width / 24;
      default:
        return 0.5;
    }
  }
}