// Game state management
class Game {
    constructor() {
        this.players = [];
        this.territories = [];
        this.currentPlayerIndex = 0;
        this.currentPhase = 'reinforcement';
        this.selectedTerritory = null;
        this.attackSource = null;
        this.availableReinforcements = 0;
    }

    initialize(mapGenerator, renderer, ai) {
        // Clear any existing game state
        this.players = [];
        this.territories = [];
        this.currentPlayerIndex = 0;
        this.currentPhase = 'reinforcement';
        this.selectedTerritory = null;
        this.attackSource = null;
        this.availableReinforcements = 0;

        // Add players
        this.addPlayer('#ff4444'); // Human player
        this.addPlayer('#4444ff', true, 'medium'); // AI player

        // Generate map
        const territories = mapGenerator.generateMap();
        this.territories = territories;

        // Randomly assign territories and initial armies
        const shuffledTerritories = [...territories].sort(() => Math.random() - 0.5);
        const territoriesPerPlayer = Math.floor(shuffledTerritories.length / this.players.length);

        this.players.forEach((player, index) => {
            const startIndex = index * territoriesPerPlayer;
            const endIndex = index === this.players.length - 1 ? 
                shuffledTerritories.length : 
                (index + 1) * territoriesPerPlayer;

            for (let i = startIndex; i < endIndex; i++) {
                const territory = shuffledTerritories[i];
                this.assignTerritory(territory.id, player.id);
                this.setArmies(territory.id, 2); // Start with 2 armies per territory
            }
        });

        // Calculate initial reinforcements
        this.calculateReinforcements();

        // Update UI
        this.updateUI();
    }

    addPlayer(color, isAI = false, aiDifficulty = 'medium') {
        const player = {
            id: this.players.length + 1,
            color: color,
            isAI: isAI,
            aiDifficulty: aiDifficulty
        };
        this.players.push(player);
        return player;
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    assignTerritory(territoryId, playerId) {
        const territory = this.territories.find(t => t.id === territoryId);
        if (territory) {
            territory.owner = playerId;
        }
    }

    setArmies(territoryId, count) {
        const territory = this.territories.find(t => t.id === territoryId);
        if (territory) {
            territory.armies = Math.max(1, count); // Ensure minimum of 1 army
        }
    }

    calculateReinforcements() {
        const player = this.currentPlayer;
        const playerTerritories = this.territories.filter(t => t.owner === player.id);
        this.availableReinforcements = Math.max(2, Math.floor(playerTerritories.length / 3));
    }

    canAttack(sourceId, targetId) {
        const source = this.territories.find(t => t.id === sourceId);
        const target = this.territories.find(t => t.id === targetId);

        if (!source || !target) return false;
        if (source.owner !== this.currentPlayer.id) return false;
        if (target.owner === this.currentPlayer.id) return false;
        if (source.armies <= 1) return false;
        if (!source.neighbors.includes(targetId)) return false;

        return true;
    }

    resolveCombat(sourceId, targetId) {
        const source = this.territories.find(t => t.id === sourceId);
        const target = this.territories.find(t => t.id === targetId);

        if (!source || !target) return false;

        // Calculate combat strength
        const attackerRoll = Math.floor(Math.random() * 6) + 1;
        const defenderRoll = Math.floor(Math.random() * 6) + 1;
        
        // Add army size bonus (1 point per 2 armies, rounded down)
        const attackerBonus = Math.floor(source.armies / 2);
        const defenderBonus = Math.floor(target.armies / 2);
        
        const attackerTotal = attackerRoll + attackerBonus;
        const defenderTotal = defenderRoll + defenderBonus;

        if (attackerTotal > defenderTotal) {
            // Attacker wins
            target.owner = source.owner;
            target.armies = source.armies - 1;
            source.armies = 1;
            return true;
        } else {
            // Defender wins
            source.armies = 1;
            
            // Calculate defender losses based on the margin of victory
            const margin = defenderTotal - attackerTotal;
            const defenderLosses = Math.min(
                Math.floor(margin / 2), // 1 loss per 2 points of margin
                target.armies - 1 // Don't reduce below 1 army
            );
            
            if (defenderLosses > 0) {
                target.armies -= defenderLosses;
            }
            
            return false;
        }
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.currentPhase = 'reinforcement';
        this.selectedTerritory = null;
        this.attackSource = null;
        this.calculateReinforcements();
        this.updateUI();
    }

    updateUI() {
        const currentPlayerElement = document.getElementById('current-player');
        const currentPhaseElement = document.getElementById('current-phase');
        const endTurnButton = document.getElementById('end-turn-btn');

        currentPlayerElement.textContent = `Player ${this.currentPlayer.id} (${this.availableReinforcements} reinforcements)`;
        currentPhaseElement.textContent = this.currentPhase.charAt(0).toUpperCase() + 
            this.currentPhase.slice(1);

        endTurnButton.disabled = this.currentPhase === 'reinforcement' && this.availableReinforcements > 0;
    }

    checkWinCondition() {
        const firstOwner = this.territories[0]?.owner;
        if (!firstOwner) return null;

        const allSameOwner = this.territories.every(t => t.owner === firstOwner);
        if (allSameOwner) {
            return this.players.find(p => p.id === firstOwner);
        }

        return null;
    }
}

export const game = new Game(); 