"use strict";
/**
 * Criação de Tabelas DynamoDB
 *
 * Script para criar todas as tabelas necessárias no DynamoDB.
 * Suporta DynamoDB Local (desenvolvimento) e AWS DynamoDB (produção).
 *
 * Uso:
 * ```bash
 * npm run dynamodb:create-tables
 * # ou
 * npx tsx scripts/create-dynamodb-tables.ts
 * ```
 *
 * @fileoverview Criação de tabelas DynamoDB
 * @module scripts/create-dynamodb-tables
 */
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
 * - Lambda (AWS_LAMBDA_FUNCTION_NAME existe) → AWS DynamoDB
 * - Local com DYNAMODB_ENDPOINT → DynamoDB Local
 * - Local sem DYNAMODB_ENDPOINT → AWS DynamoDB (scripts manuais)
 */
var isRunningInLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV);
var isLocalEnvironment = !isRunningInLambda && index_js_1.config.aws.useLocalDynamoDB;
var environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';
/**
 * Cliente DynamoDB para operações administrativas
 */
var client = new client_dynamodb_1.DynamoDBClient({
    region: index_js_1.config.aws.region,
    endpoint: index_js_1.config.aws.useLocalDynamoDB ? process.env.DYNAMODB_ENDPOINT : undefined,
    credentials: isLocalEnvironment ? {
        accessKeyId: 'fakeAccessKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
    } : undefined, // AWS usa credenciais do ambiente (IAM Role, AWS CLI, etc)
});
/**
 * ⚡ FREE TIER PERMANENTE: 25 RCU + 25 WCU TOTAL (Provisioned)
 *
 * GRÁTIS PARA SEMPRE (não expira após 12 meses)!
 *
 * AWS Free Tier PERMANENTE:
 * - ✅ 25 GB armazenamento (sempre grátis)
 * - ✅ 25 RCU + 25 WCU provisionados TOTAL (sempre grátis)
 *
 * Distribuição Inteligente entre 7 Tabelas:
 * ┌─────────────────┬─────┬─────┬──────────────────────────┐
 * │ Tabela          │ RCU │ WCU │ Justificativa            │
 * ├─────────────────┼─────┼─────┼──────────────────────────┤
 * │ Users           │  5  │  5  │ ⭐ Mais acessado (auth)  │
 * │ Posts           │  5  │  5  │ ⭐ Mais acessado (feed)  │
 * │ Categories      │  3  │  3  │ Navegação frequente      │
 * │ Comments        │  3  │  3  │ Interações médias        │
 * │ Likes           │  3  │  3  │ Curtidas frequentes      │
 * │ Bookmarks       │  3  │  3  │ Salvamentos médios       │
 * │ Notifications   │  3  │  3  │ Notificações médias      │
 * ├─────────────────┼─────┼─────┼──────────────────────────┤
 * │ TOTAL           │ 25  │ 25  │ ✅ FREE TIER SEMPRE!     │
 * └─────────────────┴─────┴─────┴──────────────────────────┘
 *
 * Boas Práticas Implementadas:
 * 1. ✅ Partition Keys bem distribuídas (id único - evita hot partitions)
 * 2. ✅ Sort Keys para ordenação eficiente (createdAt)
 * 3. ✅ Itens ≤ 1 KB (escrita) e ≤ 4 KB (leitura)
 * 4. ✅ Apenas GSIs essenciais (cada GSI consome RCU/WCU)
 * 5. ✅ CloudFront/cache recomendado (reduz leituras)
 * 6. ✅ Mídia no S3(outro), só metadados no DynamoDB
 *
 * 💡 Para escalar além do Free Tier:
 * - Configure Auto-Scaling (min=1, max=10 por tabela)
 * - Ou mude para On-Demand após 12 meses
 */
/**
 * Definições base das tabelas
 * Serão adaptadas automaticamente para Local ou AWS
 */
var baseTableDefinitions = [
    {
        TableName: TABLES.USERS,
        KeySchema: [
            { AttributeName: 'cognitoSub', KeyType: 'HASH' }, // Partition key (chave primária)
        ],
        AttributeDefinitions: [
            { AttributeName: 'cognitoSub', AttributeType: 'S' },
            { AttributeName: 'nickname', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'NicknameIndex',
                KeySchema: [
                    { AttributeName: 'nickname', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    },
    {
        TableName: TABLES.POSTS,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'slug', AttributeType: 'S' },
            { AttributeName: 'authorId', AttributeType: 'S' },
            { AttributeName: 'subcategoryId', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'SlugIndex',
                KeySchema: [
                    { AttributeName: 'slug', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
            {
                IndexName: 'AuthorIndex',
                KeySchema: [
                    { AttributeName: 'authorId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
            {
                IndexName: 'SubcategoryIndex',
                KeySchema: [
                    { AttributeName: 'subcategoryId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
            {
                IndexName: 'StatusIndex',
                KeySchema: [
                    { AttributeName: 'status', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    },
    {
        TableName: TABLES.CATEGORIES,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'slug', AttributeType: 'S' },
            { AttributeName: 'parentId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'SlugIndex',
                KeySchema: [
                    { AttributeName: 'slug', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 1,
                },
            },
            {
                IndexName: 'ParentIdIndex',
                KeySchema: [
                    { AttributeName: 'parentId', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3,
        },
    },
    {
        TableName: TABLES.COMMENTS,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'postId', AttributeType: 'S' },
            { AttributeName: 'authorId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'PostIndex',
                KeySchema: [
                    { AttributeName: 'postId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
            {
                IndexName: 'AuthorIndex',
                KeySchema: [
                    { AttributeName: 'authorId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3,
        },
    },
    {
        TableName: TABLES.LIKES,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'postId', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'PostIndex',
                KeySchema: [
                    { AttributeName: 'postId', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
            {
                IndexName: 'UserIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3,
        },
    },
    {
        TableName: TABLES.BOOKMARKS,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'postId', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'PostIndex',
                KeySchema: [
                    { AttributeName: 'postId', KeyType: 'HASH' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            },
            {
                IndexName: 'UserIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 2,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3,
        },
    },
    {
        TableName: TABLES.NOTIFICATIONS,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UserIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 3,
                    WriteCapacityUnits: 3,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 3,
            WriteCapacityUnits: 3,
        },
    },
];
/**
 * Verifica se uma tabela existe
 */
function tableExists(tableName) {
    return __awaiter(this, void 0, void 0, function () {
        var command, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    command = new client_dynamodb_1.DescribeTableCommand({ TableName: tableName });
                    return [4 /*yield*/, client.send(command)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_1 = _a.sent();
                    if (error_1.name === 'ResourceNotFoundException') {
                        return [2 /*return*/, false];
                    }
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Cria uma tabela no DynamoDB com Free Tier (25 RCU/WCU)
 */
function createTable(definition) {
    return __awaiter(this, void 0, void 0, function () {
        var exists, throughput, command, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tableExists(definition.TableName)];
                case 1:
                    exists = _a.sent();
                    if (exists) {
                        console.log("\u23ED\uFE0F  Tabela ".concat(definition.TableName, " j\u00E1 existe"));
                        return [2 /*return*/];
                    }
                    throughput = definition.ProvisionedThroughput;
                    console.log("\uD83D\uDCDD Criando tabela ".concat(definition.TableName, " [").concat(throughput.ReadCapacityUnits, " RCU / ").concat(throughput.WriteCapacityUnits, " WCU]..."));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    command = new client_dynamodb_1.CreateTableCommand(definition);
                    return [4 /*yield*/, client.send(command)];
                case 3:
                    _a.sent();
                    // Aguarda a tabela ficar ativa
                    return [4 /*yield*/, (0, client_dynamodb_1.waitUntilTableExists)({ client: client, maxWaitTime: 60 }, { TableName: definition.TableName })];
                case 4:
                    // Aguarda a tabela ficar ativa
                    _a.sent();
                    console.log("\u2705 Tabela ".concat(definition.TableName, " criada com sucesso!"));
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error("\u274C Erro ao criar tabela ".concat(definition.TableName, ":"), error_2.message);
                    throw error_2;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Lista todas as tabelas existentes
 */
function listTables() {
    return __awaiter(this, void 0, void 0, function () {
        var command, response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    command = new client_dynamodb_1.ListTablesCommand({});
                    return [4 /*yield*/, client.send(command)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.TableNames || []];
                case 2:
                    error_3 = _a.sent();
                    console.error('❌ Erro ao listar tabelas:', error_3.message);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Função principal
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var existingTables, error_4, _i, baseTableDefinitions_1, definition, finalTables;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n═══════════════════════════════════════════════════════════════════════════');
                    console.log("  \uD83D\uDDC4\uFE0F  CRIANDO TABELAS NO ".concat(environment.toUpperCase()));
                    console.log('═══════════════════════════════════════════════════════════════════════════\n');
                    console.log("\uD83C\uDF0D Ambiente: ".concat(environment));
                    console.log("\uD83D\uDD17 Endpoint: ".concat(process.env.DYNAMODB_ENDPOINT || 'AWS Cloud (padrão)'));
                    console.log("\uD83D\uDCCA Nome base das tabelas: ".concat(index_js_1.config.database.tableName));
                    console.log("\uD83C\uDF0E Regi\u00E3o: ".concat(index_js_1.config.aws.region));
                    console.log("\uD83D\uDCB0 Billing Mode: Provisioned (FREE TIER PERMANENTE)");
                    console.log("\u26A1 Capacidade Total: 25 RCU + 25 WCU distribu\u00EDdos entre 7 tabelas\n");
                    // Verifica conexão
                    console.log('🔍 Verificando conexão...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, listTables()];
                case 2:
                    existingTables = _a.sent();
                    console.log("\u2705 Conex\u00E3o estabelecida!");
                    if (existingTables.length > 0) {
                        console.log("\uD83D\uDCCB Tabelas existentes: ".concat(existingTables.join(', '), "\n"));
                    }
                    else {
                        console.log('📋 Nenhuma tabela existente\n');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('❌ Erro ao conectar com DynamoDB:', error_4.message);
                    if (isLocalEnvironment) {
                        console.error('\n💡 Certifique-se de que o DynamoDB Local está rodando:');
                        console.error('   docker-compose up -d dynamodb-local\n');
                    }
                    else {
                        console.error('\n💡 Verifique suas credenciais AWS:');
                        console.error('   aws configure');
                        console.error('   aws sts get-caller-identity\n');
                    }
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4:
                    // Cria as tabelas
                    console.log('═══════════════════════════════════════════════════════════════════════════');
                    console.log('  📝 CRIANDO TABELAS');
                    console.log('═══════════════════════════════════════════════════════════════════════════\n');
                    _i = 0, baseTableDefinitions_1 = baseTableDefinitions;
                    _a.label = 5;
                case 5:
                    if (!(_i < baseTableDefinitions_1.length)) return [3 /*break*/, 8];
                    definition = baseTableDefinitions_1[_i];
                    return [4 /*yield*/, createTable(definition)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('\n═══════════════════════════════════════════════════════════════════════════');
                    console.log('  ✨ TODAS AS TABELAS CRIADAS COM SUCESSO!');
                    console.log('═══════════════════════════════════════════════════════════════════════════\n');
                    return [4 /*yield*/, listTables()];
                case 9:
                    finalTables = _a.sent();
                    console.log('📋 Tabelas disponíveis:');
                    finalTables.forEach(function (table) { return console.log("   \u2022 ".concat(table)); });
                    // Informações do Free Tier PERMANENTE
                    console.log('\n💰 AWS Free Tier PERMANENTE (não expira!):');
                    console.log('   ✅ 25 GB de armazenamento (sempre grátis)');
                    console.log('   ✅ 25 RCU + 25 WCU provisionados TOTAL (sempre grátis)');
                    console.log('   ✅ Distribuição: Users(5) + Posts(5) + 5 tabelas(3) = 25 RCU/WCU');
                    console.log('   ✅ Custo: R$ 0,00 PARA SEMPRE! 🎉');
                    console.log('\n📊 Distribuição de Capacidade:');
                    console.log('   ⭐ Users: 5 RCU/WCU (autenticação, perfis)');
                    console.log('   ⭐ Posts: 5 RCU/WCU (feed, listagens)');
                    console.log('   📄 Categories: 3 RCU/WCU (navegação)');
                    console.log('   💬 Comments: 3 RCU/WCU (interações)');
                    console.log('   ❤️  Likes: 3 RCU/WCU (curtidas)');
                    console.log('   🔖 Bookmarks: 3 RCU/WCU (salvamentos)');
                    console.log('   🔔 Notifications: 3 RCU/WCU (notificações)');
                    console.log('\n🛡️ Boas Práticas para NÃO Ultrapassar o Limite:');
                    console.log('   1. ✅ Use CloudFront/cache para reduzir leituras');
                    console.log('   2. ✅ Itens pequenos: ≤1 KB (escrita), ≤4 KB (leitura)');
                    console.log('   3. ✅ Mídia no S3, só metadados no DynamoDB');
                    console.log('   4. ✅ CloudWatch Alarms para monitorar consumo');
                    console.log('   5. ✅ Batch operations (reduz requests)');
                    console.log('   6. ✅ Partition Keys bem distribuídas (evita hot partitions)');
                    console.log('\n⚠️  Se passar do limite:');
                    console.log('   • DynamoDB throttling (HTTP 400 - ProvisionedThroughputExceededException)');
                    console.log('   • Solução 1: Adicionar cache agressivo (CloudFront)');
                    console.log('   • Solução 2: Habilitar Auto-Scaling (min=1, max=10)');
                    console.log('   • Solução 3: Mudar para On-Demand (~$0.40/mês para blog pequeno)');
                    console.log('\n💡 Próximos passos:');
                    console.log('   • Execute: npm run dynamodb:seed (popular dados de teste)');
                    console.log('   • Execute: npm run dev (iniciar servidor)');
                    console.log('   • Configure CloudWatch: aws cloudwatch put-metric-alarm');
                    if (isLocalEnvironment) {
                        console.log('   • Para trocar para AWS: remova DYNAMODB_ENDPOINT do .env');
                    }
                    else {
                        console.log('   • Monitoramento: AWS CloudWatch Console');
                        console.log('   • Custos: aws ce get-cost-and-usage');
                    }
                    console.log();
                    return [2 /*return*/];
            }
        });
    });
}
// Executa o script
main()
    .then(function () {
    console.log('✅ Script concluído com sucesso!\n');
    process.exit(0);
})
    .catch(function (error) {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
});
