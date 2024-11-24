const Hapi = require('@hapi/hapi');
const Path = require('path');
const Inert = require('@hapi/inert');
const { loadModel, predict } = require('./inference');

(async () => {
  const model = await loadModel();
  console.log('model loaded!');

  const server = Hapi.server({
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    port: 3000,
    routes: {
      cors: {
        origin: ["*"],
      },
      files: {
        relativeTo: Path.join(__dirname, '../public')
      }
    },
  });

  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.file('index.html');
    }
  });

  server.route({
    method: 'POST',
    path: '/api/predict',
    handler: async (request) => {
      const { image } = request.payload;
      const predictions = await predict(model, image);
      return { result: predictions };
    },
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
      }
    }
  });

  server.route({
    method: '*',
    path: '/{any*}',
    handler: (request, h) => {
      return h.file('default.html');
    }
  });

  await server.start();

  console.log(`Server start at: ${server.info.uri}`);
})();
