/**
 * Fitness function for evaluating rack configurations
 * Considers multiple objectives: size, efficiency, constraints
 */

export class FitnessEvaluator {
  constructor(config = {}) {
    // Weight factors for different objectives
    this.weights = {
      volumeMinimization: config.volumeWeight || 0.3,
      mepFit: config.mepFitWeight || 0.25,
      structuralEfficiency: config.structuralWeight || 0.15,
      constraintViolation: config.constraintWeight || 0.2,
      costOptimization: config.costWeight || 0.1,
      ...config.weights
    };

    // Building constraints
    this.buildingConstraints = config.buildingConstraints || {};
    
    // MEP requirements
    this.mepRequirements = config.mepRequirements || [];
    
    // Cost factors
    this.costFactors = {
      steelPerFoot: config.steelCostPerFoot || 50,
      laborPerConnection: config.laborPerConnection || 100,
      ...config.costFactors
    };
  }

  /**
   * Calculate overall fitness score for a chromosome
   * Higher fitness is better (0-1 scale)
   */
  evaluate(chromosome) {
    const scores = {
      volume: this.evaluateVolume(chromosome),
      mepFit: this.evaluateMEPFit(chromosome),
      structural: this.evaluateStructural(chromosome),
      constraints: this.evaluateConstraints(chromosome),
      cost: this.evaluateCost(chromosome)
    };

    // Calculate weighted total
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

  /**
   * Evaluate volume minimization objective
   * Smaller volume = higher score
   */
  evaluateVolume(chromosome) {
    const volume = chromosome.getVolume();
    const maxVolume = this.calculateMaxVolume();
    const minVolume = this.calculateMinVolume();
    
    if (volume >= maxVolume) return 0;
    if (volume <= minVolume) return 1;
    
    // Linear scaling between min and max
    return 1 - (volume - minVolume) / (maxVolume - minVolume);
  }

  /**
   * Evaluate how well MEP systems fit
   */
  evaluateMEPFit(chromosome) {
    let score = 1.0;
    
    // Check for collisions
    if (chromosome.hasCollisions()) {
      score -= 0.5;
    }
    
    // Check if all MEP systems are placed
    const placedSystems = chromosome.genes.mepPlacements.length;
    const requiredSystems = this.mepRequirements.length;
    
    if (placedSystems < requiredSystems) {
      score -= 0.3 * (1 - placedSystems / requiredSystems);
    }
    
    // Evaluate spacing efficiency
    const spacingScore = this.evaluateMEPSpacing(chromosome);
    score *= spacingScore;
    
    return Math.max(0, score);
  }

  /**
   * Evaluate MEP spacing and organization
   */
  evaluateMEPSpacing(chromosome) {
    const placements = chromosome.genes.mepPlacements;
    if (placements.length === 0) return 1;
    
    let totalScore = 0;
    
    placements.forEach(placement => {
      // Prefer centered placements
      const centerOffset = Math.abs(placement.xOffset - chromosome.genes.bayWidth / 2);
      const centerScore = 1 - (centerOffset / chromosome.genes.bayWidth);
      
      // Prefer reasonable tier distribution
      const tierUtilization = this.calculateTierUtilization(placement, chromosome);
      
      totalScore += (centerScore + tierUtilization) / 2;
    });
    
    return totalScore / placements.length;
  }

  calculateTierUtilization(placement, chromosome) {
    const tierHeight = chromosome.genes.tierHeights[placement.tier];
    if (!tierHeight) return 0;
    
    const availableHeight = tierHeight.feet + tierHeight.inches / 12;
    let usedHeight = 0;
    
    switch(placement.systemType) {
      case 'duct':
        usedHeight = placement.dimensions.height / 12;
        break;
      case 'pipe':
      case 'conduit':
        usedHeight = placement.dimensions.diameter / 12;
        break;
      case 'cable-tray':
        usedHeight = placement.dimensions.height / 12;
        break;
    }
    
    const utilization = usedHeight / availableHeight;
    
    // Optimal utilization is between 40-80%
    if (utilization < 0.4) return utilization * 2.5;
    if (utilization > 0.8) return 1 - (utilization - 0.8) * 2;
    return 1;
  }

  /**
   * Evaluate structural efficiency
   */
  evaluateStructural(chromosome) {
    let score = 1.0;
    
    // Penalize excessive bay counts
    if (chromosome.genes.bayCount > 8) {
      score -= 0.1 * (chromosome.genes.bayCount - 8) / 10;
    }
    
    // Penalize excessive tier counts
    if (chromosome.genes.tierCount > 4) {
      score -= 0.1 * (chromosome.genes.tierCount - 4) / 4;
    }
    
    // Evaluate aspect ratios
    const widthHeightRatio = chromosome.getTotalWidth() / chromosome.getTotalHeight();
    const idealRatio = 2.5;
    const ratioDeviation = Math.abs(widthHeightRatio - idealRatio) / idealRatio;
    score *= Math.max(0.5, 1 - ratioDeviation * 0.3);
    
    return Math.max(0, score);
  }

  /**
   * Evaluate constraint satisfaction
   */
  evaluateConstraints(chromosome) {
    const violations = this.getConstraintViolations(chromosome);
    
    if (violations.length === 0) return 1;
    
    // Each violation reduces score
    const penaltyPerViolation = 0.2;
    const score = 1 - violations.length * penaltyPerViolation;
    
    return Math.max(0, score);
  }

  getConstraintViolations(chromosome) {
    const violations = [];
    const totalHeight = chromosome.getTotalHeight();
    const totalWidth = chromosome.getTotalWidth();
    
    // Check building constraints
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
    
    // Check MEP clearances
    if (chromosome.hasCollisions()) {
      violations.push({
        type: 'collision',
        message: 'MEP systems have collisions',
        severity: 'major'
      });
    }
    
    return violations;
  }

  /**
   * Evaluate cost optimization
   */
  evaluateCost(chromosome) {
    const steelLength = this.calculateSteelLength(chromosome);
    const connectionCount = this.calculateConnections(chromosome);
    
    const steelCost = steelLength * this.costFactors.steelPerFoot;
    const laborCost = connectionCount * this.costFactors.laborPerConnection;
    const totalCost = steelCost + laborCost;
    
    // Normalize cost score (inverse - lower cost = higher score)
    const maxCost = this.calculateMaxCost();
    const minCost = this.calculateMinCost();
    
    if (totalCost >= maxCost) return 0;
    if (totalCost <= minCost) return 1;
    
    return 1 - (totalCost - minCost) / (maxCost - minCost);
  }

  calculateSteelLength(chromosome) {
    const { bayCount, bayWidth, tierCount, rackDepth } = chromosome.genes;
    
    // Simplified calculation
    const horizontalBeams = bayCount * bayWidth * 2 * tierCount; // Front and back
    const transverseBeams = (bayCount + 1) * rackDepth * tierCount;
    const verticalPosts = (bayCount + 1) * 2 * chromosome.getTotalHeight();
    
    return horizontalBeams + transverseBeams + verticalPosts;
  }

  calculateConnections(chromosome) {
    const { bayCount, tierCount } = chromosome.genes;
    
    // Each intersection is a connection
    return (bayCount + 1) * 2 * (tierCount + 1);
  }

  // Utility functions
  convertToFeet(value) {
    if (typeof value === 'number') return value;
    return value.feet + value.inches / 12;
  }

  calculateMaxVolume() {
    const maxHeight = this.convertToFeet(this.buildingConstraints.maxHeight || { feet: 20, inches: 0 });
    const maxWidth = this.convertToFeet(this.buildingConstraints.corridorWidth || { feet: 50, inches: 0 });
    const maxDepth = 8; // Max rack depth
    return maxHeight * maxWidth * maxDepth;
  }

  calculateMinVolume() {
    // Minimum volume to fit all MEP
    let minVolume = 0;
    this.mepRequirements.forEach(req => {
      minVolume += this.estimateMEPVolume(req);
    });
    return minVolume * 1.5; // Add 50% buffer
  }

  estimateMEPVolume(mepSystem) {
    switch(mepSystem.type) {
      case 'duct':
        return (mepSystem.width * mepSystem.height * mepSystem.length) / 1728; // cubic feet
      case 'pipe':
        return Math.PI * Math.pow(mepSystem.diameter / 24, 2) * mepSystem.length;
      default:
        return 1; // Default 1 cubic foot
    }
  }

  calculateMaxCost() {
    return this.calculateSteelLength({ 
      genes: { 
        bayCount: 10, 
        bayWidth: 12, 
        tierCount: 5, 
        rackDepth: 8 
      },
      getTotalHeight: () => 20
    }) * this.costFactors.steelPerFoot * 2;
  }

  calculateMinCost() {
    return this.calculateSteelLength({ 
      genes: { 
        bayCount: 1, 
        bayWidth: 4, 
        tierCount: 1, 
        rackDepth: 2 
      },
      getTotalHeight: () => 2
    }) * this.costFactors.steelPerFoot * 0.5;
  }
}