let Auction = require('../models/auction');
let User = require('../models/user');
const validator= require('express-validator');
const tools = require('../bin/tools');
const moment = require('moment');

exports.auction_list = function(req, res, next) {
    Auction.find({})
        .sort([['end', 'ascending']])
        .exec(function (err, list_auctions) {
            if (err) { tools.catchError(req, res, next, err, 500);}
            else if (req.accepts(['html', 'json']) === 'json'){
                let auction_list = [];
                list_auctions.forEach(auction =>  {
                    auction_list = auction_list.concat([tools.server_url + auction.url])
                });
                res.json({auctions:auction_list})
            }else {
                res.render('lists/auction_list', {title: 'Auctions', auction_list: list_auctions});
            }
        });
};

exports.auction_detail = function(req, res, next) {
    Auction.findById(req.params.id)
        .populate('organisers')
        .populate('products')
        .exec(function (err, auction) {
            if (err) {
                tools.catchError(req, res, next, err, 500);}
            else if (auction == null) {
                //zorgt dat er geen html wordt meegestuurd
                if (req.accepts(['html', 'json']) === 'json'){
                    res.status(404).send();
                    return;
                }else{
                    let error = new Error('Auction not found');
                    error.status = 404;
                    return next(error);
                }
            }
            else if (req.accepts(['html', 'json']) === 'json'){
                let auc = auction.toJSON();
                //zet alle url's om naar bruikbare url's
                auc.url = tools.server_url + auc.url;
                auc.organisers.forEach(organiser => {organiser.url = tools.server_url + organiser.url});
                auc.products.forEach(product => {product.url = tools.server_url + product.url});
                res.json(auc);
            }else {
                res.render('details/auction_detail', {
                    title: 'Auction Detail',
                    auction: auction,
                    auction_ended: auction.end <= Date.now(), //einde: vanaf dan sluit de veiling kan je dus niets meer aanpassen
                    product_deadline_ended: auction.product_deadline <= Date.now() //deadline: je kan geen dingen meer toevoegen
                    , moment: require('moment')
                });
            }
        });
};

exports.auction_create_get = function(req, res, next) {
    User.find({})
        .exec(function (err, users) {
            if (err) { return next(err); }
            res.render('forms/auction_form', {title: 'Create Auction', users: users});
        });
};

//use to validate auctions
validate_auction =  [
         validator.body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be long enough (with max. of 100 characters).')
        .matches(/^[a-z0-9 ]+$/i).withMessage('Name has non-alphanumeric characters.').escape(),

        validator.body('place').trim().isLength({ min: 2 , max:100 }).withMessage('Place must be long enough (with max. of 100 characters).')
            .matches(/^[a-z0-9 \-]+$/i).withMessage('Place has non-alphanumeric characters.').escape(),

        validator.body('organisers').notEmpty().withMessage('There must be at least 1 organiser.'),
        validator.body('organisers.*').escape(),

        validator.body('start').notEmpty().withMessage('Please specify the start date.').escape()
            .custom(date => moment(date.toString(), moment.ISO_8601, true).isValid())
            .withMessage('Start date is not a valid date.').escape(),

        validator.body('end').notEmpty().withMessage('Please specify the end date.')
            .custom(date => moment(date.toString(), moment.ISO_8601, true).isValid())
            .withMessage('End date is not a valid date.')
            .custom((end, { req }) => end > req.body.start ).withMessage('End date should be after start date')
            .escape(),

        validator.body('product_deadline').notEmpty().withMessage('Please specify product deadline.')
            .custom(date => moment(date.toString(), moment.ISO_8601, true).isValid())
            .withMessage('Product deadline is not a valid date.')
            .custom((date, { req }) => (date <= req.body.end && date > req.body.start) )
            .withMessage('Product deadline should be before or on the end date and after start date.')
            .escape(),

        validator.body('bid_deadline').notEmpty().withMessage('Please specify bid deadline.')
            .custom(date => moment(date.toString(), moment.ISO_8601, true).isValid())
            .withMessage('Bid deadline is not a valid date.')
            .custom((date, { req }) => (date <= req.body.end && date > req.body.start) )
            .withMessage('Bid deadline should be before or on the end date and after start date.')
            .escape(),
];

exports.auction_create_post = [
    (req, res, next) => {
        if(!(req.body.organisers instanceof Array)){
            if(typeof req.body.organisers==='undefined')
                req.body.organisers=[];
            else
                req.body.organisers=new Array(req.body.organisers);
        }
        next();
    },
        validate_auction,
        (req, res, next) => {
            const errors = validator.validationResult(req);

            let auction = new Auction(
                {   name: req.body.name,
                    place: req.body.place,
                    start: req.body.start,
                    end: req.body.end,
                    product_deadline: req.body.product_deadline,
                    bid_deadline: req.body.bid_deadline,
                    organisers: req.body.organisers,
                });

            if (!errors.isEmpty()) {
                if (req.accepts(['html', 'json']) === 'json'){
                    res.status(400).send();
                } else {
                    User.find({})
                        .exec(function (err, users) {
                            if (err) { tools.catchError(req, res, next, err, 500); }
                            else {
                                for (let i = 0; i < users.length; i++) {
                                    if (auction.organisers.indexOf(users[i]._id) > -1) {
                                        users[i].checked = 'true';
                                    }
                                }
                                res.render('forms/auction_form',
                                    {
                                        title: 'Create Auction',
                                        auction: req.body,
                                        users: users,
                                        errors: errors.array(),
                                        moment: require('moment')
                                    }
                                );
                            }
                        });

                }
            }
            else {
                auction.save(function (err) {
                    if (err) { tools.catchError(req, res, next, err, 500);}
                    else {
                        res.redirect(auction.url);
                    }
                });
            }
        }
    ];


exports.auction_delete = function(req, res, next) {
    Auction.findById(req.params.id).then( (auction) => {
        Promise.all(tools.deleteAuctionActions(auction))
            .then( res.redirect('/auctions'))
            .catch(err => {
                tools.catchError(req, res, next, err, 500);
        })
    }).catch(err => {
        tools.catchError(req, res, next, err, 500);
    })
};


exports.auction_update_get = function(req, res, next) {
        Promise.all([
            Auction.findById(req.params.id).populate('organisers'),
            User.find({})
        ])
        .then(([auction, users])=>{
            for (let i = 0; i < users.length; i++) {
                for (let j = 0; j < auction.organisers.length; j++) {
                    if (users[i]._id.toString() === auction.organisers[j]._id.toString()) {
                        users[i].checked='true';
                    }
                }
            }
            res.render('forms/auction_form', {title: 'Update Auction', users: users, auction: auction, moment: require('moment'), updating: true});
        })
        .catch(err => {
            return next(err);
        });

};

exports.auction_update_patch = [
    (req, res, next) => {
        if(!(req.body.organisers instanceof Array)){
            if(typeof req.body.organisers==='undefined')
                req.body.organisers=[];
            else
                req.body.organisers=new Array(req.body.organisers);
        }
        next();
    },
    validate_auction,

    (req, res, next) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({
                message: "Error while updating auction.",
                errors: errors.array(),
            });
        } else {
            Auction.findByIdAndUpdate(req.params.id,
                {$set: {name: req.body.name,
                        place: req.body.place,
                        start: req.body.start,
                        end: req.body.end,
                        product_deadline: req.body.product_deadline,
                        bid_deadline: req.body.bid_deadline,
                        organisers: req.body.organisers,}},
                {new: false})
                .then((auction) => {
                    //will be redirected to auction.url
                    res.send("Success")
                })
                .catch((err) => {
                    tools.catchError(req, res, next, err, 500);
                })
        }
    }

];

