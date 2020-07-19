///express router
const express = require("express"),
  //stripe
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY),
  User = require("../models/users"),
  router = express.Router();
////EMAILING VARIABLES
const sgMail = require("@sendgrid/mail"),
  { update } = require("../models/lessons");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//////<
///STRIPE
router.get("/success", (req, res) => {
  res.render("success");
});

// Fetch the Checkout Session to display the JSON result on the success page

router.get("/checkout-session", async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

router.post("/create-checkout-session", async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { priceId } = req.body;

  // Create new Checkout Session for the order
  // Other optional params include:
  // [billing_address_collection] - to display billing address details on the page
  // [customer] - if you have an existing Stripe Customer ID
  // [customer_email] - lets you prefill the email input in the form
  // For full details see https://stripe.com/docs/api/checkout/sessions/create
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
    // success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    // cancel_url: `${domainURL}/canceled.html`,
    success_url: "https://www.insilicotrading.info/success",
    cancel_url: "https://www.insilicotrading.info/",
  });

  res.send({
    sessionId: session.id,
  });
});

router.get("/setup", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    basicPrice: process.env.BASIC_PRICE_ID,
    proPrice: process.env.PRO_PRICE_ID,
    vipPrice: process.env.VIP_PRICE_ID,
  });
});
//////
// Webhook handler for asynchronous events.
router.post("/webhook", async (req, res) => {
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

  if (eventType === "charge.succeeded") {
    let chargeEmail = data.object.billing_details.email;
    var conditions = {
      email: chargeEmail,
    };
    ///SETS UP THE USER ID WE'VE RECEIVED FROM THE TOKEN
    let chargeAmount = data.object.amount;
    let chargeCustomer = data.object.customer;
    let update = {
      stripeId: chargeCustomer,
      currentSubscription: chargeAmount,
    };
    //UPDATES IT ONTO THE DATABASE
    User.findOneAndUpdate(conditions, update, (err) => {
      // console.log(err);
    }); // returns Query
    ////SEND THE EMAIL TO INSILICO
    User.findOne({ email: chargeEmail }, (err, user) => {
      const output = `
			<h3> There's a new subscription!</h3> 
			<ul>
				<li>Email: ${user.email}</li> 
				<li>Referred by: ${user.referral}</li> 
				<li>Subscription: ${user.currentSubscription / 100} USD</li> 
			</ul> 
		`;
      //send the email info
      const msg = {
        to: "chiy100196@gmail.com",
        // *** change it to be customer's email
        from: "insilico@marandino.dev",
        subject: "INSILICO NEW SUBSCRIPTION",
        text: "null",
        html: output,
      };
      sgMail.send(msg);
      ///send you back
    });
  } else if (eventType === "customer.subscription.deleted") {
    var conditions = {
      stripeId: data.object.customer,
    };

    ///SETS UP THE USER ID WE'VE RECEIVED FROM THE TOKEN
    let update = {
      currentSubscription: null,
    };
    //UPDATES IT ONTO THE DATABASE
    User.findOneAndUpdate(conditions, update, (err) => {
      console.log(err);
    }); // returns Query
  }
  res.sendStatus(200);
});

// ACCOUNT MANAGING PORTAL
router.post("/create_customer_portal_session", async (req, res) => {
  let customer = {
    customer: req.user.stripeId,
    return_url: "https://www.insilicotrading.info",
  };
  stripe.billingPortal.sessions.create(customer, function (err, session) {
    // asynchronously called
    // if error send a message
    if (err) {
      console.log(err);
      res.redirect("/#pricing");
    } else {
      res.redirect(session.url);
    }
  });
});

/// END OF PAYMENTS

module.exports = router;
