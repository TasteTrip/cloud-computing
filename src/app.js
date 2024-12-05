const tf = require('@tensorflow/tfjs-node');
const Hapi = require('@hapi/hapi');
const sharp = require('sharp');
const Path = require('path');
const Inert = require('@hapi/inert');

(async () => {
  const modelPath = 'file://model/model.json';
  const model = await tf.loadGraphModel(modelPath);

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
    options: {
      payload: {
        maxBytes: 10 * 1024 * 1024,
        output: 'stream',
        parse: true,
        multipart: true,
      },
    },
    handler: async (request, h) => {
      try {
        const file = request.payload.image;

        const chunks = [];
        for await (const chunk of file) {
          chunks.push(chunk);
        }
        const imageBuffer = Buffer.concat(chunks);

        const processedBuffer = await sharp(imageBuffer)
          .resize(384, 384)
          .toFormat('jpeg')
          .toBuffer();
        const inputTensor = tf.node.decodeImage(processedBuffer)
          .expandDims(0)
          .div(255.0);

        const prediction = model.predict(inputTensor);
        const result = prediction.dataSync();

        return { prediction: Array.from(result) };
      } catch (error) {
        console.error('Prediction error:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
})();
