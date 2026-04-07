import type { SNSEvent, SNSEventRecord, SNSMessage } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import {
  generateUUID,
  generateTimestamp,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../utils/generators.js'

function serializeMessage(message: unknown): string {
  if (typeof message === 'string') return message
  return JSON.stringify(message)
}

interface SimplifiedSNSRecord {
  message?: unknown
  topicArn?: string
  [key: string]: unknown
}

interface SNSEventOverrides extends DeepPartial<SNSEvent> {
  records?: SimplifiedSNSRecord[]
}

function buildDefaultSNSRecord(): SNSEventRecord {
  const messageId = generateUUID()
  const now = generateTimestamp()
  const topicArn = `arn:aws:sns:${DEFAULT_REGION}:${DEFAULT_ACCOUNT_ID}:test-topic`

  return {
    EventVersion: '1.0',
    EventSubscriptionArn: `${topicArn}:${generateUUID()}`,
    EventSource: 'aws:sns',
    Sns: {
      SignatureVersion: '1',
      Timestamp: now,
      Signature: `signature-${messageId}`,
      SigningCertUrl: `https://sns.${DEFAULT_REGION}.amazonaws.com/SimpleNotificationService-test.pem`,
      MessageId: messageId,
      Message: '{}',
      MessageAttributes: {},
      Type: 'Notification',
      UnsubscribeUrl: `https://sns.${DEFAULT_REGION}.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=${topicArn}:${messageId}`,
      TopicArn: topicArn,
    },
  }
}

export function buildSNSEvent(
  overrides?: SNSEventOverrides,
): SNSEvent {
  const defaults: SNSEvent = {
    Records: [buildDefaultSNSRecord()],
  }

  if (!overrides) return defaults

  const { records, ...rest } = overrides

  // Phase 1: expand simplified records
  if (records) {
    const expandedRecords = records.map((simplified) => {
      const base = buildDefaultSNSRecord()

      const { message, topicArn, ...recordOverrides } = simplified

      if (message !== undefined) {
        base.Sns.Message = serializeMessage(message)
      }

      if (topicArn) {
        base.Sns.TopicArn = topicArn
        base.EventSubscriptionArn = `${topicArn}:${generateUUID()}`
      }

      if (Object.keys(recordOverrides).length > 0) {
        return deepMerge(base, recordOverrides as Record<string, unknown>) as SNSEventRecord
      }

      return base
    })

    defaults.Records = expandedRecords
  }

  // Phase 2: apply remaining top-level overrides
  if (Object.keys(rest).length > 0) {
    return deepMerge(defaults, rest as Record<string, unknown>) as SNSEvent
  }

  return defaults
}
