/* created by patch: shims for third-party modules without TypeScript declarations */

declare module 'tesseract.js';

declare module 'node-fetch' {
  const fetch: any;
  export default fetch;
}

declare module 'express-rate-limit';
