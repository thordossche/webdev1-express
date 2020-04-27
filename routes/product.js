let express = require('express');
let router = express.Router();
let product_controller = require('../controllers/productController');

// GET request for creating a product. NOTE This must come before route that displays product (uses id).
router.get('/create/:id', product_controller.product_create_get);

//PUT request for creating product.
router.post('/create/:id', product_controller.product_create_post);

// PUT request to delete product.
router.delete('/:id', product_controller.product_delete);

// GET request to update product.
router.get('/:id/update', product_controller.product_update_get);

// PUT request to update product.
router.patch('/:id/update', product_controller.product_update_patch);

//patch to accept bid
router.patch('/:id/accept', product_controller.product_accept);

// GET request for one product.
router.get('/:id', product_controller.product_detail);

module.exports = router;
