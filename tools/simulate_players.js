const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const HOST_URL = process.env.WS_URL || 'wss://vpn.sicloid.xyz:8443';
const PLAYER_COUNT = 500;
const ANSWER_DELAY_MS = 2000; // Random max delay before answering

const gamePin = process.argv[2];

if (!gamePin) {
  console.error("Lütfen bir PIN girin. Örnek: node simulate_players.js 123456");
  process.exit(1);
}

console.log(`Starting load test with ${PLAYER_COUNT} players on ${HOST_URL} for PIN: ${gamePin}...`);

let players = [];
let playersConnected = 0;
let disconnectedPlayers = 0;

function connectPlayers() {
  let connected = 0;
  
  // 50'şer 50'şer bağlanarak Nginx/VPS'i bir anda kitlememeye çalışıyoruz
  const batchSize = 50; 
  
  const connectBatch = () => {
    for (let i = 0; i < batchSize && connected < PLAYER_COUNT; i++) {
      const playerId = crypto.randomUUID();
      const playerName = `Bot_${connected}`;
      
      const ws = new WebSocket(`${HOST_URL}/ws/player?pin=${gamePin}&name=${playerName}&id=${playerId}`, {
        headers: { Origin: 'https://kanhoot.vercel.app' }
      });
      
      ws.on('open', () => {
        playersConnected++;
        if (playersConnected % 50 === 0) {
          console.log(`Players joined: ${playersConnected}/${PLAYER_COUNT}`);
        }
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'question_started') {
          // Send random answer when host starts the question
          setTimeout(() => {
            const colors = ['red', 'blue', 'yellow', 'green'];
            const optionCount = msg.data?.optionCount || 4;
            const validColors = colors.slice(0, optionCount);
            const randomColor = validColors[Math.floor(Math.random() * validColors.length)];
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'answer',
                data: { color: randomColor }
              }));
            }
          }, Math.random() * ANSWER_DELAY_MS);
        }

        if (msg.type === 'game_ended') {
            console.log(`Player ${playerName} received game_ended.`);
        }
      });

      ws.on('close', () => {
        disconnectedPlayers++;
      });

      ws.on('error', (err) => {
        console.error(`Player ${playerId} error:`, err.message);
      });
      
      players.push(ws);
      connected++;
    }
    
    if (connected < PLAYER_COUNT) {
      setTimeout(connectBatch, 200);
    } else {
        console.log("All connection attempts sent. Wait for host to start the game.");
        // Interval to check disconnected count
        setInterval(() => {
            if(disconnectedPlayers > 0) {
                console.log(`Current Status: Connected=${playersConnected - disconnectedPlayers}, Disconnected=${disconnectedPlayers}`);
            }
        }, 5000);
    }
  };
  
  connectBatch();
}

connectPlayers();
