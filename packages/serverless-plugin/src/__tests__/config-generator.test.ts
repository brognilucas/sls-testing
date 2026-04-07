import { generateConfig } from '../config-generator'
import type { TestingConfig } from '../config-generator'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('generateConfig', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `sls-testing-config-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('writes valid JSON config file', () => {
    const config: TestingConfig = {
      service: 'my-service',
      stage: 'dev',
      region: 'us-east-1',
      functions: {
        hello: {
          handler: 'src/hello.handler',
          name: 'my-service-dev-hello',
          memorySize: 256,
          timeout: 10,
        },
      },
    }

    const outputPath = generateConfig(config, testDir)

    expect(outputPath).toContain('sls-testing.config.json')
    const content = JSON.parse(readFileSync(outputPath, 'utf-8'))
    expect(content.service).toBe('my-service')
    expect(content.functions.hello.handler).toBe('src/hello.handler')
  })
})
