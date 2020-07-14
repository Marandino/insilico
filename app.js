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
	User = require('./models/users'),
	//    PASSPORT
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	passportLocalMongoose = require('passport-local-mongoose'),
	///forgotten password
	///async is for excecuting functions in order
	//crypto will generate a token id
	//// PORT
	PORT = process.env.PORT || 5000;
const async = require('async');
const crypto = require('crypto');

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
// app.use(bodyParser.json());
app.use(
	require('express-session')({
		secret: 'encoding passwords2',
		resave: false,
		saveUninitialized: false
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
		verify: function(req, res, buf) {
			if (req.originalUrl.startsWith('/webhook')) {
				req.rawBody = buf.toString();
			}
		}
	})
);
///SET VIEW ENGINE AND PUBLIC DIR
app.set('view engine', 'ejs');
app.use(express.static('public'));

///MIDDLEWARE TO PASS THE user info to every single page
app.use(function(req, res, next) {
	// pass the user's information
	res.locals.currentUser = req.user; //passport creates this when someone's logged in
	next();
});
///
////EMAILING VARIABLES
const sgMail = require('@sendgrid/mail');
const { update } = require('./models/lessons');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//////<

//USER AUTHENTICATION
///USER AUTHENTICATION
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
			referral: req.body.referral
		}),
		req.body.password,
		function(err, user) {
			if (err) {
				return res.render('register', {
					err: err
				});
			}

			//this part logs in the user after registering
			passport.authenticate('local')(req, res, function() {
				res.redirect('/#pricing');
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
		successRedirect: '/#pricing',
		failureRedirect: '/login'
	}),
	(req, res) => {}
);

app.get('/redirect', (req, res) => {
	res.redirect(req.session.returnTo || '/');
	delete req.session.returnTo;
});

//LOG OUT
app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});
// FORGOT PASSWORD
// forgot password
app.get('/forgot', function(req, res) {
	res.render('forgot', {
		err: null
	});
});

app.post('/forgot', function(req, res, next) {
	async.waterfall(
		[
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function(token, done) {
				User.findOne(
					{
						email: req.body.email
					},
					function(err, user) {
						if (!user) {
							// req.flash('error', 'No account with that email address exists.');
							return res.render('forgot', {
								err: "There's no account with that e-mail address"
							});
						}

						user.resetPasswordToken = token;
						user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

						user.save(function(err) {
							done(err, token, user);
						});
					}
				);
			},
			function(token, user, done) {
				let output = `<h3>Please follow this link in order to reset your password</h3>
            <a href="http://localhost:5000/reset/${token}">RESET</a>`;
				let msg = {
					to: user.email,
					// *** change it to be customer's email
					from: 'chi@marandino.dev',
					subject: 'Password Reset | Insilico Trading',
					text: 'null',
					html: output
				};
				sgMail.send(msg, function(err) {
					done(err, 'done');
				});
			}
		],
		function(err) {
			if (err) return next(err);
			res.render('forgot', {
				err: "We've sent an e-mail with further instructions on how to reset your password"
			});
		}
	);
});

app.get('/reset/:token', function(req, res) {
	User.findOne(
		{
			resetPasswordToken: req.params.token,
			resetPasswordExpires: {
				$gt: Date.now()
			}
		},
		function(err, user) {
			if (!user) {
				// req.flash('error', 'Password reset token is invalid or has expired.');
				console.log('Password reset token is invalid or has expired');
				return res.render('forgot', {
					err: 'This password reset token is invalid or has expired'
				});
			}
			res.render('reset', {
				token: req.params.token,
				err: false
			});
		}
	);
});

app.post('/reset/:token', function(req, res) {
	async.waterfall(
		[
			function(done) {
				User.findOne(
					{
						resetPasswordToken: req.params.token,
						resetPasswordExpires: {
							$gt: Date.now()
						}
					},
					function(err, user) {
						if (!user) {
							// req.flash('error', 'Password reset token is invalid or has expired.');
							console.log('Password reset token is invalid or has expired');
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(req.body.password, function(err) {
								user.resetPasswordToken = undefined;
								user.resetPasswordExpires = undefined;

								user.save(function(err) {
									req.logIn(user, function(err) {
										done(err, user);
									});
								});
							});
						} else {
							// req.flash("error", "Passwords do not match.");
							return res.redirect('/');
						}
					}
				);
			},
			function(user, done) {
				let output = `<h3>Your Password Has Been Changed</h3>
            <p>If it wasn't you, please change all your passwords as your e-mail might have been compromised.</p>`;
				let msg = {
					to: user.email,
					// *** change it to be customer's email
					from: 'chi@marandino.dev',
					subject: 'Password Reset | Insilico Trading',
					text: 'null',
					html: output
				};
				sgMail.send(msg, function(err) {
					done(err, 'done');
				});
			}
		],
		function(err) {
			res.redirect('/');
		}
	);
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

app.get('/test', (req, res) => {
	//FETCHES THE USER INFORMATION FROM REQ
	let conditions = {
		email: req.user.email
	};
	///SETS UP THE USER ID WE'VE RECEIVED FROM THE TOKEN
	let update = {
		stripeId: 'segundo asalto'
	};

	//UPDATES IT ONTO THE DATABASE
	User.findOneAndUpdate(conditions, update, (err) => {}); // returns Query

	res.redirect('/');
});

//INDEX ROUTE
app.get('/', function(req, res) {
	res.render('index');
});

/// CONTACT FORM
app.get('/contact', function(req, res) {
	res.render('contact', {
		alert: false
	});
});
app.post('/contact', function(req, res) {
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

app.get('/lesson', (req, res) => {
	Lesson.find({}, function(err, lessons) {
		if (err) {
			console.log(err);
		} else {
			res.render('lessons', {
				lessons: lessons
			});
		}
	});
});

app.get('/lesson/:id', function(req, res) {
	var lessonsData = [];
	//request all lessons
	Lesson.find({}, function(err, lessons) {
		if (err) {
			console.log(err);
		} else {
			lessonsData.push(lessons);
			Lesson.findById(req.params.id, function(err, lesson) {
				if (err) {
					console.log(err);
				} else {
					lessonsData.push(lesson);
					res.render('lesson', {
						lessons: lessonsData[0],
						lesson: lessonsData[1]
					});
				}
			});
		}
	});
	// pass lesson information onto the rendered site
	// ejsout all that crap
});
///STRIPE CHECKOUT
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.get('/success', (req, res) => {
	res.render('success');
});

// Fetch the Checkout Session to display the JSON result on the success page

app.get('/checkout-session', async (req, res) => {
	const { sessionId } = req.query;
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	res.send(session);
});

app.post('/create-checkout-session', async (req, res) => {
	const domainURL = process.env.DOMAIN;
	const { priceId } = req.body;

	// Create new Checkout Session for the order
	// Other optional params include:
	// [billing_address_collection] - to display billing address details on the page
	// [customer] - if you have an existing Stripe Customer ID
	// [customer_email] - lets you prefill the email input in the form
	// For full details see https://stripe.com/docs/api/checkout/sessions/create
	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: [ 'card' ],
		line_items: [
			{
				price: priceId,
				quantity: 1
			}
		],
		// ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
		// success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
		// cancel_url: `${domainURL}/canceled.html`,
		success_url: 'http://localhost:5000/success',
		cancel_url: 'http://localhost:5000/cancel'
	});

	res.send({
		sessionId: session.id
	});
});

app.get('/setup', (req, res) => {
	res.send({
		publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
		basicPrice: process.env.BASIC_PRICE_ID,
		proPrice: process.env.PRO_PRICE_ID,
		vipPrice: process.env.VIP_PRICE_ID
	});
});
//////
// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
	let eventType;
	// Check if webhook signing is configured.
	if (process.env.STRIPE_WEBHOOK_SECRET) {
		// Retrieve the event by verifying the signature using the raw body and secret.
		let event;
		let signature = req.headers['stripe-signature'];

		try {
			event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
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

	if (eventType === 'checkout.session.completed') {
		console.log(`🔔  Payment received!`);
		// console.log(data);
		//// I NEED TO SEND THE INFO TO THE DATABASE AND THEN SEND AN E-MAIL ********
	} else if (eventType === 'customer.created') {
		let conditions = {
			email: data.object.email
		};
		///SETS UP THE USER ID WE'VE RECEIVED FROM THE TOKEN
		let update = {
			stripeId: data.object.id
		};
		//UPDATES IT ONTO THE DATABASE
		User.findOneAndUpdate(conditions, update, (err) => {
			console.log(err);
		}); // returns Query
		console.log('Customer has been created');
		//SAID SETUP WILL CHANGE THE LOG IN BUTTON INTO A "ACCOUNT BUTTON" SO THEY CAN MANAGE THEIR SUBSCRITPION
	}
	res.sendStatus(200);
});

// ACCOUNT MANAGING PORTAL
app.post('/create_customer_portal_session', async (req, res) => {
	let customer = {
		customer: req.user.stripeId,
		/////HARDCODED CUSTOMER SHOULD BE FIXED
		return_url: 'https://insilicotrading.info'
	};
	stripe.billingPortal.sessions.create(customer, function(err, session) {
		// asynchronously called
		// if error send a message
		if (err) {
			console.log(err);
			res.redirect('/#pricing');
		} else {
			res.redirect(session.url);
		}
	});
});

/// END OF PAYMENTS

//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
