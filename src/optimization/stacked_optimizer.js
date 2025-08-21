/**
 * Stacked Container Optimizer with Top/Bottom Placement Constraint
 *
 * This module implements a genetic algorithm for optimizing the placement of rectangles
 * in stacked containers where rectangles can only be placed at the top or bottom edges
 * of containers. The algorithm supports X-axis overlapping and Y-axis compression
 * while preventing any physical rectangle clashes.
 *
 * Author: Abhishek Palit
 * Version: 1.0
 */

/**
 * Represents a rectangle to be packed.
 */
class Rectangle {
    /**
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} id - Unique identifier for the rectangle
     */
    constructor(width, height, id) {
        this.width = width;
        this.height = height;
        this.id = id;
    }

    /**
     * Calculate the area of the rectangle.
     * @returns {number} The area of the rectangle
     */
    area() {
        return this.width * this.height;
    }
}

/**
 * Represents a container with fixed width and optimizable height.
 *
 * Rectangles can only be placed at the top or bottom edges of the container.
 * The container height is optimized to minimize empty space while preventing
 * rectangle clashes.
 */
class Container {
    /**
     * @param {number} width - Fixed container width
     * @param {number} height - Variable container height (optimized by algorithm)
     * @param {number} id - Unique container identifier
     * @param {Array<[number, number]>} bottomRectangles - Rectangles at bottom (rect_id, x_position)
     * @param {Array<[number, number]>} topRectangles - Rectangles at top (rect_id, x_position)
     */
    constructor(width, height, id, bottomRectangles = null, topRectangles = null) {
        this.width = width;
        this.height = height;
        this.id = id;
        this.bottomRectangles = bottomRectangles || [];
        this.topRectangles = topRectangles || [];
    }

    /**
     * Calculate total area of rectangles placed in this container.
     * @param {Array<Rectangle>} allRectangles - List of all rectangles
     * @returns {number} Total area used
     */
    usedArea(allRectangles) {
        let total = 0;
        for (const [rectId] of this.bottomRectangles) {
            total += allRectangles[rectId].area();
        }
        for (const [rectId] of this.topRectangles) {
            total += allRectangles[rectId].area();
        }
        return total;
    }

    /**
     * Calculate container space utilization as a percentage (0.0 to 1.0+).
     * @param {Array<Rectangle>} allRectangles - List of all rectangles
     * @returns {number} Utilization ratio
     */
    utilization(allRectangles) {
        const totalArea = this.width * this.height;
        if (totalArea === 0) {
            return 0;
        }
        return this.usedArea(allRectangles) / totalArea;
    }

    /**
     * Get the height of the tallest bottom rectangle.
     * @param {Array<Rectangle>} allRectangles - List of all rectangles
     * @returns {number} Height of tallest bottom rectangle
     */
    getBottomHeight(allRectangles) {
        if (this.bottomRectangles.length === 0) {
            return 0;
        }
        return Math.max(...this.bottomRectangles.map(([rectId]) => allRectangles[rectId].height));
    }

    /**
     * Get the height of the tallest top rectangle.
     * @param {Array<Rectangle>} allRectangles - List of all rectangles
     * @returns {number} Height of tallest top rectangle
     */
    getTopHeight(allRectangles) {
        if (this.topRectangles.length === 0) {
            return 0;
        }
        return Math.max(...this.topRectangles.map(([rectId]) => allRectangles[rectId].height));
    }

    /**
     * Calculate minimum container height to prevent rectangle clashes.
     *
     * The algorithm ensures:
     * 1. Rectangles overlapping in X-direction don't clash (sum of heights)
     * 2. Non-overlapping rectangles can compress via Y-overlap (max of heights)
     * 3. Container is always tall enough for the largest individual rectangle
     *
     * @param {Array<Rectangle>} allRectangles - List of all rectangles in the problem
     * @returns {number} Minimum height needed for this container
     */
    getMinimumHeight(allRectangles) {
        if (this.bottomRectangles.length === 0 || this.topRectangles.length === 0) {
            // Single-side placement: use standard sum approach
            return this.getBottomHeight(allRectangles) + this.getTopHeight(allRectangles);
        }

        let minHeightNeeded = 0;

        // Check for X-direction overlaps between bottom and top rectangles
        for (const [bottomRectId, bottomX] of this.bottomRectangles) {
            const bottomRect = allRectangles[bottomRectId];

            for (const [topRectId, topX] of this.topRectangles) {
                const topRect = allRectangles[topRectId];

                // Check X-axis overlap
                const xOverlap = !(bottomX + bottomRect.width <= topX || 
                                 bottomX >= topX + topRect.width);

                if (xOverlap) {
                    // Prevent clash: need sum of overlapping rectangle heights
                    const requiredHeight = bottomRect.height + topRect.height;
                    minHeightNeeded = Math.max(minHeightNeeded, requiredHeight);
                }
            }
        }

        // If no X-overlaps exist, allow aggressive Y-compression
        if (minHeightNeeded === 0) {
            const bottomHeight = this.getBottomHeight(allRectangles);
            const topHeight = this.getTopHeight(allRectangles);
            minHeightNeeded = Math.max(bottomHeight, topHeight);
        }

        // Safety constraint: container must fit the tallest individual rectangle
        const allRects = [...this.bottomRectangles, ...this.topRectangles];
        const tallestRect = Math.max(...allRects.map(([rectId]) => allRectangles[rectId].height));

        return Math.max(minHeightNeeded, tallestRect);
    }
}

/**
 * Represents a solution (chromosome) in the genetic algorithm.
 *
 * Each individual encodes:
 * - Number of containers to use
 * - Height of each container
 * - Order in which rectangles are placed
 */
class Individual {
    /**
     * @param {Array<Rectangle>} rectangles - List of rectangles to pack
     * @param {number} containerWidth - Fixed width for all containers
     * @param {number} maxTotalHeight - Maximum allowed total height when stacked
     * @param {number} maxContainers - Maximum number of containers allowed
     */
    constructor(rectangles, containerWidth, maxTotalHeight, maxContainers) {
        this.rectangles = rectangles;
        this.containerWidth = containerWidth;
        this.maxTotalHeight = maxTotalHeight;
        this.maxContainers = maxContainers;

        // Solution encoding
        this.numContainers = Math.floor(Math.random() * maxContainers) + 1;
        this.rectangleOrder = Array.from({length: rectangles.length}, (_, i) => i);
        this.containerHeights = new Array(this.numContainers).fill(maxTotalHeight / this.numContainers);

        // Solution evaluation results
        this.fitness = 0;
        this.containers = [];
        this.totalHeightUsed = 0;
        this.rectanglesPlaced = 0;
        this.rectangleAssignments = [];
    }

    /**
     * Initialize solution with random rectangle order.
     */
    initializeRandom() {
        // Fisher-Yates shuffle
        for (let i = this.rectangleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.rectangleOrder[i], this.rectangleOrder[j]] = [this.rectangleOrder[j], this.rectangleOrder[i]];
        }
    }

    /**
     * Create a deep copy of this individual.
     * @returns {Individual} Deep copy of this individual
     */
    copy() {
        const newInd = new Individual(this.rectangles, this.containerWidth, 
                                    this.maxTotalHeight, this.maxContainers);
        newInd.numContainers = this.numContainers;
        newInd.rectangleOrder = [...this.rectangleOrder];
        newInd.fitness = this.fitness;
        newInd.containers = [];

        // Deep copy containers
        for (const c of this.containers) {
            const newContainer = new Container(c.width, c.height, c.id);
            newContainer.bottomRectangles = [...c.bottomRectangles];
            newContainer.topRectangles = [...c.topRectangles];
            newInd.containers.push(newContainer);
        }

        newInd.totalHeightUsed = this.totalHeightUsed;
        newInd.rectanglesPlaced = this.rectanglesPlaced;
        return newInd;
    }
}

/**
 * Genetic Algorithm optimizer for stacked container packing with top/bottom constraints.
 *
 * This optimizer solves the problem of packing rectangles into stacked containers where:
 * - Rectangles can only be placed at top or bottom edges of containers
 * - Container widths are fixed, heights are optimized
 * - Rectangles can overlap in X-direction (same location)
 * - Y-axis compression is allowed when rectangles don't clash
 * - No rectangle rotations are performed
 */
class StackedContainerOptimizer {
    /**
     * Initialize the optimizer with problem parameters and GA settings.
     *
     * @param {Array<[number, number]>} rectangles - List of (width, height) tuples for rectangles to pack
     * @param {number} containerWidth - Fixed width for all containers
     * @param {number} maxTotalHeight - Maximum total height when containers are stacked
     * @param {number} maxContainers - Maximum number of containers allowed
     * @param {number} populationSize - Number of individuals in GA population
     * @param {number} generations - Number of generations to evolve
     * @param {number} mutationRate - Probability of mutation (0.0 to 1.0)
     * @param {number} crossoverRate - Probability of crossover (0.0 to 1.0)
     * @param {number} elitismRate - Fraction of best individuals to preserve (0.0 to 1.0)
     */
    constructor(rectangles, containerWidth, maxTotalHeight, maxContainers = 10,
                populationSize = 100, generations = 500, mutationRate = 0.2,
                crossoverRate = 0.8, elitismRate = 0.1) {
        this.rectangles = rectangles.map((rect, i) => new Rectangle(rect[0], rect[1], i));
        this.containerWidth = containerWidth;
        this.maxTotalHeight = maxTotalHeight;
        this.maxContainers = maxContainers;
        this.populationSize = populationSize;
        this.generations = generations;
        this.mutationRate = mutationRate;
        this.crossoverRate = crossoverRate;
        this.elitismCount = Math.floor(populationSize * elitismRate);
        this.population = [];
        this.bestIndividual = null;
    }

    /**
     * Create initial random population
     */
    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const individual = new Individual(this.rectangles, this.containerWidth,
                                           this.maxTotalHeight, this.maxContainers);
            individual.initializeRandom();
            this.population.push(individual);
        }
    }

    /**
     * Pack rectangles into containers with top/bottom placement constraint.
     *
     * This method implements the core packing algorithm that:
     * 1. Creates containers based on the individual's container configuration
     * 2. Attempts to place each rectangle in order at either top or bottom of containers
     * 3. Uses X-axis alignment strategies to favor overlapping placements
     * 4. Optimizes container heights after placement to minimize empty space
     *
     * @param {Individual} individual - The solution individual containing container and rectangle configuration
     * @returns {[Array<Container>, number]} Tuple of (containers_list, number_of_rectangles_successfully_placed)
     */
    packRectangles(individual) {
        // Create containers based on individual's heights
        const containers = [];
        for (let i = 0; i < individual.numContainers; i++) {
            const height = i < individual.containerHeights.length 
                         ? individual.containerHeights[i] 
                         : this.maxTotalHeight / individual.numContainers;
            containers.push(new Container(this.containerWidth, height, i));
        }

        let placedCount = 0;
        individual.rectangleAssignments = new Array(this.rectangles.length).fill(-1);

        // Try to place rectangles in order
        for (const rectIdx of individual.rectangleOrder) {
            const rect = this.rectangles[rectIdx];
            let placed = false;

            // Try each container
            for (let containerIdx = 0; containerIdx < containers.length; containerIdx++) {
                const container = containers[containerIdx];
                
                // Check if rectangle fits in container width
                if (rect.width > container.width) {
                    continue;
                }

                // Try placing at bottom first, then top
                if (this.canPlaceAtBottom(container, rect) && !placed) {
                    const xPos = this.findBottomPosition(container, rect);
                    if (xPos !== null) {
                        container.bottomRectangles.push([rectIdx, xPos]);
                        individual.rectangleAssignments[rectIdx] = containerIdx;
                        placed = true;
                        placedCount++;
                    }
                }

                if (this.canPlaceAtTop(container, rect) && !placed) {
                    const xPos = this.findTopPosition(container, rect);
                    if (xPos !== null) {
                        container.topRectangles.push([rectIdx, xPos]);
                        individual.rectangleAssignments[rectIdx] = containerIdx;
                        placed = true;
                        placedCount++;
                    }
                }

                if (placed) {
                    break;
                }
            }

            if (!placed) {
                individual.rectangleAssignments[rectIdx] = -1;
            }
        }

        // Optimize container heights after placement
        for (const container of containers) {
            if (container.bottomRectangles.length > 0 || container.topRectangles.length > 0) {
                const minHeight = container.getMinimumHeight(this.rectangles);
                
                // Check for X-axis alignment between top and bottom rectangles
                const alignmentBonus = this._calculateAlignmentBonus(container);
                
                // Use minimum height with minimal variation for GA exploration
                // Add tiny random variation (0-2%) only for exploration
                const tinyVariation = Math.random() * 0.02 * minHeight;
                container.height = minHeight + tinyVariation;
            }
        }

        return [containers, placedCount];
    }

    /**
     * Check if rectangle can be placed at bottom of container
     * @param {Container} container - The container to check
     * @param {Rectangle} rect - The rectangle to place
     * @returns {boolean} Whether the rectangle can be placed
     */
    canPlaceAtBottom(container, rect) {
        if (rect.height > container.height) {
            return false;
        }

        // Check if adding this rectangle would exceed container height
        const currentBottomHeight = container.getBottomHeight(this.rectangles);
        const topHeight = container.getTopHeight(this.rectangles);

        // Rectangle height should not exceed available space considering top rectangles
        const availableSpace = container.height - topHeight;
        const newBottomHeight = Math.max(currentBottomHeight, rect.height);

        return newBottomHeight <= availableSpace;
    }

    /**
     * Check if rectangle can be placed at top of container
     * @param {Container} container - The container to check
     * @param {Rectangle} rect - The rectangle to place
     * @returns {boolean} Whether the rectangle can be placed
     */
    canPlaceAtTop(container, rect) {
        if (rect.height > container.height) {
            return false;
        }

        // Check if adding this rectangle would exceed container height
        const currentTopHeight = container.getTopHeight(this.rectangles);
        const bottomHeight = container.getBottomHeight(this.rectangles);

        // Rectangle height should not exceed available space considering bottom rectangles
        const availableSpace = container.height - bottomHeight;
        const newTopHeight = Math.max(currentTopHeight, rect.height);

        return newTopHeight <= availableSpace;
    }

    /**
     * Find x position for rectangle at bottom of container
     * @param {Container} container - The container
     * @param {Rectangle} rect - The rectangle to place
     * @returns {number|null} X position or null if can't place
     */
    findBottomPosition(container, rect) {
        if (!this.canPlaceAtBottom(container, rect)) {
            return null;
        }

        // Strategy 1: Try to align with existing top rectangles (for potential overlap)
        for (const [topRectId, topXPos] of container.topRectangles) {
            const topRect = this.rectangles[topRectId];
            // Try to place at same x-coordinate as top rectangle
            if (topXPos + rect.width <= container.width && 
                !this._overlapsWithBottomRectangles(container, rect, topXPos)) {
                return topXPos;
            }

            // Try to place aligned to top rectangle's end
            const alignedX = topXPos + topRect.width - rect.width;
            if (alignedX >= 0 && alignedX + rect.width <= container.width &&
                !this._overlapsWithBottomRectangles(container, rect, alignedX)) {
                return alignedX;
            }
        }

        // Strategy 2: Standard bottom-left placement
        const occupiedRanges = [];
        for (const [rectId, xPos] of container.bottomRectangles) {
            const r = this.rectangles[rectId];
            occupiedRanges.push([xPos, xPos + r.width]);
        }

        occupiedRanges.sort((a, b) => a[0] - b[0]);

        let currentX = 0;
        for (const [startX, endX] of occupiedRanges) {
            if (currentX + rect.width <= startX) {
                return currentX;
            }
            currentX = Math.max(currentX, endX);
        }

        if (currentX + rect.width <= container.width) {
            return currentX;
        }

        return null;
    }

    /**
     * Find x position for rectangle at top of container
     * @param {Container} container - The container
     * @param {Rectangle} rect - The rectangle to place
     * @returns {number|null} X position or null if can't place
     */
    findTopPosition(container, rect) {
        if (!this.canPlaceAtTop(container, rect)) {
            return null;
        }

        // Strategy 1: Try to align with existing bottom rectangles (for potential overlap)
        for (const [bottomRectId, bottomXPos] of container.bottomRectangles) {
            const bottomRect = this.rectangles[bottomRectId];
            // Try to place at same x-coordinate as bottom rectangle
            if (bottomXPos + rect.width <= container.width && 
                !this._overlapsWithTopRectangles(container, rect, bottomXPos)) {
                return bottomXPos;
            }

            // Try to place aligned to bottom rectangle's end
            const alignedX = bottomXPos + bottomRect.width - rect.width;
            if (alignedX >= 0 && alignedX + rect.width <= container.width &&
                !this._overlapsWithTopRectangles(container, rect, alignedX)) {
                return alignedX;
            }
        }

        // Strategy 2: Standard top-left placement
        const occupiedRanges = [];
        for (const [rectId, xPos] of container.topRectangles) {
            const r = this.rectangles[rectId];
            occupiedRanges.push([xPos, xPos + r.width]);
        }

        occupiedRanges.sort((a, b) => a[0] - b[0]);

        let currentX = 0;
        for (const [startX, endX] of occupiedRanges) {
            if (currentX + rect.width <= startX) {
                return currentX;
            }
            currentX = Math.max(currentX, endX);
        }

        if (currentX + rect.width <= container.width) {
            return currentX;
        }

        return null;
    }

    /**
     * Check if rectangle at x_pos would overlap with existing bottom rectangles
     * @param {Container} container - The container
     * @param {Rectangle} rect - The rectangle to check
     * @param {number} xPos - X position to check
     * @returns {boolean} Whether there would be overlap
     */
    _overlapsWithBottomRectangles(container, rect, xPos) {
        for (const [rectId, existingX] of container.bottomRectangles) {
            const existingRect = this.rectangles[rectId];
            // Check X overlap
            if (!(xPos + rect.width <= existingX || xPos >= existingX + existingRect.width)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if rectangle at x_pos would overlap with existing top rectangles
     * @param {Container} container - The container
     * @param {Rectangle} rect - The rectangle to check
     * @param {number} xPos - X position to check
     * @returns {boolean} Whether there would be overlap
     */
    _overlapsWithTopRectangles(container, rect, xPos) {
        for (const [rectId, existingX] of container.topRectangles) {
            const existingRect = this.rectangles[rectId];
            // Check X overlap
            if (!(xPos + rect.width <= existingX || xPos >= existingX + existingRect.width)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate bonus for X-axis alignment between top and bottom rectangles
     * @param {Container} container - The container to analyze
     * @returns {number} Alignment bonus score
     */
    _calculateAlignmentBonus(container) {
        if (container.bottomRectangles.length === 0 || container.topRectangles.length === 0) {
            return 0;
        }

        let alignmentScore = 0;
        let totalComparisons = 0;

        for (const [bottomRectId, bottomX] of container.bottomRectangles) {
            const bottomRect = this.rectangles[bottomRectId];
            const bottomRange = [bottomX, bottomX + bottomRect.width];

            for (const [topRectId, topX] of container.topRectangles) {
                const topRect = this.rectangles[topRectId];
                const topRange = [topX, topX + topRect.width];

                // Calculate overlap in X direction
                const overlapStart = Math.max(bottomRange[0], topRange[0]);
                const overlapEnd = Math.min(bottomRange[1], topRange[1]);
                const overlap = Math.max(0, overlapEnd - overlapStart);

                // Calculate alignment score based on overlap
                const minWidth = Math.min(bottomRect.width, topRect.width);
                if (minWidth > 0) {
                    alignmentScore += overlap / minWidth;
                }

                totalComparisons++;
            }
        }

        return totalComparisons > 0 ? alignmentScore / totalComparisons : 0;
    }

    /**
     * Check if any rectangles in the container actually clash (physically overlap)
     * @param {Container} container - The container to check
     * @returns {boolean} Whether there are rectangle clashes
     */
    _hasRectangleClashes(container) {
        if (container.bottomRectangles.length === 0 || container.topRectangles.length === 0) {
            return false;
        }

        const bottomHeight = container.getBottomHeight(this.rectangles);
        const topHeight = container.getTopHeight(this.rectangles);

        // Check if rectangles would physically overlap
        for (const [bottomRectId, bottomX] of container.bottomRectangles) {
            const bottomRect = this.rectangles[bottomRectId];
            // Bottom rectangle occupies Y from 0 to bottom_rect.height
            const bottomYRange = [0, bottomRect.height];

            for (const [topRectId, topX] of container.topRectangles) {
                const topRect = this.rectangles[topRectId];
                // Top rectangle occupies Y from (container.height - top_rect.height) to container.height
                const topYStart = container.height - topRect.height;
                const topYRange = [topYStart, container.height];

                // Check X overlap
                const xOverlap = !(bottomX + bottomRect.width <= topX || bottomX >= topX + topRect.width);

                // Check Y overlap
                const yOverlap = !(bottomYRange[1] <= topYRange[0] || bottomYRange[0] >= topYRange[1]);

                if (xOverlap && yOverlap) {
                    return true; // Found a clash!
                }
            }
        }

        return false;
    }

    /**
     * Calculate comprehensive fitness score for a solution individual.
     *
     * The fitness function balances multiple objectives:
     * - Maximizing rectangle placement rate (primary goal)
     * - Maximizing container space utilization
     * - Minimizing number of containers used
     * - Minimizing total height consumption
     * - Rewarding compact/compressed packing
     * - Severely penalizing any rectangle clashes
     *
     * Higher fitness scores indicate better solutions.
     *
     * @param {Individual} individual - The solution to evaluate
     */
    evaluateFitness(individual) {
        const [containers, placedCount] = this.packRectangles(individual);
        individual.containers = containers;
        individual.rectanglesPlaced = placedCount;

        // Calculate total height used
        individual.totalHeightUsed = containers.slice(0, individual.numContainers)
                                             .reduce((sum, c) => sum + c.height, 0);

        // Calculate fitness components
        const totalRectangles = this.rectangles.length;
        const placementRate = totalRectangles > 0 ? placedCount / totalRectangles : 0;

        if (placedCount === 0) {
            individual.fitness = -1000;
            return;
        }

        // Calculate average utilization of used containers
        let totalUtilization = 0;
        let containersWithItems = 0;
        for (const container of containers) {
            if (container.bottomRectangles.length > 0 || container.topRectangles.length > 0) {
                containersWithItems++;
                totalUtilization += container.utilization(this.rectangles);
            }
        }

        const avgUtilization = containersWithItems > 0 ? totalUtilization / containersWithItems : 0;

        // Penalty for using too many containers
        const containerPenalty = individual.numContainers / this.maxContainers;

        // Penalty for total height
        const heightPenalty = this.maxTotalHeight > 0 ? individual.totalHeightUsed / this.maxTotalHeight : 1;

        // Bonus for placing all rectangles
        const placementBonus = placedCount === totalRectangles ? 500 : 0;

        // CRITICAL: Check for any rectangle clashes and apply severe penalty
        let clashPenalty = 0;
        for (const container of containers) {
            if (this._hasRectangleClashes(container)) {
                clashPenalty += 10000; // Severe penalty for any clash
            }
        }

        // Calculate compactness bonus for tight packing
        let compactnessBonus = 0;
        for (const container of containers) {
            if (container.bottomRectangles.length > 0 && container.topRectangles.length > 0) {
                const minPossible = container.getMinimumHeight(this.rectangles);
                const actualHeight = container.height;
                if (actualHeight > 0) {
                    const compressionRatio = minPossible / actualHeight;
                    compactnessBonus += compressionRatio * 200; // Reward tight packing
                }
            }
        }

        // Combined fitness (higher is better)
        individual.fitness = (
            placementRate * 1000 +          // Prioritize placing all rectangles
            placementBonus +                 // Big bonus for placing everything
            avgUtilization * 300 +          // Good utilization of containers
            compactnessBonus -              // Bonus for tight/compressed packing
            containerPenalty * 50 -         // Fewer containers is better
            heightPenalty * 30 -            // Less total height is better
            clashPenalty                    // SEVERE penalty for clashes
        );
    }

    /**
     * Select an individual from the population using tournament selection.
     *
     * Tournament selection randomly samples a subset of individuals and returns
     * the one with the highest fitness. This provides selection pressure while
     * maintaining diversity.
     *
     * @param {number} tournamentSize - Number of individuals to compete in tournament
     * @returns {Individual} Copy of the winning individual
     */
    tournamentSelection(tournamentSize = 3) {
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            tournament.push(this.population[randomIndex]);
        }
        return tournament.reduce((best, current) => 
            current.fitness > best.fitness ? current : best
        ).copy();
    }

    /**
     * Create two offspring by combining traits from two parent solutions.
     *
     * This crossover operator exchanges:
     * - Number of containers (with probability)
     * - Container height configurations
     * - Rectangle placement order (using order crossover)
     *
     * The resulting children inherit mixed characteristics from both parents,
     * enabling exploration of the solution space.
     *
     * @param {Individual} parent1 - First parent individual
     * @param {Individual} parent2 - Second parent individual
     * @returns {[Individual, Individual]} Tuple of (child1, child2) offspring individuals
     */
    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) {
            return [parent1.copy(), parent2.copy()];
        }

        const child1 = new Individual(this.rectangles, this.containerWidth,
                                   this.maxTotalHeight, this.maxContainers);
        const child2 = new Individual(this.rectangles, this.containerWidth,
                                   this.maxTotalHeight, this.maxContainers);

        // Crossover number of containers
        if (Math.random() < 0.5) {
            child1.numContainers = parent1.numContainers;
            child2.numContainers = parent2.numContainers;
        } else {
            child1.numContainers = parent2.numContainers;
            child2.numContainers = parent1.numContainers;
        }

        // Crossover container heights
        child1.containerHeights = [];
        child2.containerHeights = [];

        const maxContainers = Math.max(child1.numContainers, child2.numContainers);
        for (let i = 0; i < maxContainers; i++) {
            if (Math.random() < 0.5) {
                if (i < parent1.containerHeights.length) {
                    child1.containerHeights.push(parent1.containerHeights[i]);
                }
                if (i < parent2.containerHeights.length) {
                    child2.containerHeights.push(parent2.containerHeights[i]);
                }
            } else {
                if (i < parent2.containerHeights.length) {
                    child1.containerHeights.push(parent2.containerHeights[i]);
                }
                if (i < parent1.containerHeights.length) {
                    child2.containerHeights.push(parent1.containerHeights[i]);
                }
            }
        }

        // Adjust heights to fit num_containers
        child1.containerHeights = child1.containerHeights.slice(0, child1.numContainers);
        child2.containerHeights = child2.containerHeights.slice(0, child2.numContainers);

        // Fill missing heights
        while (child1.containerHeights.length < child1.numContainers) {
            child1.containerHeights.push(this.maxTotalHeight / child1.numContainers);
        }
        while (child2.containerHeights.length < child2.numContainers) {
            child2.containerHeights.push(this.maxTotalHeight / child2.numContainers);
        }

        // Order crossover for rectangle sequence
        const size = parent1.rectangleOrder.length;
        const indices = Array.from({length: size}, (_, i) => i);
        const [start, end] = [indices[Math.floor(Math.random() * size)], 
                             indices[Math.floor(Math.random() * size)]].sort((a, b) => a - b);

        child1.rectangleOrder = new Array(size).fill(-1);
        child1.rectangleOrder.splice(start, end - start, ...parent1.rectangleOrder.slice(start, end));
        let pointer = end;
        const remaining1 = [...parent2.rectangleOrder.slice(end), ...parent2.rectangleOrder.slice(0, end)]
                          .filter(item => !child1.rectangleOrder.includes(item));
        for (const item of remaining1) {
            child1.rectangleOrder[pointer % size] = item;
            pointer++;
        }

        child2.rectangleOrder = new Array(size).fill(-1);
        child2.rectangleOrder.splice(start, end - start, ...parent2.rectangleOrder.slice(start, end));
        pointer = end;
        const remaining2 = [...parent1.rectangleOrder.slice(end), ...parent1.rectangleOrder.slice(0, end)]
                          .filter(item => !child2.rectangleOrder.includes(item));
        for (const item of remaining2) {
            child2.rectangleOrder[pointer % size] = item;
            pointer++;
        }

        return [child1, child2];
    }

    /**
     * Apply random mutations to an individual to introduce variation.
     *
     * Multiple mutation strategies are available:
     * - 'containers': Change the number of containers
     * - 'heights': Randomly adjust container heights
     * - 'order': Swap rectangles in placement order
     * - 'adjust': Redistribute heights more evenly
     * - 'shuffle': Shuffle large portions of rectangle order
     * - 'random_heights': Completely randomize height distribution
     *
     * This variety ensures thorough exploration of the solution space and helps
     * prevent premature convergence to local optima.
     *
     * @param {Individual} individual - The individual to mutate (modified in place)
     */
    mutate(individual) {
        if (Math.random() < this.mutationRate) {
            const mutationTypes = ['containers', 'heights', 'order', 'adjust', 'shuffle', 'random_heights'];
            const mutationType = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];

            if (mutationType === 'containers') {
                // Change number of containers
                individual.numContainers = Math.floor(Math.random() * this.maxContainers) + 1;
                // Adjust heights
                while (individual.containerHeights.length < individual.numContainers) {
                    individual.containerHeights.push(this.maxTotalHeight / individual.numContainers);
                }
                individual.containerHeights = individual.containerHeights.slice(0, individual.numContainers);

            } else if (mutationType === 'heights') {
                // Mutate container heights
                if (individual.containerHeights.length > 0) {
                    const idx = Math.floor(Math.random() * individual.containerHeights.length);
                    // Adjust height randomly
                    const current = individual.containerHeights[idx];
                    const delta = (Math.random() - 0.5) * 0.6 * current;
                    individual.containerHeights[idx] = Math.max(1, current + delta);

                    // Normalize to fit within max_total_height
                    const total = individual.containerHeights.reduce((sum, h) => sum + h, 0);
                    if (total > this.maxTotalHeight) {
                        const factor = this.maxTotalHeight / total;
                        individual.containerHeights = individual.containerHeights.map(h => h * factor);
                    }
                }

            } else if (mutationType === 'order') {
                // Swap two rectangles in order
                if (individual.rectangleOrder.length > 1) {
                    const i = Math.floor(Math.random() * individual.rectangleOrder.length);
                    const j = Math.floor(Math.random() * individual.rectangleOrder.length);
                    [individual.rectangleOrder[i], individual.rectangleOrder[j]] = 
                    [individual.rectangleOrder[j], individual.rectangleOrder[i]];
                }

            } else if (mutationType === 'adjust') {
                // Redistribute heights more evenly
                if (individual.numContainers > 0) {
                    const avgHeight = this.maxTotalHeight / individual.numContainers;
                    individual.containerHeights = [];
                    let remaining = this.maxTotalHeight;
                    for (let i = 0; i < individual.numContainers; i++) {
                        if (i === individual.numContainers - 1) {
                            individual.containerHeights.push(remaining);
                        } else {
                            const height = avgHeight * (0.8 + Math.random() * 0.4);
                            const clampedHeight = Math.min(height, remaining);
                            individual.containerHeights.push(clampedHeight);
                            remaining -= clampedHeight;
                        }
                    }
                }

            } else if (mutationType === 'shuffle') {
                // Shuffle large portion of rectangle order
                if (individual.rectangleOrder.length > 2) {
                    // Shuffle 30-70% of the sequence
                    const shuffleSize = Math.floor(individual.rectangleOrder.length / 3) + 
                                       Math.floor(Math.random() * (individual.rectangleOrder.length / 3));
                    const startIdx = Math.floor(Math.random() * (individual.rectangleOrder.length - shuffleSize));
                    const subsequence = individual.rectangleOrder.slice(startIdx, startIdx + shuffleSize);
                    
                    // Fisher-Yates shuffle
                    for (let i = subsequence.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [subsequence[i], subsequence[j]] = [subsequence[j], subsequence[i]];
                    }
                    
                    individual.rectangleOrder.splice(startIdx, shuffleSize, ...subsequence);
                }

            } else if (mutationType === 'random_heights') {
                // Completely randomize container heights
                if (individual.numContainers > 0) {
                    individual.containerHeights = [];
                    let remaining = this.maxTotalHeight;
                    for (let i = 0; i < individual.numContainers; i++) {
                        if (i === individual.numContainers - 1) {
                            individual.containerHeights.push(remaining);
                        } else {
                            // More random height distribution
                            const height = 0.5 + Math.random() * (remaining * 0.8 - 0.5);
                            const clampedHeight = Math.min(height, remaining);
                            individual.containerHeights.push(clampedHeight);
                            remaining -= clampedHeight;
                        }
                    }
                }
            }
        }
    }

    /**
     * Execute the complete genetic algorithm evolution process.
     *
     * The algorithm follows these steps each generation:
     * 1. Evaluate fitness of all individuals
     * 2. Track best solution and monitor stagnation
     * 3. Apply adaptive mutation rates based on progress
     * 4. Create new population via selection, crossover, and mutation
     * 5. Inject random individuals for diversity when needed
     *
     * The process continues for the specified number of generations,
     * with adaptive mechanisms to escape local optima and maintain
     * genetic diversity.
     *
     * @returns {[Individual, Array<number>]} Tuple of (best_individual_found, fitness_history_per_generation)
     */
    evolve() {
        this.initializePopulation();

        // Evaluate initial population
        for (const individual of this.population) {
            this.evaluateFitness(individual);
        }

        const bestFitnessHistory = [];
        let stagnationCounter = 0;
        let lastBestFitness = -Infinity;

        for (let generation = 0; generation < this.generations; generation++) {
            // Sort population by fitness
            this.population.sort((a, b) => b.fitness - a.fitness);

            // Track best individual
            if (!this.bestIndividual || this.population[0].fitness > this.bestIndividual.fitness) {
                this.bestIndividual = this.population[0].copy();
                stagnationCounter = 0;
            } else {
                stagnationCounter++;
            }

            if (this.bestIndividual.fitness > lastBestFitness) {
                lastBestFitness = this.bestIndividual.fitness;
            }

            bestFitnessHistory.push(this.bestIndividual.fitness);

            // Print progress
            if (generation % 50 === 0) {
                const avgFitness = this.population.reduce((sum, ind) => sum + ind.fitness, 0) / this.population.length;
                console.log(`Generation ${generation}: Best fitness = ${this.bestIndividual.fitness.toFixed(2)}, ` +
                          `Avg = ${avgFitness.toFixed(2)}, ` +
                          `Containers = ${this.bestIndividual.numContainers}, ` +
                          `Placed = ${this.bestIndividual.rectanglesPlaced}/${this.rectangles.length}`);
            }

            // Adaptive mutation with more aggressive scaling
            const currentMutation = stagnationCounter > 15 
                                  ? Math.min(0.8, this.mutationRate * (1 + stagnationCounter / 20))
                                  : this.mutationRate;

            // Create new population
            const newPopulation = [];

            // Elitism
            for (let i = 0; i < this.elitismCount; i++) {
                newPopulation.push(this.population[i].copy());
            }

            // Add random individuals for diversity (10% of population)
            const randomCount = Math.max(1, Math.floor(this.populationSize / 10));
            for (let i = 0; i < randomCount; i++) {
                if (newPopulation.length < this.populationSize) {
                    const individual = new Individual(this.rectangles, this.containerWidth,
                                                   this.maxTotalHeight, this.maxContainers);
                    individual.initializeRandom();
                    this.evaluateFitness(individual);
                    newPopulation.push(individual);
                }
            }

            // Generate rest of population
            while (newPopulation.length < this.populationSize) {
                let parent1, parent2;
                
                // Increase random selection probability
                if (Math.random() < 0.25) { // 25% random selection
                    parent1 = this.population[Math.floor(Math.random() * this.population.length)].copy();
                    parent2 = this.population[Math.floor(Math.random() * this.population.length)].copy();
                } else {
                    // Variable tournament size for more diversity
                    const tournamentSize = 2 + Math.floor(Math.random() * 4);
                    parent1 = this.tournamentSelection(tournamentSize);
                    parent2 = this.tournamentSelection(tournamentSize);
                }

                const [child1, child2] = this.crossover(parent1, parent2);

                // Apply mutation with adaptive rate (higher chance)
                if (Math.random() < currentMutation) {
                    this.mutate(child1);
                }
                if (Math.random() < currentMutation) {
                    this.mutate(child2);
                }

                // Sometimes apply multiple mutations for more exploration
                if (stagnationCounter > 25 && Math.random() < 0.3) {
                    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                        this.mutate(child1);
                        this.mutate(child2);
                    }
                }

                this.evaluateFitness(child1);
                this.evaluateFitness(child2);

                newPopulation.push(child1);
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(child2);
                }
            }

            this.population = newPopulation;
        }

        return [this.bestIndividual, bestFitnessHistory];
    }

    /**
     * Create a detailed visualization of the stacked container packing solution.
     * Note: This is a placeholder for visualization - would need a plotting library like Chart.js or D3.js in browser
     *
     * @param {Individual} individual - The solution individual to visualize
     */
    visualizeSolution(individual) {
        console.log('='.repeat(60));
        console.log('STACKED CONTAINER SOLUTION VISUALIZATION');
        console.log('='.repeat(60));
        
        let currentY = 0;
        for (let i = 0; i < individual.numContainers; i++) {
            const container = individual.containers[i];
            console.log(`\nContainer ${i + 1} (Y: ${currentY.toFixed(2)} - ${(currentY + container.height).toFixed(2)}):`);
            console.log(`  Dimensions: ${container.width} x ${container.height.toFixed(2)}`);
            console.log(`  Utilization: ${(container.utilization(this.rectangles) * 100).toFixed(1)}%`);
            
            // Bottom rectangles
            if (container.bottomRectangles.length > 0) {
                console.log('  Bottom rectangles:');
                for (const [rectId, xPos] of container.bottomRectangles) {
                    const rect = this.rectangles[rectId];
                    console.log(`    Rect ${rectId}: (${xPos.toFixed(1)}, ${currentY.toFixed(1)}) ${rect.width}x${rect.height}`);
                }
            }
            
            // Top rectangles
            if (container.topRectangles.length > 0) {
                console.log('  Top rectangles:');
                for (const [rectId, xPos] of container.topRectangles) {
                    const rect = this.rectangles[rectId];
                    const yPos = currentY + container.height - rect.height;
                    console.log(`    Rect ${rectId}: (${xPos.toFixed(1)}, ${yPos.toFixed(1)}) ${rect.width}x${rect.height}`);
                }
            }
            
            // Check for clashes
            if (this._hasRectangleClashes(container)) {
                console.log('  ⚠️  WARNING: Rectangle clashes detected!');
            }
            
            const minHeight = container.getMinimumHeight(this.rectangles);
            const compression = ((minHeight - container.height) / minHeight * 100).toFixed(1);
            console.log(`  Min height: ${minHeight.toFixed(2)}, Compression: ${compression}%`);
            
            currentY += container.height;
        }
        
        console.log(`\nSolution Summary:`);
        console.log(`  Total height used: ${individual.totalHeightUsed.toFixed(2)}/${this.maxTotalHeight}`);
        console.log(`  Rectangles placed: ${individual.rectanglesPlaced}/${this.rectangles.length}`);
        console.log(`  Fitness score: ${individual.fitness.toFixed(2)}`);
        console.log('='.repeat(60));
    }
}

// Example usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StackedContainerOptimizer, Rectangle, Container, Individual };
}

// Example usage for browser or Node.js
function runExample() {
    // Define rectangles to pack (width, height)
    const rectangles = [
        [4, 3],
        [3, 2],
        [2, 5],
        [3, 3],
        [4, 2],
        [2, 2],
        [3, 4],
        [5, 1],
        [2, 1],
        [2, 3]
    ];

    // Container constraints
    const containerWidth = 7;  // Fixed width for all containers
    const maxTotalHeight = 20; // Maximum total height when stacked
    const maxContainers = 5;   // Maximum number of containers

    // Create and run optimizer
    const optimizer = new StackedContainerOptimizer(
        rectangles,
        containerWidth,
        maxTotalHeight,
        maxContainers,
        200,  // population_size
        500,  // generations
        0.4,  // mutation_rate
        0.75, // crossover_rate
        0.05  // elitism_rate
    );

    console.log("Running stacked container optimization...");
    console.log(`Container width: ${containerWidth} (fixed)`);
    console.log(`Max total height: ${maxTotalHeight}`);
    console.log(`Max containers: ${maxContainers}`);
    console.log(`Rectangles to pack: ${rectangles.length}`);
    console.log("-".repeat(50));

    const [bestSolution, fitnessHistory] = optimizer.evolve();

    console.log("-".repeat(50));
    console.log(`\nBest solution found:`);
    console.log(`Number of containers: ${bestSolution.numContainers}`);
    console.log(`Container heights: [${bestSolution.containerHeights.slice(0, bestSolution.numContainers).map(h => h.toFixed(2)).join(', ')}]`);
    console.log(`Total height used: ${bestSolution.totalHeightUsed.toFixed(2)}`);
    console.log(`Rectangles placed: ${bestSolution.rectanglesPlaced}/${rectangles.length}`);
    console.log(`Fitness: ${bestSolution.fitness.toFixed(2)}`);

    // Show detailed container analysis
    console.log(`\nContainer Analysis:`);
    for (let i = 0; i < bestSolution.numContainers; i++) {
        const container = bestSolution.containers[i];
        const util = container.utilization(optimizer.rectangles);
        const totalItems = container.bottomRectangles.length + container.topRectangles.length;
        const minHeight = container.getMinimumHeight(optimizer.rectangles);
        const compression = minHeight > 0 ? (minHeight - container.height) / minHeight * 100 : 0;
        const hasClashes = optimizer._hasRectangleClashes(container);

        console.log(`  Container ${i + 1}: ${(util * 100).toFixed(1)}% utilization (${totalItems} items: ${container.bottomRectangles.length}B, ${container.topRectangles.length}T)`);
        console.log(`    Height: ${container.height.toFixed(2)} (min: ${minHeight.toFixed(2)}, compression: ${compression.toFixed(1)}%)`);
        if (hasClashes) {
            console.log(`    ⚠️  WARNING: Rectangle clashes detected!`);
        }
        console.log();
    }

    // Visualize the solution
    optimizer.visualizeSolution(bestSolution);

    return [bestSolution, fitnessHistory];
}

// Uncomment to run example
// runExample();