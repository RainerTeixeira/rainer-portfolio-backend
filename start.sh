#!/bin/bash
echo \ ?? Starting Rainer Portfolio Backend...\
docker-compose up -d
echo \? Backend is running!\
echo \?? API: http://localhost:4000\
echo \?? Docs: http://localhost:4000/docs\
echo \?? MongoDB: mongodb://localhost:27017\
echo \?? DynamoDB: http://localhost:8000\
echo \?? DynamoDB Admin: http://localhost:8001\
