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
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  res.render("contact", {
    alert: "Your Message Has Been Sent",
  });
  ///send you back
});
////>

module.exports = router;
