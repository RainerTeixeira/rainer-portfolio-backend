"use strict";
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
    }
});
const docClient = DynamoDBDocumentClient.from(client);
async function seedData() {
    console.log('Seeding DynamoDB...');
    await docClient.send(new PutCommand({
        TableName: 'users',
        Item: {
            cognitoSub: 'user-123',
            email: 'joao@example.com',
            name: 'João Silva',
            nickname: 'João',
            role: 'AUTHOR',
            bio: 'Desenvolvedor Full Stack',
            website: 'https://joaosilva.dev',
            avatar: 'https://picsum.photos/200/200',
            socialLinks: {
                github: 'https://github.com/joaosilva',
                linkedin: 'https://linkedin.com/in/joaosilva'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }));
    const posts = [
        {
            id: 'post-1',
            title: 'Introdução ao NestJS',
            slug: 'introducao-ao-nestjs',
            content: 'NestJS é um framework para construir aplicações Node.js server-side eficientes...',
            excerpt: 'Aprenda os conceitos básicos do NestJS',
            published: true,
            featured: true,
            authorId: 'user-123',
            categoryId: 'cat-1',
            tags: ['nestjs', 'nodejs', 'backend'],
            readingTime: 5,
            viewCount: 150,
            likeCount: 25,
            commentCount: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'post-2',
            title: 'DynamoDB com Serverless',
            slug: 'dynamodb-com-serverless',
            content: 'DynamoDB é um banco NoSQL totalmente gerenciado que oferece performance escalável...',
            excerpt: 'Como usar DynamoDB em arquiteturas serverless',
            published: true,
            featured: false,
            authorId: 'user-123',
            categoryId: 'cat-2',
            tags: ['dynamodb', 'aws', 'serverless'],
            readingTime: 8,
            viewCount: 89,
            likeCount: 12,
            commentCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    await docClient.send(new BatchWriteCommand({
        RequestItems: {
            'posts': posts.map(post => ({
                PutRequest: { Item: post }
            }))
        }
    }));
    const categories = [
        {
            id: 'cat-1',
            name: 'Backend',
            slug: 'backend',
            description: 'Artigos sobre desenvolvimento backend',
            color: '#3B82F6',
            icon: 'server',
            postCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'cat-2',
            name: 'Cloud',
            slug: 'cloud',
            description: 'Artigos sobre serviços em nuvem',
            color: '#10B981',
            icon: 'cloud',
            postCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    await docClient.send(new BatchWriteCommand({
        RequestItems: {
            'categories': categories.map(cat => ({
                PutRequest: { Item: cat }
            }))
        }
    }));
    console.log('Seed data inserted successfully!');
}
seedData().catch(console.error);
//# sourceMappingURL=seed-dynamodb.js.map