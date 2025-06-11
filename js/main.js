import { game } from './game.js';
import { MapGenerator } from './map-generator.js';
import { Renderer } from './renderer.js';
import { AI } from './ai.js';

// Initialize game components
const canvas = document.getElementById('gameCanvas');
const mapGenerator = new MapGenerator();
const renderer = new Renderer();
const ai = new AI(game, mapGenerator, renderer);

// Initialize game
game.initialize(mapGenerator, renderer, ai);

// Game loop
function gameLoop() {
    renderer.render(game.territories);
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    // Clear any existing timeout
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }

    // Set a new timeout to handle the resize after 250ms of no resize events
    resizeTimeout = setTimeout(() => {
        // Only update the renderer's scale and viewport
        renderer.updateScale();
        renderer.updateViewport();
    }, 250);
});

// Handle canvas clicks
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedTerritory = renderer.getTerritoryAt(x, y);

    if (clickedTerritory) {
        if (game.currentPhase === 'attack') {
            if (!game.attackSource) {
                if (clickedTerritory.owner === game.currentPlayer.id && clickedTerritory.armies > 1) {
                    game.attackSource = clickedTerritory.id;
                    renderer.setAttackSource(clickedTerritory.id);
                }
            } else {
                if (game.canAttack(game.attackSource, clickedTerritory.id)) {
                    const success = game.resolveCombat(game.attackSource, clickedTerritory.id);
                    if (success) {
                        const winner = game.checkWinCondition();
                        if (winner) {
                            alert(`Player ${winner.id} wins!`);
                            game.initialize(mapGenerator, renderer, ai);
                        }
                    }
                }
                game.attackSource = null;
                renderer.setAttackSource(null);
            }
        }
    }
});

// Handle end turn button
document.getElementById('end-turn-btn').addEventListener('click', () => {
    game.nextTurn();
    
    if (game.currentPlayer.isAI) {
        ai.makeMove();
    } else {
        // Automate reinforcements for human player
        automateHumanReinforcements();
    }
});

// Function to automate human player reinforcements
function automateHumanReinforcements() {
    if (game.currentPhase === 'reinforcement' && !game.currentPlayer.isAI) {
        const playerTerritories = game.territories.filter(t => t.owner === game.currentPlayer.id);
        
        // Randomly distribute reinforcements
        while (game.availableReinforcements > 0) {
            const randomIndex = Math.floor(Math.random() * playerTerritories.length);
            const territory = playerTerritories[randomIndex];
            game.setArmies(territory.id, territory.armies + 1);
            game.availableReinforcements--;
        }
        
        // Update UI and switch to attack phase
        game.updateUI();
        game.currentPhase = 'attack';
        game.updateUI();
    }
}

// Automate initial reinforcements for human player
automateHumanReinforcements(); 