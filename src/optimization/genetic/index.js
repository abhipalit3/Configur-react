/**
 * Export stacked container optimization components
 */

import { RackOptimizationGA } from './GeneticAlgorithm';

export { RackOptimizationGA };

// Convenience function to create and configure optimizer
export function createRackOptimizer(config = {}) {
  return new RackOptimizationGA(config);
}