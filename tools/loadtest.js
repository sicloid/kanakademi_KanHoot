import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 200, // 200 Concurrent Users
  duration: '30s', // Load for 30 seconds
};

export default function () {
  // Using localhost since we will run backend locally for this test first.
  // We can change this to the VPS IP later.
  const url = 'ws://localhost:8080/ws/player?pin=123456&name=TestUser_' + __VU;
  const res = ws.connect(url, { headers: { Origin: 'http://localhost:3000' } }, function (socket) {
    socket.on('open', () => {
      // Send an answer immediately after opening
      socket.send(JSON.stringify({ type: 'answer', data: { color: 'red' } }));
    });
    
    // Periodically send answers every 2 seconds
    socket.setInterval(function() {
      const colors = ['red', 'blue', 'green', 'yellow'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      socket.send(JSON.stringify({ type: 'answer', data: { color: randomColor } }));
    }, 2000);

    socket.setTimeout(function () {
      socket.close();
    }, 30000); // close after 30 seconds
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
