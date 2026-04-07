import { setupServerlessTesting } from '../../setup'

describe('setupServerlessTesting', () => {
  describe('suppressLogs', () => {
    it('silences console.log', () => {
      const originalLog = console.log
      const cleanup = setupServerlessTesting({ suppressLogs: true })

      // console.log should be mocked
      expect(console.log).not.toBe(originalLog)
      console.log('this should be suppressed')
      expect(console.log).toHaveBeenCalledWith('this should be suppressed')

      cleanup()
    })

    it('cleanup restores console.log', () => {
      const originalLog = console.log
      const cleanup = setupServerlessTesting({ suppressLogs: true })

      expect(console.log).not.toBe(originalLog)

      cleanup()

      expect(console.log).toBe(originalLog)
    })

    it('silences console.warn', () => {
      const originalWarn = console.warn
      const cleanup = setupServerlessTesting({ suppressLogs: true })

      expect(console.warn).not.toBe(originalWarn)
      console.warn('this should be suppressed')
      expect(console.warn).toHaveBeenCalledWith('this should be suppressed')

      cleanup()
      expect(console.warn).toBe(originalWarn)
    })
  })

  describe('timezone', () => {
    it('sets process.env.TZ', () => {
      const originalTZ = process.env.TZ
      const cleanup = setupServerlessTesting({ timezone: 'UTC' })

      expect(process.env.TZ).toBe('UTC')

      cleanup()

      // Restore original
      if (originalTZ === undefined) {
        expect(process.env.TZ).toBeUndefined()
      } else {
        expect(process.env.TZ).toBe(originalTZ)
      }
    })

    it('cleanup restores original TZ', () => {
      const originalTZ = process.env.TZ
      process.env.TZ = 'America/New_York'

      const cleanup = setupServerlessTesting({ timezone: 'Europe/London' })
      expect(process.env.TZ).toBe('Europe/London')

      cleanup()
      expect(process.env.TZ).toBe('America/New_York')

      // Restore for other tests
      if (originalTZ === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = originalTZ
      }
    })
  })

  describe('matchers registration', () => {
    it('registers custom matchers via expect.extend', () => {
      const cleanup = setupServerlessTesting()

      // Matchers should be available after setup
      expect({ statusCode: 200 }).toHaveStatusCode(200)
      expect({ statusCode: 200 }).toBeSuccessfulApiResponse()

      cleanup()
    })
  })
})
