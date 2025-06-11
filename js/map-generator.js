import { game } from './game.js';

class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.territoryCount = 20; // Adjust based on desired complexity
        this.minTerritorySize = 60;
        this.maxTerritorySize = 120;
    }

    generateMap() {
        const territories = [];
        const attempts = 1000;
        let currentAttempt = 0;

        while (territories.length < this.territoryCount && currentAttempt < attempts) {
            const size = this.minTerritorySize + Math.random() * (this.maxTerritorySize - this.minTerritorySize);
            const x = Math.random() * (this.width - size);
            const y = Math.random() * (this.height - size);

            const newTerritory = {
                x,
                y,
                width: size,
                height: size * 0.8, // Slightly wider than tall
                id: territories.length + 1
            };

            if (!this.overlapsWithExisting(newTerritory, territories)) {
                territories.push(newTerritory);
            }

            currentAttempt++;
        }

        // Calculate neighbors
        this.calculateNeighbors(territories);

        // Add territories to game state
        territories.forEach(territory => {
            game.addTerritory(
                territory.id,
                territory.x,
                territory.y,
                territory.width,
                territory.height,
                territory.neighbors
            );
        });

        return territories;
    }

    overlapsWithExisting(newTerritory, existingTerritories) {
        const padding = 10; // Minimum space between territories
        return existingTerritories.some(existing => {
            return !(
                newTerritory.x + newTerritory.width + padding < existing.x ||
                newTerritory.x > existing.x + existing.width + padding ||
                newTerritory.y + newTerritory.height + padding < existing.y ||
                newTerritory.y > existing.y + existing.height + padding
            );
        });
    }

    calculateNeighbors(territories) {
        const maxDistance = this.maxTerritorySize * 1.5;

        territories.forEach(territory => {
            territory.neighbors = territories
                .filter(other => {
                    if (other.id === territory.id) return false;

                    const dx = (territory.x + territory.width/2) - (other.x + other.width/2);
                    const dy = (territory.y + territory.height/2) - (other.y + other.height/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    return distance < maxDistance;
                })
                .map(other => other.id);
        });

        // Ensure all territories are connected
        this.ensureConnectivity(territories);
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
                territory.neighbors.push(nearest.id);
                nearest.neighbors.push(territory.id);
            }
        });
    }

    findNearestTerritory(territory, territories) {
        return territories.reduce((nearest, current) => {
            if (current.id === territory.id) return nearest;

            const dx = (territory.x + territory.width/2) - (current.x + current.width/2);
            const dy = (territory.y + territory.height/2) - (current.y + current.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (!nearest || distance < nearest.distance) {
                return { ...current, distance };
            }
            return nearest;
        }, null);
    }
}

export { MapGenerator }; 