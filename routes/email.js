const Email = require("email-templates");
////EMAILING VARIABLES
//GMAIL 0Auth
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
//////<

const email = new Email({
  message: {
    from: '"Insilico Trading" <service@insilicotrading.info>',
  },
  //send: process.env.DEBUG !== 'true',
  send: true, //always set to true because we have a custom transporter above
  transport: transporter,
  preview: false,
  // TODO: maybe use this?
  // https://github.com/Automattic/juice
  // https://www.npmjs.com/package/email-templates#automatic-inline-css-via-stylesheets
  juice: false,
  /*juice: {
		webResources: {
			relativeTo: 'static'
		}
  }*/
  views: {
    options: {
      extension: "ejs", // <---- HERE
    },
  },
});

module.exports = email;
