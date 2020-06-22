const mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    name: String,
    avatar: {
        type: String,
        default: "default.png"
    },
    username: String,
    email: String,
    premium: {
        type: Boolean,
        default: false
    },
    password: String
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema)