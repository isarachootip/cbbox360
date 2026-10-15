import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './server/config/env.js';
import apiRoutes from './server/routes/index.js';
import webhookRoutes from './server/routes/webhookRoutes.js';
import { initBotSettingsFromDb } from './server/services/botEngineService.js';
import { ensureDatabaseSchema } from './server/services/dbInitService.js';
import { ensureAllSeedAccounts } from './server/services/userSeedService.js';
import { userRepository } from './server/repositories/userRepository.js';
import { hashPassword } from './server/utils/cryptoUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;
app.set('trust proxy', env.TRUST_PROXY);

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

// Initialize DB schema, seed accounts (PostgreSQL or in-memory fallback) & bot settings
ensureDatabaseSchema()
  .then(() =>
    ensureAllSeedAccounts({
      userRepo: userRepository,
      hashPassword,
      defaultPassword: env.SEED_DEFAULT_PASSWORD,
      mustChangePassword: false,
    })
  )
  .then((provisioned) => {
    if (provisioned.length === 0) return;
    console.log(
      `🔐 [Auth] Provisioned/recovered ${provisioned.length} seed accounts: ${provisioned
        .map((p) => `${p.username}(${p.action})`)
        .join(', ')}`
    );
  })
  .catch((err) => console.error('❌ [Auth Seed Error]:', err.message));
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
