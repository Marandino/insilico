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
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//////<

/// USER AUTHENTICATION

//REGISTER
app.get('/register', (req, res) => {
    res.render('register');
});
//POST ROUTE
app.post('/register', (req, res) => {
    //user REGISTRATION
    User.register(
        new User({
            username: req.body.username,
            email: req.body.email,
            premium: false
        }),
        req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                return res.render('register');
            }

            //this part logs in the user after registering
            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
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
        successRedirect: '/contact',
        failureRedirect: '/login'
    }),
    (req, res) => {
        // original callback function
    }
);

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
    res.redirect('/login');
}
/////// END OF LOGIN INFORMATION ============

//INDEX ROUTE
app.get('/', function (req, res) {
    res.render('index');
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
app.get('/lesson/:id', isLoggedIn, function (req, res) {
    res.render('lesson');
});

////CHECKOUT PAGE

app.get("/checkout", (req, res) => {
    res.render("checkout");
})
//adding IDs for the different plans is going to be necessary


////PAYMENTS

app.get("/checkout", (req, res) => {
    res.render("checkout");
})

app.get('/public-key', (req, res) => {
    res.send({
        publicKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});
app.post('/create-customer', async (req, res) => {
    // This creates a new Customer and attaches
    console.log(req.body);
    // the PaymentMethod to be default for invoice in one API call.
    const customer = await stripe.customers.create({
        payment_method: req.body.payment_method,
        email: req.body.email,
        invoice_settings: {
            default_payment_method: req.body.payment_method
        }
    });
    // At this point, associate the ID of the Customer object with your
    // own internal representation of a customer, if you have one.
    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
            // price: process.env.SUBSCRIPTION_PRICE_ID
            price: "price_1GxAcpJyRCyDOw0D2kfbRhKe"
        }],
        expand: ['latest_invoice.payment_intent']
    });
    res.send(subscription);
});

app.post('/subscription', async (req, res) => {
    let subscription = await stripe.subscriptions.retrieve(
        req.body.subscriptionId
    );
    res.send(subscription);
});

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers['stripe-signature'];

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        // Extract the object from the event.
        dataObject = event.data.object;
        eventType = event.type;

        // Handle the event
        // Review important events for Billing webhooks
        // https://stripe.com/docs/billing/webhooks
        // Remove comment to see the various objects sent for this sample
        switch (event.type) {
            case 'customer.created':
                // console.log(dataObject);
                break;
            case 'customer.updated':
                // console.log(dataObject);
                break;
            case 'invoice.upcoming':
                // console.log(dataObject);
                break;
            case 'invoice.created':
                // console.log(dataObject);
                break;
            case 'invoice.finalized':
                // console.log(dataObject);
                break;
            case 'invoice.payment_succeeded':
                // console.log(dataObject);
                break;
            case 'invoice.payment_failed':
                // console.log(dataObject);
                break;
            case 'customer.subscription.created':
                // console.log(dataObject);
                break;
                // ... handle other event types
            default:
                // Unexpected event type
                return res.status(400).end();
        }
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    res.sendStatus(200);
});


/////

////TEST -- REMOVE BEFORE DEPLOYING--

app.get('/test', function (req, res) {
    res.render('PartialsTemplate');
});
//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));