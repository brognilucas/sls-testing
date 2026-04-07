import type {
  DynamoDBStreamEvent,
  DynamoDBRecord,
  AttributeValue,
} from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import {
  generateUUID,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../utils/generators.js'

/**
 * Lightweight marshall helper for constructing DynamoDB AttributeValue objects.
 * Supports: string, number, boolean, null, plain objects (maps), arrays (lists).
 */
export function marshall(value: unknown): AttributeValue {
  if (value === null || value === undefined) {
    return { NULL: true }
  }
  if (typeof value === 'string') {
    return { S: value }
  }
  if (typeof value === 'number') {
    return { N: value.toString() }
  }
  if (typeof value === 'boolean') {
    return { BOOL: value }
  }
  if (Array.isArray(value)) {
    return { L: value.map(marshall) }
  }
  if (typeof value === 'object') {
    const mapped: Record<string, AttributeValue> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      mapped[k] = marshall(v)
    }
    return { M: mapped }
  }
  return { S: String(value) }
}

interface SimplifiedDynamoDBRecord {
  eventName?: 'INSERT' | 'MODIFY' | 'REMOVE'
  keys?: Record<string, unknown>
  newImage?: Record<string, unknown>
  oldImage?: Record<string, unknown>
  [key: string]: unknown
}

interface DynamoDBStreamEventOverrides extends DeepPartial<DynamoDBStreamEvent> {
  records?: SimplifiedDynamoDBRecord[]
}

function marshallImage(
  image: Record<string, unknown>,
): Record<string, AttributeValue> {
  const result: Record<string, AttributeValue> = {}
  for (const [k, v] of Object.entries(image)) {
    // If value already looks like an AttributeValue (has S, N, BOOL, M, L, NULL, etc.), pass through
    if (isAttributeValue(v)) {
      result[k] = v as AttributeValue
    } else {
      result[k] = marshall(v)
    }
  }
  return result
}

function isAttributeValue(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const keys = Object.keys(value)
  if (keys.length !== 1) return false
  return ['S', 'N', 'BOOL', 'NULL', 'M', 'L', 'B', 'SS', 'NS', 'BS'].includes(keys[0])
}

function buildDefaultDynamoDBRecord(): DynamoDBRecord {
  const eventId = generateUUID()
  const tableName = 'test-table'

  return {
    awsRegion: DEFAULT_REGION,
    dynamodb: {
      ApproximateCreationDateTime: Math.floor(Date.now() / 1000),
      Keys: {},
      SequenceNumber: '111',
      SizeBytes: 26,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
    eventID: eventId,
    eventName: 'INSERT',
    eventSource: 'aws:dynamodb',
    eventSourceARN: `arn:aws:dynamodb:${DEFAULT_REGION}:${DEFAULT_ACCOUNT_ID}:table/${tableName}/stream/2024-01-01T00:00:00.000`,
    eventVersion: '1.1',
  }
}

export function buildDynamoDBStreamEvent(
  overrides?: DynamoDBStreamEventOverrides,
): DynamoDBStreamEvent {
  const defaults: DynamoDBStreamEvent = {
    Records: [buildDefaultDynamoDBRecord()],
  }

  if (!overrides) return defaults

  const { records, ...rest } = overrides

  // Phase 1: expand simplified records
  if (records) {
    const expandedRecords = records.map((simplified) => {
      const base = buildDefaultDynamoDBRecord()

      const { eventName, keys, newImage, oldImage, ...recordOverrides } = simplified

      if (eventName) {
        base.eventName = eventName
      }

      if (keys) {
        base.dynamodb!.Keys = marshallImage(keys)
      }

      if (newImage) {
        base.dynamodb!.NewImage = marshallImage(newImage)
      }

      if (oldImage) {
        base.dynamodb!.OldImage = marshallImage(oldImage)
      }

      // Derive StreamViewType from provided images
      if (newImage && oldImage) {
        base.dynamodb!.StreamViewType = 'NEW_AND_OLD_IMAGES'
      } else if (newImage) {
        base.dynamodb!.StreamViewType = 'NEW_IMAGE'
      } else if (oldImage) {
        base.dynamodb!.StreamViewType = 'OLD_IMAGE'
      }

      if (Object.keys(recordOverrides).length > 0) {
        return deepMerge(base as Record<string, unknown>, recordOverrides as Record<string, unknown>) as DynamoDBRecord
      }

      return base
    })

    defaults.Records = expandedRecords
  }

  // Phase 2: apply remaining top-level overrides
  if (Object.keys(rest).length > 0) {
    return deepMerge(defaults, rest as Record<string, unknown>) as DynamoDBStreamEvent
  }

  return defaults
}
