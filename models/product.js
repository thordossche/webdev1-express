let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ProductSchema = new Schema(
    {
        seller:  {type: Schema.Types.ObjectId, ref: 'User', required: true},
        name: {type: String, required: true, maxlength: 100},
        description: {type: String, required: true, maxlength: 300},
        start_price: {type: Number, required: true, min: 0},
        accepted: {type:Boolean, default: false}
    },
    {
        toJSON: { virtuals: true, transform: (doc, obj) => {delete obj.__v; delete obj._id; return obj;}}
    }
);

ProductSchema
    .virtual('url')
    .get(function () {
        return '/product/' + this._id;
    });


module.exports = mongoose.model('Product', ProductSchema);