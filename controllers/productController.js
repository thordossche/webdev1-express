let Product = require('../models/product');
let User = require('../models/user');
let Auction = require('../models/auction');
let Offer = require('../models/offer');
const validator = require('express-validator');
const tools = require('../bin/tools');

exports.product_detail = function(req, res, next) {
    Promise.all([
        Product.findById(req.params.id).populate('seller'),
        Offer.find({product: req.params.id}).populate('buyer').sort([['bid', 'descending']]),
        Auction.findOne({ products: {$in : [req.params.id]}})
    ])
    .then(([product, offers, auction])=>{
        if (product == null) { // No results.
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(404).send();
                return;
            }else{
                let error = new Error('Product not found');
                error.status = 404;
                return next(error);
            }
        }
        let deadline = {};
        deadline.product_over = Date.now() >= auction.product_deadline;
        deadline.bid_over = Date.now() >= auction.bid_deadline;
        deadline.auction_ended = Date.now() >= auction.end;
        if (req.accepts(['html', 'json']) === 'json'){
            let prod = product.toJSON();
            prod.seller = tools.server_url + prod.seller.url;
            prod.url = tools.server_url + prod.url;
            res.json(prod);
        }else {
            res.render('details/product_detail', {product:product, offers: offers, auction: auction, deadline: deadline});
        }
    })
    .catch(err => {
        tools.catchError(req, res, next, err, 500);
    });

};

// handle product accept on PATCH (set accepted field on true).
exports.product_accept = function(req, res, next) {
    Product.findByIdAndUpdate(req.params.id, {$set:{accepted:true}}, {new:false}).then( (product) => {
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(200).send();

            }else {
                res.redirect(product.url);
            }
        }).catch((err) => {
            tools.catchError(req, res, next, err, 500);
        })
};

exports.product_create_get = function(req, res, next) {
    User.find({})
        .sort([['family_name', 'ascending']])
        .exec(function (err, users)
        {
            if (err) { return next(err); }
            res.render('forms/product_form', {title: 'Create Product', users: users, auction: req.params.id});
        });
};

//use to validate products
validate_product =  [
    validator.body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be long enough. (With max. of 100 characters.)')
        .matches(/^[a-z0-9 ]+$/i).withMessage('Name has non-alphanumeric characters.').escape(),
    validator.body('description').trim().isLength({ min: 5, max: 100 })
        .withMessage('Provide a solid description of the product. (More than 5 characters, less than 100.)').escape(),
    validator.body('start_price').trim().isFloat({gt : 0})
        .withMessage('Start price is not a valid number or must be higher than 0.').escape()
];


exports.product_create_post = [
    validate_product,
    (req, res, next) => {
        const errors = validator.validationResult(req);

        let product = new Product(
            {   name: req.body.name,
                description: req.body.description,
                seller: req.body.seller,
                start_price: req.body.start_price,
            });

        if (!errors.isEmpty()) {
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(400).send();
            } else {
                User.find({})
                    .exec(function (err, users) {
                        if (err) {tools.catchError(req, res, next, err, 500);}
                        else if (req.accepts(['html', 'json']) === 'json') {
                            res.status(200).send();
                        } else {
                            res.render('forms/product_form', {
                                title: 'Create Product',
                                product: req.body,
                                users: users,
                                errors: errors.array()
                            });
                        }
                    });
            }
        }

        else {
            product.save(function (err) {
                if (err) { tools.catchError(req, res, next, err, 500);}
                //successful so add to auction list of products
                else {
                    Auction.findById(req.params.id, function (err, auction) {
                        if (err) { tools.catchError(req, res, next, err, 500);}
                        else {
                            auction.products.push(product);
                            auction.save(function (err) {
                                if (err) {
                                    tools.catchError(req, res, next, err, 500);
                                }
                            });
                        }
                    }).catch((err) => {
                        tools.catchError(req, res, next, err, 500);
                    });
                    if (req.accepts(['html', 'json']) === 'json') {
                        res.status(200).send();
                    } else {
                        res.redirect(product.url);

                    }
                }
            });
        }
    }
];

exports.product_delete = function(req, res, next) {
    Auction.find({"products": req.params.id}).then( (auctions) => {
        Offer.deleteMany({product:req.params.id}).then(
            Product.findByIdAndRemove(req.params.id, function(err) {
                if (err) {tools.catchError(req, res, next, err, 500);}
                else if (req.accepts(['html', 'json']) === 'json'){
                    res.status(200).send();
                }else {
                    res.redirect(303, '/auction/' + auctions[0]._id)
                }

            }))}
        ).catch(err => {
            tools.catchError(req, res, next, err, 500);
        })
};

exports.product_update_get = function(req, res, next) {
    Product.findById(req.params.id)
        .populate('seller')
        .exec(function (err, product) {
            if (err) { return next(err); }
            res.render('forms/product_form', {title: 'Update Product', product: product, updating: true});
        });
};

exports.product_update_patch =  [

    validate_product,
    (req, res, next) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(400).send();
            }else {
                res.status(400).send({
                    message: "Error while updating product.",
                    errors: errors.array(),
                });
            }
        } else {
            Product.findByIdAndUpdate(req.params.id,
                {$set: {name: req.body.name, start_price: req.body.start_price, description: req.body.description}},
                {new: false})
                .then(() => {
                    if (req.accepts(['html', 'json']) === 'json'){
                        res.status(200).send();
                    }else{
                        res.send("Success");
                    }
                })
                .catch((err) => {
                    tools.catchError(req, res, next, err, 500);
                })
        }
    }
];
