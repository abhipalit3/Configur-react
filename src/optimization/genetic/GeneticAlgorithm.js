/**
 * Stacked Container Optimizer for rack optimization
 * Uses genetic algorithm approach adapted for rectangle packing in stacked containers
 */

import { StackedContainerOptimizer } from '../stacked_optimizer';

export class RackOptimizationGA {
  constructor(config = {}) {
    // Convert MEP systems to rectangles for stacked optimization
    this.mepSystems = config.mepSystems || [];
    this.rectangles = this.convertMepSystemsToRectangles(this.mepSystems);
    
    // Container constraints based on building dimensions
    this.containerWidth = config.buildingConstraints?.rackLength || 20;
    this.maxTotalHeight = config.buildingConstraints?.maxHeight || 15;
    this.maxContainers = config.maxContainers || 5;
    
    // Stacked optimizer configuration
    this.optimizerConfig = {
      populationSize: config.populationSize || 100,
      generations: config.maxGenerations || 500,
      mutationRate: config.mutationRate || 0.2,
      crossoverRate: config.crossoverRate || 0.8,
      elitismRate: config.elitismRate || 0.1
    };
    
    // State tracking
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
   * Convert MEP systems to rectangles for stacked container optimization
   */
  convertMepSystemsToRectangles(mepSystems) {
    return mepSystems.map(system => [
      system.width || system.dimensions?.width || 2,
      system.height || system.dimensions?.height || 1
    ]);
  }

  /**
   * Run the stacked container optimization
   */
  async optimize() {
    if (this.rectangles.length === 0) {
      throw new Error('No MEP systems to optimize');
    }
    
    // Create stacked container optimizer
    const optimizer = new StackedContainerOptimizer(
      this.rectangles,
      this.containerWidth,
      this.maxTotalHeight,
      this.maxContainers,
      this.optimizerConfig.populationSize,
      this.optimizerConfig.generations,
      this.optimizerConfig.mutationRate,
      this.optimizerConfig.crossoverRate,
      this.optimizerConfig.elitismRate
    );
    
    // Track progress through generation callbacks
    let currentGeneration = 0;
    const originalConsoleLog = console.log;
    
    // Override console.log to capture generation progress
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('Generation')) {
        const matches = message.match(/Generation (\d+): Best fitness = ([\d.-]+), Avg = ([\d.-]+)/);
        if (matches) {
          currentGeneration = parseInt(matches[1]);
          const bestFitness = parseFloat(matches[2]);
          const avgFitness = parseFloat(matches[3]);
          
          this.onGenerationComplete({
            generation: currentGeneration,
            bestFitness: bestFitness,
            averageFitness: avgFitness,
            diversity: 0.5, // Default diversity value
            bestIndividual: null,
            stagnation: 0
          });
        }
      }
      originalConsoleLog(...args);
    };
    
    try {
      // Run optimization
      const [bestSolution, fitnessHistory] = optimizer.evolve();
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      // Convert solution to rack parameters
      const rackParams = this.convertSolutionToRackParams(bestSolution);
      
      const finalResult = {
        bestSolution: {
          containers: bestSolution.containers,
          fitness: bestSolution.fitness,
          rectanglesPlaced: bestSolution.rectanglesPlaced,
          totalHeightUsed: bestSolution.totalHeightUsed,
          toRackParams: () => rackParams
        },
        fitness: bestSolution.fitness,
        generations: currentGeneration,
        fitnessHistory: fitnessHistory.map((fitness, gen) => ({
          generation: gen,
          best: fitness,
          average: fitness * 0.9 // Approximate average
        })),
        diversityHistory: [],
        rackParams: rackParams
      };
      
      await this.onOptimizationComplete(finalResult);
      return finalResult;
      
    } catch (error) {
      console.log = originalConsoleLog;
      throw error;
    }
  }

  /**
   * Convert stacked container solution to rack parameters
   */
  convertSolutionToRackParams(solution) {
    if (!solution || !solution.containers) {
      return {
        rackLength: this.containerWidth,
        bayCount: 1,
        bayWidth: this.containerWidth,
        depth: 2,
        tierCount: 1,
        mepSystems: []
      };
    }
    
    // Calculate optimal rack configuration based on container solution
    const activeContainers = solution.containers.filter(c => 
      c.bottomRectangles.length > 0 || c.topRectangles.length > 0
    );
    
    // Estimate bay configuration
    const bayCount = Math.max(1, Math.min(activeContainers.length, 10));
    const bayWidth = this.containerWidth / bayCount;
    const tierCount = Math.max(1, Math.ceil(solution.totalHeightUsed / 3)); // Assuming 3ft per tier
    
    return {
      rackLength: this.containerWidth,
      bayCount: bayCount,
      bayWidth: bayWidth,
      depth: Math.min(8, Math.max(2, this.containerWidth / bayCount / 2)),
      tierCount: tierCount,
      mepSystems: this.mepSystems,
      containerSolution: solution
    };
  }

  /**
   * Get current optimization state
   */
  getState() {
    return {
      generation: this.generation,
      populationSize: this.optimizerConfig.populationSize,
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
    this.generation = 0;
    this.bestIndividual = null;
    this.bestFitness = 0;
    this.fitnessHistory = [];
    this.diversityHistory = [];
    this.stagnationCounter = 0;
  }








}