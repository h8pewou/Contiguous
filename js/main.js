import { game } from './game.js';
import { MapGenerator } from './map-generator.js';
import { GameRenderer } from './renderer.js';
import { AIPlayer } from './ai-player.js';

class Game {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.currentPlayerElement = document.getElementById('current-player');
        this.currentPhaseElement = document.getElementById('current-phase');
        this.endTurnButton = document.getElementById('end-turn-btn');
        
        this.renderer = new GameRenderer(this.gameBoard);
        this.aiPlayers = new Map();
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Clear any existing game state
        game.players = [];
        game.territories.clear();
        
        // Add players
        game.addPlayer('#ff4444'); // Human player
        game.addPlayer('#4444ff', true, 'medium'); // AI player
        
        // Initialize AI players
        game.players.forEach(player => {
            if (player.isAI) {
                this.aiPlayers.set(player.id, new AIPlayer(player.aiDifficulty));
            }
        });

        // Generate map
        const mapGenerator = new MapGenerator(
            this.gameBoard.clientWidth,
            this.gameBoard.clientHeight
        );
        const territories = mapGenerator.generateMap();

        // Randomly assign territories and initial armies
        const shuffledTerritories = [...territories].sort(() => Math.random() - 0.5);
        const territoriesPerPlayer = Math.floor(shuffledTerritories.length / game.players.length);
        
        game.players.forEach((player, index) => {
            const startIndex = index * territoriesPerPlayer;
            const endIndex = index === game.players.length - 1 ? 
                shuffledTerritories.length : 
                (index + 1) * territoriesPerPlayer;
            
            for (let i = startIndex; i < endIndex; i++) {
                const territory = shuffledTerritories[i];
                game.assignTerritory(territory.id, player.id);
                game.setArmies(territory.id, 2); // Start with 2 armies per territory
            }
        });

        // Render initial state
        territories.forEach(territory => {
            this.renderer.renderTerritory(territory);
        });

        this.updateUI();
    }

    setupEventListeners() {
        this.endTurnButton.addEventListener('click', () => this.endTurn());
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.clear();
            this.initializeGame();
        });
    }

    updateUI() {
        const currentPlayer = game.currentPlayer;
        this.currentPlayerElement.textContent = `Player ${currentPlayer.id}`;
        this.currentPhaseElement.textContent = game.currentPhase.charAt(0).toUpperCase() + 
            game.currentPhase.slice(1);
        
        // Enable/disable end turn button based on phase
        this.endTurnButton.disabled = game.currentPhase === 'reinforcement';
        
        // Check for win condition
        const winner = game.checkWinCondition();
        if (winner) {
            this.showGameOver(winner);
        }
    }

    endTurn() {
        if (game.currentPhase === 'attack') {
            game.nextTurn();
            this.updateUI();
            
            // If next player is AI, make their move
            if (game.currentPlayer.isAI) {
                this.makeAIMove();
            }
        } else if (game.currentPhase === 'reinforcement') {
            game.currentPhase = 'attack';
            this.updateUI();
        }
    }

    makeAIMove() {
        const aiPlayer = this.aiPlayers.get(game.currentPlayer.id);
        if (!aiPlayer) return;

        // AI makes its reinforcement move
        aiPlayer.makeMove();
        this.renderer.updateAllTerritories();
        
        // Switch to attack phase
        game.currentPhase = 'attack';
        this.updateUI();
        
        // AI makes its attack moves
        let attackCount = 0;
        const maxAttacks = 3; // Limit number of attacks per turn
        
        const makeAttack = () => {
            if (attackCount >= maxAttacks) {
                this.endTurn();
                return;
            }
            
            aiPlayer.makeMove();
            this.renderer.updateAllTerritories();
            
            // Check if game is over
            if (game.checkWinCondition()) {
                this.showGameOver(game.checkWinCondition());
                return;
            }
            
            attackCount++;
            setTimeout(makeAttack, 1000); // Add delay between attacks
        };
        
        makeAttack();
    }

    showGameOver(winner) {
        const message = winner.isAI ? 
            `Game Over! AI Player ${winner.id} wins!` :
            `Game Over! Player ${winner.id} wins!`;
            
        alert(message);
        
        // Reset game after a delay
        setTimeout(() => {
            this.initializeGame();
        }, 2000);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 