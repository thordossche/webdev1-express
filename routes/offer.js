let express = require('express');
let router = express.Router();
let offer_controller = require('../controllers/offerController');

// GET request for creating a offer. NOTE This must come before route that displays offer (uses id).
router.get('/create/:id', offer_controller.offer_create_get);

// PUT request for creating offer.
router.post('/create/:id', offer_controller.offer_create_post);

// PUT request to delete offer.
router.delete('/:id', offer_controller.offer_delete);

module.exports = router;
