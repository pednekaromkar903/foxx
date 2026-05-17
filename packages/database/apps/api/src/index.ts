import express from 'express';
import cors from 'cors';
import innovationRoutes from './modules/innovation/innovation.routes';
import techRadarRoutes from './modules/tech-radar/tech-radar.routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/innovation', innovationRoutes);
app.use('/api/tech-radar', techRadarRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;
