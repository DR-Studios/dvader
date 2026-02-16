const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dvader server running on http://localhost:${PORT}`);
    console.log(`Phone: http://<YOUR_PC_IP>:${PORT}/phone.html`);
    console.log(`PC Dashboard: http://localhost:${PORT}/dashboard.html`);
});

const wss = new WebSocket.Server({ server });
const clients = { phone: null, dashboard: null };
wss.on('connection', (ws, req) => {
    const clientType = req.url.split('?type=')[1] || 'unknown';
    console.log(`Client connected: ${clientType}`);
    if (clientType === 'phone') {
        clients.phone = ws;
    } else if (clientType === 'dashboard') {
        clients.dashboard = ws;
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Message from ${clientType}:`, data);
            if (clientType === 'phone' && clients.dashboard) {
                clients.dashboard.send(JSON.stringify({ type: 'voice_message', text: data.text, timestamp: new Date().toISOString() }));
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientType}`);
        if (clientType === 'phone') clients.phone = null;
        if (clientType === 'dashboard') clients.dashboard = null;
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error (${clientType}):`, error);
    });
});

process.on('SIGINT', () => {
    console.log('Server shutting down...');
    process.exit(0);
});