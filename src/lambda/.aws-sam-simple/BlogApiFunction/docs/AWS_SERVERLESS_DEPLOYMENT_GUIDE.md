# AWS Serverless Deployment Guide - Free Tier Optimized

## Overview
Complete guide to deploy your NestJS blog API to AWS using serverless architecture within Free Tier limits.

## 🎯 Free Tier Limits (Critical to Stay Within)

### Lambda Functions
- **Memory**: 128MB minimum (not 512MB!)
- **Duration**: 400,000 GB-seconds/month
- **Requests**: 1 million requests/month
- **Recommendation**: 128MB memory, 10s timeout for most functions

### DynamoDB
- **Storage**: 25 GB
- **Read/Write**: 25 provisioned capacity units
- **PAY_PER_REQUEST**: Can be expensive! Use with caution
- **Recommendation**: Start with provisioned capacity, scale later

### Cognito
- **MAU**: 50,000 Monthly Active Users
- **Recommendation**: Perfect for most blogs

### API Gateway (if needed)
- **Calls**: 1 million API calls/month
- **Note**: We're using Lambda Function URLs instead

### CloudWatch Logs
- **Retention**: Default is forever (costs money!)
- **Recommendation**: Set to 7 days retention

## 🚀 Prerequisites

1. **AWS CLI** installed and configured
2. **SAM CLI** installed
3. **Node.js 20** installed
4. **Docker** (for local development)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json

# Install SAM CLI
pip install aws-sam-cli

# Verify installation
sam --version
```

## 📝 Step 1: Update SAM Template for Free Tier

Edit `src/lambda/template.yaml`:

```yaml
Resources:
  BlogApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      MemorySize: 128  # CRITICAL: Free tier optimization
      Timeout: 10      # CRITICAL: Free tier optimization
      Architectures: [arm64]  # Cheaper than x86_64
      Environment:
        Variables:
          DATABASE_PROVIDER: DYNAMODB
          AWS_REGION: !Ref AWS::Region
          DYNAMODB_TABLE_PREFIX: blog-api
          NODE_ENV: production

  BlogTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PROVISIONED  # NOT PAY_PER_REQUEST!
      ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: false  # Save costs
      StreamSpecification:
        StreamViewType: KEYS_ONLY  # Minimal data

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${BlogApiFunction}"
      RetentionInDays: 7  # CRITICAL: Avoid storage costs
```

## 📝 Step 2: Create Billing Alerts

```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Create CloudWatch alarm for $1
aws cloudwatch put-metric-alarm \
  --alarm-name "AWS-Billing-Alert-1-Dollar" \
  --alarm-description "Alert when costs exceed $1" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1

# Create alarm for $5
aws cloudwatch put-metric-alarm \
  --alarm-name "AWS-Billing-Alert-5-Dollars" \
  --alarm-description "Alert when costs exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1
```

## 📝 Step 3: Build and Deploy

```bash
# Navigate to backend directory
cd C:\Desenvolvimento\rainer-portfolio-backend

# Install dependencies
pnpm install

# Build the application
pnpm run build

# Build SAM template
sam build

# Deploy to AWS
sam deploy --guided

# Follow prompts:
# Stack Name: blog-api-serverless
# AWS Region: us-east-1
# Parameter Stage: dev
# Confirm changes before deploy: y
# Allow SAM CLI IAM role creation: y
# Save arguments to config file: y
```

## 📝 Step 4: Configure Environment Variables

After deployment, update environment variables:

```bash
# Get function name from stack outputs
sam stack outputs --stack-name blog-api-serverless

# Update environment variables
aws lambda update-function-configuration \
  --function-name YOUR_FUNCTION_NAME \
  --environment Variables='{
    DATABASE_PROVIDER=DYNAMODB,
    AWS_REGION=us-east-1,
    DYNAMODB_TABLE_PREFIX=blog-api-dev,
    NODE_ENV=production,
    COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID,
    COGNITO_CLIENT_ID=YOUR_CLIENT_ID,
    JWT_SECRET=your-jwt-secret-here
  }'
```

## 📝 Step 5: Create DynamoDB Tables

```bash
# Run table creation script
pnpm tsx scripts/create-dynamodb-tables.ts

# Or create manually via AWS Console:
# 1. Open DynamoDB Console
# 2. Create table with name: blog-api-dev
# 3. Primary key: PK (String), SK (String)
# 4. Add GSIs:
#    - GSI1: GSI1PK (String), GSI1SK (String)
#    - GSI2: GSI2PK (String), GSI2SK (String)
```

## 📝 Step 6: Test Deployment

```bash
# Get function URL
aws lambda get-function-url-config --function-name YOUR_FUNCTION_NAME

# Test with curl
curl -X GET "YOUR_FUNCTION_URL/health" \
  -H "Content-Type: application/json"

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## 📝 Step 7: Update Frontend Configuration

Update your frontend to use the new Lambda Function URL:

```typescript
// In frontend .env
NEXT_PUBLIC_API_URL=https://YOUR_FUNCTION_ID.lambda-url.us-east-1.on.aws
```

## 🔧 Optimization Tips

### 1. Lambda Memory Optimization
```yaml
# Start with 128MB, monitor actual usage
MemorySize: 128
# Check CloudWatch metrics for actual memory usage
# Increase only if necessary (256MB, 512MB)
```

### 2. DynamoDB Cost Control
```bash
# Enable DynamoDB auto-scaling with minimum capacity
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id table/blog-api-dev \
  --scalable-dimension dynamodb:table:ReadCapacityUnits \
  --min-capacity 1 \
  --max-capacity 10
```

### 3. CloudWatch Logs
```bash
# Set log retention to 7 days for all functions
aws logs put-retention-policy \
  --log-group-name /aws/lambda/YOUR_FUNCTION_NAME \
  --retention-in-days 7
```

### 4. Cognito Cost Optimization
- Disable MFA if not needed
- Use email verification instead of SMS
- Monitor MAU count closely

## 📊 Monitoring Your Usage

### Check Free Tier Usage
```bash
# AWS Billing Console
# https://console.aws.amazon.com/billing/

# Check specific service usage
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Monitor Lambda Metrics
```bash
# Get function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=YOUR_FUNCTION_NAME \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## 🚨 Common Pitfalls to Avoid

1. **PAY_PER_REQUEST on DynamoDB** - Can cost $100+ with moderate traffic
2. **High Lambda Memory** - 512MB uses 4x more free tier capacity
3. **Long Timeouts** - Keep under 10 seconds
4. **No Log Retention** - Logs will accumulate and cost money
5. **Multiple Environments** - Each environment consumes free tier
6. **Large Deployment Packages** - Keep under 50MB for cold starts

## 🔄 CI/CD Pipeline (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build and deploy
        run: |
          sam build
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

## 📞 Support and Troubleshooting

### Common Issues

1. **Lambda Timeouts**
   - Check CloudWatch logs
   - Increase timeout or optimize code
   - Consider Lambda Layers for large dependencies

2. **DynamoDB Throttling**
   - Increase provisioned capacity
   - Implement exponential backoff
   - Use DynamoDB Accelerator (DAX) if needed

3. **Cognito Issues**
   - Check user pool configuration
   - Verify app client settings
   - Check callback URLs

### Debug Commands

```bash
# Check Lambda logs
sam logs -n BlogApiFunction --stack-name blog-api-serverless --tail

# Test locally
sam local invoke BlogApiFunction -e events/event.json

# Start local API
sam local start-api
```

## 📈 Scaling Beyond Free Tier

When you exceed free tier limits:

1. **Lambda**: Increase memory, add concurrency limits
2. **DynamoDB**: Enable auto-scaling, consider DAX
3. **Cognito**: No immediate action needed until 50k MAU
4. **Monitoring**: Add X-Ray, detailed metrics

## ✅ Deployment Checklist

- [ ] SAM template optimized for Free Tier
- [ ] Billing alerts configured ($1, $5, $10)
- [ ] Log retention set to 7 days
- [ ] DynamoDB using provisioned capacity
- [ ] Lambda memory set to 128MB
- [ ] Environment variables configured
- [ ] Frontend updated with new URL
- [ ] Test endpoints working
- [ ] Monitoring dashboard set up
- [ ] Documentation updated

## 🎉 You're Live!

Your NestJS blog API is now running on AWS Lambda with DynamoDB, fully optimized for the Free Tier. Monitor your usage closely and enjoy the serverless experience!
