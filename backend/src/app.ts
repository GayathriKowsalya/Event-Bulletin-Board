import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';
import eventRoutes from './routes/eventRoutes';
import qaRoutes from './routes/qaRoutes';
import aiRoutes from './routes/aiRoutes';
import jobRoutes from './routes/jobRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config();

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: frontendUrl
}));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', qaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

export default app;
