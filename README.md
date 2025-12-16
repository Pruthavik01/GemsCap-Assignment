# GemsCap - Quantitative Trading Analytics Platform

<div align="center">

![GemsCap Banner](https://img.shields.io/badge/GemsCap-Quant%20Analytics-00d4aa?style=for-the-badge)
[![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb?style=flat-square&logo=react)](https://reactjs.org/)

*Real-time cryptocurrency analytics dashboard for quantitative traders*

[Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Usage](#usage) • [API](#api-documentation) • [Contributing](#contributing)

</div>

---

## 📖 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**GemsCap** is a professional-grade quantitative trading analytics platform designed for traders, researchers, and analysts at high-frequency trading (HFT) firms. It provides real-time market data ingestion, statistical analysis, and interactive visualization for cryptocurrency markets.

### Context

Built as an evaluation project for **Quant Developer** positions, GemsCap demonstrates end-to-end capabilities in:
- Real-time data ingestion and storage
- Quantitative analytics computation
- Interactive data visualization
- Statistical arbitrage analysis
- Risk-premia harvesting metrics
- Market-making indicators

### Key Capabilities

- **Real-time Tick Data**: WebSocket streaming from Binance futures
- **OHLCV Resampling**: Configurable timeframes (1s, 1m, 5m)
- **Statistical Analysis**: Price statistics, correlations, z-scores
- **Pair Trading**: Hedge ratio computation, spread analysis, cointegration tests
- **Live Analytics**: Sub-second latency updates on streaming data
- **Data Export**: CSV export for further analysis

---

## ✨ Features

### 📊 Data Management
- ✅ Real-time tick data ingestion from Binance WebSocket
- ✅ Multi-symbol subscription management
- ✅ Configurable data sampling (1s, 1m, 5m timeframes)
- ✅ In-memory circular buffer storage (100k ticks)
- ✅ Server-Sent Events (SSE) for live streaming

### 📈 Analytics Engine
- ✅ **Price Statistics**: Mean, median, std dev, min/max, volume
- ✅ **Hedge Ratio**: OLS regression on log prices
- ✅ **Spread Analysis**: Log-price spread computation
- ✅ **Z-Score**: Rolling window z-score calculation
- ✅ **Correlation**: Rolling correlation between symbol pairs
- ✅ **ADF Test**: Stationarity testing (planned)

### 🎨 Visualization Dashboard
- ✅ Interactive price charts with Recharts
- ✅ Live ticker with price change indicators
- ✅ Spread and z-score visualization
- ✅ Recent trades history
- ✅ Symbol subscription management
- ✅ Data export functionality

### ⚡ Performance
- ✅ Sub-second latency for tick data
- ✅ Near real-time analytics updates
- ✅ Efficient in-memory storage
- ✅ Auto-reconnection on connection loss

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | REST API framework |
| **WebSocket (ws)** | Binance stream connection |
| **Custom State Manager** | In-memory tick storage |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18.3** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Recharts** | Charting library |
| **TanStack Query** | Data fetching & caching |
| **Tailwind CSS** | Styling framework |
| **shadcn/ui** | Component library |

### Data Source
- **Binance WebSocket API**: Real-time futures market data
- Stream endpoint: `wss://fstream.binance.com/ws/{symbol}@trade`

---

### Demo video link
- [https://drive.google.com/file/d/1w9v-YL7sZth-ldONkFAEadZ6G6PhMmpz/view?usp=sharing]
---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GemsCap Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐         ┌──────────────────────┐        │
│  │   Binance API      │         │   Frontend (React)   │        │
│  │   WebSocket        │         │                      │        │
│  │   (fstream)        │         │  - Dashboard         │        │
│  └─────────┬──────────┘         │  - Charts            │        │
│            │                     │  - Analytics         │        │
│            │ Tick Data           │  - Controls          │        │
│            ▼                     └──────────┬───────────┘        │
│  ┌─────────────────────┐                   │                    │
│  │  Backend (Node.js)  │                   │ HTTP/SSE           │
│  │                     │◄──────────────────┘                    │
│  │  ┌───────────────┐  │                                        │
│  │  │ WebSocket     │  │  REST API Endpoints:                   │
│  │  │ Handler       │  │  - /tick/latest                        │
│  │  └───────┬───────┘  │  - /tick/history                       │
│  │          │          │  - /tick/sample                        │
│  │          ▼          │  - /tick/stream (SSE)                  │
│  │  ┌───────────────┐  │  - /analytics/*                        │
│  │  │ State Manager │  │  - /symbols/*                          │
│  │  │ (In-Memory)   │  │  - /exports/*                          │
│  │  │               │  │                                        │
│  │  │ • Circular    │  │                                        │
│  │  │   Buffer      │  │                                        │
│  │  │ • 100k Ticks  │  │                                        │
│  │  │ • EventEmitter│  │                                        │
│  │  └───────┬───────┘  │                                        │
│  │          │          │                                        │
│  │          ▼          │                                        │
│  │  ┌───────────────┐  │                                        │
│  │  │ Analytics     │  │                                        │
│  │  │ Engine        │  │                                        │
│  │  │               │  │                                        │
│  │  │ • Resampling  │  │                                        │
│  │  │ • Statistics  │  │                                        │
│  │  │ • OLS         │  │                                        │
│  │  │ • Z-Score     │  │                                        │
│  │  └───────────────┘  │                                        │
│  └─────────────────────┘                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Ingestion**: Binance WebSocket → Backend WebSocket Handler
2. **Storage**: Handler → State Manager (Circular Buffer)
3. **Processing**: State Manager → Analytics Engine (on-demand)
4. **Delivery**: Analytics Engine → REST API → Frontend
5. **Streaming**: State Manager → SSE Stream → Frontend (live updates)

---

## 📦 Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### Step 1: Clone the Repository

```bash
git clone https://github.com/Pruthavik01/Gemscap-backend.git
cd gemscap
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

**Backend Dependencies:**
- express: ^5.2.1
- ws: ^8.18.3
- cors: ^2.8.5
- nodemon: ^3.1.11 (dev)

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

**Frontend Dependencies:**
- react: ^18.3.1
- typescript: ^5.8.3
- vite: ^5.4.19
- @tanstack/react-query: ^5.83.0
- recharts: ^2.15.4
- tailwindcss: ^3.4.17
- shadcn/ui components
- lucide-react: ^0.462.0

### Step 4: Install Root Dependencies

```bash
npm install
```

**Root Dependencies:**
- concurrently: ^9.2.1 (dev)

---

## 🚀 Usage

### Development Mode

Run both backend and frontend simultaneously:

```bash
npm run dev
```

This command uses `concurrently` to run:
- **Backend**: `http://localhost:3000` (Node.js + Express)
- **Frontend**: `http://localhost:8080` (Vite dev server)

### Individual Services

**Run Backend Only:**
```bash
npm run backend
# or
cd backend && nodemon index.js
```

**Run Frontend Only:**
```bash
npm run frontend
# or
cd frontend && npm run dev
```

### Building for Production

**Frontend Build:**
```bash
cd frontend
npm run build
```

Builds to `frontend/dist/` directory.

---

## 🎮 Getting Started Guide

### 1. Start the Application

```bash
npm run dev
```

### 2. Open the Dashboard

Navigate to `http://localhost:8080` in your browser.

### 3. Subscribe to Symbols

Click on **Symbol Streams** panel → Select symbols from Quick Add or enter custom symbols (e.g., `btcusdt`, `ethusdt`).

### 4. View Real-time Data

- **Live Ticker**: Displays latest price and size
- **Price Chart**: OHLCV candlestick chart
- **Recent Trades**: Last 20 trades
- **Statistics**: Price stats for selected timeframe

### 5. Pair Analysis

1. Select **Base Symbol** (e.g., `btcusdt`)
2. Select **Quote Symbol** (e.g., `ethusdt`)
3. Navigate to **Pairs** tab
4. View:
   - Z-Score chart (mean reversion indicator)
   - Spread chart (log price difference)
   - Hedge ratio (β coefficient)

### 6. Export Data

Go to **Settings** tab → **Export Data** → Select symbol and date range → Click **Export to CSV**.

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /health
```
**Response:** `"OK"`

---

#### Symbols

**List Active Symbols**
```http
GET /symbols
```
**Response:**
```json
["btcusdt", "ethusdt", "bnbusdt"]
```

**Subscribe to Symbol**
```http
POST /symbols/subscribe
Content-Type: application/json

{
  "symbol": "btcusdt"
}
```

**Unsubscribe from Symbol**
```http
POST /symbols/unsubscribe
Content-Type: application/json

{
  "symbol": "btcusdt"
}
```

---

#### Tick Data

**Get Latest Tick**
```http
GET /tick/latest
```
**Response:**
```json
{
  "symbol": "btcusdt",
  "price": 43250.50,
  "size": 0.125,
  "ts": "2024-01-15T10:30:45.123Z"
}
```

**Get Tick History**
```http
GET /tick/history?symbol=btcusdt&limit=100&reverse=true
```
**Query Parameters:**
- `symbol` (optional): Filter by symbol
- `since` (optional): ISO timestamp
- `until` (optional): ISO timestamp
- `limit` (default: 1000): Max records
- `reverse` (default: true): Newest first

**Sample OHLCV Data**
```http
GET /tick/sample?symbol=btcusdt&timeframe=1m&limit=100
```
**Query Parameters:**
- `symbol` (required): Symbol to sample
- `timeframe` (default: 1s): `1s`, `1m`, `5m`
- `since` (optional): ISO timestamp
- `until` (optional): ISO timestamp
- `limit` (default: 500): Max buckets

**Response:**
```json
{
  "meta": {
    "timeframe": "1m",
    "symbol": "btcusdt",
    "buckets": 100
  },
  "data": [
    {
      "t": "2024-01-15T10:30:00.000Z",
      "o": 43200.00,
      "h": 43300.00,
      "l": 43150.00,
      "c": 43250.50,
      "v": 125.45,
      "count": 234
    }
  ]
}
```

**Stream Ticks (SSE)**
```http
GET /tick/stream?symbol=btcusdt
```
**Event Stream:**
```
event: tick
data: {"symbol":"btcusdt","price":43250.50,"size":0.125,"ts":"2024-01-15T10:30:45.123Z"}
```

---

#### Analytics

**Get Statistics**
```http
GET /analytics/stats?symbol=btcusdt&timeframe=1m
```
**Response:**
```json
{
  "symbol": "btcusdt",
  "timeframe": "1m",
  "count": 100,
  "mean": 43250.50,
  "median": 43248.00,
  "std": 125.45,
  "min": 43000.00,
  "max": 43500.00,
  "totalVolume": 1250.45
}
```

**Get Spread**
```http
GET /analytics/spread?base=btcusdt&quote=ethusdt&timeframe=1m&limit=100
```
**Response:**
```json
{
  "base": "btcusdt",
  "quote": "ethusdt",
  "hedgeRatio": 17.5432,
  "zLatest": -1.234,
  "data": [
    {
      "t": "2024-01-15T10:30:00.000Z",
      "spread": 0.0234
    }
  ]
}
```

**Get Z-Score**
```http
GET /analytics/zscore?base=btcusdt&quote=ethusdt&window=60&timeframe=1s&limit=200
```
**Response:**
```json
{
  "base": "btcusdt",
  "quote": "ethusdt",
  "window": 60,
  "zLatest": -1.234,
  "data": [
    {
      "t": "2024-01-15T10:30:45.000Z",
      "z": -1.234
    }
  ]
}
```

**Get Hedge Ratio**
```http
GET /analytics/hedge-ratio?base=btcusdt&quote=ethusdt&timeframe=1m
```
**Response:**
```json
{
  "base": "btcusdt",
  "quote": "ethusdt",
  "method": "ols-log",
  "beta": 17.5432,
  "alpha": 0.0234,
  "r2": 0.9876,
  "n": 100
}
```

---

#### Exports

**Export Ticks to CSV**
```http
GET /exports/ticks?symbol=btcusdt&since=2024-01-15T00:00:00Z&until=2024-01-15T23:59:59Z
```
**Response:** CSV file download
```csv
timestamp,symbol,price,size
2024-01-15T10:30:45.123Z,btcusdt,43250.50,0.125
```

---

## 📁 Project Structure

```
gemscap/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── binanceWS.js       # WebSocket connection handler
│   │   ├── state.js           # In-memory data storage
│   │   ├── server.js          # Express server setup
│   │   └── routes/
│   │       ├── tick.route.js       # Tick data endpoints
│   │       ├── analytic.route.js   # Analytics endpoints
│   │       ├── symbol.route.js     # Symbol management
│   │       ├── alert.route.js      # Alert endpoints (planned)
│   │       └── export.route.js     # CSV export
│   ├── index.js               # Entry point
│   ├── package.json
│   └── package-lock.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── Header.tsx
│   │   │   ├── LiveTicker.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── ZScoreChart.tsx
│   │   │   ├── SpreadChart.tsx
│   │   │   ├── TickHistory.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   ├── SymbolSubscription.tsx
│   │   │   ├── ExportPanel.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useTickStream.ts    # SSE hook
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/
│   │   │   ├── api.ts         # API client
│   │   │   └── utils.ts       # Utility functions
│   │   ├── pages/
│   │   │   ├── Index.tsx      # Main dashboard
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx            # Root component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── package.json               # Root package (scripts)
├── package-lock.json
└── README.md
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

### Backend Configuration

Edit `backend/src/server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Frontend Configuration

Edit `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
});
```

### State Manager Configuration

Edit `backend/src/state.js`:

```javascript
class TickState extends EventEmitter {
  constructor({ maxTicks = 100_000 } = {}) {
    // Adjust buffer size
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test all changes locally
- Update documentation as needed

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Pruthavik**
- GitHub: [@Pruthavik01](https://github.com/Pruthavik01)
- Repository: [gemscap-backend](https://github.com/Pruthavik01/Gemscap-backend)

---

## 🙏 Acknowledgments

- **Binance API** for real-time market data
- **shadcn/ui** for beautiful UI components
- **Recharts** for powerful charting capabilities
- **TanStack Query** for efficient data management

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API specifications

---

<div align="center">

**Built with ❤️ for Quantitative Traders**

[![GitHub stars](https://img.shields.io/github/stars/Pruthavik01/Gemscap-backend?style=social)](https://github.com/Pruthavik01/Gemscap-backend)
[![GitHub forks](https://img.shields.io/github/forks/Pruthavik01/Gemscap-backend?style=social)](https://github.com/Pruthavik01/Gemscap-backend/fork)

</div>
