const mongoose = require("mongoose");

var indicatorSchema = new mongoose.Schema({
    name: String,
    description: String,
    thumbnail: String,
    tv: String, 
    ranking: {
        type: String,
		default: null
    }
})

module.exports = mongoose.model("Indicator", indicatorSchema)



