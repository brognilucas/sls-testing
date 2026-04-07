import { loadEnvFile } from '../env-loader'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('loadEnvFile', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `sls-testing-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
    // Clean up env vars set during tests
    delete process.env.TEST_VAR_A
    delete process.env.TEST_VAR_B
    delete process.env.QUOTED_VAR
  })

  it('loads key=value pairs into process.env', () => {
    writeFileSync(join(testDir, '.env.test'), 'TEST_VAR_A=hello\nTEST_VAR_B=world')

    loadEnvFile('.env.test', testDir)

    expect(process.env.TEST_VAR_A).toBe('hello')
    expect(process.env.TEST_VAR_B).toBe('world')
  })

  it('skips comments and empty lines', () => {
    writeFileSync(join(testDir, '.env.test'), '# This is a comment\n\nTEST_VAR_A=value')

    loadEnvFile('.env.test', testDir)

    expect(process.env.TEST_VAR_A).toBe('value')
  })

  it('removes surrounding quotes from values', () => {
    writeFileSync(join(testDir, '.env.test'), 'QUOTED_VAR="hello world"')

    loadEnvFile('.env.test', testDir)

    expect(process.env.QUOTED_VAR).toBe('hello world')
  })

  it('warns but does not crash when file is missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

    loadEnvFile('.env.missing', testDir)

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('env file not found'),
    )
    warnSpy.mockRestore()
  })
})
