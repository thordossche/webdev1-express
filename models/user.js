let mongoose = require('mongoose')
let Schema = mongoose.Schema


let UserSchema = new Schema(
    {
        first_name: {type:String, required:true, max: 50},
        family_name: {type:String, required:true, max: 50},
        email: {type: String, required:true, max: 120},
    },
    {
        toJSON: { virtuals: true, transform: (doc, obj) => {delete obj.__v; delete obj._id; delete obj.name; return obj;}}
    }
);

UserSchema
    .virtual('url')
    .get(function () {
        return '/user/' + this._id;
    });

UserSchema
    .virtual('name')
    .get(function () {
        var fullname = '';
        if (this.first_name && this.family_name) {
            fullname = this.family_name + ' ' + this.first_name
        }
        if (!this.first_name || !this.family_name) {
            fullname = '';
        }
        return fullname;
    });

module.exports = mongoose.model('User', UserSchema)