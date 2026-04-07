// Types
export type { DeepPartial } from './types.js'

// Utilities
export {
  deepMerge,
  deepPartialMatch,
  generateUUID,
  generateTimestamp,
  generateRequestId,
  generateArn,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from './utils/index.js'
export type { MatchResult } from './utils/index.js'

// Context
export { buildLambdaContext } from './context.js'
export type { LambdaContextOptions } from './context.js'

// Builders
export { buildApiGatewayV1Event } from './builders/index.js'
export { buildApiGatewayV2Event, buildApiGatewayEvent } from './builders/index.js'
export { buildSQSEvent } from './builders/index.js'
export { buildS3Event } from './builders/index.js'
export { buildEventBridgeEvent } from './builders/index.js'
export { buildSNSEvent } from './builders/index.js'
export { buildDynamoDBStreamEvent, marshall } from './builders/index.js'

// Asserters
export { assertApiResponse } from './asserters/index.js'
export type { ApiResponseExpectations, ApiResponse } from './asserters/index.js'
export { assertSQSBatchResponse } from './asserters/index.js'
export type { SQSBatchExpectations, SQSBatchResponse } from './asserters/index.js'
export { assertLambdaError } from './asserters/index.js'
export type { LambdaErrorExpectations } from './asserters/index.js'
