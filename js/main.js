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

    handleTerritoryClick(clickedTerritory);
});

function handleTerritoryClick(territory) {
    if (!territory) return;

    if (game.currentPhase === 'attack' && game.currentPlayer.id === 1) {
        if (!renderer.attackSource) {
            // First click - select source territory
            if (territory.owner === 1 && territory.armies > 1) {
                renderer.attackSource = territory.id;
                renderer.render(game.territories);
            }
        } else {
            // Second click - attack target territory
            const sourceTerritory = game.territories.find(t => t.id === renderer.attackSource);
            if (sourceTerritory && sourceTerritory.neighbors.includes(territory.id)) {
                if (territory.owner !== 1) {
                    // Calculate number of dice for attacker and defender
                    const attackerDice = Math.min(3, sourceTerritory.armies - 1);
                    const defenderDice = Math.min(2, territory.armies);

                    console.log(`Attacker armies: ${sourceTerritory.armies}, rolling ${attackerDice} dice`);
                    console.log(`Defender armies: ${territory.armies}, rolling ${defenderDice} dice`);

                    // Roll dice for attacker
                    const attackerRolls = [];
                    for (let i = 0; i < attackerDice; i++) {
                        const roll = Math.floor(Math.random() * 6) + 1;
                        attackerRolls.push(roll);
                        console.log(`Attacker roll ${i + 1}: ${roll}`);
                    }
                    attackerRolls.sort((a, b) => b - a);

                    // Roll dice for defender
                    const defenderRolls = [];
                    for (let i = 0; i < defenderDice; i++) {
                        const roll = Math.floor(Math.random() * 6) + 1;
                        defenderRolls.push(roll);
                        console.log(`Defender roll ${i + 1}: ${roll}`);
                    }
                    defenderRolls.sort((a, b) => b - a);

                    // Calculate bonuses
                    const attackerBonus = Math.floor(sourceTerritory.armies / 3);
                    const defenderBonus = Math.floor(territory.armies / 2);

                    console.log(`Attacker bonus: ${attackerBonus}`);
                    console.log(`Defender bonus: ${defenderBonus}`);

                    // Calculate total for each side by summing all dice and adding bonus
                    const attackerTotal = attackerRolls.reduce((sum, roll) => sum + roll, 0) + attackerBonus;
                    const defenderTotal = defenderRolls.reduce((sum, roll) => sum + roll, 0) + defenderBonus;
                    const success = attackerTotal > defenderTotal;

                    console.log(`Final comparison: ${attackerTotal} vs ${defenderTotal}`);
                    console.log(`Battle result: ${success ? 'Attacker wins' : 'Defender wins'}`);

                    // Show attack animation with battle info
                    renderer.showAttackAnimation(
                        sourceTerritory.id,
                        territory.id,
                        success,
                        attackerRolls,
                        defenderRolls,
                        attackerBonus,
                        defenderBonus
                    );

                    if (success) {
                        // Transfer territory
                        territory.owner = 1;
                        territory.armies = 1;
                        sourceTerritory.armies--;
                    } else {
                        // Defender wins
                        territory.armies--;
                        if (territory.armies <= 0) {
                            territory.owner = 1;
                            territory.armies = 1;
                            sourceTerritory.armies--;
                        }
                    }

                    // Check win condition
                    const winner = game.checkWinCondition();
                    if (winner) {
                        alert(`Player ${winner.id} wins!`);
                        game.initialize(mapGenerator, renderer, ai);
                    }
                }
            }
            renderer.attackSource = null;
            renderer.render(game.territories);
        }
    }
}

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