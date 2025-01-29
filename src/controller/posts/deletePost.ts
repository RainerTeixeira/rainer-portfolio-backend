const { deleteItem } = require('../services/dynamoDb');
const TABLE_NAME = 'PostsTable';

module.exports.deletePost = async (event) => {
    try {
        const postId = event.pathParameters.id;
        await deleteItem(TABLE_NAME, { id: postId });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post deleted successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting post' }),
        };
    }
};
