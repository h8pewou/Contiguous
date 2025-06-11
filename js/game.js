// Game state management
class GameState {
    constructor() {
        this.players = [];
        this.territories = new Map();
        this.currentPlayerIndex = 0;
        this.currentPhase = 'reinforcement';
        this.selectedTerritory = null;
        this.attackSource = null;
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    addPlayer(color, isAI = false, aiDifficulty = null) {
        const player = {
            id: this.players.length + 1,
            color,
            isAI,
            aiDifficulty,
            territories: new Set()
        };
        this.players.push(player);
        return player;
    }

    addTerritory(id, x, y, width, height, neighbors = []) {
        const territory = {
            id,
            x,
            y,
            width,
            height,
            neighbors,
            owner: null,
            armies: 0
        };
        this.territories.set(id, territory);
        return territory;
    }

    assignTerritory(territoryId, playerId) {
        const territory = this.territories.get(territoryId);
        if (!territory) return false;

        // Remove from previous owner if any
        if (territory.owner) {
            const prevOwner = this.players.find(p => p.id === territory.owner);
            if (prevOwner) {
                prevOwner.territories.delete(territoryId);
            }
        }

        // Assign to new owner
        territory.owner = playerId;
        const newOwner = this.players.find(p => p.id === playerId);
        if (newOwner) {
            newOwner.territories.add(territoryId);
        }

        return true;
    }

    setArmies(territoryId, count) {
        const territory = this.territories.get(territoryId);
        if (!territory) return false;
        territory.armies = Math.max(1, Math.min(12, count)); // Ensure between 1 and 12
        return true;
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.currentPhase = 'reinforcement';
        this.selectedTerritory = null;
        this.attackSource = null;
        this.calculateReinforcements();
    }

    calculateReinforcements() {
        const player = this.currentPlayer;
        const territoryCount = player.territories.size;
        return Math.max(2, Math.floor(territoryCount / 3));
    }

    canAttack(sourceId, targetId) {
        const source = this.territories.get(sourceId);
        const target = this.territories.get(targetId);
        
        if (!source || !target) return false;
        if (source.owner !== this.currentPlayer.id) return false;
        if (target.owner === this.currentPlayer.id) return false;
        if (!source.neighbors.includes(targetId)) return false;
        if (source.armies <= 1) return false;

        return true;
    }

    resolveCombat(attackerId, defenderId) {
        const attacker = this.territories.get(attackerId);
        const defender = this.territories.get(defenderId);
        
        if (!this.canAttack(attackerId, defenderId)) return false;

        const attackerDice = Array(attacker.armies - 1).fill(0)
            .map(() => Math.floor(Math.random() * 6) + 1);
        const defenderDice = Array(defender.armies).fill(0)
            .map(() => Math.floor(Math.random() * 6) + 1);

        const attackerSum = attackerDice.reduce((a, b) => a + b, 0);
        const defenderSum = defenderDice.reduce((a, b) => a + b, 0);

        if (attackerSum > defenderSum) {
            // Attacker wins
            this.assignTerritory(defenderId, attacker.owner);
            this.setArmies(defenderId, attacker.armies - 1);
            this.setArmies(attackerId, 1);
            return true;
        } else if (attackerSum < defenderSum) {
            // Defender wins
            this.setArmies(defenderId, defender.armies - (attacker.armies - 1));
            this.setArmies(attackerId, 1);
            return false;
        } else {
            // Tie - defender wins if equal armies, otherwise smaller force wins
            if (attacker.armies <= defender.armies) {
                this.setArmies(defenderId, defender.armies - (attacker.armies - 1));
                this.setArmies(attackerId, 1);
                return false;
            } else {
                this.assignTerritory(defenderId, attacker.owner);
                this.setArmies(defenderId, attacker.armies - 1);
                this.setArmies(attackerId, 1);
                return true;
            }
        }
    }

    checkWinCondition() {
        const activePlayers = this.players.filter(p => p.territories.size > 0);
        return activePlayers.length === 1 ? activePlayers[0] : null;
    }
}

// Game initialization
const game = new GameState();

// Add players
game.addPlayer('#ff4444'); // Player 1 (Human)
game.addPlayer('#4444ff', true, 'medium'); // Player 2 (AI)

// Export for use in other modules
export { game, GameState }; 