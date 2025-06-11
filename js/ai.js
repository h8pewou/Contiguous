import { game } from './game.js';

class AI {
    constructor() {
        this.difficulty = 'medium';
        this.maxAttacksPerTurn = 3;
    }

    makeMove() {
        if (game.currentPhase === 'reinforcement') {
            this.makeReinforcementMove();
        } else if (game.currentPhase === 'attack') {
            this.makeAttackMove();
        }
    }

    makeReinforcementMove() {
        // Get AI's territories
        const aiTerritories = game.territories.filter(t => t.owner === game.currentPlayer.id);
        
        // Find territory with most neighbors
        const targetTerritory = aiTerritories.reduce((best, current) => {
            const currentNeighbors = current.neighbors.length;
            const bestNeighbors = best.neighbors.length;
            return currentNeighbors > bestNeighbors ? current : best;
        });

        if (targetTerritory) {
            game.setArmies(targetTerritory.id, targetTerritory.armies + 1);
        }

        // Switch to attack phase
        game.currentPhase = 'attack';
        game.updateUI();
    }

    makeAttackMove() {
        let attackCount = 0;
        const makeNextAttack = () => {
            if (attackCount >= this.maxAttacksPerTurn) {
                game.nextTurn();
                return;
            }

            // Get AI's territories with more than 1 army
            const aiTerritories = game.territories.filter(t => 
                t.owner === game.currentPlayer.id && t.armies > 1
            );

            // Find best attack opportunity
            let bestSource = null;
            let bestTarget = null;
            let bestScore = -Infinity;

            for (const source of aiTerritories) {
                const attackableNeighbors = source.neighbors
                    .map(id => game.territories.find(t => t.id === id))
                    .filter(t => t && t.owner !== game.currentPlayer.id);

                for (const target of attackableNeighbors) {
                    // Calculate attack score based on army difference and territory value
                    const armyDifference = source.armies - target.armies;
                    const territoryValue = target.neighbors.length;
                    const score = armyDifference + territoryValue;

                    if (score > bestScore) {
                        bestScore = score;
                        bestSource = source;
                        bestTarget = target;
                    }
                }
            }

            if (bestSource && bestTarget) {
                const success = game.resolveCombat(bestSource.id, bestTarget.id);
                attackCount++;

                // Check for win condition
                const winner = game.checkWinCondition();
                if (winner) {
                    return;
                }

                // Make next attack after a delay
                setTimeout(makeNextAttack, 1000);
            } else {
                game.nextTurn();
            }
        };

        // Start the attack sequence
        makeNextAttack();
    }
}

export { AI }; 