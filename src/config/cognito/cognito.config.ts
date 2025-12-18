/**
 * Configurações do AWS Cognito
 * 
 * Este arquivo contém todas as configurações relacionadas
 * ao serviço Cognito da AWS para autenticação.
 */

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Interface de configuração do Cognito
 */
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  clientSecret?: string;
  region: string;
  issuer: string;
  jwksUrl: string;
}

/**
 * Obtém as configurações do Cognito a partir das variáveis de ambiente
 */
export function getCognitoConfig(): CognitoConfig {
  const region = process.env.AWS_REGION || 'us-east-1';
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID is required');
  }

  if (!clientId) {
    throw new Error('COGNITO_CLIENT_ID is required');
  }

  return {
    userPoolId,
    clientId,
    clientSecret,
    region,
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    jwksUrl: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
  };
}

/**
 * Cria uma instância do cliente Cognito Identity Provider
 */
export function createCognitoClient(): CognitoIdentityProviderClient {
  const config = getCognitoConfig();
  
  return new CognitoIdentityProviderClient({
    region: config.region,
  });
}

/**
 * URLs de redirecionamento para OAuth
 */
export const cognitoRedirectUrls = {
  development: 'http://localhost:3000/dashboard/login/callback',
  staging: 'https://staging.seudominio.com/dashboard/login/callback',
  production: 'https://seudominio.com/dashboard/login/callback',
};

/**
 * Scopes padrão para OAuth
 */
export const cognitoScopes = [
  'email',
  'openid',
  'profile',
  'aws.cognito.signin.user.admin',
];
