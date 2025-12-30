/**
 * @fileoverview Trigger Cognito Pre Sign-Up
 * 
 * Trigger do AWS Cognito que executa antes do signup.
 * Valida email, gera nickname e adiciona atributos customizados.
 * 100% compatível com Free Tier da AWS.
 * 
 * @module lambda/cognito-pre-signup-trigger
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import type { Context } from 'aws-lambda';

/**
 * Interface para evento do trigger Cognito.
 */
export interface PreSignUpEvent {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  triggerSource: string;
  request: {
    userAttributes: Record<string, string>;
    validationData?: Record<string, string>;
  };
  response: {
    userAttributes: Record<string, string>;
    autoConfirmUser: boolean;
    autoVerifyEmail: boolean;
    autoVerifyPhone: boolean;
  };
}

/**
 * Lista de domínios permitidos para registro.
 * 
 * @type {string[]}
 */
const ALLOWED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'tutanota.com',
];

/**
 * Gera nickname único baseado no nome.
 * 
 * @function generateNicknameFromName
 * @param {string} fullName - Nome completo
 * @returns {string} Nickname gerado
 */
function generateNicknameFromName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const normalized = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let nickname = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, parseInt(process.env.NICKNAME_MAX_LENGTH || '30'));

  if (nickname.length < parseInt(process.env.NICKNAME_MIN_LENGTH || '3')) {
    nickname = `${nickname}_${Date.now().toString().slice(-3)}`;
    nickname = nickname.substring(0, parseInt(process.env.NICKNAME_MAX_LENGTH || '30'));
  }

  return nickname;
}

/**
 * Limpa username para uso como nickname.
 * 
 * @function cleanUsernameForNickname
 * @param {string} username - Username original
 * @returns {string} Username limpo
 */
function cleanUsernameForNickname(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }

  const providers = (process.env.SOCIAL_PROVIDERS || 'google,github,facebook,amazon').split(',');
  const pattern = new RegExp(`^(${providers.join('|')})_`, 'i');
  const cleaned = username
    .replace(pattern, '')
    .replace(/[^a-z0-9_]/gi, '')
    .toLowerCase()
    .substring(0, parseInt(process.env.NICKNAME_MAX_LENGTH || '30'));

  if (cleaned.length < parseInt(process.env.NICKNAME_MIN_LENGTH || '3')) {
    return cleaned + '_' + Date.now().toString().slice(-3);
  }

  return cleaned;
}

/**
 * Valida se o domínio do email é permitido.
 * 
 * @function validateEmailDomain
 * @param {string} email - Email para validar
 * @returns {boolean} True se domínio é permitido
 */
function validateEmailDomain(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  
  // Em desenvolvimento, permite qualquer domínio
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Verifica se email está em lista negra (opcional).
 * 
 * @function isEmailBlacklisted
 * @param {string} email - Email para verificar
 * @returns {boolean} True se email está bloqueado
 */
function isEmailBlacklisted(email: string): boolean {
  const blacklist = process.env.EMAIL_BLACKLIST?.split(',') || [];
  return blacklist.includes(email.toLowerCase());
}

/**
 * Handler principal do trigger Cognito Pre Sign-Up.
 * 
 * @async
 * @export
 * @function handler
 * @param {PreSignUpEvent} event - Evento do Cognito
 * @param {Context} context - Context da Lambda
 * @returns {Promise<PreSignUpEvent>} Evento modificado
 * 
 * @example
 * ```typescript
 * // Evento recebido:
 * {
 *   "triggerSource": "PreSignUp_SignUp",
 *   "userName": "joao@gmail.com",
 *   "request": {
 *     "userAttributes": {
 *       "email": "joao@gmail.com",
 *       "name": "João Silva"
 *     }
 *   },
 *   "response": {
 *     "autoConfirmUser": false,
 *     "autoVerifyEmail": false
 *   }
 * }
 * ```
 */
export const handler = async (
  event: PreSignUpEvent,
  _context: Context
): Promise<PreSignUpEvent> => {
  console.log('🔐 Cognito Pre Sign-Up Trigger:', {
    triggerSource: event.triggerSource,
    userName: event.userName,
  });

  try {
    const userAttributes = { ...event.request.userAttributes };
    const isSocialLogin = event.triggerSource.includes('ExternalProvider');

    if (isSocialLogin) {
      console.log('🔗 Social login detected');

      if (userAttributes.email_verified === 'true') {
        userAttributes.email_verified = 'true';
        console.log(`Email marked as verified: ${userAttributes.email}`);
      }

      if (!userAttributes.nickname || userAttributes.nickname.trim() === '') {
        let nickname = '';

        if (userAttributes.name) {
          nickname = generateNicknameFromName(userAttributes.name);
        } else if (userAttributes.given_name || userAttributes.family_name) {
          const fullName = [userAttributes.given_name, userAttributes.family_name]
            .filter(Boolean)
            .join(' ');
          nickname = generateNicknameFromName(fullName);
        } else if (userAttributes.preferred_username) {
          nickname = cleanUsernameForNickname(userAttributes.preferred_username);
        } else if (userAttributes.email) {
          nickname = userAttributes.email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 30);
        }

        if (nickname && nickname.length >= 3) {
          userAttributes.nickname = nickname;
          console.log(`Nickname generated: ${nickname}`);
        }
      }

      if (!userAttributes.preferred_username && userAttributes.nickname) {
        userAttributes.preferred_username = userAttributes.nickname;
      }

      if (!userAttributes.name && (userAttributes.given_name || userAttributes.family_name)) {
        const parts = [
          userAttributes.given_name,
          userAttributes.family_name,
        ].filter(Boolean);
        
        if (parts.length > 0) {
          userAttributes.name = parts.join(' ');
          console.log(`Full name defined: ${userAttributes.name}`);
        }
      }

      console.log('Attributes configured for social login:', {
        email_verified: userAttributes.email_verified,
        nickname: userAttributes.nickname,
        preferred_username: userAttributes.preferred_username,
        name: userAttributes.name,
      });
    } else {
      console.log('Normal signup (not social login) - maintaining default behavior');
      
      // Validações para signup tradicional
      const email = userAttributes.email;
      
      if (!email) {
        throw new Error('Email é obrigatório');
      }

      if (isEmailBlacklisted(email)) {
        throw new Error('Email não permitido');
      }

      if (!validateEmailDomain(email)) {
        throw new Error('Domínio de email não permitido');
      }

      // Gera nickname automaticamente se não fornecido
      if (!userAttributes.nickname) {
        const base = email.toLowerCase().split('@')[0];
        userAttributes.nickname = base.replace(/[^a-z0-9]/g, '').substring(0, 30);
        console.log(`🏷️ Nickname gerado: ${userAttributes.nickname}`);
      }
    }

    // Adiciona atributos customizados
    const now = new Date().toISOString();
    userAttributes['custom:created_at'] = now;
    userAttributes['custom:signup_method'] = isSocialLogin ? 'social' : 'email';
    userAttributes['custom:role'] = 'SUBSCRIBER';

    return {
      ...event,
      response: {
        userAttributes,
        autoConfirmUser: isSocialLogin,
        autoVerifyEmail: isSocialLogin,
        autoVerifyPhone: false,
      },
    };
  } catch (error) {
    console.error('❌ Erro no Pre Sign-Up:', {
      error: error instanceof Error ? error.message : error,
      userName: event.userName,
      email: event.request.userAttributes.email,
    });

    // Lança erro para bloquear o signup
    throw new Error(error instanceof Error ? error.message : 'Falha no processamento');
  }
};

/**
 * Handler alternativo para Post Authentication (opcional).
 * 
 * Executa após login bem-sucedido para sincronizar dados.
 * 
 * @export
 * @function postAuthenticationHandler
 * @param {unknown} event - Evento do Cognito
 * @returns {Promise<unknown>} Evento não modificado
 */
export const postAuthenticationHandler = async (
  event: unknown
): Promise<unknown> => {
  console.log('🔓 Cognito Post Authentication:', {
    userName: (event as any).userName,
    userPoolId: (event as any).userPoolId,
  });

  // TODO: Sincronizar com banco de dados local
  // - Criar/atualizar usuário no MongoDB
  // - Atualizar último login
  // - Verificar status da conta

  return event;
};

/**
 * Handler para Pre Authentication (opcional).
 * 
 * Executa antes do login para validações adicionais.
 * 
 * @export
 * @function preAuthenticationHandler
 * @param {unknown} event - Evento do Cognito
 * @returns {Promise<unknown>} Evento não modificado
 */
export const preAuthenticationHandler = async (
  event: unknown
): Promise<unknown> => {
  console.log('🔒 Cognito Pre Authentication:', {
    userName: (event as any).userName,
    triggerSource: (event as any).triggerSource,
  });

  // TODO: Validações antes do login
  // - Verificar se usuário não está banido
  // - Verificar se conta está ativa
  // - Rate limiting por IP

  return event;
};

export default handler;
