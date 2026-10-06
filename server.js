import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './server/config/env.js';
import apiRoutes from './server/routes/index.js';
import webhookRoutes from './server/routes/webhookRoutes.js';
import { initBotSettingsFromDb } from './server/services/botEngineService.js';
import { ensureDatabaseSchema } from './server/services/dbInitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;

// Middlewares
app.use(cors());
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize DB schema & bot settings
ensureDatabaseSchema();
initBotSettingsFromDb();

// API Routes
app.use('/api', apiRoutes);
// Legacy / v1 webhook alias compatibility
app.use('/v1/webhooks', webhookRoutes);

// Static Frontend (Vite SPA)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CusBox 360 Production Server running on port ${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (via DATABASE_URL)`);
  console.log(`📡 API & Webhooks: http://0.0.0.0:${PORT}/api/webhooks/line/:channelId`);
});
