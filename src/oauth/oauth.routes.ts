import express, { NextFunction, Request, Response } from 'express';

import { TypedRequest } from '@common/types';

import { authenticate, authorize, oauthTest, token } from './oauth.controller';

const router = express.Router();

router.get('/authorize', async (req, res) =>
  authorize(req as TypedRequest, res),
);
router.post('/token', token);
router.get(
  '/authenticate',
  async (req: Request, res: Response, n: NextFunction) =>
    authenticate(req as TypedRequest, res, n),
  async (req, res) => oauthTest(req as TypedRequest, res),
);

export default router;
