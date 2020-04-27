let Auction = require('../models/auction');
let Offer = require('../models/offer');
let Product = require('../models/product');


exports.deleteAuctionActions = function(auction) {
    return [
        Offer.deleteMany({product: {"$in": auction.products}}),
        Product.deleteMany({_id: {"$in": auction.products}}),
        Auction.findByIdAndDelete(auction._id)
    ];
};


exports.catchError = function(req, res, next, err, code) {
    if (req.accepts(['html', 'json']) === 'json'){
        res.status(code).send();
    }else {
        return next(err);
    }
};

exports.server_url = "groep3.webdev.ilabt.imec.be";