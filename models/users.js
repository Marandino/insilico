const mongoose = require('mongoose'),
	passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
	stripeId: {
		type: String,
		default: null
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	referral: {
		type: String,
		default: null
	},

	resetPasswordToken: String,
	resetPasswordExpires: Date,
	password: String
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
