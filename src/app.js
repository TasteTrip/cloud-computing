const tf = require('@tensorflow/tfjs-node');
const Hapi = require('@hapi/hapi');
const sharp = require('sharp');
const Path = require('path');
const Inert = require('@hapi/inert');
const fs = require('fs');
require('dotenv').config();

const foodData = [
  {
    name: "Bakso",
    info: "Bakso is a beloved Indonesian meatball soup that has captured the hearts of many food enthusiasts. The meatballs are typically made from a mixture of finely ground beef or chicken, combined with tapioca flour for a bouncy texture. These are served in a savory, aromatic broth often seasoned with garlic, shallots, and white pepper. The dish is usually accompanied by yellow noodles or vermicelli, tofu, and sometimes siomay (dumplings) or boiled eggs. Toppings like fried shallots, celery, and a dash of sambal (chili sauce) elevate the flavors, making it a comforting street food staple.",
  },
  {
    name: "Batagor",
    info: "Batagor, short for Bakso Tahu Goreng, is a popular street food originating from Bandung, Indonesia. This dish combines deep-fried fish cakes and tofu stuffed with seasoned fish paste, creating a crispy and savory delight. It is typically served with a rich peanut sauce that’s sweet and slightly spicy, often accompanied by sweet soy sauce and a squeeze of lime. Batagor is enjoyed as a snack or light meal, cherished for its crunchy texture and the perfect balance of flavors in the sauce.",
  },
  {
    name: "Bubur Ayam",
    info: "Bubur Ayam, or chicken congee, is a warm and hearty rice porridge dish that is a breakfast favorite in Indonesia. The rice is cooked until it becomes creamy and smooth, then topped with shredded chicken, crispy fried shallots, scallions, and cakwe (fried dough sticks). A drizzle of soy sauce and a dollop of sambal add depth to the dish, while boiled eggs or chicken gizzards can be included as optional toppings. Served hot, it provides a comforting start to the day, especially in cooler weather.",
  },
  {
    name: "Gado-gado",
    info: "Gado-gado is a traditional Indonesian salad that offers a vibrant mix of steamed vegetables, boiled eggs, fried tofu, and tempeh. These ingredients are generously coated in a thick, aromatic peanut sauce made with ground peanuts, tamarind, and palm sugar, creating a perfect harmony of sweet, savory, and tangy flavors. The dish is typically garnished with crackers, fried shallots, and sometimes lontong (rice cakes) to make it a filling meal. Gado-gado is celebrated not only for its taste but also for its versatility and nutritional balance.",
  },
  {
    name: "Mie Ayam",
    info: "Mie Ayam, or chicken noodles, is a classic Indonesian street food dish that combines egg noodles with a flavorful topping of diced or shredded chicken cooked in a soy-based sauce. The noodles are typically served with a side of chicken broth and garnished with greens like bok choy, scallions, and fried shallots. Additional condiments such as sambal, vinegar, and soy sauce allow diners to customize the taste to their liking. Mie Ayam is a satisfying and quick meal, enjoyed by people of all ages.",
  },
  {
    name: "Nasi Goreng",
    info: "Nasi Goreng, or Indonesian fried rice, is a versatile and flavorful dish that is often considered the national dish of Indonesia. Made with day-old rice stir-fried in a mixture of sweet soy sauce, garlic, shallots, and chili, it is a dish bursting with umami. It can be customized with various add-ins like shrimp, chicken, eggs, and vegetables. Topped with a fried egg and served alongside pickled cucumbers and prawn crackers, Nasi Goreng is perfect for any time of day and a must-try for visitors to Indonesia.",
  },
  {
    name: "Nasi Padang",
    info: "Nasi Padang is a culinary experience that showcases the rich and diverse flavors of Minang cuisine from West Sumatra. Steamed white rice is served with an assortment of side dishes, such as rendang (spicy beef stew), ayam pop (steamed chicken), sambal balado (chili paste), and boiled cassava leaves. The variety of textures and bold, spicy flavors make each bite unique. Served in Padang restaurants where the dishes are brought to the table in small plates, Nasi Padang is a feast that reflects Indonesia's rich culinary heritage.",
  },
  {
    name: "Rawon",
    info: "Rawon is a distinctive beef soup from East Java, known for its rich, dark broth made from kluwak nuts, which give it an earthy and nutty flavor. Tender beef chunks are simmered with a blend of spices, including garlic, shallots, and turmeric, creating a hearty and aromatic dish. Rawon is often served with steamed rice, boiled eggs, bean sprouts, and sambal on the side, making it a comforting and satisfying meal. It is cherished for its unique taste and cultural significance.",
  },
  {
    name: "Sate Ayam",
    info: "Sate Ayam, or chicken satay, is one of Indonesia's most iconic dishes, featuring skewered and grilled chicken pieces that are marinated in a mix of sweet soy sauce and spices. The skewers are grilled over charcoal, giving them a smoky and slightly charred flavor. Served with a creamy peanut sauce, a drizzle of sweet soy sauce, and sometimes accompanied by lontong (rice cakes) and pickled vegetables, Sate Ayam is a perfect blend of sweetness, savory, and spice, enjoyed by locals and tourists alike.",
  },
  {
    name: "Soto Ayam",
    info: "Soto Ayam is a traditional Indonesian chicken soup with a rich and flavorful turmeric-based broth. The soup is typically filled with shredded chicken, glass noodles, boiled eggs, and sometimes rice cakes (lontong). Garnished with fried shallots, scallions, and a squeeze of lime, it is often accompanied by sambal and crackers for added texture and flavor. Soto Ayam is a versatile dish, commonly enjoyed as a comforting breakfast or a hearty meal during the day.",
  }
];

(async () => {
  const model = await tf.loadGraphModel(process.env.MODEL_URL);

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

        const inputTensor = tf.node
          .decodeImage(processedBuffer)
          .expandDims(0)
          .div(255.0);

        const prediction = model.predict(inputTensor);

        const result = prediction.dataSync();

        const resultArray = Array.from(result);

        const maxIndex = resultArray.indexOf(Math.max(...resultArray));

        return { prediction: foodData[maxIndex] };

      } catch (error) {
        console.error('Prediction error:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
  });

  server.route({
    method: 'GET',
    path: '/api/test-predict',
    handler: async (request, h) => {
      try {
        const imagePath = Path.join(__dirname, '../test_image/bakso.jpg');

        const imageBuffer = fs.readFileSync(imagePath);

        const processedBuffer = await sharp(imageBuffer)
          .resize(384, 384)
          .toFormat('jpeg')
          .toBuffer();

        const inputTensor = tf.node
          .decodeImage(processedBuffer)
          .expandDims(0)
          .div(255.0);

        const prediction = model.predict(inputTensor);

        const result = prediction.dataSync();

        const resultArray = Array.from(result);

        const maxIndex = resultArray.indexOf(Math.max(...resultArray));

        return { prediction: Object.entries(foodData)[maxIndex] };

      } catch (error) {
        console.error('Prediction error:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
})();
