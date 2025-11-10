/**
 * Cognito Pre-Sign-Up Trigger Lambda
 * 
 * Esta função é executada automaticamente pelo Cognito ANTES de criar um usuário.
 * 
 * Funcionalidades:
 * - Detecta se o usuário está vindo de login social (Google/GitHub) via triggerSource
 * - Marca email como verificado automaticamente quando vem de provedor social
 * - Extrai e define nickname baseado no nome do usuário
 * - Garante que atributos sejam preenchidos corretamente (email, nickname, sub)
 * 
 * @module lambda/cognito-pre-signup-trigger
 */

import type { PreSignUpTriggerHandler } from 'aws-lambda';

/**
 * Interface do evento Pre-Sign-Up do Cognito
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
    userAttributes?: Record<string, string>;
    autoConfirmUser?: boolean;
    autoVerifyEmail?: boolean;
    autoVerifyPhone?: boolean;
  };
}

/**
 * Handler do Pre-Sign-Up Trigger do Cognito
 * 
 * Este handler é invocado automaticamente pelo Cognito quando:
 * - Um usuário se registra via SignUp normal
 * - Um usuário faz login pela primeira vez via Identity Provider (Google/GitHub)
 * 
 * @param event - Evento do Cognito com informações do usuário
 * @param context - Contexto da execução Lambda
 * @returns Evento modificado com atributos atualizados
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  return processPreSignUpEvent(event as PreSignUpEvent);
};

/**
 * Processa o evento Pre-Sign-Up do Cognito
 * Pode ser chamada diretamente para testes locais
 * 
 * @param event - Evento Pre-Sign-Up do Cognito
 * @returns Evento modificado com atributos atualizados
 */
export function processPreSignUpEvent(event: PreSignUpEvent): PreSignUpEvent {
  console.log('🔔 Pre-Sign-Up Trigger executado', {
    userName: event.userName,
    userPoolId: event.userPoolId,
    triggerSource: event.triggerSource,
    request: {
      userAttributes: event.request.userAttributes,
    },
  });

  // Atributos do usuário que podem ser modificados
  const userAttributes = { ...(event.request.userAttributes || {}) };

  // Verifica se o usuário está vindo de um Identity Provider (Google/GitHub)
  // triggerSource pode ser: 'PreSignUp_ExternalProvider', 'PreSignUp_AdminCreateUser', 'PreSignUp_SignUp'
  const isSocialLogin = event.triggerSource === 'PreSignUp_ExternalProvider';

  if (isSocialLogin) {
    console.log('✅ Detectado login social - configurando atributos automaticamente');

    // 1. Marca email como verificado automaticamente
    // O email já foi verificado pelo provedor social (Google/GitHub)
    if (userAttributes.email && userAttributes.email_verified !== 'true') {
      userAttributes.email_verified = 'true';
      console.log(`✅ Email marcado como verificado: ${userAttributes.email}`);
    }

    // 2. Extrai e define nickname baseado no nome
    // Se não houver nickname, gera um baseado no nome completo ou username
    if (!userAttributes.nickname || userAttributes.nickname.trim() === '') {
      let nickname = '';

      // Tenta usar o nome completo primeiro
      if (userAttributes.name) {
        nickname = generateNicknameFromName(userAttributes.name);
      }
      // Se não tiver nome completo, tenta given_name + family_name
      else if (userAttributes.given_name || userAttributes.family_name) {
        const fullName = [userAttributes.given_name, userAttributes.family_name]
          .filter(Boolean)
          .join(' ');
        nickname = generateNicknameFromName(fullName);
      }
      // Como último recurso, usa o username (sem prefixo do provedor)
      else if (userAttributes.preferred_username) {
        nickname = cleanUsernameForNickname(userAttributes.preferred_username);
      }
      // Ou usa parte do email antes do @
      else if (userAttributes.email) {
        nickname = userAttributes.email.split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 30);
      }

      if (nickname && nickname.length >= 3) {
        userAttributes.nickname = nickname;
        console.log(`✅ Nickname gerado: ${nickname}`);
      }
    }

    // 3. Garante que preferred_username esteja definido
    // O Cognito usa isso como username principal
    if (!userAttributes.preferred_username && userAttributes.nickname) {
      userAttributes.preferred_username = userAttributes.nickname;
    }

    // 4. Normaliza o nome completo se não estiver definido
    if (!userAttributes.name && (userAttributes.given_name || userAttributes.family_name)) {
      const parts = [
        userAttributes.given_name,
        userAttributes.family_name,
      ].filter(Boolean);
      
      if (parts.length > 0) {
        userAttributes.name = parts.join(' ');
        console.log(`✅ Nome completo definido: ${userAttributes.name}`);
      }
    }

    console.log('✅ Atributos configurados para login social:', {
      email_verified: userAttributes.email_verified,
      nickname: userAttributes.nickname,
      preferred_username: userAttributes.preferred_username,
      name: userAttributes.name,
    });
  } else {
    console.log('ℹ️  Registro normal (não é login social) - mantendo comportamento padrão');
  }

  // Retorna o evento com os atributos atualizados
  // Para login social, precisamos confirmar automaticamente o usuário e verificar o email
  // pois o email já foi verificado pelo provedor social (Google/GitHub)
  
  return {
    ...event,
    response: {
      userAttributes: userAttributes,
      // Para login social: confirma automaticamente o usuário e verifica email
      // Para registro normal: deixa o Cognito gerenciar (usuário precisa confirmar email)
      autoConfirmUser: isSocialLogin, // Confirma automaticamente apenas para login social
      autoVerifyEmail: isSocialLogin, // Auto-verifica email apenas para login social
      autoVerifyPhone: false, // Não auto-verifica telefone (não usado no login social)
    },
  };
}

/**
 * Gera um nickname válido a partir de um nome completo
 * 
 * @param fullName - Nome completo do usuário
 * @returns Nickname limpo e válido (3-30 caracteres, apenas letras e números)
 */
function generateNicknameFromName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Remove acentos e caracteres especiais
  const normalized = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Remove caracteres inválidos, mantém apenas letras e números
  let nickname = normalized
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30);

  // Garante que tenha pelo menos 3 caracteres
  if (nickname.length < 3) {
    // Se muito curto, adiciona sufixo numérico
    nickname = `${nickname}_${Date.now().toString().slice(-3)}`;
    nickname = nickname.substring(0, 30);
  }

  return nickname;
}

/**
 * Limpa um username removendo prefixos de provedores sociais
 * 
 * @param username - Username que pode conter prefixos (ex: google_123456)
 * @returns Username limpo
 */
function cleanUsernameForNickname(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }

  // Remove prefixos comuns de provedores sociais
  const cleaned = username
    .replace(/^(google|github|facebook|amazon)_/i, '')
    .replace(/[^a-z0-9_]/gi, '')
    .toLowerCase()
    .substring(0, 30);

  // Garante mínimo de 3 caracteres
  if (cleaned.length < 3) {
    return cleaned + '_' + Date.now().toString().slice(-3);
  }

  return cleaned;
}
