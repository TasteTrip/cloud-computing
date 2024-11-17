const tfjs = require('@tensorflow/tfjs-node');

async function loadModel() {
  const modelUrl = "file://models/model.json";
  return tfjs.loadLayersModel(modelUrl);
}

function predict(model, imageBuffer) {
  const tensor = tfjs.node
    .decodeImage(imageBuffer, 3)
    .resizeBilinear([224, 224])
    .expandDims(0);

  return model.predict(tensor).data();
}

module.exports = { loadModel, predict };
