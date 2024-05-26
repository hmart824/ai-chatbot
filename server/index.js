const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 7070;
const dotenv = require("dotenv");
const cors = require('cors');
dotenv.config();
const Product = require('./models/ProductModel'); 
const router = express.Router();

// Import your assistant function
// const { sendMessageToWeatherAssistant } = require('./weather_assistant');
const {sendMessageToProSpectorAssistant} = require('./productAssistant/product_assistant');

console.log('api', process.env.CHAT_GPT_API_KEY);

// Middleware to parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(router);
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/products/:productId', async (req, res) => {
  const productId = req.params.productId;

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const product = await Product.findById(productId);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Define your route
app.post('/chat', sendMessageToProSpectorAssistant);

app.listen(port, () => {
  console.log(`Server is running and listening on http://localhost:${port}`);
});
