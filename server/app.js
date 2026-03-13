require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const kingdomsRoutes = require('./routes/kingdoms');
const usersRoutes = require('./routes/users');
const githubRoutes = require('./routes/github');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// CORS Implementation restricted to CLIENT_URL
const allowedOrigins = [process.env.CLIENT_URL];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/kingdoms', kingdomsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/github', githubRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
