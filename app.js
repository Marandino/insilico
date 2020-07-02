if (process.env.NODE_ENV !== 'production') {
    ///load all keys to heroku ****
    require('dotenv').config();
}
var express = require('express'),
    app = express(),
    ///MANAGING DATABASES
    mongoose = require('mongoose'),
    ///BODY PARSER (PARSE FORMS)
    bodyParser = require('body-parser'),
    ///PASSPORT DEPENDENCIES (AUTHENTICATION)
    User = require('./models/users'),
    Lesson = require('./models/lessons'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    //// PORT
    PORT = process.env.PORT || 5000;
///ENVIROMENT KEYS
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// (async () => {
//     console.log(await stripe.plans.list());
// })();

////CONNECT TO DATABASE
const uri = process.env.ATLAS_URI;
mongoose.set('useUnifiedTopology', true);
///removes deprecation when updoating files
mongoose.set('useFindAndModify', false);
mongoose.connect(uri, {
    useNewUrlParser: true
});

////=======
//INIT DEPENDENCIES
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(bodyParser.json());
app.use(
    require('express-session')({
        secret: 'encoding passwords2',
        resave: false,
        saveUninitialized: false
    })
);
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

///MIDDLEWARE TO PASS THE user info to every single page
app.use(function (req, res, next) {
    // pass the user's information
    res.locals.currentUser = req.user; //passport creates this when someone's logged in
    next();
});
///
////EMAILING VARIABLES
const sgMail = require('@sendgrid/mail');
const lessons = require('./models/lessons');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//////<

//USER AUTHENTICATION
//REGISTER
app.get('/register', (req, res) => {
    res.render('register', {
        err: false
    });
});
//POST ROUTE
app.post('/register', (req, res) => {
    //user REGISTRATION
    // if statement so i can check if it's just a registering or something else
    // still it'd be better to implement it on the stripe acct 
    User.register(
        new User({
            username: req.body.username,
            email: req.body.email,
        }),
        req.body.password,
        function (err, user) {
            if (err) {
                return res.render('register', {
                    err: err
                });
            }

            //this part logs in the user after registering
            passport.authenticate('local')(req, res, function () {
                res.redirect('/checkout');
            });
        }
    );
});
/////======= END OF REGISTRATION ========

//LOG IN
app.get('/login', (req, res) => {
    res.render('login');
});

app.post(
    '/login',
    passport.authenticate('local', {
        successRedirect: '/redirect',
        failureRedirect: '/login'
    }),
    (req, res) => {}
);


app.get("/redirect", (req, res) => {
    res.redirect(req.session.returnTo || '/');
    delete req.session.returnTo;
})


//LOG OUT
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});
// ACCOUNT SETTINGS
app.get('/account', isLoggedIn, (req, res) => {
    res.render('account');
});

//isLoggedIn middleware || checks if the user is logged in

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}
/////// END OF LOGIN INFORMATION ============

//INDEX ROUTE
app.get('/', function (req, res) {
    res.render("index");
});

/// CONTACT FORM
app.get('/contact', isLoggedIn, function (req, res) {
    res.render('contact', {
        alert: false
    });
});
app.post('/contact', function (req, res) {
    ///retrieve the email info
    const output = `
        <h3> You 've got a New Contact</h3> 
        <p> This person is trying to reach you: </p> 
        <ul>
            <li>name: ${req.body.user}</li> 
            <li>phone: ${req.body.email}</li> 
            <li>phone: ${req.body.message}</li> 
        </ul> 
    `;
    //send the email info
    const msg = {
        to: 'chiy100196@gmail.com',
        // *** change it to be customer's email
        from: 'chi@marandino.dev',
        subject: 'Insilico Customer Contact',
        text: 'null',
        html: output
    };
    sgMail.send(msg);
    ///send you back
    res.render('contact', {
        alert: 'Your Message Has Been Sent'
    });
});

////>
///LESSONS PLACEHOLDER

app.get("/lesson", (req, res) => {
    Lesson.find({}, function (err, lessons) {
        if (err) {
            console.log(err);
        } else {
            res.render('lessons', {
                lessons: lessons
            });
        }
    });
})
app.get('/lesson/:id', function (req, res) {
    var lessonsData = [];
    //request all lessons
    Lesson.find({}, function (err, lessons) {
        if (err) {
            console.log(err);
        } else {
            lessonsData.push(lessons);
            Lesson.findById(req.params.id, function (err, lesson) {
                if (err) {
                    console.log(err)
                } else {
                    lessonsData.push(lesson);
                    console.log("everything is fine")
                    res.render("lesson", {
                        lessons: lessonsData[0],
                        lesson: lessonsData[1]
                    });

                }
            })
        }
    });
    // pass lesson information onto the rendered site
    // ejsout all that crap


});


////TEST -- REMOVE BEFORE DEPLOYING--

app.get('/test', function (req, res) {
    if (res.locals) {
        console.log(res.locals.currentUser);
        res.render('PartialsTemplate');
    }
    res.render('PartialsTemplate');
});
//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));