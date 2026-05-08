const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: ['http://localhost:8080', 'https://factory-admin-panel-phi.vercel.app', 'https://id-preview--1d3aa0eb-1a49-49d7-b5bd-227f097ccaf2.lovable.app'],           // ← your frontend URL (Vite default)
  credentials: true,                         // ← VERY IMPORTANT
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/items', require('./routes/items'));
app.use('/api/stages', require('./routes/stages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));

// Error Middleware (last)
app.use(require('./middlewares/errorMiddleware'));

// Socket.io for real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join rooms based on role (e.g., supervisors join 'supervisor' room)
  socket.on('joinRoom', (role) => {
    socket.join(role);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

async function seedStages() {
  const defaultStages = [
    'Raw Material Received', 'Cutting / Machining', 'Fabrication / Welding',
    'Assembly', 'Quality Inspection', 'Finishing / Painting',
    'Final Testing', 'Packaging', 'Dispatch'
  ];
  const existing = await require('./models/Stage').countDocuments();
  if (existing === 0) {
    defaultStages.forEach(async (name, index) => {
      await require('./models/Stage').create({ name, order: index + 1 });
    });
  }
}

// Global emitter function for updates
global.io = io; // Make io accessible in controllers/services

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    // seedStages();
});