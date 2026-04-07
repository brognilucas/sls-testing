import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import { generateRequestId, generateTimestamp, DEFAULT_ACCOUNT_ID } from '../utils/generators.js'

function serializeBody(body: unknown): string | undefined {
  if (body === null || body === undefined) return undefined
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

function deriveRawQueryString(
  params: Record<string, string | undefined>,
): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&')
}

interface ApiGatewayV2Overrides extends DeepPartial<APIGatewayProxyEventV2> {
  /** Convenience shorthand — mapped to requestContext.http.method */
  method?: string
  /** Convenience shorthand — mapped to rawPath and requestContext.http.path */
  path?: string
}

export function buildApiGatewayV2Event(
  overrides?: ApiGatewayV2Overrides,
): APIGatewayProxyEventV2 {
  const now = generateTimestamp()
  const requestId = generateRequestId()

  const defaults: APIGatewayProxyEventV2 = {
    version: '2.0',
    routeKey: '$default',
    rawPath: '/',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
    },
    isBase64Encoded: false,
    requestContext: {
      accountId: DEFAULT_ACCOUNT_ID,
      apiId: 'test-api-id',
      domainName: 'test-api-id.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test-api-id',
      http: {
        method: 'GET',
        path: '/',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'Custom User Agent String',
      },
      requestId,
      routeKey: '$default',
      stage: '$default',
      time: now,
      timeEpoch: Date.now(),
    },
  }

  if (!overrides) return defaults

  const { method, path: pathShorthand, ...rest } = overrides
  const processed = { ...rest } as Record<string, unknown>

  // Apply convenience shorthands
  if (method) {
    // Ensure requestContext.http exists for merge
    const rc = (processed.requestContext ?? {}) as Record<string, unknown>
    const http = (rc.http ?? {}) as Record<string, unknown>
    http.method = method
    rc.http = http
    processed.requestContext = rc
  }

  if (pathShorthand) {
    processed.rawPath = processed.rawPath ?? pathShorthand
    const rc = (processed.requestContext ?? {}) as Record<string, unknown>
    const http = (rc.http ?? {}) as Record<string, unknown>
    http.path = http.path ?? pathShorthand
    rc.http = http
    processed.requestContext = rc
  }

  // Auto-serialize body
  if ('body' in processed && processed.body !== undefined) {
    processed.body = serializeBody(processed.body)
  }

  // Auto-derive rawQueryString from queryStringParameters if rawQueryString not explicitly provided
  if (
    processed.queryStringParameters &&
    !('rawQueryString' in rest)
  ) {
    processed.rawQueryString = deriveRawQueryString(
      processed.queryStringParameters as Record<string, string | undefined>,
    )
  }

  return deepMerge(defaults, processed) as APIGatewayProxyEventV2
}

/** Convenience alias */
export const buildApiGatewayEvent = buildApiGatewayV2Event
