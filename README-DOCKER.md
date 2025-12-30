# ?? Rainer Portfolio Backend - Docker

## ?? Overview
Backend NestJS com MongoDB e DynamoDB rodando em containers Docker.

## ?? Quick Start

### Using Docker Compose (Recommended)
`ash
# Start all services
docker-compose up -d

# Or use the convenience script
./start-docker.sh
`

### Manual Docker Build
`ash
# Build image
docker build -t rainer-backend .

# Run with dependencies
docker run -d --name rainer-backend \\
  -p 4000:4000 \\
  -e DATABASE_URL=\ mongodb://host.docker.internal:27017/rainer-portfolio\ \\
  rainer-backend
`

## ?? Services

| Service | Port | Description |
|---------|------|-------------|
| API | 4000 | NestJS Backend |
| MongoDB | 27017 | Banco de dados principal |
| DynamoDB | 8000 | Banco NoSQL AWS |
| DynamoDB Admin | 8001 | Interface web DynamoDB |

## ?? Environment Variables

`ash
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
DATABASE_URL=mongodb://mongodb:27017/rainer-portfolio?replicaSet=rs0
DYNAMODB_ENDPOINT=http://dynamodb:8000
DATABASE_PROVIDER=MONGODB
CORS_ORIGIN=*
LOG_LEVEL=info
`

## ?? Commands

`ash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
`

## ?? Health Checks

`ash
# Check API health
curl http://localhost:4000/api/v1/health

# Check MongoDB
mongosh mongodb://admin:password123@localhost:27017

# Check DynamoDB
curl http://localhost:8000
`

## ?? Development

`ash
# Run in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Access running container
docker exec -it rainer-backend-api sh

# Generate Prisma client
docker exec rainer-backend-api pnpm prisma generate
`

## ?? Notes

- Uses multi-stage build for optimized production image
- Health checks configured for all services
- Non-root user for security
- Volume persistence for data
- Network isolation
