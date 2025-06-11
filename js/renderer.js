import { game } from './game.js';

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.armyCircleRadius = 4;
        this.armyCircleSpacing = 6;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderTerritories();
        this.renderArmies();
    }

    renderTerritories() {
        game.territories.forEach(territory => {
            // Draw territory
            this.ctx.beginPath();
            territory.points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            this.ctx.closePath();

            // Set territory color based on owner
            const owner = game.players.find(p => p.id === territory.owner);
            this.ctx.fillStyle = owner ? owner.color : '#666';
            this.ctx.fill();

            // Draw border
            this.ctx.strokeStyle = territory.id === game.attackSource ? '#fff' : '#999';
            this.ctx.lineWidth = territory.id === game.attackSource ? 2 : 1;
            this.ctx.stroke();
        });
    }

    renderArmies() {
        game.territories.forEach(territory => {
            if (territory.armies > 0) {
                // Calculate the grid dimensions for the army circles
                const circlesPerRow = 4;
                const rows = Math.ceil(territory.armies / circlesPerRow);
                
                // Calculate the starting position to center the grid
                const totalWidth = (circlesPerRow - 1) * this.armyCircleSpacing;
                const totalHeight = (rows - 1) * this.armyCircleSpacing;
                const startX = territory.centerX - totalWidth / 2;
                const startY = territory.centerY - totalHeight / 2;

                // Draw each army circle
                for (let i = 0; i < territory.armies; i++) {
                    const row = Math.floor(i / circlesPerRow);
                    const col = i % circlesPerRow;
                    
                    const x = startX + col * this.armyCircleSpacing;
                    const y = startY + row * this.armyCircleSpacing;

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, this.armyCircleRadius, 0, Math.PI * 2);
                    
                    // Set circle color based on owner
                    const owner = game.players.find(p => p.id === territory.owner);
                    this.ctx.fillStyle = owner ? owner.color : '#fff';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });
    }

    showAttackAnimation(sourceId, targetId, success) {
        const source = game.territories.find(t => t.id === sourceId);
        const target = game.territories.find(t => t.id === targetId);
        
        if (!source || !target) return;

        // Draw attack line
        this.ctx.beginPath();
        this.ctx.moveTo(source.centerX, source.centerY);
        this.ctx.lineTo(target.centerX, target.centerY);
        this.ctx.strokeStyle = success ? '#0f0' : '#f00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Clear the line after a short delay
        setTimeout(() => this.render(), 500);
    }
}

export { Renderer }; 