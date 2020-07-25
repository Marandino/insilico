///express router
const express = require("express"),
  router = express.Router();
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "chi@marandino.dev", // generated ethereal user
    pass: process.env.MARANDINO_PASSWORD, // generated ethereal password
  },
});

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
    from: '"Insilico" <insilico@marandino.dev>', // sender address
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
