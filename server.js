import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import morgan from 'morgan';
import app from './src/app.js';
import connectDB from './src/config/db.js';

// ── ESM __dirname EQUIVALENT ────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── ENSURE LOGS FOLDER EXISTS ────────────────────────
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'access.log');
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '');
}

const accessLogStream = fs.createWriteStream(logFile, { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

const PORT = process.env.PORT || 4000;

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 BSF-Nutrifeed Server running on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION:', err.message);
      server.close(() => process.exit(1));
    });

    process.on('SIGINT', async () => {
      console.log('🛑 Gracefully shutting down...');
      await mongoose.connection.close();
      server.close(() => {
        console.log('💤 Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();