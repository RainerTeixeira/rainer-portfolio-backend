/**
 * Configuração do AWS Cognito
 * 
 * Este módulo centraliza todas as configurações necessárias para autenticação
 * de usuários usando o AWS Cognito.
 * 
 * **O que é AWS Cognito?**
 * É um serviço da AWS que gerencia autenticação e autorização de usuários.
 * Ele cuida de login, registro, recuperação de senha, MFA, etc.
 * 
 * **Propósito deste arquivo:**
 * - Centralizar todas as credenciais e configurações do Cognito
 * - Facilitar o acesso às configurações em qualquer módulo
 * - Validar se o Cognito está configurado corretamente
 * 
 * **Quando é usado:**
 * - Login de usuários
 * - Registro de novos usuários
 * - Validação de tokens JWT
 * - Recuperação de senha
 * - Refresh de tokens
 * 
 * @fileoverview Configuração do AWS Cognito
 * @module cognito.config
 */

import { env } from './env';

/**
 * Configurações do AWS Cognito
 * 
 * Objeto com todas as credenciais e configurações necessárias para
 * autenticação via AWS Cognito.
 * 
 * **Propriedades:**
 * 
 * - **userPoolId**: ID do User Pool no Cognito
 *   - É como o "ID do banco de usuários"
 *   - Formato: us-east-1_XXXXXXXXX
 *   - Onde encontrar: AWS Console > Cognito > User Pools
 * 
 * - **clientId**: ID da aplicação cliente
 *   - Identifica sua aplicação no Cognito
 *   - Cada app (web, mobile) pode ter um clientId diferente
 *   - Formato: string alfanumérica longa
 * 
 * - **clientSecret**: Segredo da aplicação (opcional)
 *   - Usado para autenticação server-to-server
 *   - Mantenha em segredo! Nunca exponha no frontend
 *   - Usado em fluxos de autenticação backend
 * 
 * - **region**: Região AWS onde o Cognito está hospedado
 *   - Ex: us-east-1, us-west-2, sa-east-1 (São Paulo)
 *   - Fallback para AWS_REGION se não especificado
 * 
 * - **issuer**: URL do emissor dos tokens JWT
 *   - Formato: https://cognito-idp.{region}.amazonaws.com/{userPoolId}
 *   - Usado para validar se os tokens são legítimos
 *   - Tokens JWT contêm este valor no campo "iss"
 * 
 * - **jwtSecret**: Segredo para assinar tokens JWT customizados (opcional)
 *   - Usado se você gera seus próprios tokens além dos do Cognito
 *   - Para tokens Cognito, este não é necessário
 * 
 * @example
 * // Importar as configurações em um serviço de autenticação
 * import { cognitoConfig } from './config/cognito.config';
 * 
 * const client = new CognitoIdentityProviderClient({
 *   region: cognitoConfig.region
 * });
 * 
 * @example
 * // Validar token JWT
 * import { cognitoConfig } from './config/cognito.config';
 * import jwt from 'jsonwebtoken';
 * 
 * const decoded = jwt.verify(token, cognitoConfig.jwtSecret, {
 *   issuer: cognitoConfig.issuer
 * });
 */
export const cognitoConfig = {
  userPoolId: env.COGNITO_USER_POOL_ID,
  clientId: env.COGNITO_CLIENT_ID,
  clientSecret: env.COGNITO_CLIENT_SECRET,
  region: env.COGNITO_REGION || env.AWS_REGION,
  issuer: env.COGNITO_ISSUER,
  jwtSecret: env.JWT_SECRET,
};

/**
 * Verifica se as configurações mínimas do Cognito estão presentes
 * 
 * **O que verifica:**
 * - Se o User Pool ID está definido
 * - Se o Client ID está definido
 * - Se a região está definida
 * 
 * **Para que serve:**
 * Evitar que a aplicação tente usar o Cognito sem as configurações necessárias.
 * Útil para validar o ambiente antes de iniciar a aplicação.
 * 
 * **Quando usar:**
 * - Na inicialização da aplicação (main.ts)
 * - Antes de registrar o módulo de autenticação
 * - Em health checks para verificar se o serviço está configurado
 * 
 * **Observação:**
 * Esta função verifica apenas os campos OBRIGATÓRIOS.
 * O clientSecret e jwtSecret são opcionais dependendo do fluxo de autenticação.
 * 
 * @returns true se as configurações mínimas estão presentes, false caso contrário
 * 
 * @example
 * // Validar no início da aplicação
 * import { isCognitoConfigured } from './config/cognito.config';
 * 
 * if (!isCognitoConfigured()) {
 *   console.error('❌ Cognito não está configurado!');
 *   console.error('Configure as variáveis: COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION');
 *   process.exit(1);
 * }
 * 
 * console.log('✅ Cognito configurado com sucesso!');
 * 
 * @example
 * // Usar em um health check
 * import { isCognitoConfigured } from './config/cognito.config';
 * 
 * @Get('health')
 * getHealth() {
 *   return {
 *     status: 'ok',
 *     cognito: isCognitoConfigured() ? 'configured' : 'not configured'
 *   };
 * }
 * 
 * @example
 * // Validar antes de usar serviços de autenticação
 * import { isCognitoConfigured, cognitoConfig } from './config/cognito.config';
 * 
 * if (isCognitoConfigured()) {
 *   // Prosseguir com autenticação
 *   await authService.login(credentials);
 * } else {
 *   throw new Error('Autenticação não disponível - Cognito não configurado');
 * }
 */
export function isCognitoConfigured(): boolean {
  return !!(
    cognitoConfig.userPoolId &&
    cognitoConfig.clientId &&
    cognitoConfig.region
  );
}

