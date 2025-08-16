/**
 * Genetic operators for rack optimization
 * Includes crossover, mutation, and selection strategies
 */

import { RackChromosome } from './Chromosome';

export class GeneticOperators {
  constructor(config = {}) {
    this.mutationRate = config.mutationRate || 0.1;
    this.crossoverRate = config.crossoverRate || 0.8;
    this.elitismRate = config.elitismRate || 0.1;
    this.tournamentSize = config.tournamentSize || 3;
  }

  /**
   * Tournament selection - select fittest from random subset
   */
  tournamentSelection(population, fitnessScores) {
    const tournamentIndices = [];
    
    for (let i = 0; i < this.tournamentSize; i++) {
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

  /**
   * Roulette wheel selection - probability based on fitness
   */
  rouletteSelection(population, fitnessScores) {
    const totalFitness = fitnessScores.reduce((sum, score) => sum + score, 0);
    const random = Math.random() * totalFitness;
    
    let cumulative = 0;
    for (let i = 0; i < population.length; i++) {
      cumulative += fitnessScores[i];
      if (cumulative >= random) {
        return population[i];
      }
    }
    
    return population[population.length - 1];
  }

  /**
   * Single-point crossover
   */
  singlePointCrossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1.clone(), parent2.clone()];
    }

    const child1Genes = JSON.parse(JSON.stringify(parent1.genes));
    const child2Genes = JSON.parse(JSON.stringify(parent2.genes));
    
    // Crossover structural genes
    const structuralPoint = Math.random();
    if (structuralPoint < 0.25) {
      [child1Genes.bayWidth, child2Genes.bayWidth] = [child2Genes.bayWidth, child1Genes.bayWidth];
    } else if (structuralPoint < 0.5) {
      [child1Genes.bayCount, child2Genes.bayCount] = [child2Genes.bayCount, child1Genes.bayCount];
    } else if (structuralPoint < 0.75) {
      [child1Genes.tierCount, child2Genes.tierCount] = [child2Genes.tierCount, child1Genes.tierCount];
      this.syncTierArrays(child1Genes);
      this.syncTierArrays(child2Genes);
    } else {
      [child1Genes.rackDepth, child2Genes.rackDepth] = [child2Genes.rackDepth, child1Genes.rackDepth];
    }
    
    // Crossover MEP placements
    if (child1Genes.mepPlacements.length > 0 && child2Genes.mepPlacements.length > 0) {
      const crossoverPoint = Math.floor(Math.random() * Math.min(
        child1Genes.mepPlacements.length,
        child2Genes.mepPlacements.length
      ));
      
      const temp = child1Genes.mepPlacements.slice(crossoverPoint);
      child1Genes.mepPlacements = [
        ...child1Genes.mepPlacements.slice(0, crossoverPoint),
        ...child2Genes.mepPlacements.slice(crossoverPoint)
      ];
      child2Genes.mepPlacements = [
        ...child2Genes.mepPlacements.slice(0, crossoverPoint),
        ...temp
      ];
    }
    
    return [
      new RackChromosome(child1Genes, parent1.constraints),
      new RackChromosome(child2Genes, parent2.constraints)
    ];
  }

  /**
   * Uniform crossover - each gene has 50% chance from each parent
   */
  uniformCrossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1.clone(), parent2.clone()];
    }

    const child1Genes = {};
    const child2Genes = {};
    
    // Structural genes
    child1Genes.bayWidth = Math.random() < 0.5 ? parent1.genes.bayWidth : parent2.genes.bayWidth;
    child2Genes.bayWidth = Math.random() < 0.5 ? parent1.genes.bayWidth : parent2.genes.bayWidth;
    
    child1Genes.bayCount = Math.random() < 0.5 ? parent1.genes.bayCount : parent2.genes.bayCount;
    child2Genes.bayCount = Math.random() < 0.5 ? parent1.genes.bayCount : parent2.genes.bayCount;
    
    child1Genes.tierCount = Math.random() < 0.5 ? parent1.genes.tierCount : parent2.genes.tierCount;
    child2Genes.tierCount = Math.random() < 0.5 ? parent1.genes.tierCount : parent2.genes.tierCount;
    
    child1Genes.rackDepth = Math.random() < 0.5 ? parent1.genes.rackDepth : parent2.genes.rackDepth;
    child2Genes.rackDepth = Math.random() < 0.5 ? parent1.genes.rackDepth : parent2.genes.rackDepth;
    
    // Tier heights - blend from parents
    child1Genes.tierHeights = this.blendTierHeights(parent1.genes, parent2.genes, child1Genes.tierCount);
    child2Genes.tierHeights = this.blendTierHeights(parent1.genes, parent2.genes, child2Genes.tierCount);
    
    // MEP placements - mix from both parents
    child1Genes.mepPlacements = this.mixMEPPlacements(parent1.genes.mepPlacements, parent2.genes.mepPlacements);
    child2Genes.mepPlacements = this.mixMEPPlacements(parent1.genes.mepPlacements, parent2.genes.mepPlacements);
    
    return [
      new RackChromosome(child1Genes, parent1.constraints),
      new RackChromosome(child2Genes, parent2.constraints)
    ];
  }

  blendTierHeights(parent1Genes, parent2Genes, tierCount) {
    const heights = [];
    for (let i = 0; i < tierCount; i++) {
      if (i < parent1Genes.tierHeights.length && i < parent2Genes.tierHeights.length) {
        heights.push(Math.random() < 0.5 ? parent1Genes.tierHeights[i] : parent2Genes.tierHeights[i]);
      } else if (i < parent1Genes.tierHeights.length) {
        heights.push(parent1Genes.tierHeights[i]);
      } else if (i < parent2Genes.tierHeights.length) {
        heights.push(parent2Genes.tierHeights[i]);
      } else {
        heights.push({ feet: 2, inches: 0 });
      }
    }
    return heights;
  }

  mixMEPPlacements(placements1, placements2) {
    const mixed = [];
    const allPlacements = [...placements1, ...placements2];
    const systemIds = new Set();
    
    // Ensure each system is only included once
    for (const placement of allPlacements) {
      if (!systemIds.has(placement.systemId)) {
        if (Math.random() < 0.5 || !placements2.find(p => p.systemId === placement.systemId)) {
          mixed.push(placement);
          systemIds.add(placement.systemId);
        }
      }
    }
    
    return mixed;
  }

  /**
   * Mutation operator - random changes to genes
   */
  mutate(chromosome) {
    const mutated = chromosome.clone();
    
    // Mutate structural genes
    if (Math.random() < this.mutationRate) {
      const gene = Math.floor(Math.random() * 4);
      switch(gene) {
        case 0: // Bay width
          mutated.genes.bayWidth = this.mutateValue(
            mutated.genes.bayWidth,
            chromosome.constraints.minBayWidth || 4,
            chromosome.constraints.maxBayWidth || 12,
            0.2
          );
          break;
        case 1: // Bay count
          mutated.genes.bayCount = Math.floor(this.mutateValue(
            mutated.genes.bayCount,
            chromosome.constraints.minBayCount || 1,
            chromosome.constraints.maxBayCount || 10,
            0.3
          ));
          break;
        case 2: // Tier count
          const oldTierCount = mutated.genes.tierCount;
          mutated.genes.tierCount = Math.floor(this.mutateValue(
            mutated.genes.tierCount,
            chromosome.constraints.minTierCount || 1,
            chromosome.constraints.maxTierCount || 5,
            0.3
          ));
          this.syncTierArrays(mutated.genes);
          break;
        case 3: // Rack depth
          mutated.genes.rackDepth = this.mutateValue(
            mutated.genes.rackDepth,
            chromosome.constraints.minRackDepth || 2,
            chromosome.constraints.maxRackDepth || 8,
            0.2
          );
          break;
      }
    }
    
    // Mutate tier heights
    if (Math.random() < this.mutationRate) {
      const tierIndex = Math.floor(Math.random() * mutated.genes.tierHeights.length);
      if (mutated.genes.tierHeights[tierIndex]) {
        mutated.genes.tierHeights[tierIndex] = {
          feet: Math.floor(this.mutateValue(mutated.genes.tierHeights[tierIndex].feet, 1, 5, 0.3)),
          inches: Math.floor(this.mutateValue(mutated.genes.tierHeights[tierIndex].inches, 0, 11, 0.5))
        };
      }
    }
    
    // Mutate MEP placements
    if (Math.random() < this.mutationRate && mutated.genes.mepPlacements.length > 0) {
      const mepIndex = Math.floor(Math.random() * mutated.genes.mepPlacements.length);
      const placement = mutated.genes.mepPlacements[mepIndex];
      
      const mutationType = Math.floor(Math.random() * 4);
      switch(mutationType) {
        case 0: // Change tier
          placement.tier = Math.floor(Math.random() * mutated.genes.tierCount);
          break;
        case 1: // Change bay position
          placement.bayStart = Math.floor(Math.random() * mutated.genes.bayCount);
          placement.bayEnd = Math.min(
            mutated.genes.bayCount - 1,
            placement.bayStart + Math.floor(Math.random() * 3)
          );
          break;
        case 2: // Change offsets
          placement.xOffset = this.mutateValue(placement.xOffset, 0, mutated.genes.bayWidth * 0.8, 0.3);
          placement.yOffset = this.mutateValue(placement.yOffset, 0, mutated.genes.rackDepth * 0.8, 0.3);
          break;
        case 3: // Change dimensions
          this.mutateMEPDimensions(placement);
          break;
      }
    }
    
    return mutated;
  }

  mutateValue(value, min, max, stdDev) {
    const gaussian = this.gaussianRandom() * stdDev * (max - min);
    let newValue = value + gaussian;
    return Math.max(min, Math.min(max, newValue));
  }

  mutateMEPDimensions(placement) {
    switch(placement.systemType) {
      case 'duct':
        placement.dimensions.width = this.mutateValue(placement.dimensions.width, 12, 48, 0.2);
        placement.dimensions.height = this.mutateValue(placement.dimensions.height, 8, 36, 0.2);
        break;
      case 'pipe':
      case 'conduit':
        placement.dimensions.diameter = this.mutateValue(
          placement.dimensions.diameter, 
          0.5, 
          placement.systemType === 'pipe' ? 12 : 4, 
          0.2
        );
        break;
      case 'cable-tray':
        placement.dimensions.width = this.mutateValue(placement.dimensions.width, 6, 24, 0.2);
        placement.dimensions.height = this.mutateValue(placement.dimensions.height, 2, 6, 0.2);
        break;
    }
  }

  /**
   * Adaptive mutation - increase rate if population is stagnant
   */
  adaptiveMutate(chromosome, generationsSinceImprovement) {
    const adaptedRate = this.mutationRate * (1 + generationsSinceImprovement * 0.1);
    const originalRate = this.mutationRate;
    this.mutationRate = Math.min(0.5, adaptedRate);
    
    const mutated = this.mutate(chromosome);
    
    this.mutationRate = originalRate;
    return mutated;
  }

  /**
   * Repair operator - fix constraint violations
   */
  repair(chromosome, buildingConstraints) {
    const repaired = chromosome.clone();
    
    // Fix height violations
    if (buildingConstraints.maxHeight) {
      const maxHeight = this.convertToFeet(buildingConstraints.maxHeight);
      while (repaired.getTotalHeight() > maxHeight && repaired.genes.tierCount > 1) {
        repaired.genes.tierCount--;
        this.syncTierArrays(repaired.genes);
      }
    }
    
    // Fix width violations
    if (buildingConstraints.corridorWidth) {
      const maxWidth = this.convertToFeet(buildingConstraints.corridorWidth);
      while (repaired.getTotalWidth() > maxWidth && repaired.genes.bayCount > 1) {
        repaired.genes.bayCount--;
      }
    }
    
    // Fix MEP placement violations
    repaired.genes.mepPlacements.forEach(placement => {
      placement.tier = Math.min(placement.tier, repaired.genes.tierCount - 1);
      placement.bayStart = Math.min(placement.bayStart, repaired.genes.bayCount - 1);
      placement.bayEnd = Math.min(placement.bayEnd, repaired.genes.bayCount - 1);
    });
    
    return repaired;
  }

  syncTierArrays(genes) {
    while (genes.tierHeights.length < genes.tierCount) {
      genes.tierHeights.push({ feet: 2, inches: 0 });
    }
    genes.tierHeights.length = genes.tierCount;
    
    // Update MEP placements to valid tiers
    genes.mepPlacements.forEach(placement => {
      if (placement.tier >= genes.tierCount) {
        placement.tier = genes.tierCount - 1;
      }
    });
  }

  convertToFeet(value) {
    if (typeof value === 'number') return value;
    return value.feet + value.inches / 12;
  }

  gaussianRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}