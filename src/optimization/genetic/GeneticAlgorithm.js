/**
 * Main Genetic Algorithm runner for rack optimization
 * Manages population evolution and optimization process
 */

import { RackChromosome } from './Chromosome';
import { FitnessEvaluator } from './FitnessFunction';
import { GeneticOperators } from './GeneticOperators';

export class RackOptimizationGA {
  constructor(config = {}) {
    // GA parameters
    this.populationSize = config.populationSize || 50;
    this.maxGenerations = config.maxGenerations || 100;
    this.targetFitness = config.targetFitness || 0.95;
    this.stagnationLimit = config.stagnationLimit || 20;
    
    // Problem constraints
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
    
    // Initialize components
    this.fitnessEvaluator = new FitnessEvaluator({
      buildingConstraints: this.constraints.buildingConstraints,
      mepRequirements: this.constraints.mepSystems,
      ...config.fitnessConfig
    });
    
    this.operators = new GeneticOperators({
      mutationRate: config.mutationRate || 0.1,
      crossoverRate: config.crossoverRate || 0.8,
      elitismRate: config.elitismRate || 0.1,
      tournamentSize: config.tournamentSize || 3
    });
    
    // State tracking
    this.population = [];
    this.generation = 0;
    this.bestIndividual = null;
    this.bestFitness = 0;
    this.fitnessHistory = [];
    this.diversityHistory = [];
    this.stagnationCounter = 0;
    
    // Callbacks
    this.onGenerationComplete = config.onGenerationComplete || (() => {});
    this.onOptimizationComplete = config.onOptimizationComplete || (() => {});
    this.onImprovement = config.onImprovement || (() => {});
  }

  /**
   * Initialize population with random chromosomes
   */
  initializePopulation() {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new RackChromosome(null, this.constraints));
    }
    this.generation = 0;
    this.stagnationCounter = 0;
  }

  /**
   * Run the genetic algorithm optimization
   */
  async optimize() {
    this.initializePopulation();
    
    while (this.generation < this.maxGenerations) {
      // Evaluate fitness
      const fitnessResults = this.evaluatePopulation();
      
      // Track best individual
      this.updateBestIndividual(fitnessResults);
      
      // Check termination conditions
      if (this.shouldTerminate()) {
        break;
      }
      
      // Generate next generation
      this.population = this.evolvePopulation(fitnessResults);
      
      // Track statistics
      this.trackStatistics(fitnessResults);
      
      // Callback
      await this.onGenerationComplete({
        generation: this.generation,
        bestFitness: this.bestFitness,
        averageFitness: this.getAverageFitness(fitnessResults),
        diversity: this.calculateDiversity(),
        bestIndividual: this.bestIndividual,
        stagnation: this.stagnationCounter
      });
      
      this.generation++;
      
      // Allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Final callback
    const finalResult = {
      bestSolution: this.bestIndividual,
      fitness: this.bestFitness,
      generations: this.generation,
      fitnessHistory: this.fitnessHistory,
      diversityHistory: this.diversityHistory,
      rackParams: this.bestIndividual.toRackParams()
    };
    
    await this.onOptimizationComplete(finalResult);
    return finalResult;
  }

  /**
   * Evaluate fitness for entire population
   */
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
    
    // Sort by fitness (descending)
    results.sort((a, b) => b.fitness - a.fitness);
    
    return results;
  }

  /**
   * Update best individual tracking
   */
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

  /**
   * Check if optimization should terminate
   */
  shouldTerminate() {
    // Target fitness reached
    if (this.bestFitness >= this.targetFitness) {
      console.log(`Target fitness ${this.targetFitness} reached`);
      return true;
    }
    
    // Stagnation limit reached
    if (this.stagnationCounter >= this.stagnationLimit) {
      console.log(`Stagnation limit ${this.stagnationLimit} reached`);
      return true;
    }
    
    return false;
  }

  /**
   * Evolve population to next generation
   */
  evolvePopulation(fitnessResults) {
    const newPopulation = [];
    const fitnessScores = fitnessResults.map(r => r.fitness);
    const individuals = fitnessResults.map(r => r.individual);
    
    // Elitism - keep best individuals
    const eliteCount = Math.floor(this.populationSize * this.operators.elitismRate);
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push(individuals[i].clone());
    }
    
    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      // Selection
      const parent1 = this.operators.tournamentSelection(individuals, fitnessScores);
      const parent2 = this.operators.tournamentSelection(individuals, fitnessScores);
      
      // Crossover
      let offspring;
      if (Math.random() < 0.5) {
        offspring = this.operators.singlePointCrossover(parent1, parent2);
      } else {
        offspring = this.operators.uniformCrossover(parent1, parent2);
      }
      
      // Mutation
      offspring = offspring.map(child => {
        if (this.stagnationCounter > 5) {
          // Use adaptive mutation if stagnating
          return this.operators.adaptiveMutate(child, this.stagnationCounter);
        } else {
          return this.operators.mutate(child);
        }
      });
      
      // Repair if needed
      offspring = offspring.map(child => 
        this.operators.repair(child, this.constraints.buildingConstraints)
      );
      
      // Add to new population
      newPopulation.push(...offspring);
    }
    
    // Trim to exact population size
    newPopulation.length = this.populationSize;
    
    // Inject diversity if population is too homogeneous
    if (this.calculateDiversity() < 0.1 && this.stagnationCounter > 10) {
      this.injectDiversity(newPopulation);
    }
    
    return newPopulation;
  }

  /**
   * Calculate population diversity
   */
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
    
    // Structural differences
    distance += Math.abs(chrom1.genes.bayWidth - chrom2.genes.bayWidth) / 8;
    distance += Math.abs(chrom1.genes.bayCount - chrom2.genes.bayCount) / 10;
    distance += Math.abs(chrom1.genes.tierCount - chrom2.genes.tierCount) / 5;
    distance += Math.abs(chrom1.genes.rackDepth - chrom2.genes.rackDepth) / 6;
    
    return distance / 4; // Normalize to 0-1
  }

  /**
   * Inject new random individuals for diversity
   */
  injectDiversity(population) {
    const injectionCount = Math.floor(this.populationSize * 0.2);
    
    for (let i = 0; i < injectionCount; i++) {
      const randomIndex = Math.floor(Math.random() * (population.length - eliteCount)) + eliteCount;
      population[randomIndex] = new RackChromosome(null, this.constraints);
    }
  }

  /**
   * Track optimization statistics
   */
  trackStatistics(fitnessResults) {
    const avgFitness = this.getAverageFitness(fitnessResults);
    const diversity = this.calculateDiversity();
    
    this.fitnessHistory.push({
      generation: this.generation,
      best: this.bestFitness,
      average: avgFitness,
      worst: fitnessResults[fitnessResults.length - 1].fitness
    });
    
    this.diversityHistory.push({
      generation: this.generation,
      diversity: diversity
    });
  }

  getAverageFitness(fitnessResults) {
    const sum = fitnessResults.reduce((acc, r) => acc + r.fitness, 0);
    return sum / fitnessResults.length;
  }

  /**
   * Get current optimization state
   */
  getState() {
    return {
      generation: this.generation,
      populationSize: this.population.length,
      bestFitness: this.bestFitness,
      bestIndividual: this.bestIndividual,
      stagnationCounter: this.stagnationCounter,
      fitnessHistory: this.fitnessHistory,
      diversityHistory: this.diversityHistory
    };
  }

  /**
   * Reset the algorithm
   */
  reset() {
    this.population = [];
    this.generation = 0;
    this.bestIndividual = null;
    this.bestFitness = 0;
    this.fitnessHistory = [];
    this.diversityHistory = [];
    this.stagnationCounter = 0;
  }
}