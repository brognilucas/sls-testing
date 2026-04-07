import { randomUUID } from 'node:crypto'

export const DEFAULT_REGION = 'us-east-1'
export const DEFAULT_ACCOUNT_ID = '123456789012'

export function generateUUID(): string {
  return randomUUID()
}

export function generateTimestamp(): string {
  return new Date().toISOString()
}

export function generateRequestId(): string {
  return randomUUID()
}

export function generateArn(
  service: string,
  resource: string,
  region = DEFAULT_REGION,
  accountId = DEFAULT_ACCOUNT_ID,
): string {
  return `arn:aws:${service}:${region}:${accountId}:function:${resource}`
}
