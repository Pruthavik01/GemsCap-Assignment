const { startBinanceWS } = require('./src/binanceWS');
const { startServer } = require('./src/server');

startBinanceWS();
startServer();
