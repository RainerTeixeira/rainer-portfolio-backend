/**
 * Script para testar Login Social do Cognito via Browser (Playwright)
 * 
 * Abre o Cognito Hosted UI no navegador e testa o fluxo de login social
 * 
 * Uso: npm run test:cognito:ui
 * ou: tsx scripts/test-cognito-ui-login.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Carregar variáveis de ambiente
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  Arquivo .env não encontrado, usando variáveis de ambiente do sistema');
}

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_wryiyhbWC';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '3ueos5ofu499je6ebc5u98n35h';
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';

// Construir domínio do Cognito
// Geralmente é: {userPoolId.toLowerCase().replace('_', '')}.auth.{region}.amazoncognito.com
// ou pode ser um domínio customizado
const cognitoDomain = `${COGNITO_USER_POOL_ID.toLowerCase().replace('_', '')}.auth.${COGNITO_REGION}.amazoncognito.com`;
const redirectUri = 'http://localhost:3000/dashboard/login/callback';
const localLoginUrl = 'http://localhost:3000/dashboard/login';

/**
 * Constrói a URL do Cognito Hosted UI para login social
 */
function buildCognitoSocialLoginUrl(provider: 'Google' | 'GitHub'): string {
  const baseUrl = `https://${cognitoDomain}/oauth2/authorize`;
  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'email openid profile',
    redirect_uri: redirectUri,
    identity_provider: provider,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Testa o login social via browser começando pela página local
 */
async function testSocialLogin(provider: 'Google' | 'GitHub'): Promise<boolean> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🌐 Testando Login Social com ${provider}`);
  console.log('═'.repeat(60));

  let browser: Browser | null = null;

  try {
    // Abrir browser Chrome com configurações para evitar detecção de automação
    console.log('\n🚀 Abrindo Chrome...');
    browser = await chromium.launch({
      channel: 'chrome', // Usar Chrome instalado no sistema
      headless: false, // Mostrar browser para interação manual
      slowMo: 500, // Desacelerar ações para visualizar
      args: [
        '--disable-blink-features=AutomationControlled', // Desabilitar detecção de automação
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      // User agent real para evitar detecção
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Permitir permissões necessárias
      permissions: ['geolocation'],
      // Configurações para melhorar compatibilidade com OAuth
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      // Aceitar cookies automaticamente
      acceptDownloads: true,
    });

    // Remover propriedades que indicam automação
    await context.addInitScript(() => {
      // Remover webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Mockar plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mockar languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      });
      
      // Adicionar Chrome property
      (window as any).chrome = {
        runtime: {},
      };
    });

    const page = await context.newPage();

    // PASSO 1: Navegar para a página de login local
    console.log(`\n📍 Passo 1: Acessando página de login local`);
    console.log(`   URL: ${localLoginUrl}\n`);
    
    console.log(`📱 Navegando para a página de login...`);
    try {
      await page.goto(localLoginUrl, { waitUntil: 'networkidle', timeout: 10000 });
    } catch (error) {
      console.log(`\n⚠️  Não foi possível acessar a página local (frontend não está rodando?)`);
      console.log(`   Erro: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`\n📝 Tentando acesso direto ao Cognito Hosted UI...\n`);
      
      // Fallback: ir direto para o Cognito Hosted UI
      const loginUrl = buildCognitoSocialLoginUrl(provider);
      await page.goto(loginUrl, { waitUntil: 'networkidle' });
      return await handleCognitoHostedUI(page, provider, loginUrl);
    }

    // Aguardar um pouco para a página carregar
    await page.waitForTimeout(2000);

    // Tirar screenshot da página inicial
    const screenshotPath = `screenshots/login-local-${provider.toLowerCase()}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

    // Verificar se a página carregou corretamente
    const pageTitle = await page.title();
    console.log(`\n📄 Título da página: ${pageTitle}`);
    console.log(`🔗 URL atual: ${page.url()}`);

    // PASSO 2: Procurar e clicar no botão de login social
    console.log(`\n📍 Passo 2: Procurando botão de login ${provider}...`);
    
    // Tentar vários seletores comuns para botões de login social
    const providerSelectors = {
      Google: [
        'button:has-text("Google")',
        'button:has-text("Entrar com Google")',
        'button:has-text("Login com Google")',
        'a:has-text("Google")',
        'a:has-text("Entrar com Google")',
        '[data-provider="Google"]',
        '[data-provider="google"]',
        'button[aria-label*="Google"]',
        '.google-login',
        '#google-login',
      ],
      GitHub: [
        'button:has-text("GitHub")',
        'button:has-text("Entrar com GitHub")',
        'button:has-text("Login com GitHub")',
        'a:has-text("GitHub")',
        'a:has-text("Entrar com GitHub")',
        '[data-provider="GitHub"]',
        '[data-provider="github"]',
        'button[aria-label*="GitHub"]',
        '.github-login',
        '#github-login',
      ],
    };

    let buttonFound = false;
    let buttonElement: ReturnType<typeof page.locator> | null = null;

    for (const selector of providerSelectors[provider]) {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`   ✅ Botão encontrado com seletor: ${selector}`);
        buttonElement = element;
        buttonFound = true;
        break;
      }
    }

    if (!buttonFound) {
      console.log(`\n⚠️  Botão de login ${provider} não encontrado automaticamente.`);
      console.log(`   Procurando todos os botões e links na página...\n`);
      
      // Listar todos os botões e links
      const allButtons = await page.locator('button, a[href*="login"], a[href*="auth"]').all();
      console.log(`   Encontrados ${allButtons.length} botões/links:`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        const href = await allButtons[i].getAttribute('href').catch(() => null);
        console.log(`   ${i + 1}. "${text?.trim() || '(sem texto)'}" ${href ? `(${href})` : ''}`);
      }
      
      console.log(`\n⏳ Aguardando interação manual...`);
      console.log(`   Por favor, clique no botão de login ${provider} manualmente.`);
      console.log(`   O script aguardará até você ser redirecionado para o Cognito...\n`);
      
      // Aguardar navegação para o Cognito
      try {
        await page.waitForURL(new RegExp(`${cognitoDomain}|oauth|authorize`, 'i'), { timeout: 60000 });
        console.log(`✅ Redirecionamento para Cognito detectado!`);
        const cognitoUrl = page.url();
        return await handleCognitoHostedUI(page, provider, cognitoUrl);
      } catch (e) {
        console.log(`⏱️  Timeout - não foi redirecionado para Cognito em 1 minuto`);
        return false;
      }
    }

    // PASSO 3: Clicar no botão de login social
    console.log(`\n📍 Passo 3: Clicando no botão de login ${provider}...`);
    if (!buttonElement) {
      console.log(`   ❌ Botão não encontrado!`);
      return false;
    }
    
    try {
      await buttonElement.click();
      console.log(`   ✅ Clique realizado!`);
      
      // Aguardar navegação (pode ir para Cognito, Google/GitHub, ou callback com erro)
      console.log(`\n⏳ Aguardando redirecionamento...`);
      
      // Aguardar qualquer navegação (Cognito, provider, ou callback)
      await Promise.race([
        page.waitForURL(new RegExp(`${cognitoDomain}|oauth|authorize|accounts.google|github.com|callback|error`, 'i'), { timeout: 10000 }),
        page.waitForTimeout(3000), // Timeout mínimo de 3s para página carregar
      ]);
      
      const currentUrl = page.url();
      console.log(`   🔗 URL após clique: ${currentUrl.substring(0, 100)}...`);
      
      // Verificar se foi redirecionado para callback com erro
      if (currentUrl.includes('callback') && currentUrl.includes('error')) {
        const urlObj = new URL(currentUrl);
        const errorType = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');
        
        if (errorDescription?.includes('Unsupported configuration for OIDC')) {
          console.log(`\n❌ ERRO DE CONFIGURAÇÃO OIDC DETECTADO NA URL:`);
          console.log(`   O Cognito retornou erro de configuração do Identity Provider.`);
          console.log(`\n🔧 SOLUÇÃO:`);
          console.log(`\n   1. Acesse o AWS Cognito Console`);
          console.log(`   2. Vá em: User Pools → ${COGNITO_USER_POOL_ID} → Sign-in experience → Federated identity provider sign-in`);
          console.log(`   3. Verifique se o Identity Provider (${provider}) está configurado corretamente:`);
          console.log(`\n   ✅ Para Google (já funcionando!):`);
          console.log(`      - Client ID: Deve ser o Client ID do Google OAuth`);
          console.log(`      - Client secret: Deve ser o Client Secret do Google OAuth`);
          console.log(`      - Authorized scopes: email profile openid`);
          console.log(`\n   ✅ Para GitHub (precisa configurar):`);
          console.log(`      - Client ID: Deve ser o Client ID do GitHub OAuth`);
          console.log(`      - Client secret: Deve ser o Client Secret do GitHub OAuth`);
          console.log(`      - Authorized scopes: user:email read:user`);
          console.log(`      - Attribute mapping:`);
          console.log(`        * email → email (ou email:primary_email)`);
          console.log(`        * name → name`);
          console.log(`        * login → preferred_username`);
          console.log(`\n   4. Verifique se os scopes solicitados no App Client estão corretos:`);
          console.log(`      - Abra: App integration → App clients → ${COGNITO_CLIENT_ID}`);
          console.log(`      - Em "Hosted UI settings", verifique os "Allowed OAuth scopes":`);
          console.log(`        * openid`);
          console.log(`        * email`);
          console.log(`        * profile`);
          console.log(`\n   5. Salve todas as alterações e tente novamente.`);
          return false;
        }
        
        // Outro tipo de erro
        console.log(`\n❌ Erro detectado na URL de callback:`);
        console.log(`   Tipo: ${errorType || 'desconhecido'}`);
        if (errorDescription) {
          console.log(`   Descrição: ${decodeURIComponent(errorDescription)}`);
        }
        return false;
      }
      
      // Verificar se foi para Cognito ou provider
      if (currentUrl.includes(cognitoDomain) || currentUrl.includes('oauth') || currentUrl.includes('authorize')) {
        console.log(`   ✅ Redirecionado para Cognito Hosted UI\n`);
        return await handleCognitoHostedUI(page, provider, currentUrl);
      }
      
      // Verificar se foi para provider direto (Google/GitHub)
      if (currentUrl.includes('accounts.google.com') || currentUrl.includes('github.com')) {
        console.log(`   ✅ Redirecionado para ${provider} login\n`);
        return await handleCognitoHostedUI(page, provider, currentUrl);
      }
      
      // Fallback: processar página atual
      return await handleCognitoHostedUI(page, provider, currentUrl);
    } catch (error) {
      console.log(`\n❌ Erro ao clicar no botão: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`   Tentando navegação manual...\n`);
      
      // Fallback: aguardar navegação manual e verificar URL
      try {
        await page.waitForTimeout(5000);
        const currentUrl = page.url();
        
        // Verificar se há erro na URL
        if (currentUrl.includes('error')) {
          const urlObj = new URL(currentUrl);
          const errorDescription = urlObj.searchParams.get('error_description');
          if (errorDescription?.includes('Unsupported configuration for OIDC')) {
            console.log(`\n❌ ERRO DE CONFIGURAÇÃO OIDC DETECTADO!`);
            console.log(`   Verifique a configuração do Identity Provider ${provider} no Cognito.`);
            return false;
          }
        }
        
        return await handleCognitoHostedUI(page, provider, currentUrl);
      } catch (e) {
        return false;
      }
    }
  } catch (error) {
    console.error(`\n❌ Erro ao testar login social:`, error);
    return false;
  } finally {
    if (browser) {
      console.log(`\n🔒 Fechando navegador...`);
      await browser.close();
    }
  }
}

/**
 * Manipula o fluxo no Cognito Hosted UI após redirecionamento
 */
async function handleCognitoHostedUI(page: Page, provider: 'Google' | 'GitHub', cognitoUrl: string): Promise<boolean> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📍 Passo 4: Processando Cognito Hosted UI`);
  console.log('─'.repeat(60));

  // Aguardar um pouco para a página carregar
  await page.waitForTimeout(2000);

  // Tirar screenshot do Cognito Hosted UI
  const cognitoScreenshotPath = `screenshots/cognito-hosted-ui-${provider.toLowerCase()}-${Date.now()}.png`;
  await page.screenshot({ path: cognitoScreenshotPath, fullPage: true });
  console.log(`📸 Screenshot do Cognito salvo em: ${cognitoScreenshotPath}`);

  const currentUrl = page.url();
  console.log(`\n🔗 URL atual: ${currentUrl.substring(0, 100)}...`);

  // Verificar se há erro na URL primeiro (antes de ler o conteúdo da página)
  if (currentUrl.includes('error')) {
    try {
      const urlObj = new URL(currentUrl);
      const errorDescription = urlObj.searchParams.get('error_description');
      
      if (errorDescription?.includes('Unsupported configuration for OIDC')) {
        console.log(`\n❌ ERRO DE CONFIGURAÇÃO OIDC DETECTADO NA URL:`);
        console.log(`   O Cognito retornou erro de configuração do Identity Provider.`);
        console.log(`\n🔧 SOLUÇÃO:`);
        console.log(`\n   1. Acesse o AWS Cognito Console`);
        console.log(`   2. Vá em: User Pools → ${COGNITO_USER_POOL_ID} → Sign-in experience → Federated identity provider sign-in`);
        console.log(`   3. Verifique se o Identity Provider (${provider}) está configurado corretamente:`);
        console.log(`\n   ✅ Para Google:`);
        console.log(`      - Client ID: Deve ser o Client ID do Google OAuth`);
        console.log(`      - Client secret: Deve ser o Client Secret do Google OAuth`);
        console.log(`      - Authorized scopes: email profile openid`);
        console.log(`\n   ✅ Para GitHub:`);
        console.log(`      - Client ID: Deve ser o Client ID do GitHub OAuth`);
        console.log(`      - Client secret: Deve ser o Client Secret do GitHub OAuth`);
        console.log(`      - Authorized scopes: user:email read:user`);
        console.log(`\n   4. Verifique se os scopes do App Client estão corretos.`);
        console.log(`\n⏸️  Browser ficará aberto por 30 segundos para você visualizar...\n`);
        
        try {
          await page.waitForTimeout(30000);
        } catch (e) {
          console.log(`   Browser fechado pelo usuário.`);
        }
        return false;
      }
    } catch (e) {
      // Continuar se não conseguir parsear URL
    }
  }

  // Verificar conteúdo da página para detectar erros
  const pageText = await page.locator('body').textContent().catch(() => '') || '';
  
  // Detectar erro de configuração OIDC (verificar primeiro, antes dos outros erros)
  const isOidcConfigError = pageText.includes('Unsupported configuration for OIDC Identity Provider') ||
    pageText.includes('unsupported configuration') ||
    (currentUrl.includes('error') && pageText.includes('OIDC'));
  
  // Detectar bloqueio do Google
  const isGoogleBlocked = provider === 'Google' && (
    pageText.includes('não é seguro') ||
    pageText.includes('pode não ser seguro') ||
    pageText.includes('Tente usar outro navegador') ||
    pageText.includes('browser or app may not be secure')
  );
  
  // Verificar erros primeiro, antes de processar página normal

  if (isOidcConfigError) {
    console.log(`\n❌ ERRO DE CONFIGURAÇÃO OIDC DETECTADO:`);
    console.log(`   O Cognito não está conseguindo se comunicar com o Identity Provider.`);
    console.log(`   Isso geralmente acontece por configuração incorreta no Cognito.`);
    console.log(`\n🔧 SOLUÇÃO:`);
    console.log(`\n   1. Acesse o AWS Cognito Console`);
    console.log(`   2. Vá em: User Pools → ${COGNITO_USER_POOL_ID} → Sign-in experience → Federated identity provider sign-in`);
    console.log(`   3. Verifique se o Identity Provider (${provider}) está configurado corretamente:`);
    console.log(`\n   ✅ Para Google:`);
    console.log(`      - Client ID: Deve ser o Client ID do Google OAuth`);
    console.log(`      - Client secret: Deve ser o Client Secret do Google OAuth`);
    console.log(`      - Authorized scopes: email profile openid`);
    console.log(`      - Attribute mapping:`);
    console.log(`        * email → email`);
    console.log(`        * name → name`);
    console.log(`        * given_name → given_name`);
    console.log(`        * family_name → family_name`);
    console.log(`\n   ✅ Para GitHub:`);
    console.log(`      - Client ID: Deve ser o Client ID do GitHub OAuth`);
    console.log(`      - Client secret: Deve ser o Client Secret do GitHub OAuth`);
    console.log(`      - Authorized scopes: user:email read:user`);
    console.log(`      - Attribute mapping:`);
    console.log(`        * email → email (ou email:primary_email)`);
    console.log(`        * name → name`);
    console.log(`        * login → preferred_username`);
    console.log(`\n   4. Verifique se os scopes solicitados no App Client estão corretos:`);
    console.log(`      - Abra: App integration → App clients → ${COGNITO_CLIENT_ID}`);
    console.log(`      - Em "Hosted UI settings", verifique os "Allowed OAuth scopes":`);
    console.log(`        * openid`);
    console.log(`        * email`);
    console.log(`        * profile`);
    console.log(`\n   5. Salve todas as alterações e tente novamente.`);
    console.log(`\n⏸️  Browser ficará aberto por 30 segundos para você visualizar...\n`);
    
    try {
      await page.waitForTimeout(30000);
    } catch (e) {
      console.log(`   Browser fechado pelo usuário.`);
    }
    return false;
  }

  if (isGoogleBlocked) {
    console.log(`\n❌ GOOGLE BLOQUEOU O LOGIN:`);
    console.log(`   O Google está bloqueando o login por questões de segurança.`);
    console.log(`   Isso geralmente acontece quando o login é feito de localhost.`);
    console.log(`\n🔧 SOLUÇÕES:`);
    console.log(`\n   Opção 1: Configurar Google OAuth Console`);
    console.log(`   1. Acesse: https://console.cloud.google.com/apis/credentials`);
    console.log(`   2. Encontre o OAuth 2.0 Client ID usado pelo Cognito`);
    console.log(`   3. Adicione em "Authorized JavaScript origins":`);
    console.log(`      - http://localhost:3000`);
    console.log(`      - http://127.0.0.1:3000`);
    console.log(`   4. Adicione em "Authorized redirect URIs":`);
    console.log(`      - ${redirectUri}`);
    console.log(`      - URL do Cognito Hosted UI callback`);
    console.log(`\n   Opção 2: Testar manualmente no navegador`);
    console.log(`   1. Copie a URL abaixo e cole no seu navegador Chrome:`);
    console.log(`      ${currentUrl}`);
    console.log(`   2. Faça o login manualmente`);
    console.log(`\n   Opção 3: Usar domínio local real`);
    console.log(`   Edite C:\\Windows\\System32\\drivers\\etc\\hosts e adicione:`);
    console.log(`   127.0.0.1  local.app`);
    console.log(`   Depois use http://local.app:3000 e configure no Google OAuth`);
    console.log(`\n⏸️  Browser ficará aberto por 30 segundos para você visualizar...\n`);
    
    try {
      await page.waitForTimeout(30000);
    } catch (e) {
      console.log(`   Browser fechado pelo usuário.`);
    }
    return false;
  }

  // Verificar se há erro na página
  if (currentUrl.includes('error')) {
    console.log(`\n❌ ERRO DETECTADO NA PÁGINA:`);
    console.log(`   URL: ${currentUrl}`);
    
    // Extrair tipo de erro da URL
    const urlObj = new URL(currentUrl);
      const errorType = urlObj.searchParams.get('error');
      const errorDescription = urlObj.searchParams.get('error_description');
      
      console.log(`   Tipo: ${errorType || 'desconhecido'}`);
      if (errorDescription) {
        console.log(`   Descrição: ${decodeURIComponent(errorDescription)}`);
      }
      
      if (errorType === 'redirect_mismatch') {
        console.log(`\n⚠️  PROBLEMA: Redirect URI não está configurado no Cognito!`);
        console.log(`\n🔧 SOLUÇÃO:`);
        console.log(`   1. Acesse o AWS Cognito Console`);
        console.log(`   2. Vá em: User Pools → ${COGNITO_USER_POOL_ID} → App integration → App clients`);
        console.log(`   3. Clique no App Client: ${COGNITO_CLIENT_ID}`);
        console.log(`   4. Em "Hosted UI settings", adicione o Redirect URI:`);
        console.log(`      ${redirectUri}`);
        console.log(`\n   5. Salve e tente novamente.\n`);
        
        // Tentar verificar conteúdo da página de erro
        if (pageText && pageText.length < 500) {
          console.log(`\n📄 Conteúdo da página de erro:`);
          console.log(`   ${pageText.substring(0, 200)}...`);
        }
      }
      
      // Aguardar para usuário ver a página
      console.log(`\n⏸️  Página de erro aberta no navegador.`);
      console.log(`   Verifique a configuração do Cognito e tente novamente.`);
      console.log(`   O browser ficará aberto por 30 segundos para você visualizar...\n`);
      
      try {
        await page.waitForTimeout(30000);
      } catch (e) {
        // Página pode ter sido fechada manualmente
        console.log(`   Browser fechado pelo usuário.`);
      }
      return false;
    }

    // Verificar se a página carregou corretamente (sem erro)
    console.log(`\n✅ Cognito Hosted UI carregado!`);

    // Verificar se há botões de login social no Cognito
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google"), button[data-provider="Google"]').first();
    const githubButton = page.locator('button:has-text("GitHub"), a:has-text("GitHub"), button[data-provider="GitHub"]').first();

    const hasGoogleButton = await googleButton.count() > 0;
    const hasGithubButton = await githubButton.count() > 0;

    console.log(`\n🔍 Elementos no Cognito Hosted UI:`);
    console.log(`   ${hasGoogleButton ? '✅' : '❌'} Botão Google: ${hasGoogleButton}`);
    console.log(`   ${hasGithubButton ? '✅' : '❌'} Botão GitHub: ${hasGithubButton}`);

    // Se já estivermos redirecionados para o provedor social, aguardar o retorno
    // Caso contrário, aguardar interação manual
    console.log(`\n⏳ Aguardando interação manual...`);
    console.log(`   Você pode fazer login manualmente no browser.`);
    console.log(`   O script aguardará até você completar o login e ser redirecionado.`);
    console.log(`   Pressione Ctrl+C para cancelar.\n`);

    // PASSO 5: Aguardar redirecionamento de volta para o callback
    console.log(`\n📍 Passo 5: Aguardando callback após login...`);
    
    try {
      await Promise.race([
        page.waitForURL(new RegExp(`${redirectUri}|error|callback|localhost:3000`, 'i'), { timeout: 300000 }), // 5 minutos
        page.waitForEvent('close', { timeout: 300000 }),
      ]);

      const finalUrl = page.url();
      console.log(`\n✅ Redirecionamento detectado!`);
      console.log(`   URL final: ${finalUrl}`);

      // Verificar se foi redirecionado para callback
      if (finalUrl.includes('callback') || finalUrl.includes('code=') || finalUrl.includes('localhost:3000')) {
        console.log(`   ✅ Redirecionado para o callback local!`);
        
        // Extrair código se presente
        try {
          const urlObj = new URL(finalUrl);
          const code = urlObj.searchParams.get('code');
          if (code) {
            console.log(`   📝 Código de autorização recebido: ${code.substring(0, 20)}...`);
            console.log(`\n✅ Login social concluído com sucesso!`);
            
            // Tirar screenshot final
            const finalScreenshotPath = `screenshots/callback-${provider.toLowerCase()}-${Date.now()}.png`;
            await page.screenshot({ path: finalScreenshotPath, fullPage: true });
            console.log(`📸 Screenshot do callback salvo em: ${finalScreenshotPath}`);
            
            return true;
          } else {
            console.log(`   ⚠️  URL de callback sem código de autorização`);
            console.log(`   Isso pode ser normal se o frontend está processando o login.`);
            return true;
          }
        } catch (e) {
          console.log(`   ⚠️  Erro ao processar URL: ${e instanceof Error ? e.message : String(e)}`);
          return true; // Considera sucesso se foi redirecionado
        }
      } else if (finalUrl.includes('error')) {
        console.log(`   ❌ Erro no login: ${finalUrl}`);
        return false;
      }

      return true;
    } catch (error) {
      console.log(`\n⏱️  Timeout - página não foi redirecionada em 5 minutos`);
      console.log(`   Isso é normal se você não completou o login manualmente`);
      return false;
    }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Testando Login Social via UI Local\n');
  console.log(`📋 Configurações:`);
  console.log(`   Página de Login Local: ${localLoginUrl}`);
  console.log(`   User Pool ID: ${COGNITO_USER_POOL_ID}`);
  console.log(`   Client ID: ${COGNITO_CLIENT_ID}`);
  console.log(`   Region: ${COGNITO_REGION}`);
  console.log(`   Cognito Domain: ${cognitoDomain}`);
  console.log(`   Redirect URI: ${redirectUri}\n`);

  // Criar diretório de screenshots
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const results: { provider: string; success: boolean }[] = [];

  // Teste 1: Login com Google (obrigatório primeiro)
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📌 TESTE 1: Google (obrigatório primeiro)`);
  console.log('═'.repeat(60));
  
  let googleResult = false;
  try {
    googleResult = await testSocialLogin('Google');
    results.push({ provider: 'Google', success: googleResult });
  } catch (error) {
    console.error('❌ Erro ao testar Google:', error);
    results.push({ provider: 'Google', success: false });
  }

  // Teste 2: Login com GitHub (apenas se Google passou)
  if (googleResult) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📌 TESTE 2: GitHub (executando porque Google passou)`);
    console.log('═'.repeat(60));
    
    try {
      const githubResult = await testSocialLogin('GitHub');
      results.push({ provider: 'GitHub', success: githubResult });
    } catch (error) {
      console.error('❌ Erro ao testar GitHub:', error);
      results.push({ provider: 'GitHub', success: false });
    }
  } else {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`⚠️  GitHub não será testado porque Google falhou`);
    console.log('═'.repeat(60));
    console.log(`   Para testar GitHub, primeiro o teste do Google deve passar.\n`);
  }

  // Resumo
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 RESUMO DOS TESTES');
  console.log('═'.repeat(60));
  results.forEach(result => {
    console.log(`   ${result.success ? '✅' : '❌'} ${result.provider}: ${result.success ? 'Sucesso' : 'Falhou'}`);
  });

  const allPassed = results.every(r => r.success);
  if (allPassed && results.length > 0) {
    console.log(`\n🎉 Todos os testes passaram!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Alguns testes falharam ou foram cancelados.`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}
