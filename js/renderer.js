import { game } from './game.js';

class GameRenderer {
    constructor(container) {
        this.container = container;
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.container.appendChild(this.svg);
        
        this.territoryElements = new Map();
        this.attackLine = null;
    }

    renderTerritory(territory) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-territory-id', territory.id);
        group.classList.add('territory');

        // Create territory shape
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', territory.x);
        rect.setAttribute('y', territory.y);
        rect.setAttribute('width', territory.width);
        rect.setAttribute('height', territory.height);
        rect.setAttribute('rx', '10');
        rect.setAttribute('ry', '10');
        group.appendChild(rect);

        // Create army circles container
        const circlesContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        circlesContainer.classList.add('army-circles');
        
        // Create 12 circles in a honeycomb pattern
        for (let i = 0; i < 12; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const row = Math.floor(i / 4);
            const col = i % 4;
            const spacing = 8;
            const startX = territory.x + (territory.width - (3 * spacing)) / 2;
            const startY = territory.y + (territory.height - (3 * spacing)) / 2;
            
            circle.setAttribute('cx', startX + col * spacing);
            circle.setAttribute('cy', startY + row * spacing);
            circle.setAttribute('r', '3');
            circle.classList.add('army-circle');
            circlesContainer.appendChild(circle);
        }
        
        group.appendChild(circlesContainer);
        this.svg.appendChild(group);
        this.territoryElements.set(territory.id, group);

        // Add click handler
        group.addEventListener('click', () => this.handleTerritoryClick(territory.id));

        this.updateTerritory(territory);
    }

    updateTerritory(territory) {
        const element = this.territoryElements.get(territory.id);
        if (!element) return;

        const rect = element.querySelector('rect');
        const circles = element.querySelectorAll('.army-circle');
        const owner = game.players.find(p => p.id === territory.owner);

        // Update territory color
        rect.style.fill = owner ? owner.color : '#666';
        rect.style.stroke = territory.id === game.selectedTerritory ? '#fff' : '#999';

        // Update army circles
        circles.forEach((circle, index) => {
            circle.classList.toggle('filled', index < territory.armies);
            circle.style.fill = owner ? owner.color : 'none';
        });

        // Update selection state
        element.classList.toggle('selected', territory.id === game.selectedTerritory);
    }

    handleTerritoryClick(territoryId) {
        const territory = game.territories.get(territoryId);
        if (!territory) return;

        if (game.currentPhase === 'reinforcement') {
            if (territory.owner === game.currentPlayer.id) {
                game.setArmies(territoryId, territory.armies + 1);
                this.updateTerritory(territory);
            }
        } else if (game.currentPhase === 'attack') {
            if (!game.attackSource) {
                if (territory.owner === game.currentPlayer.id && territory.armies > 1) {
                    game.attackSource = territoryId;
                    this.updateTerritory(territory);
                }
            } else {
                if (game.canAttack(game.attackSource, territoryId)) {
                    const success = game.resolveCombat(game.attackSource, territoryId);
                    this.showAttackAnimation(game.attackSource, territoryId, success);
                    game.attackSource = null;
                    this.updateAllTerritories();
                }
            }
        }
    }

    showAttackAnimation(sourceId, targetId, success) {
        const source = game.territories.get(sourceId);
        const target = game.territories.get(targetId);
        
        if (!source || !target) return;

        // Create attack line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', source.x + source.width/2);
        line.setAttribute('y1', source.y + source.height/2);
        line.setAttribute('x2', target.x + target.width/2);
        line.setAttribute('y2', target.y + target.height/2);
        line.classList.add('attack-line');
        this.svg.appendChild(line);

        // Remove line after animation
        setTimeout(() => {
            this.svg.removeChild(line);
        }, 1000);
    }

    updateAllTerritories() {
        game.territories.forEach(territory => {
            this.updateTerritory(territory);
        });
    }

    clear() {
        this.svg.innerHTML = '';
        this.territoryElements.clear();
    }
}

export { GameRenderer }; 