// src/routes/debug.ts
import { Router } from 'express';
import { debugEnv, debugSimple } from '../controllers/debugController';

const router = Router();

router.get('/env', debugEnv);
router.get('/simple', debugSimple);

export default router;