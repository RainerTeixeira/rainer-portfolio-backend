const { createItem } = require('../services/dynamoDb');
const { createPostDto } = require('./dto/createPost.dto');
const TABLE_NAME = 'PostsTable';

module.exports.createPost = async (event) => {
    try {
        const newPost = JSON.parse(event.body);
        const postDto = createPostDto(newPost); // Valida e formata os dados
        await createItem(TABLE_NAME, postDto);
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Post created successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating post', error: error.message }),
        };
    }
};
