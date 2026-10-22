# SDD project file

## Documentation
The folder for the permanent documentation: `Docs/`.

## Tests
- Unit: Vitest. Files: `src/**/<subject>.spec.ts`, with the step helpers in `src/**/<subject>.steps.ts`.
- E2E: Cucumber with Playwright. Files: `e2e/features/*.feature`, with the steps in `e2e/steps/*.ts`.
- Model specs: `src/book/book.spec.ts`, `e2e/features/opening-book.feature`.
- Forbidden stub: `throw new Error("unimplemented")`.

## Gates
- Build: `npm run typecheck`.
- Unit: `npm test -- <spec file>`, or `npm test -- -t "<scenario>"`.
- E2E: `npm run e2e -- <feature file>`, or `npm run e2e -- --name "<scenario>"`.
- Result: the count of passed tests that Vitest and Cucumber give.

## Commit
Use `git`. Include only the files that you changed.

## Standards
- Obey `CLAUDE.md`: keep `Docs/` correct, in the Open Knowledge Format.
