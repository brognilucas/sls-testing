# Contributing to @sls-testing

## Development Setup

```bash
git clone https://github.com/practical-serverless/sls-testing.git
cd sls-testing
pnpm install
pnpm turbo run build
pnpm turbo run test
```

## Adding a New Event Builder

1. Create the builder in `packages/core/src/builders/`
2. Follow the existing pattern: factory function, `DeepPartial<T>` overrides, `deepMerge`
3. Export from `packages/core/src/builders/index.ts`
4. Export from `packages/core/src/index.ts`
5. Add tests in `packages/core/src/__tests__/builders/`
6. Aim for 100% coverage on the new builder

## Testing

```bash
pnpm turbo run test                          # all packages
pnpm --filter @sls-testing/core test         # core only
pnpm --filter @sls-testing/core test -- --coverage  # with coverage
```

The core package enforces 100% test coverage.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add a changeset: `pnpm changeset`
4. Ensure tests pass: `pnpm turbo run test`
5. Ensure build passes: `pnpm turbo run build`
6. Submit a pull request

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning.

After making changes, run:

```bash
pnpm changeset
```

Select the affected packages and describe the change. The changeset file will be committed with your PR. When merged, a "Version Packages" PR is automatically created.

## Code Style

- TypeScript strict mode
- Prefer `import type` for type-only imports
- Use `.js` extensions in source imports (ESM convention)
- Follow existing patterns in the codebase
