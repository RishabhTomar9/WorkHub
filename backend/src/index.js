import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import sitesRoutes from './routes/sites.js';
import workersRoutes from './routes/workers.js';
import attendanceRoutes from './routes/attendance.js';
import payoutsRoutes from './routes/payouts.js';
import paymentsRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));
app.use(morgan('combined'));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/sites', sitesRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/payments', paymentsRoutes);

app.use(errorHandler);

try {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
} catch (err) {
  console.error('❌ Failed to connect DB', err);
  process.exit(1);
}
