import { game } from './game.js';
import { MapGenerator } from './map-generator.js';
import { Renderer } from './renderer.js';
import { AI } from './ai.js';

// Initialize game
const canvas = document.getElementById('gameCanvas');
const mapGenerator = new MapGenerator(canvas.width, canvas.height);
const renderer = new Renderer(canvas);
const ai = new AI();

// Set up game state
game.initialize(mapGenerator, renderer, ai);

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    mapGenerator.width = canvas.width;
    mapGenerator.height = canvas.height;
    game.initialize(mapGenerator, renderer, ai);
});

// Handle canvas click
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked territory
    const clickedTerritory = game.territories.find(territory => {
        const bounds = territory.getBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    });

    if (clickedTerritory) {
        if (game.currentPhase === 'reinforcement') {
            if (clickedTerritory.owner === game.currentPlayer.id && game.availableReinforcements > 0) {
                game.setArmies(clickedTerritory.id, clickedTerritory.armies + 1);
                game.availableReinforcements--;
                game.updateUI();
                renderer.render();

                // If no more reinforcements, switch to attack phase
                if (game.availableReinforcements === 0) {
                    game.currentPhase = 'attack';
                    game.updateUI();
                }
            }
        } else if (game.currentPhase === 'attack') {
            if (!game.attackSource) {
                if (clickedTerritory.owner === game.currentPlayer.id && clickedTerritory.armies > 1) {
                    game.attackSource = clickedTerritory.id;
                    renderer.render();
                }
            } else {
                if (game.canAttack(game.attackSource, clickedTerritory.id)) {
                    const success = game.resolveCombat(game.attackSource, clickedTerritory.id);
                    renderer.showAttackAnimation(game.attackSource, clickedTerritory.id, success);
                    game.attackSource = null;
                    renderer.render();

                    // Check for win condition
                    const winner = game.checkWinCondition();
                    if (winner) {
                        alert(`Game Over! ${winner.isAI ? 'AI' : 'Player'} ${winner.id} wins!`);
                        game.initialize(mapGenerator, renderer, ai);
                    }
                }
            }
        }
    }
});

// Handle end turn button
document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (game.currentPhase === 'attack') {
        game.nextTurn();
        renderer.render();

        // If next player is AI, make their move
        if (game.currentPlayer.isAI) {
            setTimeout(() => {
                ai.makeMove();
                renderer.render();
            }, 1000);
        }
    }
});

// Start game loop
function gameLoop() {
    renderer.render();
    requestAnimationFrame(gameLoop);
}

gameLoop(); 