/**
 * Export main genetic algorithm components
 */

import { RackChromosome } from './Chromosome';
import { FitnessEvaluator } from './FitnessFunction';
import { GeneticOperators } from './GeneticOperators';
import { RackOptimizationGA } from './GeneticAlgorithm';

export { RackChromosome, FitnessEvaluator, GeneticOperators, RackOptimizationGA };

// Convenience function to create and configure optimizer
export function createRackOptimizer(config = {}) {
  return new RackOptimizationGA(config);
}