import swaggerAutogen from 'swagger-autogen';

import swaggerDef from './swagger.def';

const outputFile = '../../data/swagger-output.json';
const endpointsFiles = ['./docs.routes.ts', '../oauth/oauth.routes.ts'];

void swaggerAutogen({ openapi: '3.0.0' })(
  outputFile,
  endpointsFiles,
  swaggerDef,
).then(async () => {
  await import('../index'); // Your project's root file
});
