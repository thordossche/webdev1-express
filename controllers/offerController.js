let Offer = require('../models/offer');
let User = require('../models/user');
const validator = require('express-validator');
const tools = require('../bin/tools');

exports.offer_create_get = function(req, res) {
    User.find({})
        .sort([['family_name', 'ascending']])
        .exec(function (err, users)
        {
            if (err) { return next(err); }
            res.render('forms/offer_form', {title: 'Create Offer', users: users, product: req.params.id});
        });
};

exports.offer_create_post = [
    validator.body('bid').trim().isFloat({gt : 0})
        .withMessage('Your offer is not a valid number or must be higher than 0.').escape(),

    (req, res, next) => {
        const errors = validator.validationResult(req);

        let offer = new Offer(
            {   buyer: req.body.buyer,
                bid: req.body.bid,
                product: req.params.id,
            });

        if (!errors.isEmpty()) {
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(400).send();
            } else {
                User.find({})
                    .exec(function (err, users) {
                        if (err) {
                            if (req.accepts(['html', 'json']) === 'json') {
                                res.status(err.status).send();
                            } else {
                                return next(err);
                            }
                        }
                        res.render('forms/offer_form', {
                            title: 'Create Offer',
                            users: users,
                            errors: errors.array(),
                            auction: req.params.id
                        });
                    });
            }
        }
        else {
            offer.save(function (err) {
                if (err) { tools.catchError(req, res, next, err, 500);}
                else if (req.accepts(['html', 'json']) === 'json'){
                    res.status(200).send();
                }else{
                    res.redirect('/product/' + req.params.id);
                }
            });
        }
    }
];

exports.offer_delete = function(req, res, next) {
    Offer.findById(req.params.id).then( offer => {
            Offer.findByIdAndRemove(req.params.id, function(err) {
                if (err) { tools.catchError(req, res, next, err, 500);}
                else if (req.accepts(['html', 'json']) === 'json'){
                    res.status(200).send();
                }else{
                    res.redirect(303, '/product/' + offer.product._id)
                }
            })}
        )
    .catch(err => {
        tools.catchError(req, res, next, err, 500);
    });
};
