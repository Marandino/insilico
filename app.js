var express = require("express"),
    app = express(),
    ///MANAGING DATABASES
    mongoose = require('mongoose'),
    ///BODY PARSER (PARSE FORMS)
    bodyParser = require('body-parser'),
    ///PASSPORT DEPENDENCIES (AUTHENTICATION)
    User = require("./models/users"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    //// PORT
    PORT = process.env.PORT || 5000;
////CONNECT TO DATABASE
const uri = "mongodb+srv://marandino:herediano@cluster0-deig9.gcp.mongodb.net/?retryWrites=true&w=majority";
mongoose.set('useUnifiedTopology', true);
mongoose.connect(uri, {
    useNewUrlParser: true
});

////=======
//INIT DEPENDENCIES
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(require("express-session")({
    secret: "encoding passwords2",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

///SET VIEW ENGINE AND PUBLIC DIR
app.set('view engine', 'ejs');
app.use(express.static('public'));

///// PASSPORT INITIALIZATION
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//=========

app.get("/", function (req, res) {
    res.render("index");
})
/// USER AUTHENTICATION

//REGISTER
app.get("/register", (req, res) => {
    res.render("register")
})
//POST ROUTE
app.post("/register", (req, res) => {
    //user REGISTRATION
    User.register(new User({
        username: req.body.username,
        email: req.body.email
    }), req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            return res.render("register");
        }

        //this part logs in the user after registering
        passport.authenticate("local")(req, res, function () {
            res.redirect("/");
        })
    })
})
/////======= END OF REGISTRATION ========

//LOG IN
app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/contact",
    failureRedirect: "/login"
}), (req, res) => {
    // original callback function
})

//LOG OUT
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})
//isLoggedIn middleware on secret route

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}
/////// END OF LOGIN INFORMATION ============

app.get("/contact", isLoggedIn, function (req, res) {
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