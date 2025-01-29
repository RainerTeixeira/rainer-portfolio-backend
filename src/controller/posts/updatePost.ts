const { updateItem } = require('../services/dynamoDb');
const TABLE_NAME = 'PostsTable';

module.exports.updatePost = async (event) => {
    try {
        const postId = event.pathParameters.id;
        const updatedPost = JSON.parse(event.body);
        const updateExpression = 'set #title = :title, #content = :content, #updatedAt = :updatedAt';
        const expressionAttributeValues = {
            ':title': updatedPost.title,
            ':content': updatedPost.content,
            ':updatedAt': new Date().toISOString(),
        };
        await updateItem(TABLE_NAME, { id: postId }, updateExpression, expressionAttributeValues);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post updated successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating post' }),
        };
    }
};
