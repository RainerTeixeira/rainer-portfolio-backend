import { handler, PreSignUpEvent } from './cognito-pre-signup-trigger';
import type { Context } from 'aws-lambda';

describe('CognitoPreSignupTrigger', () => {
  let mockEvent: PreSignUpEvent;
  let mockContext: Context;

  beforeEach(() => {
    mockEvent = {
      version: '1.0',
      region: 'us-east-1',
      userPoolId: 'us-east-1_abcdef123',
      userName: 'test_user',
      triggerSource: 'PreSignUp_ExternalProvider',
      request: {
        userAttributes: {
          email: 'test@example.com',
          name: 'John Doe',
          given_name: 'John',
          family_name: 'Doe',
        },
      },
      response: {
        userAttributes: {},
        autoConfirmUser: false,
        autoVerifyEmail: false,
        autoVerifyPhone: false,
      },
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2021/11/10/[$LATEST]abcdef1234567890',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should process social login correctly', async () => {
    const result = await handler(mockEvent, mockContext);
    
    expect(result.response.autoConfirmUser).toBe(true);
    expect(result.response.autoVerifyEmail).toBe(true);
    expect(result.response.userAttributes.nickname).toBeDefined();
  });

  it('should handle normal signup without auto-confirmation', async () => {
    const normalEvent = {
      ...mockEvent,
      triggerSource: 'PreSignUp_SignUp',
      request: {
        ...mockEvent.request,
        userAttributes: {
          email: 'test@gmail.com', // Domínio permitido
        },
      },
    };

    const result = await handler(normalEvent, mockContext);
    
    expect(result.response.autoConfirmUser).toBe(false);
    expect(result.response.autoVerifyEmail).toBe(false);
  });

  it('should generate nickname from name', async () => {
    const result = await handler(mockEvent, mockContext);
    
    expect(result.response.userAttributes.nickname).toBe('john_doe');
  });

  it('should clean username from social provider', async () => {
    const socialEvent = {
      ...mockEvent,
      userName: 'google_123456789',
      request: {
        userAttributes: {
          email: 'test@example.com',
        },
      },
    };

    const result = await handler(socialEvent, mockContext);
    
    expect(result.response.userAttributes.nickname).toBe('test');
  });

  it('should handle missing name gracefully', async () => {
    const eventWithoutName = {
      ...mockEvent,
      request: {
        userAttributes: {
          email: 'test@example.com',
        },
      },
    };

    const result = await handler(eventWithoutName, mockContext);
    
    expect(result.response.userAttributes.nickname).toBe('test');
  });

  it('should preserve existing nickname', async () => {
    const eventWithNickname = {
      ...mockEvent,
      request: {
        userAttributes: {
          email: 'test@example.com',
          nickname: 'existing_nickname',
        },
      },
    };

    const result = await handler(eventWithNickname, mockContext);
    
    expect(result.response.userAttributes.nickname).toBe('existing_nickname');
  });

  it('should reject invalid email domain', async () => {
    const invalidEvent = {
      ...mockEvent,
      triggerSource: 'PreSignUp_SignUp',
      request: {
        userAttributes: {
          email: 'test@invalid.com',
        },
      },
    };

    await expect(handler(invalidEvent, mockContext)).rejects.toThrow('Domínio de email não permitido');
  });

  it('should add custom attributes', async () => {
    const result = await handler(mockEvent, mockContext);
    
    expect(result.response.userAttributes['custom:created_at']).toBeDefined();
    expect(result.response.userAttributes['custom:signup_method']).toBe('social');
    expect(result.response.userAttributes['custom:role']).toBe('SUBSCRIBER');
  });
});
