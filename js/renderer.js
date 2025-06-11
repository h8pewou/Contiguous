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
        this.battleResult = null;
        this.battleResultTimeout = null;
        this.updateScale();
        this.updateViewport();

        // Add click handler for battle result overlay
        this.canvas.addEventListener('click', (event) => {
            if (this.battleResult) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (event.clientX - rect.left - this.viewport.x) / this.scale;
                const y = (event.clientY - rect.top - this.viewport.y) / this.scale;
                
                // Check if click is within battle result overlay
                const overlayX = this.battleResult.x;
                const overlayY = this.battleResult.y;
                const overlayWidth = 120;
                const overlayHeight = 80;
                
                if (x >= overlayX - overlayWidth/2 && 
                    x <= overlayX + overlayWidth/2 && 
                    y >= overlayY - overlayHeight/2 && 
                    y <= overlayY + overlayHeight/2) {
                    this.battleResult = null;
                    this.render(game.territories);
                }
            }
        });
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
        // Convert screen coordinates to world coordinates
        const worldX = (x - this.viewport.x) / this.scale;
        const worldY = (y - this.viewport.y) / this.scale;
        
        // Find the territory that contains this point
        return game.territories.find(territory => {
            const dx = worldX - territory.centerX;
            const dy = worldY - territory.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < this.hexWidth * 0.6; // Slightly smaller than hex radius for better click accuracy
        });
    }

    render(territories) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply viewport transform
        this.ctx.translate(this.viewport.x, this.viewport.y);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw territories
        territories.forEach(territory => this.renderTerritory(territory));
        
        // Draw battle result if it exists
        if (this.battleResult) {
            const { x, y, attacker, defender } = this.battleResult;
            
            // Draw background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.roundRect(x - 80, y - 40, 160, 80, 10);
            this.ctx.fill();
            
            // Draw text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            
            // Attacker info
            const attackerRollsText = attacker.rolls.join(' + ');
            this.ctx.fillText(`Attacker: ${attackerRollsText} + ${attacker.bonus} = ${attacker.total}`, x, y - 15);
            
            // Defender info
            const defenderRollsText = defender.rolls.join(' + ');
            this.ctx.fillText(`Defender: ${defenderRollsText} + ${defender.bonus} = ${defender.total}`, x, y + 15);
            
            // Result
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = attacker.total > defender.total ? '#0f0' : '#f00';
            this.ctx.fillText(attacker.total > defender.total ? 'Attacker Wins!' : 'Defender Wins!', x, y + 40);
        }
        
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
        
        // Draw border with enhanced selection effect
        if (territory.id === this.attackSource) {
            // Pulsing effect for selected territory
            const pulseIntensity = 0.5 + Math.sin(Date.now() / 200) * 0.2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulseIntensity})`;
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
        }
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
    }

    getTerritoryColor(territory) {
        const owner = game.players.find(p => p.id === territory.owner);
        return owner ? owner.color : '#888888';
    }

    showAttackAnimation(sourceId, targetId, success, attackerRolls, defenderRolls, attackerBonus, defenderBonus) {
        const source = game.territories.find(t => t.id === sourceId);
        const target = game.territories.find(t => t.id === targetId);
        
        if (!source || !target) return;

        // Draw attack line with animation
        const startTime = Date.now();
        const duration = 500; // 500ms animation

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Clear previous frame
            this.render(game.territories);
            
            // Draw animated attack line
            this.ctx.beginPath();
            this.ctx.moveTo(source.centerX, source.centerY);
            
            // Add a slight curve to the line
            const midX = (source.centerX + target.centerX) / 2;
            const midY = (source.centerY + target.centerY) / 2;
            const curveOffset = 20;
            const controlX = midX + (Math.random() - 0.5) * curveOffset;
            const controlY = midY + (Math.random() - 0.5) * curveOffset;
            
            this.ctx.quadraticCurveTo(controlX, controlY, target.centerX, target.centerY);
            
            // Animate the line color
            const alpha = 1 - progress;
            this.ctx.strokeStyle = success ? 
                `rgba(0, 255, 0, ${alpha})` : 
                `rgba(255, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Show battle result
            this.showBattleResult(source, target, attackerRolls, defenderRolls, attackerBonus, defenderBonus);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    showBattleResult(source, target, attackerRolls, defenderRolls, attackerBonus, defenderBonus) {
        const attackerTotal = attackerRolls.reduce((sum, roll) => sum + roll, 0) + attackerBonus;
        const defenderTotal = defenderRolls.reduce((sum, roll) => sum + roll, 0) + defenderBonus;
        
        // Calculate position for the overlay
        const x = (source.centerX + target.centerX) / 2;
        const y = (source.centerY + target.centerY) / 2;
        
        this.battleResult = {
            attacker: {
                rolls: attackerRolls,
                bonus: attackerBonus,
                total: attackerTotal
            },
            defender: {
                rolls: defenderRolls,
                bonus: defenderBonus,
                total: defenderTotal
            },
            x: x,
            y: y,
            timestamp: Date.now()
        };
        
        // Draw battle result overlay
        const ctx = this.ctx;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x - 80, y - 40, 160, 80, 10);
        ctx.fill();
        
        // Draw text
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        // Attacker info
        const attackerRollsText = attackerRolls.join(' + ');
        ctx.fillText(`Attacker: ${attackerRollsText} + ${attackerBonus} = ${attackerTotal}`, x, y - 15);
        
        // Defender info
        const defenderRollsText = defenderRolls.join(' + ');
        ctx.fillText(`Defender: ${defenderRollsText} + ${defenderBonus} = ${defenderTotal}`, x, y + 15);
        
        // Result
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = attackerTotal > defenderTotal ? '#0f0' : '#f00';
        ctx.fillText(attackerTotal > defenderTotal ? 'Attacker Wins!' : 'Defender Wins!', x, y + 40);
    }
}

export { Renderer }; 