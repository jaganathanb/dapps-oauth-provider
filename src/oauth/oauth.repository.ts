import { AuthorizationCode, Client, RefreshToken, Token } from 'oauth2-server';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';

import { AppDataSource } from '@db/data-source';
import {
  OAuthAccessToken,
  OAuthAuthorizationCode,
  OAuthClient,
  OAuthRefreshToken,
  User,
} from '@db/entity';

const clientRepo = AppDataSource.getRepository(OAuthClient);
const authCodeRepo = AppDataSource.getRepository(OAuthAuthorizationCode);
const authRefreshTokenRepo = AppDataSource.getRepository(OAuthRefreshToken);
const authAccessTokenRepo = AppDataSource.getRepository(OAuthAccessToken);
const userRepo = AppDataSource.getRepository(User);

const getClient = async (
  clientId: string,
  clientSecret: string,
): Promise<Client> => {
  const client = await clientRepo.findOne({
    where: { clientId, clientSecret },
  });

  if (!client) throw new Error('Client not found');

  return {
    id: client.clientId,
    grants: client.grants,
    redirectUris: [client.callbackUrl],
  } as Client;
};

/**
 * Save authorization code.
 */
const saveAuthorizationCode = async (
  code: Pick<
    AuthorizationCode,
    'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope'
  >,
  client: Client,
  user: User,
): Promise<AuthorizationCode> => {
  const authorizationCode: OAuthAuthorizationCode = {
    authorizationCode: code.authorizationCode,
    expiresAt: code.expiresAt.toISOString(),
    redirectUri: code.redirectUri,
    scope: code.scope as string,
    clientId: client.id,
    userId: user.userId,
  } as OAuthAuthorizationCode;

  const authCode = await authCodeRepo.upsert(authorizationCode, {
    skipUpdateIfNoValuesChanged: true,
  } as UpsertOptions<OAuthAuthorizationCode>);

  const data = authCode.generatedMaps[0] as AuthorizationCode;

  return {
    authorizationCode: data.authorizationCode,
    expiresAt: new Date(data.expiresAt),
    scope: data.scope,
  } as AuthorizationCode;
};

/**
 * Get authorization code.
 */
const getAuthorizationCode = async (
  authorizationCode: string,
): Promise<AuthorizationCode> => {
  const code = await authCodeRepo.findOne({ where: { authorizationCode } });

  if (!code) throw new Error('Authorization code not found');

  return {
    authorizationCode: code.authorizationCode,
    expiresAt: new Date(code.expiresAt),
    redirectUri: code.redirectUri,
    scope: code.scope,
  } as AuthorizationCode;
};

/**
 * Revoke authorization code.
 */
const revokeAuthorizationCode = async ({
  authorizationCode,
}: AuthorizationCode): Promise<boolean> => {
  const res = await authCodeRepo.delete({
    authorizationCode,
  });

  return res.affected === 1;
};

/**
 * Revoke a refresh token.
 */
const revokeToken = async ({
  refreshToken,
}: RefreshToken): Promise<boolean> => {
  const res = await authRefreshTokenRepo.delete({ refreshToken });

  return res.affected === 1;
};

/**
 * Save token.
 */
const saveToken = async (
  token: Token,
  client: Client,
  user: User,
): Promise<Token> => {
  if (token.accessToken) {
    const data = token;
    await authAccessTokenRepo.upsert(
      {
        accessToken: data.accessToken,
        accessTokenExpiresAt: (data.accessTokenExpiresAt as Date).toISOString(),
        scope: data.scope,
        clientId: client.id,
        userId: user.userId,
      } as OAuthAccessToken,
      { skipUpdateIfNoValuesChanged: true } as UpsertOptions<OAuthAccessToken>,
    );

    return {
      accessToken: data.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt as Date,
      scope: data.scope,
    } as Token;
  } else {
    const data = token as RefreshToken;

    await authRefreshTokenRepo.upsert(
      {
        refreshToken: data.refreshToken,
        refreshTokenExpiresAt: data.refreshTokenExpiresAt?.toISOString(),
        scope: data.scope,
        clientId: client.id,
        userId: user.userId,
      } as OAuthRefreshToken,
      { skipUpdateIfNoValuesChanged: true } as UpsertOptions<OAuthRefreshToken>,
    );

    return {
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
    } as Token;
  }
};

/**
 * Get access token.
 */
const getAccessToken = async (accessToken: string): Promise<Token> => {
  const token = await authAccessTokenRepo.findOne({ where: { accessToken } });

  if (!token) throw new Error('Access token not found');

  return {
    accessToken: token.accessToken,
    accessTokenExpiresAt: new Date(token.accessTokenExpiresAt),
    scope: token.scope,
    client: { id: token.clientId } as Client,
    user: { userId: token.userId } as User,
  } as Token;
};

/**
 * Get refresh token.
 */
const getRefreshToken = async (refreshToken: string): Promise<RefreshToken> => {
  const token = await authRefreshTokenRepo.findOne({ where: { refreshToken } });
  if (!token) throw new Error('Refresh token not found');

  return {
    refreshToken: token.refreshToken,
    // refreshTokenExpiresAt: token.refreshTokenExpiresAt, // never expires
    scope: token.scope,
    client: { id: token.clientId } as Client,
    user: { userId: token.userId } as User,
  } as RefreshToken;
};

const verifyScope = async (token: Token, scope: string): Promise<boolean> => {
  if (!token.scope) {
    return false;
  }

  const requestedScopes = scope.split(' ');
  const authorizedScopes = (token.scope as string).split(' ');

  return Promise.resolve(
    requestedScopes.every((s) => authorizedScopes.indexOf(s) >= 0),
  );
};

const validateScope = async (
  user: User,
  client: Client,
  scope: string,
): Promise<string> => {
  const dbClient = await clientRepo.findOneBy({ clientId: client.id });
  if (dbClient) {
    return scope
      .split(' ')
      .filter((s) => dbClient?.allowedScopes?.indexOf(s) >= 0)
      .join(' ');
  }

  return '';
};

export default {
  saveToken,
  saveAuthorizationCode,
  revokeAuthorizationCode,
  revokeToken,
  getAuthorizationCode,
  getAccessToken,
  getClient,
  verifyScope,
  validateScope,
  getRefreshToken,
  clientRepo,
  userRepo,
};
