if (process.env.NODE_ENV !== "production") {
  ///load all keys to heroku ****
  require("dotenv").config();
}
const express = require("express"),
  app = express(),
  ///MANAGING DATABASES
  mongoose = require("mongoose"),
  ///BODY PARSER (PARSE FORMS)
  bodyParser = require("body-parser"),
  User = require("./models/users"),
  //    PASSPORT
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  ///forgotten password
  //// VARIABLES MAILING

  //atlas
  uri = process.env.ATLAS_URI,
  //port
  PORT = process.env.PORT || 5000;
/////midddleware
////MONGOOSE
mongoose.set("useUnifiedTopology", true);
///removes deprecation when updoating files
mongoose.set("useFindAndModify", false);
mongoose.connect(uri, {
  useNewUrlParser: true,
});
////=======

//INIT DEPENDENCIES
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// app.use(bodyParser.json());
app.use(
  require("express-session")({
    secret: "encoding passwords2",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

///// PASSPORT INITIALIZATION
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//=========

app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);
///SET VIEW ENGINE AND PUBLIC DIR
app.set("view engine", "ejs");
app.use(express.static("public"));

///MIDDLEWARE TO PASS THE user info to every single page
app.use(function (req, res, next) {
  // pass the user's information
  res.locals.currentUser = req.user; //passport creates this when someone's logged in
  next();
});
///

////ROUTES
const productRoutes = require("./routes/products"),
  authRoutes = require("./routes/auth"),
  contactRoutes = require("./routes/contact"),
  stripeRoutes = require("./routes/stripe");

//// USE THEM
app.use(productRoutes, authRoutes, contactRoutes, stripeRoutes);

//INDEX ROUTE
app.get("/", function (req, res) {
  res.render("index");
});
//// END OF ROUTES

//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
