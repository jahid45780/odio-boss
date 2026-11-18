const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const productService = require('./product.service');

const list = catchAsync(async (req, res) => {
  const data = await productService.listProducts(req.query);
  sendResponse(res, 200, data);
});

const getOne = catchAsync(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  sendResponse(res, 200, { product });
});

const create = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files || [], req.user?.name);
  sendResponse(res, 201, { product }, 'Product created');
});

const update = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files || [], req.user?.name);
  sendResponse(res, 200, { product }, 'Product updated');
});

const remove = catchAsync(async (req, res) => {
  const data = await productService.deleteProduct(req.params.id);
  sendResponse(res, 200, data, 'Product deleted');
});

module.exports = { list, getOne, create, update, remove };
