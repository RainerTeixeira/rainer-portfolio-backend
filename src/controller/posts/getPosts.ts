const { getAllItems } = require('../services/dynamoDb');
const TABLE_NAME = 'PostsTable';

module.exports.getPosts = async () => {
    try {
        const posts = await getAllItems(TABLE_NAME);
        return {
            statusCode: 200,
            body: JSON.stringify(posts),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching posts' }),
        };
    }
};
