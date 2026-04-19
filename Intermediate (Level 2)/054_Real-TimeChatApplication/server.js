const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ADMIN_PASSWORD = 'admin123';

let users = [];       // { id, username, isAdmin }
let chatHistory = []; // { id, username, message, time }
let activityLog = []; // { event, username, time }

app.use(express.static(path.join(__dirname, 'public')));

function getTime() {
  return new Date().toLocaleTimeString();
}

function logActivity(event, username) {
  const entry = { event, username, time: getTime() };
  activityLog.push(entry);
  io.emit('activityLog', activityLog);
}

io.on('connection', (socket) => {

  // User joins
  socket.on('join', ({ username }) => {
    if (!username || !username.trim()) {
      socket.emit('joinError', 'Username cannot be empty');
      return;
    }
    username = username.trim();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      socket.emit('joinError', 'Username already taken');
      return;
    }
    socket.username = username;
    socket.isAdmin = false;
    users.push({ id: socket.id, username, isAdmin: false });

    socket.emit('joinSuccess', { username, chatHistory, activityLog });
    io.emit('userList', users);

    const sysMsg = { id: Date.now(), username: 'System', message: `${username} joined the chat`, time: getTime(), system: true };
    chatHistory.push(sysMsg);
    io.emit('message', sysMsg);
    logActivity('joined', username);
  });

  // Admin login
  socket.on('adminLogin', ({ password }) => {
    if (password === ADMIN_PASSWORD) {
      socket.isAdmin = true;
      const user = users.find(u => u.id === socket.id);
      if (user) user.isAdmin = true;
      socket.emit('adminLoginSuccess');
      io.emit('userList', users);
    } else {
      socket.emit('adminLoginFail', 'Wrong password');
    }
  });

  // Send message
  socket.on('message', ({ message }) => {
    if (!message || !message.trim()) return;
    if (!socket.username) return;
    const msg = { id: Date.now() + Math.random(), username: socket.username, message: message.trim(), time: getTime(), system: false };
    chatHistory.push(msg);
    io.emit('message', msg);
  });

  // Admin: kick user
  socket.on('kickUser', ({ targetId }) => {
    if (!socket.isAdmin) return;
    const target = users.find(u => u.id === targetId);
    if (target) {
      io.to(targetId).emit('kicked', 'You have been kicked by admin');
      io.sockets.sockets.get(targetId)?.disconnect(true);
    }
  });

  // Admin: delete message
  socket.on('deleteMessage', ({ msgId }) => {
    if (!socket.isAdmin) return;
    chatHistory = chatHistory.filter(m => m.id != msgId);
    io.emit('messageDeleted', msgId);
  });

  // Admin: clear chat
  socket.on('clearChat', () => {
    if (!socket.isAdmin) return;
    chatHistory = [];
    io.emit('chatCleared');
    logActivity('cleared chat', socket.username);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      users = users.filter(u => u.id !== socket.id);
      io.emit('userList', users);
      const sysMsg = { id: Date.now(), username: 'System', message: `${socket.username} left the chat`, time: getTime(), system: true };
      chatHistory.push(sysMsg);
      io.emit('message', sysMsg);
      logActivity('left', socket.username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));