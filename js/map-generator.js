import { game } from './game.js';

class MapGenerator {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.hexSize = 25; // You can adjust this for larger/smaller hexes
        this.hexHeight = this.hexSize * Math.sqrt(3);
        this.hexWidth = this.hexSize * 2;
        this.territories = [];
    }

    generateMap() {
        // Generate a larger grid than needed
        const cols = Math.ceil(this.width / (this.hexWidth * 0.75)) + 4;
        const rows = Math.ceil(this.height / this.hexHeight) + 4;
        
        // Create the full grid first
        this.createFullGrid(cols, rows);
        
        // Remove the last two columns and rows
        this.removeOuterTerritories();
        
        // Calculate neighbors and ensure connectivity
        this.calculateNeighbors();
        this.ensureConnectivity();
        
        return this.territories;
    }

    createFullGrid(cols, rows) {
        const grid = [];
        
        // Calculate the total width and height of the grid
        const totalWidth = cols * this.hexWidth * 0.75;
        const totalHeight = rows * this.hexHeight;
        
        // Calculate the starting position to center the grid
        const startX = (this.width - totalWidth) / 2;
        const startY = (this.height - totalHeight) / 2;
        
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                // Calculate position with centering offset
                const x = startX + col * this.hexWidth * 0.75;
                const y = startY + row * this.hexHeight + (col % 2) * (this.hexHeight / 2);
                
                grid.push({
                    id: grid.length,
                    x: x,
                    y: y,
                    armies: 0,
                    owner: null,
                    neighbors: [],
                    centerX: x,
                    centerY: y,
                    col: col,  // Store column and row for filtering
                    row: row
                });
            }
        }
        
        this.territories = grid;
    }

    removeOuterTerritories() {
        // Find the maximum column and row
        const maxCol = Math.max(...this.territories.map(t => t.col));
        const maxRow = Math.max(...this.territories.map(t => t.row));
        
        // Remove territories in the last two columns and rows
        this.territories = this.territories.filter(territory => 
            territory.col < maxCol - 1 && territory.row < maxRow - 1
        );
        
        // Reassign IDs to be sequential
        this.territories.forEach((territory, index) => {
            territory.id = index;
        });
    }

    filterTerritories() {
        // Filter out territories that are outside the screen
        this.territories = this.territories.filter(territory => {
            // Calculate the corners of the hexagon
            const corners = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const cornerX = territory.x + this.hexWidth * Math.cos(angle);
                const cornerY = territory.y + this.hexHeight * Math.sin(angle);
                corners.push({ x: cornerX, y: cornerY });
            }
            
            // Check if any corner is outside the screen
            const isOutside = corners.some(corner => 
                corner.x < 0 || 
                corner.x > this.width || 
                corner.y < 0 || 
                corner.y > this.height
            );
            
            return !isOutside;
        });
        
        // Reassign IDs to be sequential
        this.territories.forEach((territory, index) => {
            territory.id = index;
        });
    }

    isHexagonInBounds(x, y) {
        // Calculate the radius of the hexagon with safety margin
        const radius = this.hexWidth * 1.1; // Add 10% safety margin
        
        // Check if the hexagon's center is far enough from the edges
        const minX = radius;
        const maxX = this.width - radius;
        const minY = radius;
        const maxY = this.height - radius;
        
        // First check if the center is in bounds
        if (x < minX || x > maxX || y < minY || y > maxY) {
            return false;
        }
        
        // Then check all corners with safety margin
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const cornerX = x + radius * Math.cos(angle);
            const cornerY = y + radius * Math.sin(angle);
            
            // Add small safety margin to boundary checks
            if (cornerX < 5 || cornerX > this.width - 5 || cornerY < 5 || cornerY > this.height - 5) {
                return false;
            }
        }
        
        return true;
    }

    selectTerritories() {
        // Select all hexes that are at least partially visible on the canvas
        this.territories = this.territories
            .map((hex, index) => ({
                id: index + 1,
                x: hex.x,
                y: hex.y,
                width: this.hexWidth,
                height: this.hexHeight,
                armies: 0,
                owner: null,
                neighbors: [],
                getBounds() {
                    return {
                        x: this.x - this.width / 2,
                        y: this.y - this.height / 2,
                        width: this.width,
                        height: this.height
                    };
                }
            }))
            .filter(hex =>
                hex.x + this.hexWidth / 2 > 0 &&
                hex.x - this.hexWidth / 2 < this.width &&
                hex.y + this.hexHeight / 2 > 0 &&
                hex.y - this.hexHeight / 2 < this.height
            );
    }

    calculateNeighbors() {
        // Calculate neighbors based on hex grid positions
        for (let i = 0; i < this.territories.length; i++) {
            const t1 = this.territories[i];
            for (let j = i + 1; j < this.territories.length; j++) {
                const t2 = this.territories[j];
                const dx = t1.x - t2.x;
                const dy = t1.y - t2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Adjust neighbor distance to ensure horizontal connections
                // Using 1.1 times hexWidth to account for slight variations in positioning
                if (distance <= this.hexWidth * 1.1) {
                    t1.neighbors.push(t2.id);
                    t2.neighbors.push(t1.id);
                }
            }
        }
    }

    ensureConnectivity() {
        this.calculateNeighbors();
        
        // Find any isolated territories
        const isolated = this.territories.filter(t => t.neighbors.length === 0);
        
        // Connect isolated territories to their nearest neighbor
        isolated.forEach(territory => {
            let nearest = null;
            let minDistance = Infinity;
            
            this.territories.forEach(other => {
                if (other.id !== territory.id) {
                    const dx = other.x - territory.x;
                    const dy = other.y - territory.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = other;
                    }
                }
            });
            
            if (nearest) {
                territory.neighbors.push(nearest.id);
                nearest.neighbors.push(territory.id);
            }
        });
    }
}

export { MapGenerator }; 