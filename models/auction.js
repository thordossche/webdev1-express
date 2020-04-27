let mongoose = require('mongoose');
let Schema = mongoose.Schema;
var moment = require('moment');

let AuctionSchema = new Schema(
    {
        name: {type: String, required: true, max: 100},
        place: {type: String, required: true, max: 100},
        start: {type: Date, default: Date.now},
        end: {type: Date, required: true, min: this.start},
        product_deadline: {type: Date, min: this.start, max: this.end, default: this.end},
        bid_deadline: {type: Date, min: this.start, max: this.end, default: this.end},
        organisers: [{type: Schema.Types.ObjectId, ref: 'User'}],
        products: [{type: Schema.Types.ObjectId, ref: 'Product'}]
    },
    //transform is om niet de __v en niet 2x het id te tonen bij het omzetten naar json formaat
    {
        toJSON: { virtuals: true, transform: (doc, obj) => {delete obj.__v; delete obj._id; return obj;}}
    }
);

AuctionSchema
    .virtual('url')
    .get(function () {
            return '/auction/' + this._id;
    });

AuctionSchema
    .virtual('running_time')
    .get(function () {
        return (moment(this.start).format('MMMM Do, YYYY') + " - " + moment(this.end).format('MMMM Do, YYYY'));
    });

module.exports = mongoose.model('Auction', AuctionSchema);