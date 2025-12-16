const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

const tickRoutes = require('./routes/tick.route');
const analyticRoutes =  require('./routes/analytic.route')
const alertRoutes = require('./routes/alert.route');
const exportRoutes = require('./routes/export.route');
const symbolRoutes = require('./routes/symbol.route');

app.use(cors({
  origin: [
    'http://localhost:8080', // Vite dev
    'http://localhost:5173', // default Vite
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Backend is running');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use('/tick', tickRoutes);
app.use('/analytics', analyticRoutes);

app.use("/alerts", alertRoutes);

app.use('/exports', exportRoutes);

app.use('/symbols', symbolRoutes);


function startServer() {
  app.listen(PORT, () => {
    console.log(`🌐 API running at http://localhost:${PORT}`);
  });
}

module.exports = { startServer };
