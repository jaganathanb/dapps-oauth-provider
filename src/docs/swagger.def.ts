import { defaultConfig as config } from '@common/config';

import { version } from '../../package.json';

const swaggerDef = {
  info: {
    title: 'DApps OAuth provider API documentation',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/jaganathanb/dapps-oathu-provider/blob/master/LICENSE',
    },
  },
  host: `localhost:${config.port}`,
  basePath: '/api/v1',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    apiKeyAuth: {
      type: 'Bearer',
      in: 'header',
      name: 'Authoriation',
      description: 'Add jwt token here',
    },
  },
};

export default swaggerDef;
