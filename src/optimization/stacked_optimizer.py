"""
Stacked Container Optimizer with Top/Bottom Placement Constraint

This module implements a genetic algorithm for optimizing the placement of rectangles
in stacked containers where rectangles can only be placed at the top or bottom edges
of containers. The algorithm supports X-axis overlapping and Y-axis compression
while preventing any physical rectangle clashes.

Author: Abhishek Palit
Version: 1.0
"""

import random
import numpy as np
from typing import List, Tuple, Optional
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from dataclasses import dataclass

@dataclass
class Rectangle:
    """
    Represents a rectangle to be packed.
    
    Attributes:
        width (float): Rectangle width
        height (float): Rectangle height  
        id (int): Unique identifier for the rectangle
    """
    width: float
    height: float
    id: int
    
    def area(self) -> float:
        """Calculate the area of the rectangle."""
        return self.width * self.height

@dataclass
class Container:
    """
    Represents a container with fixed width and optimizable height.
    
    Rectangles can only be placed at the top or bottom edges of the container.
    The container height is optimized to minimize empty space while preventing
    rectangle clashes.
    
    Attributes:
        width (float): Fixed container width
        height (float): Variable container height (optimized by algorithm)
        id (int): Unique container identifier
        bottom_rectangles (List[Tuple[int, float]]): Rectangles at bottom (rect_id, x_position)
        top_rectangles (List[Tuple[int, float]]): Rectangles at top (rect_id, x_position)
    """
    width: float
    height: float
    id: int
    bottom_rectangles: List[Tuple[int, float]] = None
    top_rectangles: List[Tuple[int, float]] = None
    
    def __post_init__(self):
        """Initialize empty rectangle lists if not provided."""
        if self.bottom_rectangles is None:
            self.bottom_rectangles = []
        if self.top_rectangles is None:
            self.top_rectangles = []
    
    def used_area(self, all_rectangles: List[Rectangle]) -> float:
        """Calculate total area of rectangles placed in this container."""
        total = 0
        for rect_id, _ in self.bottom_rectangles:
            total += all_rectangles[rect_id].area()
        for rect_id, _ in self.top_rectangles:
            total += all_rectangles[rect_id].area()
        return total
    
    def utilization(self, all_rectangles: List[Rectangle]) -> float:
        """Calculate container space utilization as a percentage (0.0 to 1.0+)."""
        total_area = self.width * self.height
        if total_area == 0:
            return 0
        return self.used_area(all_rectangles) / total_area
    
    def get_bottom_height(self, all_rectangles: List[Rectangle]) -> float:
        """Get the height of the tallest bottom rectangle."""
        if not self.bottom_rectangles:
            return 0
        return max(all_rectangles[rect_id].height for rect_id, _ in self.bottom_rectangles)
    
    def get_top_height(self, all_rectangles: List[Rectangle]) -> float:
        """Get the height of the tallest top rectangle."""
        if not self.top_rectangles:
            return 0
        return max(all_rectangles[rect_id].height for rect_id, _ in self.top_rectangles)
    
    def get_minimum_height(self, all_rectangles: List[Rectangle]) -> float:
        """
        Calculate minimum container height to prevent rectangle clashes.
        
        The algorithm ensures:
        1. Rectangles overlapping in X-direction don't clash (sum of heights)
        2. Non-overlapping rectangles can compress via Y-overlap (max of heights)
        3. Container is always tall enough for the largest individual rectangle
        
        Args:
            all_rectangles: List of all rectangles in the problem
            
        Returns:
            Minimum height needed for this container
        """
        if not self.bottom_rectangles or not self.top_rectangles:
            # Single-side placement: use standard sum approach
            return self.get_bottom_height(all_rectangles) + self.get_top_height(all_rectangles)
        
        min_height_needed = 0
        
        # Check for X-direction overlaps between bottom and top rectangles
        for bottom_rect_id, bottom_x in self.bottom_rectangles:
            bottom_rect = all_rectangles[bottom_rect_id]
            
            for top_rect_id, top_x in self.top_rectangles:
                top_rect = all_rectangles[top_rect_id]
                
                # Check X-axis overlap
                x_overlap = not (bottom_x + bottom_rect.width <= top_x or 
                               bottom_x >= top_x + top_rect.width)
                
                if x_overlap:
                    # Prevent clash: need sum of overlapping rectangle heights
                    required_height = bottom_rect.height + top_rect.height
                    min_height_needed = max(min_height_needed, required_height)
        
        # If no X-overlaps exist, allow aggressive Y-compression
        if min_height_needed == 0:
            bottom_height = self.get_bottom_height(all_rectangles)
            top_height = self.get_top_height(all_rectangles)
            min_height_needed = max(bottom_height, top_height)
        
        # Safety constraint: container must fit the tallest individual rectangle
        tallest_rect = max(all_rectangles[rect_id].height 
                          for rect_id, _ in self.bottom_rectangles + self.top_rectangles)
        
        return max(min_height_needed, tallest_rect)

class Individual:
    """
    Represents a solution (chromosome) in the genetic algorithm.
    
    Each individual encodes:
    - Number of containers to use
    - Height of each container  
    - Order in which rectangles are placed
    
    Attributes:
        rectangles: List of rectangles to pack
        container_width: Fixed width for all containers
        max_total_height: Maximum allowed total height when stacked
        max_containers: Maximum number of containers allowed
        num_containers: Number of containers in this solution
        rectangle_order: Order for attempting rectangle placement
        fitness: Fitness score of this solution
        containers: List of container objects after evaluation
        total_height_used: Sum of all container heights
        rectangles_placed: Number of successfully placed rectangles
    """
    def __init__(self, rectangles: List[Rectangle], container_width: float, 
                 max_total_height: float, max_containers: int):
        self.rectangles = rectangles
        self.container_width = container_width
        self.max_total_height = max_total_height
        self.max_containers = max_containers
        
        # Solution encoding
        self.num_containers = random.randint(1, max_containers)
        self.rectangle_order = list(range(len(rectangles)))
        self.container_heights = [max_total_height / self.num_containers] * self.num_containers
        
        # Solution evaluation results
        self.fitness = 0
        self.containers = []
        self.total_height_used = 0
        self.rectangles_placed = 0
    
    def initialize_random(self):
        """Initialize solution with random rectangle order."""
        random.shuffle(self.rectangle_order)
    
    def copy(self):
        """Create a deep copy of this individual."""
        new_ind = Individual(self.rectangles, self.container_width, 
                            self.max_total_height, self.max_containers)
        new_ind.num_containers = self.num_containers
        new_ind.rectangle_order = self.rectangle_order.copy()
        new_ind.fitness = self.fitness
        new_ind.containers = []
        
        # Deep copy containers
        for c in self.containers:
            new_container = Container(c.width, c.height, c.id)
            new_container.bottom_rectangles = c.bottom_rectangles.copy()
            new_container.top_rectangles = c.top_rectangles.copy()
            new_ind.containers.append(new_container)
        
        new_ind.total_height_used = self.total_height_used
        new_ind.rectangles_placed = self.rectangles_placed
        return new_ind

class StackedContainerOptimizer:
    """
    Genetic Algorithm optimizer for stacked container packing with top/bottom constraints.
    
    This optimizer solves the problem of packing rectangles into stacked containers where:
    - Rectangles can only be placed at top or bottom edges of containers
    - Container widths are fixed, heights are optimized
    - Rectangles can overlap in X-direction (same location)
    - Y-axis compression is allowed when rectangles don't clash
    - No rectangle rotations are performed
    
    Example:
        rectangles = [(4, 3), (3, 2), (2, 5)]  # (width, height) tuples
        optimizer = StackedContainerOptimizer(
            rectangles=rectangles,
            container_width=10,
            max_total_height=15,
            max_containers=3
        )
        best_solution, fitness_history = optimizer.evolve()
    """
    
    def __init__(self, rectangles: List[Tuple[float, float]], 
                 container_width: float,
                 max_total_height: float,
                 max_containers: int = 10,
                 population_size: int = 100,
                 generations: int = 500,
                 mutation_rate: float = 0.2,
                 crossover_rate: float = 0.8,
                 elitism_rate: float = 0.1):
        """
        Initialize the optimizer with problem parameters and GA settings.
        
        Args:
            rectangles: List of (width, height) tuples for rectangles to pack
            container_width: Fixed width for all containers  
            max_total_height: Maximum total height when containers are stacked
            max_containers: Maximum number of containers allowed
            population_size: Number of individuals in GA population
            generations: Number of generations to evolve
            mutation_rate: Probability of mutation (0.0 to 1.0)
            crossover_rate: Probability of crossover (0.0 to 1.0)
            elitism_rate: Fraction of best individuals to preserve (0.0 to 1.0)
        """
        self.rectangles = [Rectangle(w, h, i) for i, (w, h) in enumerate(rectangles)]
        self.container_width = container_width
        self.max_total_height = max_total_height
        self.max_containers = max_containers
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elitism_count = int(population_size * elitism_rate)
        self.population = []
        self.best_individual = None
    
    def initialize_population(self):
        """Create initial random population"""
        self.population = []
        for _ in range(self.population_size):
            individual = Individual(self.rectangles, self.container_width,
                                   self.max_total_height, self.max_containers)
            individual.initialize_random()
            self.population.append(individual)
    
    def pack_rectangles(self, individual: Individual) -> Tuple[List[Container], int]:
        """
        Pack rectangles into containers with top/bottom placement constraint.
        
        This method implements the core packing algorithm that:
        1. Creates containers based on the individual's container configuration
        2. Attempts to place each rectangle in order at either top or bottom of containers
        3. Uses X-axis alignment strategies to favor overlapping placements
        4. Optimizes container heights after placement to minimize empty space
        
        Args:
            individual: The solution individual containing container and rectangle configuration
            
        Returns:
            Tuple of (containers_list, number_of_rectangles_successfully_placed)
        """
        # Create containers based on individual's heights
        containers = []
        for i in range(individual.num_containers):
            if i < len(individual.container_heights):
                height = individual.container_heights[i]
            else:
                height = self.max_total_height / individual.num_containers
            containers.append(Container(self.container_width, height, i))
        
        placed_count = 0
        individual.rectangle_assignments = [-1] * len(self.rectangles)
        
        # Try to place rectangles in order
        for rect_idx in individual.rectangle_order:
            rect = self.rectangles[rect_idx]
            placed = False
            
            # Try each container
            for container_idx, container in enumerate(containers):
                # Check if rectangle fits in container width
                if rect.width > container.width:
                    continue
                
                # Try placing at bottom first, then top
                if self.can_place_at_bottom(container, rect) and not placed:
                    x_pos = self.find_bottom_position(container, rect)
                    if x_pos is not None:
                        container.bottom_rectangles.append((rect_idx, x_pos))
                        individual.rectangle_assignments[rect_idx] = container_idx
                        placed = True
                        placed_count += 1
                
                if self.can_place_at_top(container, rect) and not placed:
                    x_pos = self.find_top_position(container, rect)
                    if x_pos is not None:
                        container.top_rectangles.append((rect_idx, x_pos))
                        individual.rectangle_assignments[rect_idx] = container_idx
                        placed = True
                        placed_count += 1
                
                if placed:
                    break
            
            if not placed:
                individual.rectangle_assignments[rect_idx] = -1
        
        # Optimize container heights after placement
        for container in containers:
            if container.bottom_rectangles or container.top_rectangles:
                min_height = container.get_minimum_height(self.rectangles)
                
                # Check for X-axis alignment between top and bottom rectangles
                alignment_bonus = self._calculate_alignment_bonus(container)
                
                # Use minimum height with minimal variation for GA exploration
                # Add tiny random variation (0-2%) only for exploration
                tiny_variation = random.uniform(0.0, 0.02) * min_height
                container.height = min_height + tiny_variation
        
        return containers, placed_count
    
    def can_place_at_bottom(self, container: Container, rect: Rectangle) -> bool:
        """Check if rectangle can be placed at bottom of container"""
        if rect.height > container.height:
            return False
        
        # Check if adding this rectangle would exceed container height
        current_bottom_height = container.get_bottom_height(self.rectangles)
        top_height = container.get_top_height(self.rectangles)
        
        # Rectangle height should not exceed available space considering top rectangles
        available_space = container.height - top_height
        new_bottom_height = max(current_bottom_height, rect.height)
        
        return new_bottom_height <= available_space
    
    def can_place_at_top(self, container: Container, rect: Rectangle) -> bool:
        """Check if rectangle can be placed at top of container"""
        if rect.height > container.height:
            return False
        
        # Check if adding this rectangle would exceed container height
        current_top_height = container.get_top_height(self.rectangles)
        bottom_height = container.get_bottom_height(self.rectangles)
        
        # Rectangle height should not exceed available space considering bottom rectangles
        available_space = container.height - bottom_height
        new_top_height = max(current_top_height, rect.height)
        
        return new_top_height <= available_space
    
    def find_bottom_position(self, container: Container, rect: Rectangle) -> Optional[float]:
        """Find x position for rectangle at bottom of container"""
        if not self.can_place_at_bottom(container, rect):
            return None
        
        # Strategy 1: Try to align with existing top rectangles (for potential overlap)
        for top_rect_id, top_x_pos in container.top_rectangles:
            top_rect = self.rectangles[top_rect_id]
            # Try to place at same x-coordinate as top rectangle
            if (top_x_pos + rect.width <= container.width and 
                not self._overlaps_with_bottom_rectangles(container, rect, top_x_pos)):
                return top_x_pos
            
            # Try to place aligned to top rectangle's end
            aligned_x = top_x_pos + top_rect.width - rect.width
            if (aligned_x >= 0 and aligned_x + rect.width <= container.width and
                not self._overlaps_with_bottom_rectangles(container, rect, aligned_x)):
                return aligned_x
        
        # Strategy 2: Standard bottom-left placement
        occupied_ranges = []
        for rect_id, x_pos in container.bottom_rectangles:
            r = self.rectangles[rect_id]
            occupied_ranges.append((x_pos, x_pos + r.width))
        
        occupied_ranges.sort()
        
        current_x = 0
        for start_x, end_x in occupied_ranges:
            if current_x + rect.width <= start_x:
                return current_x
            current_x = max(current_x, end_x)
        
        if current_x + rect.width <= container.width:
            return current_x
        
        return None
    
    def find_top_position(self, container: Container, rect: Rectangle) -> Optional[float]:
        """Find x position for rectangle at top of container"""
        if not self.can_place_at_top(container, rect):
            return None
        
        # Strategy 1: Try to align with existing bottom rectangles (for potential overlap)
        for bottom_rect_id, bottom_x_pos in container.bottom_rectangles:
            bottom_rect = self.rectangles[bottom_rect_id]
            # Try to place at same x-coordinate as bottom rectangle
            if (bottom_x_pos + rect.width <= container.width and 
                not self._overlaps_with_top_rectangles(container, rect, bottom_x_pos)):
                return bottom_x_pos
            
            # Try to place aligned to bottom rectangle's end
            aligned_x = bottom_x_pos + bottom_rect.width - rect.width
            if (aligned_x >= 0 and aligned_x + rect.width <= container.width and
                not self._overlaps_with_top_rectangles(container, rect, aligned_x)):
                return aligned_x
        
        # Strategy 2: Standard top-left placement
        occupied_ranges = []
        for rect_id, x_pos in container.top_rectangles:
            r = self.rectangles[rect_id]
            occupied_ranges.append((x_pos, x_pos + r.width))
        
        occupied_ranges.sort()
        
        current_x = 0
        for start_x, end_x in occupied_ranges:
            if current_x + rect.width <= start_x:
                return current_x
            current_x = max(current_x, end_x)
        
        if current_x + rect.width <= container.width:
            return current_x
        
        return None
    
    def _overlaps_with_bottom_rectangles(self, container: Container, rect: Rectangle, x_pos: float) -> bool:
        """Check if rectangle at x_pos would overlap with existing bottom rectangles"""
        for rect_id, existing_x in container.bottom_rectangles:
            existing_rect = self.rectangles[rect_id]
            # Check X overlap
            if not (x_pos + rect.width <= existing_x or x_pos >= existing_x + existing_rect.width):
                return True
        return False
    
    def _overlaps_with_top_rectangles(self, container: Container, rect: Rectangle, x_pos: float) -> bool:
        """Check if rectangle at x_pos would overlap with existing top rectangles"""
        for rect_id, existing_x in container.top_rectangles:
            existing_rect = self.rectangles[rect_id]
            # Check X overlap
            if not (x_pos + rect.width <= existing_x or x_pos >= existing_x + existing_rect.width):
                return True
        return False
    
    def _calculate_alignment_bonus(self, container: Container) -> float:
        """Calculate bonus for X-axis alignment between top and bottom rectangles"""
        if not container.bottom_rectangles or not container.top_rectangles:
            return 0
        
        alignment_score = 0
        total_comparisons = 0
        
        for bottom_rect_id, bottom_x in container.bottom_rectangles:
            bottom_rect = self.rectangles[bottom_rect_id]
            bottom_range = (bottom_x, bottom_x + bottom_rect.width)
            
            for top_rect_id, top_x in container.top_rectangles:
                top_rect = self.rectangles[top_rect_id]
                top_range = (top_x, top_x + top_rect.width)
                
                # Calculate overlap in X direction
                overlap_start = max(bottom_range[0], top_range[0])
                overlap_end = min(bottom_range[1], top_range[1])
                overlap = max(0, overlap_end - overlap_start)
                
                # Calculate alignment score based on overlap
                min_width = min(bottom_rect.width, top_rect.width)
                if min_width > 0:
                    alignment_score += overlap / min_width
                
                total_comparisons += 1
        
        return alignment_score / total_comparisons if total_comparisons > 0 else 0
    
    def _has_rectangle_clashes(self, container: Container) -> bool:
        """Check if any rectangles in the container actually clash (physically overlap)"""
        if not container.bottom_rectangles or not container.top_rectangles:
            return False
        
        bottom_height = container.get_bottom_height(self.rectangles)
        top_height = container.get_top_height(self.rectangles)
        
        # Check if rectangles would physically overlap
        for bottom_rect_id, bottom_x in container.bottom_rectangles:
            bottom_rect = self.rectangles[bottom_rect_id]
            # Bottom rectangle occupies Y from 0 to bottom_rect.height
            bottom_y_range = (0, bottom_rect.height)
            
            for top_rect_id, top_x in container.top_rectangles:
                top_rect = self.rectangles[top_rect_id]
                # Top rectangle occupies Y from (container.height - top_rect.height) to container.height
                top_y_start = container.height - top_rect.height
                top_y_range = (top_y_start, container.height)
                
                # Check X overlap
                x_overlap = not (bottom_x + bottom_rect.width <= top_x or bottom_x >= top_x + top_rect.width)
                
                # Check Y overlap
                y_overlap = not (bottom_y_range[1] <= top_y_range[0] or bottom_y_range[0] >= top_y_range[1])
                
                if x_overlap and y_overlap:
                    return True  # Found a clash!
        
        return False
    
    def evaluate_fitness(self, individual: Individual):
        """
        Calculate comprehensive fitness score for a solution individual.
        
        The fitness function balances multiple objectives:
        - Maximizing rectangle placement rate (primary goal)
        - Maximizing container space utilization
        - Minimizing number of containers used
        - Minimizing total height consumption
        - Rewarding compact/compressed packing
        - Severely penalizing any rectangle clashes
        
        Higher fitness scores indicate better solutions.
        
        Args:
            individual: The solution to evaluate
        """
        containers, placed_count = self.pack_rectangles(individual)
        individual.containers = containers
        individual.rectangles_placed = placed_count
        
        # Calculate total height used
        individual.total_height_used = sum(c.height for c in containers[:individual.num_containers])
        
        # Calculate fitness components
        total_rectangles = len(self.rectangles)
        placement_rate = placed_count / total_rectangles if total_rectangles > 0 else 0
        
        if placed_count == 0:
            individual.fitness = -1000
            return
        
        # Calculate average utilization of used containers
        total_utilization = 0
        containers_with_items = 0
        for container in containers:
            if container.bottom_rectangles or container.top_rectangles:
                containers_with_items += 1
                total_utilization += container.utilization(self.rectangles)
        
        avg_utilization = total_utilization / containers_with_items if containers_with_items > 0 else 0
        
        # Penalty for using too many containers
        container_penalty = individual.num_containers / self.max_containers
        
        # Penalty for total height
        height_penalty = individual.total_height_used / self.max_total_height if self.max_total_height > 0 else 1
        
        # Bonus for placing all rectangles
        if placed_count == total_rectangles:
            placement_bonus = 500
        else:
            placement_bonus = 0
        
        # CRITICAL: Check for any rectangle clashes and apply severe penalty
        clash_penalty = 0
        for container in containers:
            if self._has_rectangle_clashes(container):
                clash_penalty += 10000  # Severe penalty for any clash
        
        # Calculate compactness bonus for tight packing
        compactness_bonus = 0
        for container in containers:
            if container.bottom_rectangles and container.top_rectangles:
                min_possible = container.get_minimum_height(self.rectangles)
                actual_height = container.height
                if actual_height > 0:
                    compression_ratio = min_possible / actual_height
                    compactness_bonus += compression_ratio * 200  # Reward tight packing
        
        # Combined fitness (higher is better)
        individual.fitness = (
            placement_rate * 1000 +          # Prioritize placing all rectangles
            placement_bonus +                 # Big bonus for placing everything
            avg_utilization * 300 +          # Good utilization of containers
            compactness_bonus -              # Bonus for tight/compressed packing
            container_penalty * 50 -         # Fewer containers is better
            height_penalty * 30 -            # Less total height is better
            clash_penalty                    # SEVERE penalty for clashes
        )
    
    def tournament_selection(self, tournament_size: int = 3) -> Individual:
        """
        Select an individual from the population using tournament selection.
        
        Tournament selection randomly samples a subset of individuals and returns
        the one with the highest fitness. This provides selection pressure while
        maintaining diversity.
        
        Args:
            tournament_size: Number of individuals to compete in tournament
            
        Returns:
            Copy of the winning individual
        """
        tournament = random.sample(self.population, tournament_size)
        return max(tournament, key=lambda ind: ind.fitness).copy()
    
    def crossover(self, parent1: Individual, parent2: Individual) -> Tuple[Individual, Individual]:
        """
        Create two offspring by combining traits from two parent solutions.
        
        This crossover operator exchanges:
        - Number of containers (with probability)
        - Container height configurations
        - Rectangle placement order (using order crossover)
        
        The resulting children inherit mixed characteristics from both parents,
        enabling exploration of the solution space.
        
        Args:
            parent1: First parent individual
            parent2: Second parent individual
            
        Returns:
            Tuple of (child1, child2) offspring individuals
        """
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        child1 = Individual(self.rectangles, self.container_width,
                           self.max_total_height, self.max_containers)
        child2 = Individual(self.rectangles, self.container_width,
                           self.max_total_height, self.max_containers)
        
        # Crossover number of containers
        if random.random() < 0.5:
            child1.num_containers = parent1.num_containers
            child2.num_containers = parent2.num_containers
        else:
            child1.num_containers = parent2.num_containers
            child2.num_containers = parent1.num_containers
        
        # Crossover container heights
        child1.container_heights = []
        child2.container_heights = []
        
        for i in range(max(child1.num_containers, child2.num_containers)):
            if random.random() < 0.5:
                if i < len(parent1.container_heights):
                    child1.container_heights.append(parent1.container_heights[i])
                if i < len(parent2.container_heights):
                    child2.container_heights.append(parent2.container_heights[i])
            else:
                if i < len(parent2.container_heights):
                    child1.container_heights.append(parent2.container_heights[i])
                if i < len(parent1.container_heights):
                    child2.container_heights.append(parent1.container_heights[i])
        
        # Adjust heights to fit num_containers
        child1.container_heights = child1.container_heights[:child1.num_containers]
        child2.container_heights = child2.container_heights[:child2.num_containers]
        
        # Fill missing heights
        while len(child1.container_heights) < child1.num_containers:
            child1.container_heights.append(self.max_total_height / child1.num_containers)
        while len(child2.container_heights) < child2.num_containers:
            child2.container_heights.append(self.max_total_height / child2.num_containers)
        
        # Order crossover for rectangle sequence
        size = len(parent1.rectangle_order)
        start, end = sorted(random.sample(range(size), 2))
        
        child1.rectangle_order = [-1] * size
        child1.rectangle_order[start:end] = parent1.rectangle_order[start:end]
        pointer = end
        for item in parent2.rectangle_order[end:] + parent2.rectangle_order[:end]:
            if item not in child1.rectangle_order:
                child1.rectangle_order[pointer % size] = item
                pointer += 1
        
        child2.rectangle_order = [-1] * size
        child2.rectangle_order[start:end] = parent2.rectangle_order[start:end]
        pointer = end
        for item in parent1.rectangle_order[end:] + parent1.rectangle_order[:end]:
            if item not in child2.rectangle_order:
                child2.rectangle_order[pointer % size] = item
                pointer += 1
        
        return child1, child2
    
    def mutate(self, individual: Individual):
        """
        Apply random mutations to an individual to introduce variation.
        
        Multiple mutation strategies are available:
        - 'containers': Change the number of containers
        - 'heights': Randomly adjust container heights
        - 'order': Swap rectangles in placement order
        - 'adjust': Redistribute heights more evenly
        - 'shuffle': Shuffle large portions of rectangle order
        - 'random_heights': Completely randomize height distribution
        
        This variety ensures thorough exploration of the solution space and helps
        prevent premature convergence to local optima.
        
        Args:
            individual: The individual to mutate (modified in place)
        """
        if random.random() < self.mutation_rate:
            mutation_type = random.choice(['containers', 'heights', 'order', 'adjust', 'shuffle', 'random_heights'])
            
            if mutation_type == 'containers':
                # Change number of containers
                individual.num_containers = random.randint(1, self.max_containers)
                # Adjust heights
                while len(individual.container_heights) < individual.num_containers:
                    individual.container_heights.append(self.max_total_height / individual.num_containers)
                individual.container_heights = individual.container_heights[:individual.num_containers]
            
            elif mutation_type == 'heights':
                # Mutate container heights
                if individual.container_heights:
                    idx = random.randint(0, len(individual.container_heights) - 1)
                    # Adjust height randomly
                    current = individual.container_heights[idx]
                    delta = random.uniform(-current * 0.3, current * 0.3)
                    individual.container_heights[idx] = max(1, current + delta)
                    
                    # Normalize to fit within max_total_height
                    total = sum(individual.container_heights)
                    if total > self.max_total_height:
                        factor = self.max_total_height / total
                        individual.container_heights = [h * factor for h in individual.container_heights]
            
            elif mutation_type == 'order':
                # Swap two rectangles in order
                if len(individual.rectangle_order) > 1:
                    i, j = random.sample(range(len(individual.rectangle_order)), 2)
                    individual.rectangle_order[i], individual.rectangle_order[j] = \
                        individual.rectangle_order[j], individual.rectangle_order[i]
            
            elif mutation_type == 'adjust':
                # Redistribute heights more evenly
                if individual.num_containers > 0:
                    avg_height = self.max_total_height / individual.num_containers
                    individual.container_heights = []
                    remaining = self.max_total_height
                    for i in range(individual.num_containers):
                        if i == individual.num_containers - 1:
                            height = remaining
                        else:
                            height = avg_height * random.uniform(0.8, 1.2)
                            height = min(height, remaining)
                        individual.container_heights.append(height)
                        remaining -= height
            
            elif mutation_type == 'shuffle':
                # Shuffle large portion of rectangle order
                if len(individual.rectangle_order) > 2:
                    # Shuffle 30-70% of the sequence
                    shuffle_size = random.randint(len(individual.rectangle_order) // 3, 
                                                 len(individual.rectangle_order) * 2 // 3)
                    start_idx = random.randint(0, len(individual.rectangle_order) - shuffle_size)
                    subsequence = individual.rectangle_order[start_idx:start_idx + shuffle_size]
                    random.shuffle(subsequence)
                    individual.rectangle_order[start_idx:start_idx + shuffle_size] = subsequence
            
            elif mutation_type == 'random_heights':
                # Completely randomize container heights
                if individual.num_containers > 0:
                    individual.container_heights = []
                    remaining = self.max_total_height
                    for i in range(individual.num_containers):
                        if i == individual.num_containers - 1:
                            height = remaining
                        else:
                            # More random height distribution
                            height = random.uniform(0.5, remaining * 0.8)
                            height = min(height, remaining)
                        individual.container_heights.append(height)
                        remaining -= height
    
    def evolve(self):
        """
        Execute the complete genetic algorithm evolution process.
        
        The algorithm follows these steps each generation:
        1. Evaluate fitness of all individuals
        2. Track best solution and monitor stagnation
        3. Apply adaptive mutation rates based on progress
        4. Create new population via selection, crossover, and mutation
        5. Inject random individuals for diversity when needed
        
        The process continues for the specified number of generations,
        with adaptive mechanisms to escape local optima and maintain
        genetic diversity.
        
        Returns:
            Tuple of (best_individual_found, fitness_history_per_generation)
        """
        self.initialize_population()
        
        # Evaluate initial population
        for individual in self.population:
            self.evaluate_fitness(individual)
        
        best_fitness_history = []
        stagnation_counter = 0
        last_best_fitness = float('-inf')
        
        for generation in range(self.generations):
            # Sort population by fitness
            self.population.sort(key=lambda ind: ind.fitness, reverse=True)
            
            # Track best individual
            if not self.best_individual or self.population[0].fitness > self.best_individual.fitness:
                self.best_individual = self.population[0].copy()
                stagnation_counter = 0
            else:
                stagnation_counter += 1
            
            if self.best_individual.fitness > last_best_fitness:
                last_best_fitness = self.best_individual.fitness
            
            best_fitness_history.append(self.best_individual.fitness)
            
            # Print progress
            if generation % 50 == 0:
                avg_fitness = sum(ind.fitness for ind in self.population) / len(self.population)
                print(f"Generation {generation}: Best fitness = {self.best_individual.fitness:.2f}, "
                      f"Avg = {avg_fitness:.2f}, "
                      f"Containers = {self.best_individual.num_containers}, "
                      f"Placed = {self.best_individual.rectangles_placed}/{len(self.rectangles)}")
            
            # Adaptive mutation with more aggressive scaling
            if stagnation_counter > 15:
                current_mutation = min(0.8, self.mutation_rate * (1 + stagnation_counter / 20))
            else:
                current_mutation = self.mutation_rate
            
            # Create new population
            new_population = []
            
            # Elitism
            for i in range(self.elitism_count):
                new_population.append(self.population[i].copy())
            
            # Add random individuals for diversity (10% of population)
            random_count = max(1, self.population_size // 10)
            for _ in range(random_count):
                if len(new_population) < self.population_size:
                    individual = Individual(self.rectangles, self.container_width,
                                           self.max_total_height, self.max_containers)
                    individual.initialize_random()
                    self.evaluate_fitness(individual)
                    new_population.append(individual)
            
            # Generate rest of population
            while len(new_population) < self.population_size:
                # Increase random selection probability
                if random.random() < 0.25:  # 25% random selection
                    parent1 = random.choice(self.population).copy()
                    parent2 = random.choice(self.population).copy()
                else:
                    # Variable tournament size for more diversity
                    tournament_size = random.randint(2, 5)
                    parent1 = self.tournament_selection(tournament_size)
                    parent2 = self.tournament_selection(tournament_size)
                
                child1, child2 = self.crossover(parent1, parent2)
                
                # Apply mutation with adaptive rate (higher chance)
                if random.random() < current_mutation:
                    self.mutate(child1)
                if random.random() < current_mutation:
                    self.mutate(child2)
                
                # Sometimes apply multiple mutations for more exploration
                if stagnation_counter > 25 and random.random() < 0.3:
                    for _ in range(random.randint(1, 2)):
                        self.mutate(child1)
                        self.mutate(child2)
                
                self.evaluate_fitness(child1)
                self.evaluate_fitness(child2)
                
                new_population.append(child1)
                if len(new_population) < self.population_size:
                    new_population.append(child2)
            
            self.population = new_population
        
        return self.best_individual, best_fitness_history
    
    def visualize_solution(self, individual: Individual):
        """
        Create a detailed visualization of the stacked container packing solution.
        
        The visualization shows:
        - Containers stacked vertically with actual heights
        - Bottom rectangles (blue edges, labeled with 'B')
        - Top rectangles (red edges, labeled with 'T')
        - Empty space or compression regions
        - Container utilization statistics
        - Rectangle clash detection (if any)
        - Maximum height constraint line
        
        Args:
            individual: The solution individual to visualize
        """
        fig, ax = plt.subplots(1, 1, figsize=(10, 12))
        
        # Colors for rectangles
        colors = plt.cm.Set3(np.linspace(0, 1, len(self.rectangles)))
        
        # Draw containers stacked
        current_y = 0
        for i, container in enumerate(individual.containers[:individual.num_containers]):
            # Draw container outline
            container_rect = patches.Rectangle((0, current_y), self.container_width, 
                                              container.height,
                                              linewidth=2, edgecolor='black',
                                              facecolor='lightgray', alpha=0.3)
            ax.add_patch(container_rect)
            
            # Draw bottom rectangles
            bottom_height = container.get_bottom_height(self.rectangles)
            for rect_id, x_pos in container.bottom_rectangles:
                rect = self.rectangles[rect_id]
                y_pos = current_y  # Bottom rectangles start at container bottom
                rect_patch = patches.Rectangle((x_pos, y_pos), rect.width, rect.height,
                                             linewidth=1, edgecolor='blue',
                                             facecolor=colors[rect_id], alpha=0.8)
                ax.add_patch(rect_patch)
                
                # Add rectangle label
                ax.text(x_pos + rect.width/2, y_pos + rect.height/2, f"{rect_id}B",
                       ha='center', va='center', fontsize=8, fontweight='bold',
                       color='white')
            
            # Draw top rectangles
            top_height = container.get_top_height(self.rectangles)
            for rect_id, x_pos in container.top_rectangles:
                rect = self.rectangles[rect_id]
                y_pos = current_y + container.height - rect.height  # Top rectangles align to container top
                rect_patch = patches.Rectangle((x_pos, y_pos), rect.width, rect.height,
                                             linewidth=1, edgecolor='red',
                                             facecolor=colors[rect_id], alpha=0.8)
                ax.add_patch(rect_patch)
                
                # Add rectangle label
                ax.text(x_pos + rect.width/2, y_pos + rect.height/2, f"{rect_id}T",
                       ha='center', va='center', fontsize=8, fontweight='bold',
                       color='white')
            
            # Draw center space indicator or overlap
            center_start = current_y + bottom_height
            center_height = container.height - bottom_height - top_height
            min_height = container.get_minimum_height(self.rectangles)
            
            if center_height > 0:
                center_rect = patches.Rectangle((0, center_start), self.container_width, center_height,
                                              linewidth=1, edgecolor='gray', linestyle='--',
                                              facecolor='white', alpha=0.5)
                ax.add_patch(center_rect)
                ax.text(self.container_width / 2, center_start + center_height / 2,
                       f"Empty Space\n{center_height:.1f}",
                       ha='center', va='center', fontsize=7, alpha=0.7)
            elif center_height < 0:
                # Container compressed - check if there are actual clashes
                has_clashes = self._has_rectangle_clashes(container)
                compression = abs(center_height)
                
                if has_clashes:
                    # Show actual clash in red
                    clash_rect = patches.Rectangle((0, center_start - compression/2), self.container_width, compression,
                                                 linewidth=2, edgecolor='red', linestyle=':',
                                                 facecolor='red', alpha=0.5)
                    ax.add_patch(clash_rect)
                    ax.text(self.container_width / 2, center_start,
                           f"CLASH!\n{compression:.1f}",
                           ha='center', va='center', fontsize=7, color='white', fontweight='bold')
                else:
                    # Show safe compression in green
                    compress_rect = patches.Rectangle((0, center_start - compression/2), self.container_width, compression,
                                                    linewidth=2, edgecolor='green', linestyle=':',
                                                    facecolor='lightgreen', alpha=0.4)
                    ax.add_patch(compress_rect)
                    ax.text(self.container_width / 2, center_start,
                           f"COMPRESSED\n{compression:.1f}\n(No Clash)",
                           ha='center', va='center', fontsize=6, color='darkgreen', fontweight='bold')
            
            # Add container info
            ax.text(self.container_width + 0.5, current_y + container.height / 2,
                   f"C{i+1}\nH:{container.height:.1f}\nU:{container.utilization(self.rectangles)*100:.1f}%\nB:{len(container.bottom_rectangles)}\nT:{len(container.top_rectangles)}",
                   ha='left', va='center', fontsize=8, alpha=0.8,
                   bbox=dict(boxstyle="round,pad=0.3", facecolor="lightblue", alpha=0.5))
            
            current_y += container.height
        
        # Draw max height line
        ax.axhline(y=self.max_total_height, color='red', linestyle='--', alpha=0.7,
                  linewidth=2)
        
        # Add legend for rectangle types
        from matplotlib.lines import Line2D
        legend_elements = [
            Line2D([0], [0], color='blue', linewidth=3, label='Bottom Rectangles'),
            Line2D([0], [0], color='red', linewidth=3, label='Top Rectangles'),
            Line2D([0], [0], color='gray', linestyle='--', label='Empty Space'),
            Line2D([0], [0], color='red', linestyle='--', label='Max Height Limit')
        ]
        ax.legend(handles=legend_elements, loc='upper right')
        
        ax.set_xlim(-1, self.container_width + 4)
        ax.set_ylim(-1, max(individual.total_height_used, self.max_total_height) + 1)
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        ax.set_xlabel('Width')
        ax.set_ylabel('Height (Stacked)')
        ax.set_title(f'Stacked Container Solution (Top/Bottom Constraint)\n'
                    f'Containers: {individual.num_containers}, '
                    f'Total Height: {individual.total_height_used:.2f}/{self.max_total_height}, '
                    f'Placed: {individual.rectangles_placed}/{len(self.rectangles)}, '
                    f'Fitness: {individual.fitness:.2f}')
        
        plt.tight_layout()
        plt.show()

# Example usage
if __name__ == "__main__":
    # Define rectangles to pack (width, height)
    rectangles = [
        (4, 3),
        (3, 2),
        (2, 5),
        (3, 3),
        (4, 2),
        (2, 2),
        (3, 4),
        (5, 1),
        (2, 1),
        (2, 3)
    ]
    
    # Container constraints
    container_width = 7  # Fixed width for all containers
    max_total_height = 20  # Maximum total height when stacked
    max_containers = 5  # Maximum number of containers
    
    # Create and run optimizer
    optimizer = StackedContainerOptimizer(
        rectangles=rectangles,
        container_width=container_width,
        max_total_height=max_total_height,
        max_containers=max_containers,
        population_size=200,
        generations=500,
        mutation_rate=0.4,
        crossover_rate=0.75,
        elitism_rate=0.05
    )
    
    print("Running stacked container optimization...")
    print(f"Container width: {container_width} (fixed)")
    print(f"Max total height: {max_total_height}")
    print(f"Max containers: {max_containers}")
    print(f"Rectangles to pack: {len(rectangles)}")
    print("-" * 50)
    
    best_solution, fitness_history = optimizer.evolve()
    
    print("-" * 50)
    print(f"\nBest solution found:")
    print(f"Number of containers: {best_solution.num_containers}")
    print(f"Container heights: {[f'{h:.2f}' for h in best_solution.container_heights[:best_solution.num_containers]]}")
    print(f"Total height used: {best_solution.total_height_used:.2f}")
    print(f"Rectangles placed: {best_solution.rectangles_placed}/{len(rectangles)}")
    print(f"Fitness: {best_solution.fitness:.2f}")
    
    # Show detailed container analysis
    print(f"\nContainer Analysis:")
    for i, container in enumerate(best_solution.containers[:best_solution.num_containers]):
        util = container.utilization(optimizer.rectangles)
        total_items = len(container.bottom_rectangles) + len(container.top_rectangles)
        min_height = container.get_minimum_height(optimizer.rectangles)
        compression = (min_height - container.height) / min_height * 100 if min_height > 0 else 0
        has_clashes = optimizer._has_rectangle_clashes(container)
        
        print(f"  Container {i+1}: {util*100:.1f}% utilization ({total_items} items: {len(container.bottom_rectangles)}B, {len(container.top_rectangles)}T)")
        print(f"    Height: {container.height:.2f} (min: {min_height:.2f}, compression: {compression:.1f}%)")
        if has_clashes:
            print(f"    ⚠️  WARNING: Rectangle clashes detected!")
        print()
    
    # Visualize the solution
    optimizer.visualize_solution(best_solution)
    
    # Plot fitness evolution
    plt.figure(figsize=(10, 5))
    plt.plot(fitness_history)
    plt.xlabel('Generation')
    plt.ylabel('Best Fitness')
    plt.title('Fitness Evolution')
    plt.grid(True, alpha=0.3)
    plt.show()