import { DynamoDB } from 'aws-sdk';

// Configuração do DynamoDB para suportar tanto local quanto AWS
const dynamoDB = new DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMO_DB_ENDPOINT || undefined, // Usa o DynamoDB local se configurado
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
});

// Função genérica para criar um item
const createItem = async (tableName, itemData) => {
    const params = {
        TableName: tableName,
        Item: itemData,
    };
    try {
        await dynamoDB.put(params).promise();
        return itemData;
    } catch (error) {
        console.error("Error creating item:", error);
        throw new Error('Error creating item');
    }
};

// Função genérica para obter um item pelo ID
const getItem = async (tableName, key) => {
    const params = {
        TableName: tableName,
        Key: key,
    };
    try {
        const result = await dynamoDB.get(params).promise();
        return result.Item;
    } catch (error) {
        console.error("Error getting item:", error);
        throw new Error('Error getting item');
    }
};

// Função genérica para obter todos os itens de uma tabela
const getAllItems = async (tableName) => {
    const params = {
        TableName: tableName,
    };
    try {
        const result = await dynamoDB.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.error("Error getting items:", error);
        throw new Error('Error getting items');
    }
};

// Função genérica para atualizar um item
const updateItem = async (tableName, key, updateExpression, expressionAttributeValues) => {
    const params = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
    };
    try {
        const result = await dynamoDB.update(params).promise();
        return result.Attributes;
    } catch (error) {
        console.error("Error updating item:", error);
        throw new Error('Error updating item');
    }
};

// Função genérica para excluir um item
const deleteItem = async (tableName, key) => {
    const params = {
        TableName: tableName,
        Key: key,
    };
    try {
        await dynamoDB.delete(params).promise();
        return { message: 'Item deleted successfully' };
    } catch (error) {
        console.error("Error deleting item:", error);
        throw new Error('Error deleting item');
    }
};

export default { createItem, getItem, getAllItems, updateItem, deleteItem };
