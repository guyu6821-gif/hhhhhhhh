const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// In-memory message store
let messages = [];

// Admin credentials
const ADMIN_USER = 'FATİMƏ1618';
const ADMIN_PASS = 'majorursa0618';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin login check
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Yanlış məlumatlar' });
  }
});

// Get all messages
app.get('/api/messages', (req, res) => {
  const { auth } = req.headers;
  if (auth !== 'FATİMƏ1618:majorursa0618') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(messages);
});

// Submit message (from "login" form)
app.post('/api/submit', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Ad və mesaj tələb olunur' });
  }
  const msg = {
    id: Date.now(),
    name: name.trim(),
    message: message.trim(),
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleString('az-AZ', {
      timeZone: 'Asia/Baku',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
  messages.push(msg);
  // Emit to all admin sockets
  io.to('admin-room').emit('new-message', msg);
  res.json({ success: true });
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join-admin', (data) => {
    if (data && data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
      socket.join('admin-room');
      socket.emit('all-messages', messages);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
