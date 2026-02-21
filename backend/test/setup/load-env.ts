/**
 * Jest setupFiles entry point — runs BEFORE any test module is loaded.
 * Must use require() (not import) because it runs in the Jest worker
 * before the TypeScript transform kicks in for module-level code.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

// process.cwd() = backend/ when Jest runs from the jest-integration.json location
dotenv.config({
  path: path.join(process.cwd(), '.env.test'),
  override: true,  // override any pre-existing env vars (e.g., from .env)
});
