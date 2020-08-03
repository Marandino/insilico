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

router.post("/contact", async (req, res) => {
  // //send the email info
  const info = await email.send({
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
  console.log("Message sent: %s", info.messageId);
  res.render("contact", {
    alert: "Your Message Has Been Sent",
  });
  ///send you back
});
////>

module.exports = router;
