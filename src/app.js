const Hapi = require('@hapi/hapi');
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
    },
  });

  server.route({
    method: 'POST',
    path: '/predict',
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

  await server.start();

  console.log(`Server start at: ${server.info.uri}`);
})();
