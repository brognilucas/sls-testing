import { matchers } from '../../matchers'

expect.extend(matchers)

describe('toHaveNoFailedMessages', () => {
  it('passes when batchItemFailures is empty', () => {
    expect({ batchItemFailures: [] }).toHaveNoFailedMessages()
  })

  it('passes when batchItemFailures is undefined', () => {
    expect({}).toHaveNoFailedMessages()
  })

  it('fails when there are failed messages', () => {
    expect(() => {
      expect({
        batchItemFailures: [{ itemIdentifier: 'msg-1' }],
      }).toHaveNoFailedMessages()
    }).toThrow('Expected no failed messages, but found 1: [msg-1]')
  })

  it('.not fails on empty failures', () => {
    expect(() => {
      expect({ batchItemFailures: [] }).not.toHaveNoFailedMessages()
    }).toThrow('Expected response to have failed messages, but none were found')
  })
})

describe('toHaveFailedMessage', () => {
  it('passes when message is in failures', () => {
    expect({
      batchItemFailures: [
        { itemIdentifier: 'msg-1' },
        { itemIdentifier: 'msg-2' },
      ],
    }).toHaveFailedMessage('msg-1')
  })

  it('fails when message is not in failures', () => {
    expect(() => {
      expect({
        batchItemFailures: [{ itemIdentifier: 'msg-2' }],
      }).toHaveFailedMessage('msg-1')
    }).toThrow('Expected message "msg-1" to be in failures, but found: [msg-2]')
  })

  it('fails when there are no failures', () => {
    expect(() => {
      expect({}).toHaveFailedMessage('msg-1')
    }).toThrow(
      'Expected message "msg-1" to be in failures, but found: [none]',
    )
  })

  it('.not fails when message is present', () => {
    expect(() => {
      expect({
        batchItemFailures: [{ itemIdentifier: 'msg-1' }],
      }).not.toHaveFailedMessage('msg-1')
    }).toThrow(
      'Expected message "msg-1" not to be in failures, but it was found',
    )
  })
})
