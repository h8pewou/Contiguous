import { game } from './game.js';

class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.hexSize = 25; // Further reduced from 30 to 25
        this.hexHeight = this.hexSize * Math.sqrt(3);
        this.hexWidth = this.hexSize * 2;
        this.territoryCount = 20;
    }

    generateMap() {
        // Calculate grid dimensions
        const cols = Math.floor(this.width / (this.hexWidth * 0.75));
        const rows = Math.floor(this.height / this.hexHeight);
        
        // Create hexagonal grid
        const hexagons = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * this.hexWidth * 0.75;
                const y = row * this.hexHeight + (col % 2) * (this.hexHeight / 2);
                
                // Only add hexagons that are mostly within the game board
                if (x > -this.hexWidth && x < this.width && y > -this.hexHeight && y < this.height) {
                    const points = this.generateHexagonPoints(x, y);
                    const bounds = this.calculateBounds(points);
                    
                    hexagons.push({
                        id: hexagons.length + 1,
                        x,
                        y,
                        row,
                        col,
                        points,
                        centerX: x,
                        centerY: y,
                        owner: null,
                        armies: 0,
                        getBounds: () => bounds
                    });
                }
            }
        }

        // Create a more compact grid by removing some hexagons
        const compactHexagons = this.createCompactGrid(hexagons);
        
        // Select territories in a more structured way
        const territories = this.selectTerritories(compactHexagons);

        // Calculate neighbors
        this.calculateNeighbors(territories, compactHexagons);

        // Ensure all territories are connected
        this.ensureConnectivity(territories);

        return territories;
    }

    createCompactGrid(hexagons) {
        // Create a more compact grid by removing some hexagons
        const compactHexagons = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxDistance = Math.min(this.width, this.height) * 0.3; // Reduced from 0.4 to 0.3

        hexagons.forEach(hex => {
            const dx = hex.centerX - centerX;
            const dy = hex.centerY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= maxDistance) {
                compactHexagons.push(hex);
            }
        });

        return compactHexagons;
    }

    selectTerritories(hexagons) {
        // Sort hexagons by distance from center
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const sortedHexagons = [...hexagons].sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.centerX - centerX, 2) + 
                Math.pow(a.centerY - centerY, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.centerX - centerX, 2) + 
                Math.pow(b.centerY - centerY, 2)
            );
            return distA - distB;
        });

        // Take the closest hexagons up to territoryCount
        return sortedHexagons.slice(0, this.territoryCount);
    }

    generateHexagonPoints(centerX, centerY) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + this.hexSize * Math.cos(angle);
            const y = centerY + this.hexSize * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }

    calculateBounds(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    calculateNeighbors(territories, allHexagons) {
        // For each territory, find its neighbors in the hexagonal grid
        territories.forEach(territory => {
            territory.neighbors = [];
            
            // Get the row and column of the current territory
            const row = territory.row;
            const col = territory.col;
            const isEvenRow = col % 2 === 0;

            // Define the six possible neighbor positions in a hexagonal grid
            const neighborOffsets = isEvenRow ? [
                { row: -1, col: 0 },  // top
                { row: -1, col: 1 },  // top-right
                { row: 0, col: 1 },   // right
                { row: 1, col: 0 },   // bottom
                { row: 0, col: -1 },  // left
                { row: -1, col: -1 }  // top-left
            ] : [
                { row: -1, col: 0 },  // top
                { row: 0, col: 1 },   // top-right
                { row: 1, col: 1 },   // right
                { row: 1, col: 0 },   // bottom
                { row: 1, col: -1 },  // bottom-left
                { row: 0, col: -1 }   // left
            ];

            // Check each possible neighbor position
            neighborOffsets.forEach(offset => {
                const neighborRow = row + offset.row;
                const neighborCol = col + offset.col;

                // Find the hexagon at this position
                const neighbor = allHexagons.find(h => h.row === neighborRow && h.col === neighborCol);
                
                // If the neighbor exists and is a territory, add it to the neighbors list
                if (neighbor && territories.some(t => t.id === neighbor.id)) {
                    territory.neighbors.push(neighbor.id);
                }
            });
        });
    }

    ensureConnectivity(territories) {
        const visited = new Set();
        const queue = [territories[0].id];
        visited.add(territories[0].id);

        while (queue.length > 0) {
            const currentId = queue.shift();
            const current = territories.find(t => t.id === currentId);

            current.neighbors.forEach(neighborId => {
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            });
        }

        // If any territory is not connected, add a connection to the nearest territory
        territories.forEach(territory => {
            if (!visited.has(territory.id)) {
                const nearest = this.findNearestTerritory(territory, territories);
                if (nearest) {
                    territory.neighbors.push(nearest.id);
                    nearest.neighbors.push(territory.id);
                }
            }
        });

        // Ensure each territory has at least one neighbor
        territories.forEach(territory => {
            if (territory.neighbors.length === 0) {
                const nearest = this.findNearestTerritory(territory, territories);
                if (nearest) {
                    territory.neighbors.push(nearest.id);
                    nearest.neighbors.push(territory.id);
                }
            }
        });
    }

    findNearestTerritory(territory, territories) {
        return territories.reduce((nearest, current) => {
            if (current.id === territory.id) return nearest;

            const dx = territory.centerX - current.centerX;
            const dy = territory.centerY - current.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (!nearest || distance < nearest.distance) {
                return { ...current, distance };
            }
            return nearest;
        }, null);
    }
}

export { MapGenerator }; 