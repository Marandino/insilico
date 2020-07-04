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
    Lesson = require('./models/lessons'),
    //// PORT
    PORT = process.env.PORT || 5000;
////CONNECT TO DATABASE
const uri = process.env.ATLAS_URI;
mongoose.set('useUnifiedTopology', true);
///removes deprecation when updoating files
mongoose.set('useFindAndModify', false);
mongoose.connect(uri, {
    useNewUrlParser: true
});

////=======

////CONNECT TO STRIPE
//INIT DEPENDENCIES
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

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
app.set('view engine', 'ejs');
app.use(express.static('public'));

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

//INDEX ROUTE
app.get('/', function (req, res) {
    res.render("index");
});

/// CONTACT FORM
app.get('/contact', function (req, res) {
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
            <li>email: ${req.body.email}</li> 
            <li>message: ${req.body.message}</li> 
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

///STRIPE CHECKOUT 
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.get("/success", (req, res) => {
    res.render("success");
})


// Fetch the Checkout Session to display the JSON result on the success page

app.get("/checkout-session", async (req, res) => {
    const {
        sessionId
    } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
});

app.post("/create-checkout-session", async (req, res) => {
    const domainURL = process.env.DOMAIN;
    const {
        priceId
    } = req.body;

    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{
            price: priceId,
            quantity: 1,
        }, ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        // success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        // cancel_url: `${domainURL}/canceled.html`,
        success_url: "http://localhost:5000/success",
        cancel_url: "http://localhost:5000/cancel",

    });

    res.send({
        sessionId: session.id,
    });
});

app.get("/setup", (req, res) => {
    res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        basicPrice: process.env.BASIC_PRICE_ID,
        proPrice: process.env.PRO_PRICE_ID,
        vipPrice: process.env.VIP_PRICE_ID,
    });
});
//////
// Webhook handler for asynchronous events.
app.post("/webhook", async (req, res) => {
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];

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
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    if (eventType === "checkout.session.completed") {
        console.log(`🔔  Payment received!`);
        console.log(data);
        //// I NEED TO SEND THE INFO TO THE DATABASE AND THEN SEND AN E-MAIL ********
    } else if (eventType === "customer.created") {
        console.log(data.object.email + data.object.id);

        console.log("Customer has been created")

        ////CREATE USER AUTHENTICATION WITHOUT A PASSWORD THERE. 

        //THEN AN EMAIL CONFIRMATION SETUP WHERE THE FIRST TIME THE USER LOGS IN, SETS UP THE PASSWORD

        //SAID SETUP WILL CHANGE THE LOG IN BUTTON INTO A "ACCOUNT BUTTON" SO THEY CAN MANAGE THEIR SUBSCRITPION

        // PROBABLY JUST THE STRIPE USER SETTING
    }

    res.sendStatus(200);
});


/// END OF PAYMENTS

//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));