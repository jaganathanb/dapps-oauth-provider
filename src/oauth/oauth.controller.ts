import express, { NextFunction } from 'express';
import OAuth2Server, { Request, Response } from 'oauth2-server';

import { logger } from '@common/config';
import { TypedRequest } from '@common/types';
import { ApiError } from '@common/utils/api-error';

import authRepo from './oauth.repository';

const server = new OAuth2Server({
  model: authRepo,
});

const authorize = async (
  req: TypedRequest,
  res: express.Response,
): Promise<void> => {
  const request = new Request(req);
  const response = new Response(res);

  return server
    .authorize(request, response, {
      authenticateHandler: {
        handle: async () => {
          // Present in Flow 1 and Flow 2 ('client_id' is a required for /oauth/authorize
          const { client_id } = req.query || {};
          if (!client_id) throw new Error('Client ID not found');
          const client = await authRepo.clientRepo.findOneBy({
            clientId: client_id as string,
          });
          if (!client) throw new Error('Client not found');
          // Only present in Flow 2 (authentication screen)
          const { user } = req.auth;

          // At this point, if there's no 'userId' attached to the client or the request doesn't originate from an authentication screen,
          // then do not bind this authorization code to any user, just the client
          if (!client.userId && !user?.userId) return {}; // falsy value

          const dbUser = await authRepo.userRepo.findOneBy({
            ...(client.userId && { userId: client.userId }),
          });
          if (!dbUser) throw new Error('User not found');

          return { userId: dbUser.userId };
        },
      },
    })
    .then((result) => {
      res.json(result);
    })
    .catch((err: ApiError) => {
      logger.log('err', err);
      res
        .status(err.statusCode || 500)
        .json(err instanceof Error ? { error: err.message } : err);
    });
};

const token = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  const request = new Request(req);
  const response = new Response(res);

  return server
    .token(request, response, { alwaysIssueNewRefreshToken: false })
    .then((result) => {
      res.json(result);
    })
    .catch((err: ApiError) => {
      logger.error('err', err);
      res
        .status(err.statusCode || 500)
        .json(err instanceof Error ? { error: err.message } : err);
    });
};

const authenticate = async (
  req: TypedRequest,
  res: express.Response,
  next: NextFunction,
): Promise<void> => {
  const request = new Request(req);
  const response = new Response(res);

  return server
    .authenticate(request, response)
    .then((data) => {
      req.auth = {
        user: {
          userId: data?.user?.['userId'] as string,
        },
      };

      next();
    })
    .catch((err: ApiError) => {
      logger.error('err', err);
      res
        .status(err.statusCode || 500)
        .json(err instanceof Error ? { error: err.message } : err);
    });
};

const oauthTest = async (
  req: TypedRequest,
  res: express.Response,
): Promise<void> => {
  const { user } = req.auth;
  if (!user?.userId) throw new Error('User not found');
  const dbUser = await authRepo.userRepo.findOneBy({
    userId: user?.userId as string,
  });
  if (!dbUser) throw new Error('User not found');
  res.json({ userId: dbUser.userId, username: dbUser.email });
};

export { server, authorize, token, authenticate, oauthTest };
