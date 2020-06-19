var express = require("express"),
    app = express(),
    // mongoose = require('mongoose'),
    // methodOverride = require('method-override'),
    // uri = 'mongodb+srv://marandino:herediano@cluster0-deig9.gcp.mongodb.net/insilico?retryWrites=true&w=majority',
    bodyParser = require('body-parser'),
    PORT = process.env.PORT || 5000;

// mongoose.set('useUnifiedTopology', true);
// mongoose.connect(uri, {
//     useNewUrlParser: true
// });

app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(methodOverride("_method"));

app.get("/", function (req, res) {
    res.render("index");
})
/// USER AUTHENTICATION

//REGISTER
app.get("/register", (req, res) => {
    res.render("register")
})

//LOG IN
app.get("/login", (req, res) => {
    res.render("login")
})

//LOG OUT

app.get("/contact", function (req, res) {
    res.render("contact");
})

app.get("/lesson/:id", function (req, res) {
    res.render("lesson");
})

////TEST
app.get("/test", function (req, res) {
    res.render("PartialsTemplate");
})
//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));