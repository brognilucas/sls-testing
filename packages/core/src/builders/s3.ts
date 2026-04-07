import type { S3Event } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import {
  generateUUID,
  generateTimestamp,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../utils/generators.js'

interface S3EventOverrides extends DeepPartial<S3Event> {
  /** Convenience shorthand — bucket name */
  bucket?: string
  /** Convenience shorthand — object key */
  key?: string
  /** Convenience shorthand — event name, defaults to ObjectCreated:Put */
  eventName?: string
}

export function buildS3Event(
  overrides?: S3EventOverrides,
): S3Event {
  const requestId = generateUUID()
  const now = generateTimestamp()

  const defaultBucket = 'test-bucket'
  const defaultKey = 'test-key'

  const defaults: S3Event = {
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: DEFAULT_REGION,
        eventTime: now,
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          principalId: 'EXAMPLE',
        },
        requestParameters: {
          sourceIPAddress: '127.0.0.1',
        },
        responseElements: {
          'x-amz-request-id': requestId,
          'x-amz-id-2': `${requestId}-id2`,
        },
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'test-config-id',
          bucket: {
            name: defaultBucket,
            ownerIdentity: {
              principalId: 'EXAMPLE',
            },
            arn: `arn:aws:s3:::${defaultBucket}`,
          },
          object: {
            key: defaultKey,
            size: 1024,
            eTag: 'test-etag',
            sequencer: '0A1B2C3D4E5F678901',
          },
        },
      },
    ],
  }

  if (!overrides) return defaults

  const { bucket, key, eventName, ...rest } = overrides

  // Apply convenience shorthands
  if (bucket) {
    defaults.Records[0].s3.bucket.name = bucket
    defaults.Records[0].s3.bucket.arn = `arn:aws:s3:::${bucket}`
  }

  if (key) {
    defaults.Records[0].s3.object.key = key
  }

  if (eventName) {
    defaults.Records[0].eventName = eventName
  }

  // Apply remaining deep overrides
  if (Object.keys(rest).length > 0) {
    return deepMerge(defaults, rest as Record<string, unknown>) as S3Event
  }

  return defaults
}
