/**
 * React component for rack optimization using genetic algorithm
 * Provides UI for configuration and visualization of optimization process
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRackOptimizer } from '../../optimization/RackOptimizer';
import './RackOptimizationPanel.css';

const RackOptimizationPanel = ({ 
  buildingConstraints = {}, 
  mepSystems = [],
  onOptimizationComplete = () => {},
  onApplyConfiguration = () => {},
  onClose = () => {},
  rootClassName = ''
}) => {
  // State management
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({
    generation: 0,
    bestFitness: 0,
    averageFitness: 0,
    diversity: 0,
    stagnation: 0
  });
  
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [fitnessChart, setFitnessChart] = useState([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [lastImprovementData, setLastImprovementData] = useState(null);
  
  // GA configuration
  const [gaConfig, setGaConfig] = useState({
    populationSize: 50,
    maxGenerations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    elitismRate: 0.1,
    targetFitness: 0.99,
    stagnationLimit: 20
  });
  
  // Fitness weights configuration
  const [fitnessWeights, setFitnessWeights] = useState({
    volumeWeight: 0.3,
    mepFitWeight: 0.25,
    structuralWeight: 0.15,
    constraintWeight: 0.2,
    costWeight: 0.1
  });
  
  const optimizerRef = useRef(null);
  const chartCanvasRef = useRef(null);

  // Start optimization process
  const startOptimization = async () => {
    console.log('🚀 Starting optimization...');
    console.log('Building constraints:', buildingConstraints);
    console.log('MEP systems:', mepSystems);
    console.log('GA config:', gaConfig);
    
    setIsOptimizing(true);
    setOptimizationResult(null);
    setFitnessChart([]);
    
    // Create optimizer with current configuration
    const optimizer = createRackOptimizer({
      ...gaConfig,
      buildingConstraints: {
        ...buildingConstraints,
        // Pass building context for proper rack positioning
        buildingContext: {
          corridorHeight: buildingConstraints.corridorHeight,
          beamDepth: buildingConstraints.beamDepth
        }
      },
      mepSystems,
      fixedRackLength: buildingConstraints.rackLength?.feet ? 
        buildingConstraints.rackLength.feet + (buildingConstraints.rackLength.inches || 0) / 12 : 
        20, // Default to 20 feet if not specified
      fitnessConfig: fitnessWeights,
      
      // Callbacks for progress tracking
      onGenerationComplete: (stats) => {
        console.log('📊 Generation completed:', stats);
        setOptimizationProgress(stats);
        setFitnessChart(prev => [...prev, {
          generation: stats.generation,
          best: stats.bestFitness,
          average: stats.averageFitness
        }]);
      },
      
      onImprovement: (improvement) => {
        console.log('✨ New best solution found:', improvement);
        setLastImprovementData(improvement);
      },
      
      onOptimizationComplete: (result) => {
        console.log('🎯 Optimization completed:', result);
        setIsOptimizing(false);
        
        // Use the breakdown from the final result (now includes correct data)
        setOptimizationResult(result);
        onOptimizationComplete(result);
      }
    });
    
    optimizerRef.current = optimizer;
    
    try {
      console.log('🔧 Created optimizer, starting optimization...');
      const result = await optimizer.optimize();
      console.log('✅ Optimization finished:', result);
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      setIsOptimizing(false);
    }
  };

  // Stop optimization
  const stopOptimization = () => {
    if (optimizerRef.current) {
      // In a real implementation, you'd add a stop method to the GA class
      setIsOptimizing(false);
    }
  };

  // Apply optimized configuration
  const applyOptimizedConfiguration = () => {
    if (optimizationResult && optimizationResult.rackParams) {
      onApplyConfiguration(optimizationResult.rackParams);
    }
  };

  // Draw fitness chart
  useEffect(() => {
    if (chartCanvasRef.current && fitnessChart.length > 0) {
      const canvas = chartCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw axes
      ctx.strokeStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(30, height - 30);
      ctx.lineTo(width - 10, height - 30);
      ctx.moveTo(30, 10);
      ctx.lineTo(30, height - 30);
      ctx.stroke();
      
      // Draw data
      if (fitnessChart.length > 1) {
        const xScale = (width - 40) / (fitnessChart.length - 1);
        const yScale = (height - 40);
        
        // Best fitness line
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        fitnessChart.forEach((point, i) => {
          const x = 30 + i * xScale;
          const y = height - 30 - point.best * yScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Average fitness line
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        fitnessChart.forEach((point, i) => {
          const x = 30 + i * xScale;
          const y = height - 30 - point.average * yScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }
  }, [fitnessChart]);

  return (
    <div className={`rack-optimization-panel ${rootClassName}`}>
      <div className="optimization-header">
        <h2>Rack Optimizer</h2>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="close-button"
          onClick={onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      <div className="optimization-content">

      {/* Configuration Section */}
      <div className="optimization-config">
        <div className="config-section">
          <h3>Optimization Parameters</h3>
          
          <div className="config-row">
            <label>Population Size:</label>
            <input
              type="number"
              value={gaConfig.populationSize}
              onChange={(e) => setGaConfig({...gaConfig, populationSize: parseInt(e.target.value)})}
              min="10"
              max="200"
              disabled={isOptimizing}
            />
          </div>
          
          <div className="config-row">
            <label>Max Generations:</label>
            <input
              type="number"
              value={gaConfig.maxGenerations}
              onChange={(e) => setGaConfig({...gaConfig, maxGenerations: parseInt(e.target.value)})}
              min="10"
              max="500"
              disabled={isOptimizing}
            />
          </div>
          
          <div className="config-row">
            <label>Target Fitness:</label>
            <input
              type="number"
              value={gaConfig.targetFitness}
              onChange={(e) => setGaConfig({...gaConfig, targetFitness: parseFloat(e.target.value)})}
              min="0.5"
              max="1.0"
              step="0.05"
              disabled={isOptimizing}
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="config-section">
          <button 
            className="toggle-advanced"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? '▼' : '▶'} Advanced Settings
          </button>
          
          {showAdvancedSettings && (
            <div className="advanced-settings">
              <h4>Genetic Operators</h4>
              <div className="config-row">
                <label>Mutation Rate:</label>
                <input
                  type="number"
                  value={gaConfig.mutationRate}
                  onChange={(e) => setGaConfig({...gaConfig, mutationRate: parseFloat(e.target.value)})}
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  disabled={isOptimizing}
                />
              </div>
              
              <div className="config-row">
                <label>Crossover Rate:</label>
                <input
                  type="number"
                  value={gaConfig.crossoverRate}
                  onChange={(e) => setGaConfig({...gaConfig, crossoverRate: parseFloat(e.target.value)})}
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  disabled={isOptimizing}
                />
              </div>
              
              <h4>Fitness Weights</h4>
              <div className="config-row">
                <label>Volume Minimization:</label>
                <input
                  type="number"
                  value={fitnessWeights.volumeWeight}
                  onChange={(e) => setFitnessWeights({...fitnessWeights, volumeWeight: parseFloat(e.target.value)})}
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={isOptimizing}
                />
              </div>
              
              <div className="config-row">
                <label>MEP Fit Quality:</label>
                <input
                  type="number"
                  value={fitnessWeights.mepFitWeight}
                  onChange={(e) => setFitnessWeights({...fitnessWeights, mepFitWeight: parseFloat(e.target.value)})}
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={isOptimizing}
                />
              </div>
              
              <div className="config-row">
                <label>Cost Optimization:</label>
                <input
                  type="number"
                  value={fitnessWeights.costWeight}
                  onChange={(e) => setFitnessWeights({...fitnessWeights, costWeight: parseFloat(e.target.value)})}
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={isOptimizing}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {(isOptimizing || optimizationResult) && (
        <div className="optimization-progress">
          <h3>Optimization Progress</h3>
          
          <div className="progress-stats">
            <div className="stat">
              <label>Generation:</label>
              <span>{optimizationProgress.generation}</span>
            </div>
            <div className="stat">
              <label>Best Fitness:</label>
              <span>{optimizationProgress.bestFitness.toFixed(3)}</span>
            </div>
            <div className="stat">
              <label>Avg Fitness:</label>
              <span>{optimizationProgress.averageFitness.toFixed(3)}</span>
            </div>
            <div className="stat">
              <label>Diversity:</label>
              <span>{optimizationProgress.diversity.toFixed(3)}</span>
            </div>
            <div className="stat">
              <label>Stagnation:</label>
              <span>{optimizationProgress.stagnation}</span>
            </div>
          </div>
          
          <canvas 
            ref={chartCanvasRef}
            width="600"
            height="200"
            className="fitness-chart"
          />
        </div>
      )}

      {/* Results Section */}
      {optimizationResult && (
        <div className="optimization-results">
          <h3>Optimization Results</h3>
          
          <div className="result-summary">
            <p><strong>Final Fitness:</strong> {optimizationResult.fitness.toFixed(3)}</p>
            <p><strong>Generations:</strong> {optimizationResult.generations}</p>
          </div>
          
          <div className="result-configuration">
            <h4>Optimized Configuration:</h4>
            <ul>
              <li>Rack Length: {optimizationResult.rackParams.rackLength?.toFixed(2) || 'N/A'} ft (FIXED)</li>
              <li>Bay Count: {optimizationResult.rackParams.bayCount}</li>
              <li>Bay Width: {optimizationResult.rackParams.bayWidth.toFixed(2)} ft</li>
              <li>Rack Depth: {optimizationResult.rackParams.depth.toFixed(2)} ft</li>
              <li>Tier Count: {optimizationResult.rackParams.tierCount}</li>
              <li>MEP Systems Placed: {optimizationResult.rackParams.mepSystems?.length || 0}</li>
              <li>Total Volume: {(optimizationResult.bestSolution?.getVolume() || 0).toFixed(1)} ft³</li>
            </ul>
            
            {optimizationResult.bestSolution && (
              <div className="debug-info">
                <h4>Debug Info:</h4>
                <ul>
                  <li>Has Collisions: {optimizationResult.bestSolution.hasCollisions() ? 'YES ❌' : 'NO ✅'}</li>
                  <li>Fitness Breakdown:</li>
                  <ul>
                    <li>Volume: {((optimizationResult.breakdown?.volume || 0) * 100).toFixed(1)}%</li>
                    <li>MEP Fit: {((optimizationResult.breakdown?.mepFit || 0) * 100).toFixed(1)}%</li>
                    <li>Structural: {((optimizationResult.breakdown?.structural || 0) * 100).toFixed(1)}%</li>
                    <li>Constraints: {((optimizationResult.breakdown?.constraints || 0) * 100).toFixed(1)}%</li>
                  </ul>
                  <li>Violations: {optimizationResult.violations?.length || 0}</li>
                  {optimizationResult.violations?.map((violation, i) => (
                    <li key={i} style={{color: 'red', fontSize: '12px'}}>⚠️ {violation.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {optimizationResult.bestSolution?.genes && (
            <button 
              className="apply-button"
              onClick={applyOptimizedConfiguration}
            >
              Apply Configuration
            </button>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="optimization-controls">
        {!isOptimizing ? (
          <button 
            className="start-button"
            onClick={startOptimization}
            disabled={mepSystems.length === 0}
          >
            Start Optimization
          </button>
        ) : (
          <button 
            className="stop-button"
            onClick={stopOptimization}
          >
            Stop Optimization
          </button>
        )}
      </div>
      
      {mepSystems.length === 0 && (
        <p className="warning-message">
          Please add MEP systems before starting optimization
        </p>
      )}
      
      </div>
    </div>
  );
};

export default RackOptimizationPanel;