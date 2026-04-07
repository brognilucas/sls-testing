import type { SQSEvent, SQSRecord } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import {
  generateUUID,
  generateTimestamp,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../utils/generators.js'

function serializeBody(body: unknown): string {
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

interface SimplifiedSQSRecord {
  body?: unknown
  [key: string]: unknown
}

interface SQSEventOverrides extends DeepPartial<SQSEvent> {
  records?: SimplifiedSQSRecord[]
}

function buildDefaultSQSRecord(index: number): SQSRecord {
  const messageId = generateUUID()
  const now = Date.now().toString()

  return {
    messageId,
    receiptHandle: `receipt-handle-${messageId}`,
    body: '{}',
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: now,
      SenderId: `${DEFAULT_ACCOUNT_ID}:test-sender`,
      ApproximateFirstReceiveTimestamp: now,
    },
    messageAttributes: {},
    md5OfBody: `md5-${messageId}`,
    eventSource: 'aws:sqs',
    eventSourceARN: `arn:aws:sqs:${DEFAULT_REGION}:${DEFAULT_ACCOUNT_ID}:test-queue`,
    awsRegion: DEFAULT_REGION,
  }
}

export function buildSQSEvent(
  overrides?: SQSEventOverrides,
): SQSEvent {
  const defaults: SQSEvent = {
    Records: [buildDefaultSQSRecord(0)],
  }

  if (!overrides) return defaults

  const { records, ...rest } = overrides

  // Phase 1: expand simplified records
  if (records) {
    const expandedRecords = records.map((simplified, index) => {
      const base = buildDefaultSQSRecord(index)

      const { body, ...recordOverrides } = simplified

      // Auto-serialize body
      if (body !== undefined) {
        base.body = serializeBody(body)
      }

      if (Object.keys(recordOverrides).length > 0) {
        return deepMerge(base, recordOverrides as Record<string, unknown>) as SQSRecord
      }

      return base
    })

    defaults.Records = expandedRecords
  }

  // Phase 2: apply remaining top-level overrides (excluding records)
  if (Object.keys(rest).length > 0) {
    return deepMerge(defaults, rest as Record<string, unknown>) as SQSEvent
  }

  return defaults
}
