"use strict";
/**
 * Seed do DynamoDB - Popular Banco de Dados com Dados Reais
 *
 * Script para popular o DynamoDB com dados profissionais e reais do portfolio.
 * Suporta DynamoDB Local (desenvolvimento) e AWS DynamoDB (produção).
 *
 * Uso:
 * ```bash
 * npm run dynamodb:seed
 * # ou
 * npx tsx scripts/dynamodb.seed.ts
 * ```
 *
 * @fileoverview Seed do DynamoDB com dados reais
 * @module scripts/dynamodb.seed
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var nanoid_1 = require("nanoid");
var index_js_1 = require("../src/common/config/index.js");
// Nomes das tabelas
var TABLES = {
    USERS: "".concat(index_js_1.config.database.tableName, "-users"),
    POSTS: "".concat(index_js_1.config.database.tableName, "-posts"),
    CATEGORIES: "".concat(index_js_1.config.database.tableName, "-categories"),
    COMMENTS: "".concat(index_js_1.config.database.tableName, "-comments"),
    LIKES: "".concat(index_js_1.config.database.tableName, "-likes"),
    BOOKMARKS: "".concat(index_js_1.config.database.tableName, "-bookmarks"),
    NOTIFICATIONS: "".concat(index_js_1.config.database.tableName, "-notifications"),
};
/**
 * Detecta automaticamente o ambiente
 */
var isRunningInLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV);
var isLocalEnvironment = !isRunningInLambda && index_js_1.config.aws.useLocalDynamoDB;
var environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';
/**
 * Cliente DynamoDB
 */
var client = new client_dynamodb_1.DynamoDBClient({
    region: index_js_1.config.aws.region,
    endpoint: index_js_1.config.aws.useLocalDynamoDB ? process.env.DYNAMODB_ENDPOINT : undefined,
    credentials: isLocalEnvironment ? {
        accessKeyId: 'fakeAccessKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
    } : undefined,
});
var docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
/**
 * Limpa todos os dados das tabelas
 */
function cleanup() {
    return __awaiter(this, void 0, void 0, function () {
        var tables, _loop_1, _i, tables_1, tableName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧹 Limpando banco de dados...');
                    tables = Object.values(TABLES);
                    _loop_1 = function (tableName) {
                        var scanResult, items, batches, i, batch, _b, batches_1, batch, deleteRequests, error_1;
                        var _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 6, , 7]);
                                    console.log("   \uD83D\uDDD1\uFE0F  Limpando ".concat(tableName, "..."));
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.ScanCommand({
                                            TableName: tableName,
                                        }))];
                                case 1:
                                    scanResult = _d.sent();
                                    if (!scanResult.Items || scanResult.Items.length === 0) {
                                        console.log("   \u2705 ".concat(tableName, " j\u00E1 est\u00E1 vazia"));
                                        return [2 /*return*/, "continue"];
                                    }
                                    items = scanResult.Items;
                                    batches = [];
                                    for (i = 0; i < items.length; i += 25) {
                                        batch = items.slice(i, i + 25);
                                        batches.push(batch);
                                    }
                                    _b = 0, batches_1 = batches;
                                    _d.label = 2;
                                case 2:
                                    if (!(_b < batches_1.length)) return [3 /*break*/, 5];
                                    batch = batches_1[_b];
                                    deleteRequests = batch.map(function (item) {
                                        // Determinar a chave primária baseada na tabela
                                        var key = {};
                                        if (tableName === TABLES.USERS) {
                                            key = { cognitoSub: item.cognitoSub };
                                        }
                                        else {
                                            key = { id: item.id };
                                        }
                                        return {
                                            DeleteRequest: { Key: key }
                                        };
                                    });
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.BatchWriteCommand({
                                            RequestItems: (_c = {},
                                                _c[tableName] = deleteRequests,
                                                _c)
                                        }))];
                                case 3:
                                    _d.sent();
                                    _d.label = 4;
                                case 4:
                                    _b++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    console.log("   \u2705 ".concat(items.length, " itens removidos de ").concat(tableName));
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_1 = _d.sent();
                                    console.warn("   \u26A0\uFE0F  Aviso ao limpar ".concat(tableName, ":"), (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || error_1);
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, tables_1 = tables;
                    _a.label = 1;
                case 1:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 4];
                    tableName = tables_1[_i];
                    return [5 /*yield**/, _loop_1(tableName)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('✅ Banco limpo!');
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Cria usuários reais do portfolio
 */
function seedUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var users, createdUsers, _i, users_1, userData, cognitoDisplay;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n👥 Criando usuários...');
                    console.log('   ℹ️  Email gerenciado pelo Cognito (não armazenado no DynamoDB)');
                    users = [
                        {
                            cognitoSub: '44085408-7021-7051-e274-ae704499cd72', // CognitoSub real do usuário aoline
                            fullName: 'Rainer Teixeira',
                            nickname: 'rainer',
                            bio: 'Desenvolvedor Full Stack especializado em React, Node.js e AWS. Fundador da Rainer Soft, criando soluções digitais inovadoras desde 2020.',
                            avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/rainer-avatar.jpg',
                            website: 'https://rainersoft.com.br',
                            socialLinks: {
                                github: 'https://github.com/RainerTeixeira',
                                linkedin: 'https://linkedin.com/in/rainer-teixeira',
                                twitter: 'https://twitter.com/rainersoft',
                                instagram: 'https://instagram.com/rainersoft',
                            },
                            role: 'ADMIN',
                            isActive: true,
                            isBanned: false,
                            postsCount: 0, // Será atualizado após criar posts
                            commentsCount: 0,
                            createdAt: new Date('2020-01-15').toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                        {
                            cognitoSub: "cognito-".concat((0, nanoid_1.nanoid)()),
                            fullName: 'Maria Silva',
                            nickname: 'maria-editor',
                            bio: 'Editora de conteúdo técnico com 8 anos de experiência. Especialista em revisar e otimizar artigos sobre tecnologia e desenvolvimento.',
                            avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/maria-avatar.jpg',
                            website: 'https://mariasilva.dev',
                            socialLinks: {
                                linkedin: 'https://linkedin.com/in/maria-silva-editor',
                                medium: 'https://medium.com/@mariasilva',
                            },
                            role: 'EDITOR',
                            isActive: true,
                            isBanned: false,
                            postsCount: 0,
                            commentsCount: 0,
                            createdAt: new Date('2021-03-10').toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                        {
                            cognitoSub: "cognito-".concat((0, nanoid_1.nanoid)()),
                            fullName: 'João Santos',
                            nickname: 'joao-dev',
                            bio: 'Desenvolvedor Frontend especializado em React, Next.js e TypeScript. Contribuidor ativo em projetos open source.',
                            avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/joao-avatar.jpg',
                            website: 'https://joaosantos.dev',
                            socialLinks: {
                                github: 'https://github.com/joaosantos',
                                linkedin: 'https://linkedin.com/in/joao-santos-dev',
                                twitter: 'https://twitter.com/joaodev',
                            },
                            role: 'AUTHOR',
                            isActive: true,
                            isBanned: false,
                            postsCount: 0,
                            commentsCount: 0,
                            createdAt: new Date('2021-07-22').toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                        {
                            cognitoSub: "cognito-".concat((0, nanoid_1.nanoid)()),
                            fullName: 'Ana Costa',
                            nickname: 'ana-designer',
                            bio: 'UX/UI Designer com foco em design systems e acessibilidade. Criando experiências digitais inclusivas e intuitivas.',
                            avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/ana-avatar.jpg',
                            website: 'https://anacosta.design',
                            socialLinks: {
                                behance: 'https://behance.net/anacosta',
                                dribbble: 'https://dribbble.com/anacosta',
                                linkedin: 'https://linkedin.com/in/ana-costa-ux',
                            },
                            role: 'AUTHOR',
                            isActive: true,
                            isBanned: false,
                            postsCount: 0,
                            commentsCount: 0,
                            createdAt: new Date('2022-01-15').toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                        {
                            cognitoSub: "cognito-".concat((0, nanoid_1.nanoid)()),
                            fullName: 'Carlos Oliveira',
                            nickname: 'carlos-reader',
                            bio: 'Entusiasta de tecnologia e leitor assíduo. Sempre em busca de novos conhecimentos em desenvolvimento e inovação.',
                            avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/carlos-avatar.jpg',
                            socialLinks: {
                                linkedin: 'https://linkedin.com/in/carlos-oliveira',
                            },
                            role: 'SUBSCRIBER',
                            isActive: true,
                            isBanned: false,
                            postsCount: 0,
                            commentsCount: 0,
                            createdAt: new Date('2023-05-20').toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ];
                    createdUsers = [];
                    _i = 0, users_1 = users;
                    _a.label = 1;
                case 1:
                    if (!(_i < users_1.length)) return [3 /*break*/, 4];
                    userData = users_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.USERS,
                            Item: userData,
                        }))];
                case 2:
                    _a.sent();
                    createdUsers.push(userData);
                    cognitoDisplay = userData.cognitoSub === '44085408-7021-7051-e274-ae704499cd72'
                        ? userData.cognitoSub
                        : "".concat(userData.cognitoSub.substring(0, 20), "...");
                    console.log("   \u2705 ".concat(userData.fullName, " - ").concat(userData.role, " [cognitoSub: ").concat(cognitoDisplay, "]"));
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('   ℹ️  Emails dos usuários estão no Cognito, não no DynamoDB');
                    return [2 /*return*/, createdUsers];
            }
        });
    });
}
/**
 * Cria categorias hierárquicas reais
 */
function seedCategories() {
    return __awaiter(this, void 0, void 0, function () {
        var tecnologia, design, carreira, frontend, backend, devops, uxui, designSystems, produtividade, subcategories, _i, subcategories_1, subcategory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📂 Criando categorias...');
                    tecnologia = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Tecnologia',
                        slug: 'tecnologia',
                        description: 'Artigos sobre desenvolvimento, programação e inovação tecnológica',
                        color: '#3498DB',
                        icon: 'code',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/tecnologia-cover.jpg',
                        order: 1,
                        metaDescription: 'Explore os últimos avanços em tecnologia, desenvolvimento de software e inovação digital.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    design = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Design',
                        slug: 'design',
                        description: 'UX/UI Design, Design Systems e tendências visuais',
                        color: '#E74C3C',
                        icon: 'palette',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/design-cover.jpg',
                        order: 2,
                        metaDescription: 'Descubra as melhores práticas em UX/UI Design e design de interfaces modernas.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    carreira = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Carreira',
                        slug: 'carreira',
                        description: 'Desenvolvimento profissional, produtividade e crescimento na carreira tech',
                        color: '#2ECC71',
                        icon: 'briefcase',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/carreira-cover.jpg',
                        order: 3,
                        metaDescription: 'Dicas e estratégias para acelerar sua carreira em tecnologia.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    // Salvar categorias principais
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({ TableName: TABLES.CATEGORIES, Item: tecnologia }))];
                case 1:
                    // Salvar categorias principais
                    _a.sent();
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({ TableName: TABLES.CATEGORIES, Item: design }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({ TableName: TABLES.CATEGORIES, Item: carreira }))];
                case 3:
                    _a.sent();
                    console.log('   ✅ Tecnologia (categoria principal)');
                    console.log('   ✅ Design (categoria principal)');
                    console.log('   ✅ Carreira (categoria principal)');
                    frontend = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Frontend',
                        slug: 'frontend',
                        description: 'React, Next.js, Vue, Angular e tecnologias frontend modernas',
                        color: '#61DAFB',
                        icon: 'monitor',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/frontend-cover.jpg',
                        parentId: tecnologia.id,
                        order: 1,
                        metaDescription: 'Aprenda as melhores práticas em desenvolvimento frontend com React, Next.js e mais.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    backend = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Backend',
                        slug: 'backend',
                        description: 'Node.js, NestJS, APIs REST, GraphQL e arquitetura de sistemas',
                        color: '#68A063',
                        icon: 'server',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/backend-cover.jpg',
                        parentId: tecnologia.id,
                        order: 2,
                        metaDescription: 'Domine o desenvolvimento backend com Node.js, APIs e arquitetura escalável.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    devops = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'DevOps',
                        slug: 'devops',
                        description: 'CI/CD, Docker, Kubernetes, AWS e infraestrutura como código',
                        color: '#FF6B35',
                        icon: 'cloud',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/devops-cover.jpg',
                        parentId: tecnologia.id,
                        order: 3,
                        metaDescription: 'Automatize deploys e gerencie infraestrutura com as melhores práticas DevOps.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    uxui = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'UX/UI Design',
                        slug: 'ux-ui-design',
                        description: 'User Experience, User Interface e Design de Produto',
                        color: '#9B59B6',
                        icon: 'layout',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/uxui-cover.jpg',
                        parentId: design.id,
                        order: 1,
                        metaDescription: 'Crie experiências digitais excepcionais com princípios de UX/UI Design.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    designSystems = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Design Systems',
                        slug: 'design-systems',
                        description: 'Criação e manutenção de sistemas de design escaláveis',
                        color: '#E67E22',
                        icon: 'grid',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/design-systems-cover.jpg',
                        parentId: design.id,
                        order: 2,
                        metaDescription: 'Construa design systems robustos e escaláveis para produtos digitais.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    produtividade = {
                        id: (0, nanoid_1.nanoid)(),
                        name: 'Produtividade',
                        slug: 'produtividade',
                        description: 'Técnicas, ferramentas e metodologias para máxima produtividade',
                        color: '#1ABC9C',
                        icon: 'zap',
                        coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/produtividade-cover.jpg',
                        parentId: carreira.id,
                        order: 1,
                        metaDescription: 'Aumente sua produtividade com técnicas e ferramentas comprovadas.',
                        isActive: true,
                        postsCount: 0,
                        createdAt: new Date('2020-01-15').toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    subcategories = [frontend, backend, devops, uxui, designSystems, produtividade];
                    _i = 0, subcategories_1 = subcategories;
                    _a.label = 4;
                case 4:
                    if (!(_i < subcategories_1.length)) return [3 /*break*/, 7];
                    subcategory = subcategories_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({ TableName: TABLES.CATEGORIES, Item: subcategory }))];
                case 5:
                    _a.sent();
                    console.log("   \u2705 ".concat(subcategory.name, " (subcategoria)"));
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, {
                        tecnologia: tecnologia,
                        design: design,
                        carreira: carreira,
                        frontend: frontend,
                        backend: backend,
                        devops: devops,
                        uxui: uxui,
                        designSystems: designSystems,
                        produtividade: produtividade,
                    }];
            }
        });
    });
}
/**
 * Cria posts reais e profissionais
 */
function seedPosts(users, categories) {
    return __awaiter(this, void 0, void 0, function () {
        var posts, createdPosts, _i, posts_1, postData, publishedPosts, frontendPosts, backendPosts, devopsPosts, uxuiPosts, designSystemsPosts, produtividadePosts, tecnologiaPosts, designPosts, carreiraPosts, rainerPosts, anaPosts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📝 Criando posts...');
                    posts = [
                        // Posts de Frontend por Rainer
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'React 19: Revolucionando o Desenvolvimento Frontend',
                            slug: 'react-19-revolucionando-desenvolvimento-frontend',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'React 19 chegou com mudanças que vão transformar completamente a forma como desenvolvemos aplicações frontend. Neste artigo detalhado, exploramos as principais novidades como React Compiler, Server Components aprimorados, Actions nativas, e o novo hook use(). Descubra como essas features podem aumentar drasticamente a performance das suas aplicações e simplificar o desenvolvimento.',
                                            },
                                        ],
                                    },
                                    {
                                        type: 'heading',
                                        attrs: { level: 2 },
                                        content: [{ type: 'text', text: 'React Compiler: Otimização Automática' }],
                                    },
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'O React Compiler é uma das maiores inovações do React 19. Ele analisa seu código automaticamente e aplica otimizações que antes precisavam ser feitas manualmente com useMemo, useCallback e React.memo.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.frontend.id,
                            authorId: users[0].cognitoSub, // Rainer
                            status: 'PUBLISHED',
                            featured: true,
                            allowComments: true,
                            pinned: true,
                            priority: 1,
                            publishedAt: new Date('2024-12-01').toISOString(),
                            createdAt: new Date('2024-11-25').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 2847,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'Next.js 15: App Router e Server Actions na Prática',
                            slug: 'nextjs-15-app-router-server-actions-pratica',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Next.js 15 consolidou o App Router como o futuro do framework, trazendo Server Actions estáveis e performance incomparável. Neste tutorial hands-on, construímos uma aplicação completa do zero, explorando Server Components, Client Components, streaming, caching inteligente e as melhores práticas para aplicações em produção.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.frontend.id,
                            authorId: users[0].cognitoSub,
                            status: 'PUBLISHED',
                            featured: true,
                            allowComments: true,
                            publishedAt: new Date('2024-11-20').toISOString(),
                            createdAt: new Date('2024-11-15').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 1923,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        // Posts de Backend por Rainer
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'NestJS: Arquitetura Enterprise com DDD e Clean Architecture',
                            slug: 'nestjs-arquitetura-enterprise-ddd-clean-architecture',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'NestJS é a escolha ideal para aplicações Node.js de nível enterprise. Neste guia completo, implementamos uma arquitetura robusta usando Domain-Driven Design (DDD), Clean Architecture, CQRS, Event Sourcing e microservices. Aprenda a estruturar aplicações que escalam para milhões de usuários mantendo código limpo e testável.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.backend.id,
                            authorId: users[0].cognitoSub,
                            status: 'PUBLISHED',
                            featured: false,
                            allowComments: true,
                            publishedAt: new Date('2024-11-15').toISOString(),
                            createdAt: new Date('2024-11-10').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 1456,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'AWS Lambda + DynamoDB: Serverless na Prática',
                            slug: 'aws-lambda-dynamodb-serverless-pratica',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Serverless é o futuro da computação em nuvem. Neste projeto prático, construímos uma API completa usando AWS Lambda, DynamoDB, API Gateway e Cognito. Exploramos patterns avançados como single-table design, optimistic locking, event-driven architecture e monitoramento com CloudWatch. Inclui código completo e deploy automatizado.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.devops.id,
                            authorId: users[0].cognitoSub,
                            status: 'PUBLISHED',
                            featured: true,
                            allowComments: true,
                            publishedAt: new Date('2024-11-10').toISOString(),
                            createdAt: new Date('2024-11-05').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 2134,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        // Posts de Design por Ana
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'Design Systems: Da Teoria à Implementação com Figma e Storybook',
                            slug: 'design-systems-teoria-implementacao-figma-storybook',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Design Systems são essenciais para produtos digitais escaláveis. Neste guia completo, criamos um design system do zero usando Figma para design e Storybook para documentação. Abordamos tokens de design, componentes atômicos, variantes, documentação interativa e integração com desenvolvimento. Inclui templates e exemplos reais.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.designSystems.id,
                            authorId: users[3].cognitoSub, // Ana
                            status: 'PUBLISHED',
                            featured: true,
                            allowComments: true,
                            publishedAt: new Date('2024-11-08').toISOString(),
                            createdAt: new Date('2024-11-03').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 1789,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'UX Research: Métodos Práticos para Produtos Digitais',
                            slug: 'ux-research-metodos-praticos-produtos-digitais',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'UX Research é fundamental para criar produtos que realmente resolvem problemas dos usuários. Neste artigo prático, exploramos métodos quantitativos e qualitativos: entrevistas, surveys, testes de usabilidade, card sorting, tree testing e analytics. Aprenda a planejar, executar e apresentar pesquisas que impactam decisões de produto.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.uxui.id,
                            authorId: users[3].cognitoSub,
                            status: 'PUBLISHED',
                            featured: false,
                            allowComments: true,
                            publishedAt: new Date('2024-11-05').toISOString(),
                            createdAt: new Date('2024-10-30').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 1234,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        // Posts de Carreira
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'Carreira Tech: Do Júnior ao Senior em 3 Anos',
                            slug: 'carreira-tech-junior-senior-3-anos',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Acelerar a carreira em tecnologia requer estratégia, dedicação e as escolhas certas. Neste guia baseado em experiência real, compartilho o roadmap completo que me levou de desenvolvedor júnior a senior em 3 anos. Inclui skills técnicas, soft skills, networking, projetos pessoais, contribuições open source e negociação salarial.',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.produtividade.id,
                            authorId: users[0].cognitoSub,
                            status: 'PUBLISHED',
                            featured: false,
                            allowComments: true,
                            publishedAt: new Date('2024-11-03').toISOString(),
                            createdAt: new Date('2024-10-28').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 3456,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                        // Post em rascunho
                        {
                            id: (0, nanoid_1.nanoid)(),
                            title: 'TypeScript 5.5: Novidades e Melhores Práticas',
                            slug: 'typescript-55-novidades-melhores-praticas',
                            content: {
                                type: 'doc',
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'TypeScript 5.5 trouxe melhorias significativas em performance, type inference e developer experience. Neste artigo, exploramos as principais novidades como...',
                                            },
                                        ],
                                    },
                                ],
                            },
                            subcategoryId: categories.frontend.id,
                            authorId: users[0].cognitoSub,
                            status: 'DRAFT',
                            featured: false,
                            allowComments: true,
                            createdAt: new Date('2024-11-28').toISOString(),
                            updatedAt: new Date().toISOString(),
                            views: 0,
                            likesCount: 0,
                            commentsCount: 0,
                            bookmarksCount: 0,
                        },
                    ];
                    createdPosts = [];
                    _i = 0, posts_1 = posts;
                    _a.label = 1;
                case 1:
                    if (!(_i < posts_1.length)) return [3 /*break*/, 4];
                    postData = posts_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.POSTS,
                            Item: postData,
                        }))];
                case 2:
                    _a.sent();
                    createdPosts.push(postData);
                    console.log("   \u2705 \"".concat(postData.title, "\" (").concat(postData.status, ")"));
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    publishedPosts = createdPosts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    frontendPosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.frontend.id; }).length;
                    backendPosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.backend.id; }).length;
                    devopsPosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.devops.id; }).length;
                    uxuiPosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.uxui.id; }).length;
                    designSystemsPosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.designSystems.id; }).length;
                    produtividadePosts = publishedPosts.filter(function (p) { return p.subcategoryId === categories.produtividade.id; }).length;
                    if (!(frontendPosts > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.frontend), { postsCount: frontendPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (!(backendPosts > 0)) return [3 /*break*/, 8];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.backend), { postsCount: backendPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    if (!(devopsPosts > 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.devops), { postsCount: devopsPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    if (!(uxuiPosts > 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.uxui), { postsCount: uxuiPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    if (!(designSystemsPosts > 0)) return [3 /*break*/, 14];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.designSystems), { postsCount: designSystemsPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 13:
                    _a.sent();
                    _a.label = 14;
                case 14:
                    if (!(produtividadePosts > 0)) return [3 /*break*/, 16];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.produtividade), { postsCount: produtividadePosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16:
                    tecnologiaPosts = frontendPosts + backendPosts + devopsPosts;
                    designPosts = uxuiPosts + designSystemsPosts;
                    carreiraPosts = produtividadePosts;
                    if (!(tecnologiaPosts > 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.tecnologia), { postsCount: tecnologiaPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18:
                    if (!(designPosts > 0)) return [3 /*break*/, 20];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.design), { postsCount: designPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 19:
                    _a.sent();
                    _a.label = 20;
                case 20:
                    if (!(carreiraPosts > 0)) return [3 /*break*/, 22];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.CATEGORIES,
                            Item: __assign(__assign({}, categories.carreira), { postsCount: carreiraPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 21:
                    _a.sent();
                    _a.label = 22;
                case 22:
                    rainerPosts = publishedPosts.filter(function (p) { return p.authorId === users[0].cognitoSub; }).length;
                    anaPosts = publishedPosts.filter(function (p) { return p.authorId === users[3].cognitoSub; }).length;
                    if (!(rainerPosts > 0)) return [3 /*break*/, 24];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.USERS,
                            Item: __assign(__assign({}, users[0]), { postsCount: rainerPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 23:
                    _a.sent();
                    _a.label = 24;
                case 24:
                    if (!(anaPosts > 0)) return [3 /*break*/, 26];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.USERS,
                            Item: __assign(__assign({}, users[3]), { postsCount: anaPosts, updatedAt: new Date().toISOString() }),
                        }))];
                case 25:
                    _a.sent();
                    _a.label = 26;
                case 26: return [2 /*return*/, createdPosts];
            }
        });
    });
}
/**
 * Cria comentários realistas
 */
function seedComments(users, posts) {
    return __awaiter(this, void 0, void 0, function () {
        var publishedPosts, comments, createdComments, _i, comments_1, commentData, commentCounts, _loop_2, _a, _b, _c, postId, count, userCommentCounts, _loop_3, _d, _e, _f, userId, count;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log('\n💬 Criando comentários...');
                    publishedPosts = posts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    comments = [
                        // Comentários no post de React 19
                        {
                            id: (0, nanoid_1.nanoid)(),
                            content: 'Excelente artigo, Rainer! O React Compiler realmente vai mudar o jogo. Já testei na versão beta e a diferença de performance é impressionante. Mal posso esperar para usar em produção.',
                            authorId: users[2].cognitoSub, // João
                            postId: publishedPosts[0].id,
                            parentId: null,
                            isApproved: true,
                            createdAt: new Date('2024-12-02').toISOString(),
                            updatedAt: new Date('2024-12-02').toISOString(),
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            content: 'Obrigado João! Realmente é uma revolução. O que mais me impressiona é como o compiler consegue otimizar código que nem imaginávamos que poderia ser melhorado. Vale muito a pena migrar.',
                            authorId: users[0].cognitoSub, // Rainer respondendo
                            postId: publishedPosts[0].id,
                            parentId: null, // Seria o ID do comentário anterior, mas simplificando
                            isApproved: true,
                            createdAt: new Date('2024-12-02').toISOString(),
                            updatedAt: new Date('2024-12-02').toISOString(),
                        },
                        // Comentário no post de Next.js
                        {
                            id: (0, nanoid_1.nanoid)(),
                            content: 'Tutorial fantástico! Server Actions realmente simplificam muito o desenvolvimento. Não preciso mais criar rotas de API separadas para tudo. Isso economiza muito tempo.',
                            authorId: users[3].cognitoSub, // Ana
                            postId: publishedPosts[1].id,
                            parentId: null,
                            isApproved: true,
                            createdAt: new Date('2024-11-21').toISOString(),
                            updatedAt: new Date('2024-11-21').toISOString(),
                        },
                        // Comentário no post de NestJS
                        {
                            id: (0, nanoid_1.nanoid)(),
                            content: 'Implementação muito sólida! Estou aplicando esses conceitos de DDD no meu projeto atual. A separação de responsabilidades fica muito mais clara com essa arquitetura.',
                            authorId: users[4].cognitoSub, // Carlos
                            postId: publishedPosts[2].id,
                            parentId: null,
                            isApproved: true,
                            createdAt: new Date('2024-11-16').toISOString(),
                            updatedAt: new Date('2024-11-16').toISOString(),
                        },
                        // Comentário no post de Design Systems
                        {
                            id: (0, nanoid_1.nanoid)(),
                            content: 'Ana, seu trabalho com design systems é inspirador! A integração entre Figma e Storybook que você mostrou vai revolucionar nosso workflow de design-dev.',
                            authorId: users[2].cognitoSub, // João
                            postId: publishedPosts[4].id,
                            parentId: null,
                            isApproved: true,
                            createdAt: new Date('2024-11-09').toISOString(),
                            updatedAt: new Date('2024-11-09').toISOString(),
                        },
                    ];
                    createdComments = [];
                    _i = 0, comments_1 = comments;
                    _g.label = 1;
                case 1:
                    if (!(_i < comments_1.length)) return [3 /*break*/, 4];
                    commentData = comments_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.COMMENTS,
                            Item: commentData,
                        }))];
                case 2:
                    _g.sent();
                    createdComments.push(commentData);
                    _g.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("   \u2705 ".concat(createdComments.length, " coment\u00E1rios criados"));
                    commentCounts = {};
                    createdComments.forEach(function (comment) {
                        commentCounts[comment.postId] = (commentCounts[comment.postId] || 0) + 1;
                    });
                    _loop_2 = function (postId, count) {
                        var post;
                        return __generator(this, function (_h) {
                            switch (_h.label) {
                                case 0:
                                    post = posts.find(function (p) { return p.id === postId; });
                                    if (!post) return [3 /*break*/, 2];
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                                            TableName: TABLES.POSTS,
                                            Item: __assign(__assign({}, post), { commentsCount: count, updatedAt: new Date().toISOString() }),
                                        }))];
                                case 1:
                                    _h.sent();
                                    _h.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, _b = Object.entries(commentCounts);
                    _g.label = 5;
                case 5:
                    if (!(_a < _b.length)) return [3 /*break*/, 8];
                    _c = _b[_a], postId = _c[0], count = _c[1];
                    return [5 /*yield**/, _loop_2(postId, count)];
                case 6:
                    _g.sent();
                    _g.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    userCommentCounts = {};
                    createdComments.forEach(function (comment) {
                        userCommentCounts[comment.authorId] = (userCommentCounts[comment.authorId] || 0) + 1;
                    });
                    _loop_3 = function (userId, count) {
                        var user;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    user = users.find(function (u) { return u.cognitoSub === userId; });
                                    if (!user) return [3 /*break*/, 2];
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                                            TableName: TABLES.USERS,
                                            Item: __assign(__assign({}, user), { commentsCount: count, updatedAt: new Date().toISOString() }),
                                        }))];
                                case 1:
                                    _j.sent();
                                    _j.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, _e = Object.entries(userCommentCounts);
                    _g.label = 9;
                case 9:
                    if (!(_d < _e.length)) return [3 /*break*/, 12];
                    _f = _e[_d], userId = _f[0], count = _f[1];
                    return [5 /*yield**/, _loop_3(userId, count)];
                case 10:
                    _g.sent();
                    _g.label = 11;
                case 11:
                    _d++;
                    return [3 /*break*/, 9];
                case 12: return [2 /*return*/, createdComments];
            }
        });
    });
}
/**
 * Cria likes realistas
 */
function seedLikes(users, posts) {
    return __awaiter(this, void 0, void 0, function () {
        var publishedPosts, likes, _i, likes_1, likeData, likeCounts, _loop_4, _a, _b, _c, postId, count;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('\n❤️  Criando likes...');
                    publishedPosts = posts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    likes = [
                        // Likes no post de React 19 (mais popular)
                        { id: (0, nanoid_1.nanoid)(), userId: users[1].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[2].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[3].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[4].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-02').toISOString() },
                        // Likes no post de Next.js
                        { id: (0, nanoid_1.nanoid)(), userId: users[2].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-20').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[3].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-21').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[4].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-21').toISOString() },
                        // Likes no post de AWS Lambda
                        { id: (0, nanoid_1.nanoid)(), userId: users[1].cognitoSub, postId: publishedPosts[3].id, createdAt: new Date('2024-11-10').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[2].cognitoSub, postId: publishedPosts[3].id, createdAt: new Date('2024-11-11').toISOString() },
                        // Likes no post de Design Systems
                        { id: (0, nanoid_1.nanoid)(), userId: users[0].cognitoSub, postId: publishedPosts[4].id, createdAt: new Date('2024-11-08').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[2].cognitoSub, postId: publishedPosts[4].id, createdAt: new Date('2024-11-09').toISOString() },
                        // Likes no post de Carreira
                        { id: (0, nanoid_1.nanoid)(), userId: users[2].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-03').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[3].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-04').toISOString() },
                        { id: (0, nanoid_1.nanoid)(), userId: users[4].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-04').toISOString() },
                    ];
                    _i = 0, likes_1 = likes;
                    _d.label = 1;
                case 1:
                    if (!(_i < likes_1.length)) return [3 /*break*/, 4];
                    likeData = likes_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.LIKES,
                            Item: likeData,
                        }))];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("   \u2705 ".concat(likes.length, " likes criados"));
                    likeCounts = {};
                    likes.forEach(function (like) {
                        likeCounts[like.postId] = (likeCounts[like.postId] || 0) + 1;
                    });
                    _loop_4 = function (postId, count) {
                        var post;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    post = posts.find(function (p) { return p.id === postId; });
                                    if (!post) return [3 /*break*/, 2];
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                                            TableName: TABLES.POSTS,
                                            Item: __assign(__assign({}, post), { likesCount: count, updatedAt: new Date().toISOString() }),
                                        }))];
                                case 1:
                                    _e.sent();
                                    _e.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, _b = Object.entries(likeCounts);
                    _d.label = 5;
                case 5:
                    if (!(_a < _b.length)) return [3 /*break*/, 8];
                    _c = _b[_a], postId = _c[0], count = _c[1];
                    return [5 /*yield**/, _loop_4(postId, count)];
                case 6:
                    _d.sent();
                    _d.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8: return [2 /*return*/, likes];
            }
        });
    });
}
/**
 * Cria bookmarks realistas
 */
function seedBookmarks(users, posts) {
    return __awaiter(this, void 0, void 0, function () {
        var publishedPosts, bookmarks, _i, bookmarks_1, bookmarkData, bookmarkCounts, _loop_5, _a, _b, _c, postId, count;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('\n🔖 Criando bookmarks...');
                    publishedPosts = posts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    bookmarks = [
                        // Carlos salvou posts técnicos
                        {
                            id: (0, nanoid_1.nanoid)(),
                            userId: users[4].cognitoSub,
                            postId: publishedPosts[0].id, // React 19
                            collection: 'Estudar Depois',
                            notes: 'Preciso estudar o React Compiler com mais detalhes',
                            createdAt: new Date('2024-12-01').toISOString(),
                            updatedAt: new Date('2024-12-01').toISOString(),
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            userId: users[4].cognitoSub,
                            postId: publishedPosts[2].id, // NestJS
                            collection: 'Arquitetura',
                            notes: 'Implementar DDD no projeto atual',
                            createdAt: new Date('2024-11-15').toISOString(),
                            updatedAt: new Date('2024-11-15').toISOString(),
                        },
                        // João salvou posts de referência
                        {
                            id: (0, nanoid_1.nanoid)(),
                            userId: users[2].cognitoSub,
                            postId: publishedPosts[1].id, // Next.js
                            collection: 'Favoritos',
                            notes: 'Melhor tutorial de Server Actions que já vi',
                            createdAt: new Date('2024-11-20').toISOString(),
                            updatedAt: new Date('2024-11-20').toISOString(),
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            userId: users[2].cognitoSub,
                            postId: publishedPosts[4].id, // Design Systems
                            collection: 'Design',
                            notes: 'Para mostrar para o time de design',
                            createdAt: new Date('2024-11-08').toISOString(),
                            updatedAt: new Date('2024-11-08').toISOString(),
                        },
                        // Ana salvou posts técnicos
                        {
                            id: (0, nanoid_1.nanoid)(),
                            userId: users[3].cognitoSub,
                            postId: publishedPosts[3].id, // AWS Lambda
                            collection: 'Aprender Backend',
                            notes: 'Quero entender melhor serverless',
                            createdAt: new Date('2024-11-10').toISOString(),
                            updatedAt: new Date('2024-11-10').toISOString(),
                        },
                    ];
                    _i = 0, bookmarks_1 = bookmarks;
                    _d.label = 1;
                case 1:
                    if (!(_i < bookmarks_1.length)) return [3 /*break*/, 4];
                    bookmarkData = bookmarks_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.BOOKMARKS,
                            Item: bookmarkData,
                        }))];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("   \u2705 ".concat(bookmarks.length, " bookmarks criados"));
                    bookmarkCounts = {};
                    bookmarks.forEach(function (bookmark) {
                        bookmarkCounts[bookmark.postId] = (bookmarkCounts[bookmark.postId] || 0) + 1;
                    });
                    _loop_5 = function (postId, count) {
                        var post;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    post = posts.find(function (p) { return p.id === postId; });
                                    if (!post) return [3 /*break*/, 2];
                                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                                            TableName: TABLES.POSTS,
                                            Item: __assign(__assign({}, post), { bookmarksCount: count, updatedAt: new Date().toISOString() }),
                                        }))];
                                case 1:
                                    _e.sent();
                                    _e.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, _b = Object.entries(bookmarkCounts);
                    _d.label = 5;
                case 5:
                    if (!(_a < _b.length)) return [3 /*break*/, 8];
                    _c = _b[_a], postId = _c[0], count = _c[1];
                    return [5 /*yield**/, _loop_5(postId, count)];
                case 6:
                    _d.sent();
                    _d.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8: return [2 /*return*/, bookmarks];
            }
        });
    });
}
/**
 * Cria notificações realistas
 */
function seedNotifications(users, posts) {
    return __awaiter(this, void 0, void 0, function () {
        var publishedPosts, notifications, _i, notifications_1, notificationData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🔔 Criando notificações...');
                    publishedPosts = posts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    notifications = [
                        // Notificações para Rainer (autor principal)
                        {
                            id: (0, nanoid_1.nanoid)(),
                            type: 'NEW_COMMENT',
                            title: 'Novo Comentário',
                            message: 'João Santos comentou no seu post "React 19: Revolucionando o Desenvolvimento Frontend"',
                            link: "/blog/".concat(publishedPosts[0].slug),
                            userId: users[0].cognitoSub,
                            isRead: false,
                            metadata: {
                                postId: publishedPosts[0].id,
                                commentAuthor: 'João Santos',
                                postTitle: publishedPosts[0].title,
                            },
                            createdAt: new Date('2024-12-02').toISOString(),
                            updatedAt: new Date('2024-12-02').toISOString(),
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            type: 'NEW_LIKE',
                            title: 'Novo Like',
                            message: 'Ana Costa curtiu seu post "Next.js 15: App Router e Server Actions na Prática"',
                            link: "/blog/".concat(publishedPosts[1].slug),
                            userId: users[0].cognitoSub,
                            isRead: true,
                            readAt: new Date('2024-11-21').toISOString(),
                            metadata: {
                                postId: publishedPosts[1].id,
                                likeAuthor: 'Ana Costa',
                                postTitle: publishedPosts[1].title,
                            },
                            createdAt: new Date('2024-11-21').toISOString(),
                            updatedAt: new Date('2024-11-21').toISOString(),
                        },
                        {
                            id: (0, nanoid_1.nanoid)(),
                            type: 'POST_PUBLISHED',
                            title: 'Post Publicado',
                            message: 'Seu post "AWS Lambda + DynamoDB: Serverless na Prática" foi publicado com sucesso!',
                            link: "/blog/".concat(publishedPosts[3].slug),
                            userId: users[0].cognitoSub,
                            isRead: true,
                            readAt: new Date('2024-11-10').toISOString(),
                            createdAt: new Date('2024-11-10').toISOString(),
                            updatedAt: new Date('2024-11-10').toISOString(),
                        },
                        // Notificações para Ana
                        {
                            id: (0, nanoid_1.nanoid)(),
                            type: 'NEW_COMMENT',
                            title: 'Novo Comentário',
                            message: 'João Santos comentou no seu post "Design Systems: Da Teoria à Implementação"',
                            link: "/blog/".concat(publishedPosts[4].slug),
                            userId: users[3].cognitoSub,
                            isRead: false,
                            metadata: {
                                postId: publishedPosts[4].id,
                                commentAuthor: 'João Santos',
                                postTitle: publishedPosts[4].title,
                            },
                            createdAt: new Date('2024-11-09').toISOString(),
                            updatedAt: new Date('2024-11-09').toISOString(),
                        },
                        // Notificações do sistema para novos usuários
                        {
                            id: (0, nanoid_1.nanoid)(),
                            type: 'SYSTEM',
                            title: 'Bem-vindo ao Rainer Soft Blog!',
                            message: 'Obrigado por se cadastrar! Explore nossos artigos sobre tecnologia, design e carreira. Não se esqueça de deixar seus comentários e interagir com a comunidade.',
                            userId: users[4].cognitoSub, // Carlos
                            isRead: false,
                            createdAt: new Date('2023-05-20').toISOString(),
                            updatedAt: new Date('2023-05-20').toISOString(),
                        },
                    ];
                    _i = 0, notifications_1 = notifications;
                    _a.label = 1;
                case 1:
                    if (!(_i < notifications_1.length)) return [3 /*break*/, 4];
                    notificationData = notifications_1[_i];
                    return [4 /*yield*/, docClient.send(new lib_dynamodb_1.PutCommand({
                            TableName: TABLES.NOTIFICATIONS,
                            Item: notificationData,
                        }))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("   \u2705 ".concat(notifications.length, " notifica\u00E7\u00F5es criadas"));
                    return [2 /*return*/, notifications];
            }
        });
    });
}
/**
 * Função principal de seed
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var users, categories, posts, comments, likes, bookmarks, notifications, publishedPosts, draftPosts, approvedComments, unreadNotifications, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🌱 Iniciando seed do DynamoDB com dados reais...\n');
                    console.log('═══════════════════════════════════════════════════════════════════════════');
                    console.log("  \uD83D\uDDC4\uFE0F  POPULANDO ".concat(environment.toUpperCase()));
                    console.log('═══════════════════════════════════════════════════════════════════════════\n');
                    console.log("\uD83C\uDF0D Ambiente: ".concat(environment));
                    console.log("\uD83D\uDD17 Endpoint: ".concat(process.env.DYNAMODB_ENDPOINT || 'AWS Cloud (padrão)'));
                    console.log("\uD83D\uDCCA Nome base das tabelas: ".concat(index_js_1.config.database.tableName));
                    console.log("\uD83C\uDF0E Regi\u00E3o: ".concat(index_js_1.config.aws.region, "\n"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    // Limpar banco
                    return [4 /*yield*/, cleanup()];
                case 2:
                    // Limpar banco
                    _a.sent();
                    return [4 /*yield*/, seedUsers()];
                case 3:
                    users = _a.sent();
                    return [4 /*yield*/, seedCategories()];
                case 4:
                    categories = _a.sent();
                    return [4 /*yield*/, seedPosts(users, categories)];
                case 5:
                    posts = _a.sent();
                    return [4 /*yield*/, seedComments(users, posts)];
                case 6:
                    comments = _a.sent();
                    return [4 /*yield*/, seedLikes(users, posts)];
                case 7:
                    likes = _a.sent();
                    return [4 /*yield*/, seedBookmarks(users, posts)];
                case 8:
                    bookmarks = _a.sent();
                    return [4 /*yield*/, seedNotifications(users, posts)];
                case 9:
                    notifications = _a.sent();
                    console.log('\n═══════════════════════════════════════════════════════════════════════════');
                    console.log('  ✅ SEED CONCLUÍDO COM SUCESSO!');
                    console.log('═══════════════════════════════════════════════════════════════════════════\n');
                    publishedPosts = posts.filter(function (p) { return p.status === 'PUBLISHED'; });
                    draftPosts = posts.filter(function (p) { return p.status === 'DRAFT'; });
                    approvedComments = comments.filter(function (c) { return c.isApproved; });
                    unreadNotifications = notifications.filter(function (n) { return !n.isRead; });
                    console.log('📊 Resumo dos dados criados:');
                    console.log("   \u2022 ".concat(users.length, " usu\u00E1rios (1 admin, 1 editor, 2 autores, 1 subscriber)"));
                    console.log("   \u2022 9 categorias (3 principais + 6 subcategorias)");
                    console.log("   \u2022 ".concat(posts.length, " posts (").concat(publishedPosts.length, " publicados, ").concat(draftPosts.length, " rascunho)"));
                    console.log("   \u2022 ".concat(comments.length, " coment\u00E1rios (").concat(approvedComments.length, " aprovados)"));
                    console.log("   \u2022 ".concat(likes.length, " likes"));
                    console.log("   \u2022 ".concat(bookmarks.length, " bookmarks"));
                    console.log("   \u2022 ".concat(notifications.length, " notifica\u00E7\u00F5es (").concat(unreadNotifications.length, " n\u00E3o lidas)"));
                    console.log('\n🎯 Dados destacados:');
                    console.log('   • Usuário admin: Rainer Teixeira (cognitoSub real)');
                    console.log('   • Posts com conteúdo profissional e realista');
                    console.log('   • Categorias: Tecnologia, Design, Carreira');
                    console.log('   • Subcategorias: Frontend, Backend, DevOps, UX/UI, Design Systems, Produtividade');
                    console.log('   • Views realistas nos posts (1K-3K)');
                    console.log('   • Comentários e interações orgânicas');
                    console.log('\n💡 Próximos passos:');
                    console.log('   • Execute: npm run dev (iniciar servidor)');
                    console.log('   • Acesse: http://localhost:4000/docs (Swagger)');
                    console.log('   • Teste: GET /health (verificar status)');
                    console.log('   • Login: Use o usuário aoline no Cognito');
                    console.log('\n🎉 Banco de dados populado e pronto para produção!\n');
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _a.sent();
                    console.error('\n❌ Erro ao popular banco:', error_2);
                    throw error_2;
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Executar seed
main()
    .then(function () {
    console.log('✅ Script concluído com sucesso!\n');
    process.exit(0);
})
    .catch(function (error) {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
});
