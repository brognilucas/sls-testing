import type { EventBridgeEvent } from 'aws-lambda'
import type { DeepPartial } from '../types.js'
import { deepMerge } from '../utils/deep-merge.js'
import {
  generateUUID,
  generateTimestamp,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../utils/generators.js'

type EventBridgeOverrides<TDetail> = DeepPartial<EventBridgeEvent<string, TDetail>> & {
  /** Convenience for the hyphenated 'detail-type' field */
  'detail-type'?: string
  /** Convenience for the hyphenated 'replay-name' field */
  'replay-name'?: string
}

export function buildEventBridgeEvent<TDetail = Record<string, unknown>>(
  overrides?: EventBridgeOverrides<TDetail>,
): EventBridgeEvent<string, TDetail> {
  const defaults: EventBridgeEvent<string, TDetail> = {
    id: generateUUID(),
    version: '0',
    account: DEFAULT_ACCOUNT_ID,
    time: generateTimestamp(),
    region: DEFAULT_REGION,
    resources: [],
    source: 'test.source',
    'detail-type': 'TestDetailType',
    detail: {} as TDetail,
  }

  if (!overrides) return defaults

  return deepMerge(
    defaults,
    overrides as Record<string, unknown>,
  ) as unknown as EventBridgeEvent<string, TDetail>
}
