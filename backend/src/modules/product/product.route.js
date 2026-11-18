const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/admin.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createProductSchema } = require('./product.validation');
const controller = require('./product.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', authenticate, requireAdmin, upload.array('images', 6), validate(createProductSchema), controller.create);
router.patch('/:id', authenticate, requireAdmin, upload.array('images', 6), controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

module.exports = router;
