import type { Context } from 'aws-lambda'
import { generateUUID, generateArn } from './utils/generators.js'

export interface LambdaContextOptions {
  functionName: string
  functionVersion: string
  memoryLimitInMB: string
  awsRequestId: string
  logGroupName: string
  logStreamName: string
  invokedFunctionArn: string
  callbackWaitsForEmptyEventLoop: boolean
  remainingTimeOverride: number
}

const noop = () => {}

export function buildLambdaContext(
  overrides?: Partial<LambdaContextOptions>,
): Context {
  const functionName = overrides?.functionName ?? 'test-function'
  const functionVersion = overrides?.functionVersion ?? '$LATEST'
  const awsRequestId = overrides?.awsRequestId ?? generateUUID()
  const memoryLimitInMB = overrides?.memoryLimitInMB ?? '128'
  const logGroupName =
    overrides?.logGroupName ?? `/aws/lambda/${functionName}`
  const logStreamName =
    overrides?.logStreamName ??
    `${formatDate(new Date())}/[${functionVersion}]${awsRequestId}`
  const invokedFunctionArn =
    overrides?.invokedFunctionArn ?? generateArn('lambda', functionName)
  const callbackWaitsForEmptyEventLoop =
    overrides?.callbackWaitsForEmptyEventLoop ?? true

  const remainingTime = overrides?.remainingTimeOverride ?? 30_000

  return {
    functionName,
    functionVersion,
    memoryLimitInMB,
    awsRequestId,
    logGroupName,
    logStreamName,
    invokedFunctionArn,
    callbackWaitsForEmptyEventLoop,
    getRemainingTimeInMillis: () => remainingTime,
    done: noop,
    fail: noop,
    succeed: noop,
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}
