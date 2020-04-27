let express = require('express');
let router = express.Router();
let auction_controller = require('../controllers/auctionController');

// GET request for creating a auction. NOTE This must come before routes that display auction (uses id).
router.get('/create', auction_controller.auction_create_get);

// PUT request for creating auction.
router.post('/create', auction_controller.auction_create_post);

// DELETE request to delete auction.
router.delete('/:id', auction_controller.auction_delete);

// GET request to update auction.
router.get('/:id/update', auction_controller.auction_update_get);

// PATCH request to update auction.
router.patch('/:id/update', auction_controller.auction_update_patch);

// GET request for one auction.
router.get('/:id', auction_controller.auction_detail);

module.exports = router;
