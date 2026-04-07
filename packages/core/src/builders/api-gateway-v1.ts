import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import { generateRequestId, generateTimestamp, DEFAULT_ACCOUNT_ID } from '../utils/generators.js'

function serializeBody(body: unknown): string | null {
  if (body === null || body === undefined) return null
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

export function buildApiGatewayV1Event(
  overrides?: DeepPartial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent {
  const now = generateTimestamp()
  const requestId = generateRequestId()

  const defaults: APIGatewayProxyEvent = {
    body: null,
    headers: {
      'Content-Type': 'application/json',
    },
    multiValueHeaders: {
      'Content-Type': ['application/json'],
    },
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: DEFAULT_ACCOUNT_ID,
      apiId: 'test-api-id',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'Custom User Agent String',
        userArn: null,
      },
      path: '/',
      stage: 'test',
      requestId,
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource-id',
      resourcePath: '/{proxy+}',
    },
    resource: '/{proxy+}',
  }

  if (!overrides) return defaults

  // Auto-serialize body
  const processed = { ...overrides } as Record<string, unknown>
  if ('body' in processed && processed.body !== undefined) {
    processed.body = serializeBody(processed.body)
  }

  return deepMerge(defaults, processed as Record<string, unknown>) as APIGatewayProxyEvent
}
