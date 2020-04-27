let express = require('express');
let router = express.Router();

// Require controller modules.
let auction_controller = require('../controllers/auctionController');
let user_controller = require('../controllers/userController');
let product_controller = require('../controllers/productController');
let offer_controller = require('../controllers/offerController');

// GET home page.
router.get('/', function(req, res) {
  res.render('index', { title: 'AuCtIoN TimE'});
});

// GET request for list of all users.
router.get('/users', user_controller.user_list);

// GET request for list of all auction items.
router.get('/auctions', auction_controller.auction_list);


module.exports = router;
