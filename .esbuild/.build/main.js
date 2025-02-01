"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Welcome to Rainer Portfolio API',
            endpoints: {
                posts: '/posts',
                authors: '/authors',
                categories: '/categories',
                comments: '/comments'
            }
        })
    };
};
exports.handler = handler;
//# sourceMappingURL=main.js.map