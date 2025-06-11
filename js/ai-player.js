import { game } from './game.js';

class AIPlayer {
    constructor(difficulty = 'medium', personality = 'balanced') {
        this.difficulty = difficulty;
        this.personality = personality;
    }

    makeMove() {
        if (game.currentPhase === 'reinforcement') {
            this.handleReinforcement();
        } else if (game.currentPhase === 'attack') {
            this.handleAttack();
        }
    }

    handleReinforcement() {
        const reinforcements = game.calculateReinforcements();
        const territories = Array.from(game.territories.values())
            .filter(t => t.owner === game.currentPlayer.id);

        if (this.personality === 'aggressive') {
            // Aggressive AI reinforces territories that can attack
            const attackTerritories = territories.filter(t => 
                t.neighbors.some(n => game.territories.get(n).owner !== game.currentPlayer.id)
            );
            if (attackTerritories.length > 0) {
                const target = this.selectBestTerritory(attackTerritories);
                game.setArmies(target.id, target.armies + reinforcements);
            }
        } else if (this.personality === 'defensive') {
            // Defensive AI reinforces territories with enemy neighbors
            const borderTerritories = territories.filter(t => 
                t.neighbors.some(n => game.territories.get(n).owner !== game.currentPlayer.id)
            );
            if (borderTerritories.length > 0) {
                const target = this.selectBestTerritory(borderTerritories);
                game.setArmies(target.id, target.armies + reinforcements);
            }
        } else {
            // Balanced AI uses a mix of strategies
            const borderTerritories = territories.filter(t => 
                t.neighbors.some(n => game.territories.get(n).owner !== game.currentPlayer.id)
            );
            if (borderTerritories.length > 0) {
                const target = this.selectBestTerritory(borderTerritories);
                game.setArmies(target.id, target.armies + reinforcements);
            }
        }
    }

    handleAttack() {
        const territories = Array.from(game.territories.values())
            .filter(t => t.owner === game.currentPlayer.id && t.armies > 1);

        if (territories.length === 0) return;

        let sourceTerritory;
        let targetTerritory;

        if (this.difficulty === 'easy') {
            // Easy AI makes random attacks
            sourceTerritory = territories[Math.floor(Math.random() * territories.length)];
            const possibleTargets = sourceTerritory.neighbors
                .map(id => game.territories.get(id))
                .filter(t => t.owner !== game.currentPlayer.id);
            
            if (possibleTargets.length > 0) {
                targetTerritory = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            }
        } else if (this.difficulty === 'medium') {
            // Medium AI considers basic odds
            sourceTerritory = this.selectBestAttackingTerritory(territories);
            if (sourceTerritory) {
                targetTerritory = this.selectBestTargetTerritory(sourceTerritory);
            }
        } else {
            // Hard AI uses advanced strategy
            sourceTerritory = this.selectStrategicAttackingTerritory(territories);
            if (sourceTerritory) {
                targetTerritory = this.selectStrategicTargetTerritory(sourceTerritory);
            }
        }

        if (sourceTerritory && targetTerritory) {
            game.resolveCombat(sourceTerritory.id, targetTerritory.id);
        }
    }

    selectBestTerritory(territories) {
        if (this.difficulty === 'easy') {
            return territories[Math.floor(Math.random() * territories.length)];
        }

        return territories.reduce((best, current) => {
            const currentScore = this.evaluateTerritory(current);
            const bestScore = best ? this.evaluateTerritory(best) : -Infinity;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    evaluateTerritory(territory) {
        let score = 0;
        
        // Consider number of armies
        score += territory.armies * 2;

        // Consider number of enemy neighbors
        const enemyNeighbors = territory.neighbors.filter(n => 
            game.territories.get(n).owner !== game.currentPlayer.id
        ).length;
        score += enemyNeighbors * 3;

        // Consider territory size
        score += (territory.width * territory.height) / 100;

        return score;
    }

    selectBestAttackingTerritory(territories) {
        return territories.reduce((best, current) => {
            const currentScore = this.evaluateAttackingTerritory(current);
            const bestScore = best ? this.evaluateAttackingTerritory(best) : -Infinity;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    evaluateAttackingTerritory(territory) {
        let score = 0;
        
        // Consider number of armies
        score += territory.armies * 3;

        // Consider number of possible targets
        const possibleTargets = territory.neighbors.filter(n => 
            game.territories.get(n).owner !== game.currentPlayer.id
        ).length;
        score += possibleTargets * 2;

        return score;
    }

    selectBestTargetTerritory(sourceTerritory) {
        const possibleTargets = sourceTerritory.neighbors
            .map(id => game.territories.get(id))
            .filter(t => t.owner !== game.currentPlayer.id);

        return possibleTargets.reduce((best, current) => {
            const currentScore = this.evaluateTargetTerritory(current, sourceTerritory);
            const bestScore = best ? this.evaluateTargetTerritory(best, sourceTerritory) : -Infinity;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    evaluateTargetTerritory(target, source) {
        let score = 0;
        
        // Consider army ratio
        score += (source.armies - target.armies) * 5;

        // Consider territory value
        score += (target.width * target.height) / 100;

        // Consider number of enemy neighbors
        const enemyNeighbors = target.neighbors.filter(n => 
            game.territories.get(n).owner !== game.currentPlayer.id
        ).length;
        score -= enemyNeighbors * 2;

        return score;
    }

    selectStrategicAttackingTerritory(territories) {
        // Hard AI considers strategic value of territories
        return territories.reduce((best, current) => {
            const currentScore = this.evaluateStrategicAttackingTerritory(current);
            const bestScore = best ? this.evaluateStrategicAttackingTerritory(best) : -Infinity;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    evaluateStrategicAttackingTerritory(territory) {
        let score = this.evaluateAttackingTerritory(territory);
        
        // Consider strategic position
        const enemyNeighbors = territory.neighbors.filter(n => 
            game.territories.get(n).owner !== game.currentPlayer.id
        );
        
        // Prefer territories that can cut off enemy regions
        const enemyOwners = new Set(enemyNeighbors.map(n => 
            game.territories.get(n).owner
        ));
        score += enemyOwners.size * 5;

        return score;
    }

    selectStrategicTargetTerritory(sourceTerritory) {
        const possibleTargets = sourceTerritory.neighbors
            .map(id => game.territories.get(id))
            .filter(t => t.owner !== game.currentPlayer.id);

        return possibleTargets.reduce((best, current) => {
            const currentScore = this.evaluateStrategicTargetTerritory(current, sourceTerritory);
            const bestScore = best ? this.evaluateStrategicTargetTerritory(best, sourceTerritory) : -Infinity;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    evaluateStrategicTargetTerritory(target, source) {
        let score = this.evaluateTargetTerritory(target, source);
        
        // Consider strategic value
        const targetNeighbors = target.neighbors.map(n => game.territories.get(n));
        const friendlyNeighbors = targetNeighbors.filter(t => 
            t.owner === game.currentPlayer.id
        ).length;
        
        // Prefer territories that connect to friendly territories
        score += friendlyNeighbors * 3;

        // Consider potential for expansion
        const enemyNeighbors = targetNeighbors.filter(t => 
            t.owner !== game.currentPlayer.id
        ).length;
        score += enemyNeighbors * 2;

        return score;
    }
}

export { AIPlayer }; 