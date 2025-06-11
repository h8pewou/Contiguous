import { game } from './game.js';

class Renderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.attackSource = null;
        this.scale = 1;
        this.hexWidth = 25;  // Match the map generator's hex size
        this.hexHeight = 25 * Math.sqrt(3) / 2;  // Proper hex height for pointy-top hexes
        this.viewport = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        this.updateScale();
        this.updateViewport();
    }

    updateScale() {
        // Calculate scale based on screen size
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        this.scale = minDimension / 1000; // Base scale on 1000px reference size
    }

    updateViewport() {
        // Update canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update viewport
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
    }

    setAttackSource(territoryId) {
        this.attackSource = territoryId;
    }

    getTerritoryAt(x, y) {
        if (!game.territories) return null;

        // Convert screen coordinates to world coordinates
        const worldX = (x - this.viewport.x) / this.scale;
        const worldY = (y - this.viewport.y) / this.scale;

        // Find the territory at these coordinates
        return game.territories.find(territory => {
            const dx = worldX - territory.x;
            const dy = worldY - territory.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.hexWidth;
        });
    }

    render(territories) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // If no territories, just return
        if (!territories || !Array.isArray(territories)) {
            return;
        }
        
        // Save context state
        this.ctx.save();
        
        // Apply viewport transform
        this.ctx.translate(this.viewport.x, this.viewport.y);
        this.ctx.scale(this.scale, this.scale);

        // Render territories
        territories.forEach(territory => {
            if (territory) {
                this.renderTerritory(territory);
            }
        });

        // Restore context state
        this.ctx.restore();
    }

    renderTerritory(territory) {
        if (!territory) return;
        
        const ctx = this.ctx;
        const x = territory.centerX || territory.x;
        const y = territory.centerY || territory.y;
        
        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const cornerX = x + this.hexWidth * Math.cos(angle);
            const cornerY = y + this.hexHeight * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(cornerX, cornerY);
            } else {
                ctx.lineTo(cornerX, cornerY);
            }
        }
        ctx.closePath();
        
        // Fill hexagon
        ctx.fillStyle = this.getTerritoryColor(territory);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw army circles
        if (territory.armies > 0) {
            const owner = game.players.find(p => p.id === territory.owner);
            const circleSize = this.hexWidth * 0.15;
            const spacing = this.hexWidth * 0.3;
            const rows = 3;
            const cols = 4;
            const totalCircles = rows * cols;

            // Calculate starting position to center the grid
            const startX = x - (cols - 1) * spacing / 2;
            const startY = y - (rows - 1) * spacing / 2;

            // Draw army circles in a grid
            for (let i = 0; i < Math.min(territory.armies, totalCircles); i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const circleX = startX + col * spacing;
                const circleY = startY + row * spacing;

                ctx.beginPath();
                ctx.arc(circleX, circleY, circleSize, 0, Math.PI * 2);
                ctx.fillStyle = owner ? owner.color : '#888888';
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        // Highlight attack source
        if (territory.id === this.attackSource) {
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    getTerritoryColor(territory) {
        const owner = game.players.find(p => p.id === territory.owner);
        return owner ? owner.color : '#888888';
    }

    showAttackAnimation(sourceId, targetId, success) {
        const source = game.territories.find(t => t.id === sourceId);
        const target = game.territories.find(t => t.id === targetId);
        
        if (!source || !target) return;

        // Draw attack line
        this.ctx.beginPath();
        this.ctx.moveTo(source.x, source.y);
        this.ctx.lineTo(target.x, target.y);
        this.ctx.strokeStyle = success ? '#0f0' : '#f00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Clear the line after a short delay
        setTimeout(() => this.render(game.territories), 500);
    }
}

export { Renderer }; 