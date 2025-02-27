import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import healthRoute from './routes/health.route';
import bidRoutes from './routes/bid.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Routes
app.use('/api/health', healthRoute);
app.use('/api/bids', bidRoutes);

// Other routes will be added here

// Error handling middleware
app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(_err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

export default app; 