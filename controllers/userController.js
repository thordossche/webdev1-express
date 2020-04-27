let User = require('../models/user');
let Auction = require('../models/auction');
let Offer = require('../models/offer');
let Product = require('../models/product');
const validator = require('express-validator');
const tools = require('../bin/tools');
let mongoose = require('mongoose');

exports.user_list = function(req, res, next) {
    User.find()
        .populate('user')
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_users) {
            if (err) {tools.catchError(req, res, next, err, 500);}
            else if (req.accepts(['html', 'json']) === 'json'){
                let user_list = [];
                list_users.forEach(user =>  {
                    user_list = user_list.concat([tools.server_url + user.url])
                });
                res.json({users:user_list})
            }else {
                res.render('lists/user_list', {title: 'Users', user_list: list_users});
            }
        });
};

exports.user_detail = function(req, res, next) {
    Promise.all([
        User.findById(req.params.id),
        Product.find({seller: req.params.id}),
        Auction.find({organisers: req.params.id}),
        Offer.find({buyer: req.params.id}).populate('product')
    ])
    .then(([user, products, auctions, offers])=>{
        //gaf anders problemen op de server
        if (products === null || products === undefined){
            products = [];
        }
        if (auctions === null || auctions === undefined){
            auctions = [];
        }
        if (offers === null || offers === undefined){
            offers = [];
        }
        if (user === null || user === undefined) { // No results.
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(404).send();
                return;
            }else{
                let error = new Error('User not found');
                error.status = 404;
                return next(error);
            }
        }
        // Successful, so render.
        if (req.accepts(['html', 'json']) === 'json'){
            res.json(user.toJSON());
        }else{
            res.render('details/user_detail', {user: user, products: products, auctions: auctions, offers: offers});
        }
    })
    .catch(err => {
        tools.catchError(req, res, next, err, 500);
    });
};

exports.user_create_get = function(req, res) {
    res.render('forms/user_form', {title: 'Create User'})
};

//use to validate users
validate_user =  [
    validator.body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be long enough.')
        .matches(/^[a-z0-9 ]+$/i).withMessage('First name has non-alphanumeric characters.').escape(),
    validator.body('family_name').trim().isLength({ min: 2 }).withMessage('Family name must be long enough.')
        .matches(/^[a-z0-9 ]+$/i).withMessage('Family has non-alphanumeric characters.').escape(),
    validator.body('email').trim().notEmpty().withMessage('Email must be specified.')
        .isEmail().withMessage('Email field must be an email (check if it contains "@",.. )').escape()
];

exports.user_create_post = [

    validate_user,

    (req, res, next) => {
        const errors = validator.validationResult(req);
        let email_error = [];

        //controleer eerst en vooral of er al een user is met die email
        User.findOne({email: req.body.email}).then( user => {
            if (user) {
                email_error = [{msg: "Email already exists."}];
            }
            if (!errors.isEmpty() || email_error.length > 0) {
                if (req.accepts(['html', 'json']) === 'json'){
                    res.status(400).send();
                }else {
                    res.render('forms/user_form', {
                        title: 'Create User',
                        user: req.body,
                        errors: errors.array().concat(email_error)
                    });
                }
            }
            else {
                let user = new User(
                    {
                        first_name: req.body.first_name,
                        family_name: req.body.family_name,
                        email: req.body.email
                    });
                user.save(function (err) {
                    if (err) {tools.catchError(req, res, next, err, 500);}
                    else if (req.accepts(['html', 'json']) === 'json'){
                        res.status(200).send();
                    }else{
                        res.redirect(user.url);
                    }
                });
            }
        }).catch((err) => {
            tools.catchError(req, res, next, err, 500);
        });

    }
];

exports.user_delete = function(req, res, next) {
    Auction.find({organisers: req.params.id}).then( auctions => {
        auctions.forEach(function (auction, index) {
            //als auction meer dan 1 organiser heeft hoeft de auction niet verwijderd te worden
            if (auction.organisers.length > 1){
                Auction.findByIdAndUpdate(auction._id,
                    { $pull: { organisers: { $in: [req.params.id] }} },
                    {new: false})
                    .catch((err) => {
                        tools.catchError(req, res, next, err, 500);
                    })
            }
            //de auction heeft maar 1 organiser, dus verwijder ook de auction zodat we geen auction zonder organiser hebben
            else {
                Promise.all(tools.deleteAuctionActions(auction)).catch(err => {
                    tools.catchError(req, res, next, err, 500);
                })
            }
        });
    })
    //verwijder dan alle producten, offers, ... van de gebruiker
    .then(
        Promise.all([
            Offer.deleteMany({buyer:req.params.id}),
            Product.deleteMany({seller:req.params.id}),
            User.findByIdAndDelete(req.params.id)
        ])
    ).then( () => {
            if (req.accepts(['html', 'json']) === 'json'){
                res.status(200).send();
            }else{
                res.redirect('/users')
            }
        }
    ).catch(err => {
        tools.catchError(req, res, next, err, 500);
    })
};

exports.user_update_get = function(req, res) {
    User.findById(req.params.id)
        .exec(function (err, user) {
            if (err) {
                return next(err);
            }
            res.render('forms/user_form', {title: 'Update User', user: user, updating: true});
        });
};

exports.user_update_patch =  [
    validate_user,
    (req, res, next) => {
        const errors = validator.validationResult(req);
        let email_error = [];
        //controleer eerst en vooral of er al een user is met die email
        User.findOne({email: req.body.email}).then( user => {
            if (user && user._id.toString() !== req.params.id.toString()) {
                email_error = [{msg: "Email already exists."}];
            }
            if (!errors.isEmpty() || email_error.length > 0) {
                if (req.accepts(['html', 'json']) === 'json'){
                    res.status(400).send();
                }else {
                    res.status('400').send({
                        message: "Error while updating user.",
                        errors: errors.array().concat(email_error),
                    });
                }
            }
            else {
                User.findByIdAndUpdate(req.params.id,
                    {$set: {first_name: req.body.first_name,
                            family_name: req.body.family_name,
                            email: req.body.email}},
                    {new: false})
                    .then(() => {
                        //this will be redirected to user.url, done in  public/js/main.js
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
        }).catch((err) => {
            tools.catchError(req, res, next, err, 500);});
    }
];
