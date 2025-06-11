# Contiguous

A browser-based territory control game where players compete to conquer territories and eliminate opponents.

## Features

- Hexagonal grid-based map
- Two-player gameplay (Human vs AI)
- Territory control mechanics
- Army management system
- Combat resolution with dice rolls and army bonuses
- Visual feedback for attacks and territory ownership
- Automated reinforcement placement
- AI opponent with strategic decision making

## How to Play

1. **Setup**
   - The game automatically starts with a human player (red) and an AI opponent (blue)
   - Territories are randomly assigned to players
   - Each territory starts with 2 armies

2. **Game Phases**
   - **Reinforcement Phase**
     - Players receive reinforcements based on the number of territories they control
     - Reinforcements are automatically placed for both players
   - **Attack Phase**
     - Players can attack adjacent enemy territories
     - Select a territory with more than 1 army to attack from
     - Click an adjacent enemy territory to attack
     - Combat is resolved with dice rolls and army bonuses

3. **Combat Rules**
   - Each combat involves a dice roll (1-6)
   - Army size bonus: +1 for every 2 armies (rounded down)
   - Attacker wins if their total (roll + bonus) is higher
   - Defender loses armies based on the margin of victory
   - Minimum of 1 army remains in each territory

4. **Winning**
   - The game ends when one player controls all territories
   - The last player standing wins

## Technical Details

- Built with vanilla JavaScript
- Uses HTML5 Canvas for rendering
- No external dependencies
- Responsive design that adapts to window size

## Development

To run the game locally:
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process or server required

## Future Improvements

- [ ] Add more AI difficulty levels
- [ ] Implement multiplayer support
- [ ] Add sound effects and music
- [ ] Create a tutorial mode
- [ ] Add game statistics and history
- [ ] Implement save/load functionality 