import { Token } from 'oauth2-server';
import express from 'express';

export interface TypedRequest extends express.Request {
  auth: Partial<Token>;
}
