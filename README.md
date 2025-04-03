<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://nodejs.org" target="_blank">Powered by Node.js</a>
</p>

# Rainer Portfolio Backend

Bem-vindo ao repositório do backend do meu portfólio! Este projeto foi desenvolvido para demonstrar minhas habilidades em desenvolvimento backend utilizando tecnologias modernas e escaláveis. Aqui você encontrará uma aplicação robusta, construída com **NestJS**, integrada com serviços da **AWS** e projetada para atender a requisitos de alta performance e segurança.

---

## 🚀 Tecnologias Utilizadas

### **Framework Backend**
- **[NestJS](https://nestjs.com/):** Framework Node.js progressivo para construção de aplicações escaláveis e modulares. Utilizado para estruturar o backend com uma arquitetura limpa e organizada.

### **Serviços AWS**
- **[AWS Lambda](https://aws.amazon.com/lambda/):** Serviço de computação serverless para execução do backend sem necessidade de gerenciar servidores.
- **[DynamoDB](https://aws.amazon.com/dynamodb/):** Banco de dados NoSQL altamente escalável e gerenciado, utilizado para armazenar dados de posts, categorias, autores e comentários.
- **[Cognito](https://aws.amazon.com/cognito/):** Serviço de autenticação e autorização, utilizado para gerenciar usuários e validar tokens JWT.
- **[S3](https://aws.amazon.com/s3/):** Serviço de armazenamento de objetos, utilizado para gerenciar imagens de posts.

### **Ferramentas de Desenvolvimento**
- **[Serverless Framework](https://www.serverless.com/):** Framework para gerenciar a infraestrutura serverless e facilitar o deploy na AWS.
- **[TypeScript](https://www.typescriptlang.org/):** Linguagem de programação que adiciona tipagem estática ao JavaScript, garantindo maior segurança e produtividade no desenvolvimento.
- **[Fastify](https://www.fastify.io/):** Framework web rápido e eficiente, utilizado como adaptador HTTP para o NestJS.
- **[Swagger](https://swagger.io/):** Ferramenta para documentação de APIs, permitindo explorar e testar os endpoints diretamente no navegador.

### **Outras Bibliotecas e Ferramentas**
- **Class Validator:** Validação de dados de entrada utilizando decorators.
- **Cache Manager:** Gerenciamento de cache para melhorar a performance.
- **Esbuild:** Ferramenta de build rápida e eficiente para empacotamento do código.
- **Jest:** Framework de testes para garantir a qualidade do código.
- **Prettier e ESLint:** Ferramentas para padronização e linting do código.

---

## 🛠️ Arquitetura do Projeto

O projeto foi estruturado seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com foco em modularidade e separação de responsabilidades. Abaixo estão os principais módulos e suas responsabilidades:

### **Módulos**
1. **Posts**
   - Gerenciamento de posts do blog.
   - Suporte a criação, leitura, atualização e exclusão (CRUD).
   - Integração com DynamoDB para persistência de dados.

2. **Comentários**
   - Gerenciamento de comentários associados aos posts.
   - Validação de dados e integração com DynamoDB.

3. **Categorias e Subcategorias**
   - Organização dos posts em categorias e subcategorias.
   - Suporte a SEO com metadados.

4. **Autores**
   - Gerenciamento de informações dos autores dos posts.
   - Integração com DynamoDB para armazenamento.

5. **Autenticação**
   - Implementação de autenticação via AWS Cognito.
   - Validação de tokens JWT para proteger endpoints.

---

## 🌐 Endpoints da API

A API foi documentada utilizando o **Swagger**, disponível no endpoint `/api` quando executada localmente. A documentação inclui detalhes sobre os endpoints, parâmetros de entrada e exemplos de respostas.

---

## 🛡️ Segurança

- **Autenticação JWT:** Todos os endpoints protegidos utilizam tokens JWT gerados pelo AWS Cognito.
- **Validação de Dados:** Utilização de `class-validator` para garantir que os dados recebidos pela API estejam no formato esperado.
- **CORS Configurado:** Apenas origens confiáveis podem acessar a API.

---

## 📦 Deploy e Infraestrutura

O deploy é gerenciado pelo **Serverless Framework**, que configura automaticamente os recursos na AWS, incluindo:
- Funções Lambda.
- Tabelas DynamoDB.
- URLs de função Lambda com suporte a CORS.

### **Pipeline CI/CD**
- Utilização do **GitHub Actions** para automação do deploy em cada push na branch `main`.

---

## ⚙️ Configuração do Ambiente

### **Pré-requisitos**
- **Node.js** (versão 20 ou superior)
- **AWS CLI** configurado com credenciais válidas.

### **Instalação**
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/rainer-portfolio-backend.git
   cd rainer-portfolio-backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente no arquivo `.env`:
   ```properties
   AWS_REGION=us-east-1
   DYNAMODB_ACCESS_KEY_ID=SEU_ACCESS_KEY
   DYNAMODB_SECRET_ACCESS_KEY=SEU_SECRET_KEY
   COGNITO_USER_POOL_ID=SEU_USER_POOL_ID
   COGNITO_CLIENT_ID=SEU_CLIENT_ID
   ```

4. Execute localmente:
   ```bash
   npm run start:dev
   ```

5. Deploy para AWS:
   ```bash
   serverless deploy
   ```

---

## 📚 Estrutura de Pastas

```plaintext
src/
├── auth/                # Módulo de autenticação
├── common/              # Interceptores, filtros e utilitários
├── modules/
│   ├── blog/            # Módulo principal do blog
│   │   ├── posts/       # Gerenciamento de posts
│   │   ├── comments/    # Gerenciamento de comentários
│   │   ├── category/    # Gerenciamento de categorias
│   │   ├── authors/     # Gerenciamento de autores
├── services/            # Serviços compartilhados (ex.: DynamoDB)
├── app.module.ts        # Módulo raiz da aplicação
├── main.lambda.ts       # Arquivo de entrada para AWS Lambda
```

---

## 📞 Contato

Se você tiver dúvidas ou sugestões, sinta-se à vontade para entrar em contato:
- **Email:** rainer@exemplo.com
- **LinkedIn:** [linkedin.com/in/RainerTeixeira](https://linkedin.com/in/RainerTeixeira)

Obrigado por visitar meu portfólio! 🚀
