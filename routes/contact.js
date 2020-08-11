///express router
const express = require("express"),
  router = express.Router();
const email = require("./email");

/// CONTACT FORM
router.get("/contact", function (req, res) {
  res.render("contact", {
    alert: false,
  });
});

router.post("/contact", (req, res) => {
  // //send the email info
  if (!req.body.email)
    return res.render("contact", { alert: "We don't want spammers" });
  email.send({
    template: "contact",
    message: {
      to: process.env.INSILICO_EMAIL,
    },
    locals: {
      username: req.body.user,
      email: req.body.email,
      message: req.body.message,
    },
  });
  // console.log("Message sent: %s", info.messageId);
  ///NEXXT (sends you back)
  res.render("contact", {
    alert: "Your Message Has Been Sent",
  });
});

module.exports = router;
