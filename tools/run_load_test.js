const WebSocket = require('ws');
const { spawn } = require('child_process');

const HOST_URL = process.env.WS_URL || 'wss://vpn.sicloid.xyz:8443';

console.log(`Connecting host to ${HOST_URL}...`);
const hostWs = new WebSocket(`${HOST_URL}/ws/host`, {
  headers: { Origin: 'https://kanhoot.vercel.app' }
});

let gamePin = null;

hostWs.on('open', () => {
    console.log('Host connected. Waiting for PIN...');
});

hostWs.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('Host received:', msg.type);
    
    if (msg.type === 'game_created') {
        gamePin = msg.data.pin;
        console.log(`Game created with PIN: ${gamePin}`);
        
        const questions = [
            { question: "Q1", time_limit_sec: 20, correct_index: 0, options: ["A", "B", "C", "D"] },
            { question: "Q2", time_limit_sec: 20, correct_index: 1, options: ["A", "B", "C", "D"] }
        ];
        hostWs.send(JSON.stringify({ type: "set_questions", data: { questions } }));
        console.log('Set questions.');
        
        console.log('Spawning players...');
        const playersProcess = spawn('node', ['tools/simulate_players.js', gamePin], { stdio: 'inherit' });
        
        setTimeout(() => {
            console.log('Starting game...');
            hostWs.send(JSON.stringify({ type: "start_game" }));
        }, 15000);
    }
    
    if (msg.type === 'question_started') {
        console.log(`Question started. Waiting 5s for players to answer...`);
        setTimeout(() => {
            console.log('Ending question...');
            hostWs.send(JSON.stringify({ type: "end_question" }));
        }, 5000);
    }
    
    if (msg.type === 'question_ended') {
        console.log(`Question ended. Leaderboard size:`, msg.data.leaderboard.length);
        setTimeout(() => {
            hostWs.send(JSON.stringify({ type: "next_question" }));
        }, 3000);
    }

    if (msg.type === 'game_ended') {
        console.log(`Game ended successfully.`);
        setTimeout(() => process.exit(0), 1000);
    }
});

hostWs.on('close', () => console.log('Host closed'));
hostWs.on('error', (e) => console.error('Host error:', e));
