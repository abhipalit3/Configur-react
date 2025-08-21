/**
 * Test script for stacked container optimization
 */

import { createRackOptimizer } from './src/optimization/RackOptimizer.js';

const testConfig = {
  mepSystems: [
    { id: 1, type: 'duct', width: 24, height: 12 },
    { id: 2, type: 'pipe', diameter: 6 },
    { id: 3, type: 'cableTray', width: 18, height: 4 }
  ],
  buildingConstraints: {
    rackLength: 20,
    maxHeight: 15
  },
  populationSize: 10,
  maxGenerations: 5
};

async function testOptimization() {
  console.log('🧪 Testing stacked container optimization...');
  
  try {
    const optimizer = createRackOptimizer(testConfig);
    console.log('✅ Optimizer created successfully');
    
    const result = await optimizer.optimize();
    console.log('✅ Optimization completed successfully');
    console.log('📊 Result:', {
      fitness: result.fitness,
      generations: result.generations,
      mepSystemsPlaced: result.rackParams.mepSystems.length
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOptimization();