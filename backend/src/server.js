import './config/env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Connect DB
connectDB();

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: config.nodeEnv, timestamp: new Date().toISOString() })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () =>
  console.log(`🚀 Server running on http://localhost:${config.port} [${config.nodeEnv}]`)
);
