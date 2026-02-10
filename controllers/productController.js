// controllers/productController.js
const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

// Get single product
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const existing = await Product.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Product name already exists' });
    }

    const product = await Product.create({
      name,
      description,
    });

    // Optional: emit real-time update
    // global.io.to('admin').emit('productUpdate', { newProduct: product });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Prevent duplicate names
    if (name && name !== product.name) {
      const existing = await Product.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: 'Product name already exists' });
      }
    }

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;

    await product.save();

    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};