///express router
const express = require("express"),
  router = express.Router();
///GMAIL 0Auth
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.OAUTH_CLIENT_ID, // ClientID
  process.env.OAUTH_CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
const accessToken = oauth2Client.getAccessToken();
///END OF GOOGLE OAUTH
///NODEMAILER
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "service@insilicotrading.info",
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken,
  },
});
////====

/// CONTACT FORM
router.get("/contact", function (req, res) {
  res.render("contact", {
    alert: false,
  });
});

router.post("/contact", async (req, res) => {
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
  let info = await transporter.sendMail({
    from: '"Insilico" <service@insilicotrading.info>', // sender address
    to: process.env.INSILICO_EMAIL, // list of receivers
    subject: "New Contact Form Submission", // Subject line
    text: "Hello world?", // plain text body
    html: output, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  res.render("contact", {
    alert: "Your Message Has Been Sent",
  });
  ///send you back
});

////>

module.exports = router;
