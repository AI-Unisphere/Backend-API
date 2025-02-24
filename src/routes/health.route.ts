import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router; 