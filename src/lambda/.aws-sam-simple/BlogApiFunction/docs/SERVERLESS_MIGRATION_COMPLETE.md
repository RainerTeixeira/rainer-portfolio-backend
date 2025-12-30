# Complete Serverless Migration Guide - NestJS to AWS

## 🎯 Executive Summary

This guide provides a complete migration path from a traditional NestJS + MongoDB setup to a 100% serverless AWS architecture using Lambda, DynamoDB, and Cognito. The solution is optimized for the AWS Free Tier and production workloads.

## 📋 Migration Overview

### Before Migration
- NestJS with Fastify
- MongoDB with Prisma ORM
- Traditional server deployment
- Manual scaling and infrastructure

### After Migration
- NestJS on AWS Lambda (Node.js 20)
- DynamoDB single-table design
- Cognito authentication
- Auto-scaling serverless infrastructure
- 90% cost reduction for small workloads

## 🏗️ Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AWS Lambda    │    │   DynamoDB      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   Single Table  │
│                 │    │                 │    │                 │
│ - OAuth Login   │    │ - Function URLs │    │ - PK/SK Pattern │
│ - API Calls     │    │ - Cold Start    │    │ - 3 GSIs        │
│ - Static Assets │    │ - Auto Scale    │    │ - Pay-per-use   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  AWS Cognito    │◄─────────────┘
                        │                 │
                        │ - User Pool     │
                        │ - OAuth Providers│
                        │ - JWT Tokens    │
                        └─────────────────┘
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── lambda/
│   │   ├── handler.ts           # Lambda entry point
│   │   └── template.yaml        # SAM infrastructure
│   ├── modules/
│   │   ├── users/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── dynamodb-users.service.ts  # DynamoDB service
│   │   │   │   └── users.service.ts          # Original Prisma service
│   │   │   └── users.module.ts
│   │   ├── posts/
│   │   ├── categories/
│   │   ├── comments/
│   │   ├── likes/
│   │   ├── bookmarks/
│   │   └── notifications/
│   ├── repositories/
│   │   └── dynamodb/            # DynamoDB repositories
│   │       ├── base.repository.ts
│   │       ├── user.repository.ts
│   │       ├── post.repository.ts
│   │       └── ...
│   ├── providers/
│   │   └── dynamodb.provider.ts # DynamoDB client setup
│   └── utils/
│       └── database-provider/   # Database abstraction
├── scripts/
│   ├── setup-dynamodb-local.ps1
│   └── create-dynamodb-tables.ts
└── docs/
    ├── DYNAMODB_SCHEMA_DESIGN.md
    ├── AWS_SERVERLESS_DEPLOYMENT_GUIDE.md
    └── SERVERLESS_MIGRATION_COMPLETE.md
```

## 🔄 Migration Steps

### Phase 1: Preparation (1-2 days)

1. **Backup Existing Data**
   ```bash
   # Export MongoDB data
   mongodump --uri="mongodb://localhost:27017/blog" --out=./backup
   ```

2. **Install Dependencies**
   ```bash
   pnpm add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb
   pnpm add @fastify/aws-lambda
   ```

3. **Setup Local Environment**
   ```bash
   # Start DynamoDB Local
   ./scripts/setup-dynamodb-local.ps1
   ```

### Phase 2: Database Migration (2-3 days)

1. **Create DynamoDB Schema**
   - Review `docs/DYNAMODB_SCHEMA_DESIGN.md`
   - Create tables using provided script
   - Set up GSIs for access patterns

2. **Migrate Data**
   ```typescript
   // Example migration script
   const migrateUsers = async () => {
     const mongoUsers = await UserModel.find({});
     for (const user of mongoUsers) {
       await dynamoUserRepository.create({
         cognitoSub: user.cognitoSub,
         fullName: user.fullName,
         // ... map fields
       });
     }
   };
   ```

3. **Update Services**
   - Create DynamoDB versions of all services
   - Implement database provider abstraction
   - Test with dual-write strategy

### Phase 3: Lambda Migration (1-2 days)

1. **Update Lambda Handler**
   - Already implemented in `src/lambda/handler.ts`
   - Uses memoization for cold starts
   - Supports both local and AWS environments

2. **Configure SAM Template**
   - Review `src/lambda/template.yaml`
   - Adjust memory and timeout for Free Tier
   - Set up environment variables

3. **Local Testing**
   ```bash
   # Test locally
   sam local invoke BlogApiFunction -e events/event.json
   
   # Start local API
   sam local start-api
   ```

### Phase 4: Deployment (1 day)

1. **Deploy to AWS**
   ```bash
   sam build
   sam deploy --guided
   ```

2. **Configure Production**
   - Set up billing alerts
   - Configure log retention
   - Update frontend URLs

3. **Final Testing**
   - Test all endpoints
   - Verify authentication flow
   - Check performance metrics

## 🚨 Critical Considerations

### Free Tier Optimization

1. **Lambda Configuration**
   ```yaml
   MemorySize: 128      # Minimum for Free Tier
   Timeout: 10          # Keep short
   Architectures: [arm64]  # 20% cheaper
   ```

2. **DynamoDB Costs**
   - Use PROVISIONED mode, not PAY_PER_REQUEST
   - Start with 1 RCUs and 1 WCUs
   - Enable auto-scaling with minimums

3. **Monitoring Costs**
   - Set CloudWatch log retention to 7 days
   - Disable X-Ray tracing unless needed
   - Use CloudWatch Free Tier effectively

### Performance Optimization

1. **Cold Start Reduction**
   ```typescript
   // Handler memoization (already implemented)
   let app: INestApplication;
   let handler: Handler;

   export const lambdaHandler = async (event, context) => {
     if (!handler || !app) {
       app = await createApp();
       handler = awsLambdaFastify(app.getHttpAdapter().getInstance());
     }
     return handler(event, context);
   };
   ```

2. **DynamoDB Optimization**
   - Use batch operations when possible
   - Implement pagination correctly
   - Choose optimal partition keys

3. **Lambda Optimization**
   - Keep deployment package < 50MB
   - Use Lambda Layers for dependencies
   - Implement async patterns where possible

## 📊 Monitoring and Debugging

### CloudWatch Metrics to Watch

1. **Lambda Metrics**
   - Duration
   - Throttles
   - Errors
   - ConcurrentExecutions

2. **DynamoDB Metrics**
   - Read/Write Capacity Units
   - ThrottledRequests
   - SystemErrors

3. **Cognito Metrics**
   - SignUpSuccesses
   - TokenRefreshSuccesses
   - FailedLogins

### Debugging Tools

```bash
# View Lambda logs
sam logs -n BlogApiFunction --stack-name blog-api-serverless --tail

# Debug locally
sam local invoke BlogApiFunction -e events/event.json --debug-port 5858

# Test specific endpoint
curl -X POST "https://your-url.lambda-url.us-east-1.on.aws/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🛠️ Common Issues and Solutions

### Issue 1: Lambda Timeouts
**Cause**: Cold starts or long-running operations
**Solution**: 
- Increase timeout gradually
- Optimize database queries
- Use async patterns

### Issue 2: DynamoDB Throttling
**Cause**: Exceeding provisioned capacity
**Solution**:
- Implement exponential backoff
- Increase provisioned capacity
- Use batch operations

### Issue 3: Cognito Callback Errors
**Cause**: Incorrect callback URLs
**Solution**:
- Verify all callback URLs in Cognito console
- Check environment variables
- Test OAuth flow end-to-end

## 📈 Scaling Strategy

### Beyond Free Tier

1. **Lambda Scaling**
   - Increase memory based on actual usage
   - Add reserved concurrency for critical functions
   - Consider Lambda Layers for larger applications

2. **DynamoDB Scaling**
   - Enable auto-scaling with appropriate limits
   - Consider DAX for read-heavy workloads
   - Implement TTL for old data

3. **Cost Optimization**
   - Use Compute Savings Plans for Lambda
   - Consider DynamoDB Reserved Capacity
   - Implement data archival strategies

## 🔐 Security Best Practices

1. **IAM Roles**
   - Principle of least privilege
   - Use IAM roles for Lambda functions
   - Rotate credentials regularly

2. **Environment Variables**
   - Store secrets in AWS Secrets Manager
   - Use encryption at rest
   - Never commit secrets to git

3. **Network Security**
   - Use VPC endpoints for DynamoDB
   - Implement WAF for additional protection
   - Enable CloudTrail for audit

## 📝 Maintenance Checklist

### Daily
- [ ] Check error rates in CloudWatch
- [ ] Monitor billing alerts
- [ ] Review performance metrics

### Weekly
- [ ] Update dependencies
- [ ] Review log patterns
- [ ] Check security advisories

### Monthly
- [ ] Optimize DynamoDB capacity
- [ ] Review Free Tier usage
- [ ] Update documentation

## 🎯 Success Metrics

### Performance Targets
- Cold start: < 500ms
- API response: < 200ms (p95)
- Error rate: < 0.1%
- Uptime: > 99.9%

### Cost Targets
- Monthly cost: <$10 (small blog)
- Free Tier utilization: > 80%
- Cost per request: <$0.0001

### Scalability Targets
- Handle 1000 concurrent users
- Support 10K daily active users
- Scale to 1M requests/month

## 🚀 Next Steps

1. **Monitor Usage**: Keep track of Free Tier consumption
2. **Optimize**: Based on actual usage patterns
3. **Scale**: When exceeding Free Tier limits
4. **Enhance**: Add features like caching, CDN

## 📞 Support Resources

- **AWS Free Tier Guide**: https://aws.amazon.com/free/
- **Lambda Documentation**: https://docs.aws.amazon.com/lambda/
- **DynamoDB Developer Guide**: https://docs.aws.amazon.com/amazondynamodb/
- **Cognito Developer Guide**: https://docs.aws.amazon.com/cognito/

## ✅ Migration Complete!

Your NestJS application is now running on AWS serverless infrastructure. You've achieved:
- 90% cost reduction for small workloads
- Auto-scaling without manual intervention
- High availability with multiple AZs
- Pay-per-use billing model

Welcome to the serverless era! 🎉
