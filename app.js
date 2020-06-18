var express = require("express"),
    app = express(),
    mongoose = require('mongoose'),
    // methodOverride = require('method-override'),
    uri = 'mongodb+srv://marandino:herediano@cluster0-deig9.gcp.mongodb.net/cluster0?retryWrites=true&w=majority',
    bodyParser = require('body-parser'),
    port = 3000;

mongoose.set('useUnifiedTopology', true);
mongoose.connect(uri, {
    useNewUrlParser: true
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(methodOverride("_method"));

app.get("/", function (req, res) {
    res.render("index");
})

app.get("/contact", function (req, res) {
    res.render("contact");
})

app.get("/lesson/:id", function (req, res) {
    res.render("lesson");
})

app.get("/test", function (req, res) {
    res.render("PartialsTemplate");
})
//LISTEN
app.listen(port || process.env.PORT, () => {
    console.log('server is up');
});