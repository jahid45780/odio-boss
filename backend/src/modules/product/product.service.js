const Product = require('./product.model');
const InventoryLog = require('../inventory/inventory.model');
const ApiError = require('../../utils/ApiError');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');

function toSlug(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function listProducts(query) {
  const filter = {};
  if (query.includeUnpublished !== 'true') filter.isPublished = true;
  if (query.search) filter.$text = { $search: query.search };
  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 12)));
  const skip = (page - 1) * limit;

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { soldCount: -1 },
    rating: { ratingAverage: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').populate('brand', 'name slug').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return { products, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getProduct(idOrSlug) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const product = await Product.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug })
    .populate('category', 'name slug')
    .populate('brand', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

async function createProduct(payload, files = [], actorName = 'Admin') {
  const uploadedImages = [];
  for (const file of files) {
    uploadedImages.push(await uploadBufferToCloudinary(file.buffer, 'soniq/products'));
  }

  const product = await Product.create({
    ...payload,
    slug: `${toSlug(payload.name)}-${Date.now().toString(36)}`,
    images: uploadedImages,
  });

  await InventoryLog.create({
    product: product._id,
    productName: product.name,
    sku: product.sku,
    previousStock: 0,
    changeAmount: product.stock,
    newStock: product.stock,
    reason: 'Initial stock on product creation',
    actorName,
  });

  return product;
}

async function updateProduct(id, payload, files = [], actorName = 'Admin') {
  const existing = await Product.findById(id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const prevStock = existing.stock;
  const newImages = [];
  for (const file of files) {
    newImages.push(await uploadBufferToCloudinary(file.buffer, 'soniq/products'));
  }

  Object.assign(existing, payload);
  if (newImages.length > 0) existing.images.push(...newImages);
  await existing.save();

  if (payload.stock !== undefined && Number(payload.stock) !== prevStock) {
    await InventoryLog.create({
      product: existing._id,
      productName: existing.name,
      sku: existing.sku,
      previousStock: prevStock,
      changeAmount: existing.stock - prevStock,
      newStock: existing.stock,
      reason: 'Admin product update',
      actorName,
    });
  }

  return existing;
}

async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ApiError(404, 'Product not found');
  for (const img of product.images) {
    if (img.publicId) await deleteFromCloudinary(img.publicId);
  }
  return { deleted: true };
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
