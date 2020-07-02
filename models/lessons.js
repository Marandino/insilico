const mongoose = require("mongoose");

var lessonSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    thumbnail: String,
    social: String
})

module.exports = mongoose.model("Lesson", lessonSchema)