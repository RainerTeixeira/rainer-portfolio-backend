#!/bin/bash
echo \ ?? Starting Rainer Portfolio Backend with Docker...\
echo \?? Building image...\
docker build -t rainer-backend .
echo \?? Starting services...\
docker-compose up -d
echo \? Backend is running!\
echo \\
echo \?? Services:\
echo \ • API: http://localhost:4000\
echo \ • Docs: http://localhost:4000/docs\
echo \ • MongoDB: mongodb://localhost:27017\
echo \ • DynamoDB: http://localhost:8000\
echo \ • DynamoDB Admin: http://localhost:8001\
echo \\
echo \?? Commands:\
echo \ • View logs: docker-compose logs -f\
echo \ • Stop services: docker-compose down\
