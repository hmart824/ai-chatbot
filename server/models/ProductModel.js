const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  shipping_method: {
    type: String,
    required: true
  },
  estimated_delivery: {
    type: String,
    required: true
  },
  shipping_cost: {
    type: Number,
    required: true
  },
  shipping_countries: {
    type: [String],
    required: true
  },
  return_policy: {
    days_allowed: {
      type: Number,
      required: true
    },
    details: {
      type: String,
      required: true
    }
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  specs: {
    screen_size: {
      type: String,
      required: true
    },
    camera: {
      type: String,
      required: true
    },
    processor: {
      type: String,
      required: true
    },
    storage: {
      type: String,
      required: true
    },
    battery: {
      type: String,
      required: true
    }
  },
  delivery: deliverySchema
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
