///express router
const express = require("express"),
  router = express.Router();

/// CONTACT FORM
router.get("/contact", function (req, res) {
  res.render("contact", {
    alert: false,
  });
});
router.post("/contact", function (req, res) {
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
    to: "chiy100196@gmail.com",
    // *** change it to be customer's email
    from: "insilico@marandino.dev",
    subject: "Insilico Customer Contact",
    text: "null",
    html: output,
  };
  sgMail.send(msg);
  ///send you back
  res.render("contact", {
    alert: "Your Message Has Been Sent",
  });
});

////>

module.exports = router;
