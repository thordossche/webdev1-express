let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let OfferSchema = new Schema(
    {
        buyer:  {type: Schema.Types.ObjectId, ref: 'User', required: true},
        bid: {type: Number, required: true, min: 0},
        product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
    },
    {
        toJSON: { virtuals: true, transform: (doc, obj) => {delete obj.__v; delete obj._id; return obj;}}
    }
);

OfferSchema
    .virtual('url')
    .get(function () {
        return '/offer/' + this._id;
    });

//Export model
module.exports = mongoose.model('Offer', OfferSchema);