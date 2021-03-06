///express router
const express = require("express"),
  passport = require("passport"),
  ///async is for excecuting functions in order
  async = require("async"),
  //crypto will generate a token id
  crypto = require("crypto"),
  User = require("../models/users"),
  router = express.Router();
////EMAILING VARIABLES
const email = require("./email");
///USER AUTHENTICATION
//REGISTER
router.get("/register", (req, res) => {
  res.render("register", {
    err: false,
  });
});
//POST ROUTE
router.post("/register", (req, res) => {
  //user REGISTRATION
  // if statement so i can check if it's just a registering or something else
  // still it'd be better to implement it on the stripe acct
  User.register(
    new User({
      username: req.body.username,
      email: req.body.email,
      referral: req.body.referral,
    }),
    req.body.password,
    function (err, user) {
      if (err) {
        return res.render("register", {
          err: err,
        });
      }
      //this part logs in the user after registering
      passport.authenticate("local")(req, res, function () {
        //callback function
        // ///EMAIL commented out as per cx req
        // // email.send({
        // //   template: "welcome",
        // //   message: {
        // //     to: req.body.email,
        // //   },
        // //   locals: {
        // //     name: req.body.username,
        // //   },
        // // });
        // // console.log("Message sent: to", user.email);
        res.redirect("/#pricing");
      });
    }
  );
});
/////======= END OF REGISTRATION ========

//LOG IN
router.get("/login", (req, res) => {
  res.render("login", { query: req.query });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/#pricing",
    failureRedirect: "/login?auth=failed",
  }),
  (req, res) => {}
);

router.get("/redirect", (req, res) => {
  res.redirect(req.session.returnTo || "/");
  delete req.session.returnTo;
});

//LOG OUT
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
// FORGOT PASSWORD
// forgot password
router.get("/forgot", function (req, res) {
  res.render("forgot", {
    err: null,
  });
});

router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne(
          {
            email: req.body.email,
          },
          function (err, user) {
            if (!user) {
              // req.flash('error', 'No account with that email address exists.');
              return res.render("forgot", {
                err: "There's no account with that e-mail address",
              });
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function (err) {
              done(err, token, user);
            });
          }
        );
      },
      function (token, user, done) {
        ///EMAIL
        email.send({
          template: "passwordReset",
          message: {
            to: user.email,
          },
          locals: {
            name: user.username,
            token,
          },
        });
        console.log("Message sent: to", user.email);
        ///NEXXT (sends you back)
      },
    ],
    function (err) {
      if (err) return next(err);
    }
  );
  res.render("forgot", {
    err:
      "We've sent an e-mail with further instructions on how to reset your password",
  });
});

router.get("/reset/:token", function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    },
    function (err, user) {
      if (!user) {
        // req.flash('error', 'Password reset token is invalid or has expired.');
        console.log("Password reset token is invalid or has expired");
        return res.render("forgot", {
          err: "This password reset token is invalid or has expired",
        });
      }
      res.render("reset", {
        token: req.params.token,
        err: false,
      });
    }
  );
});

router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
              $gt: Date.now(),
            },
          },
          function (err, user) {
            if (!user) {
              // req.flash('error', 'Password reset token is invalid or has expired.');
              console.log("Password reset token is invalid or has expired");
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, (err) => {
                    err ? console.log(err) : console.log("el nene esta bien");
                  });
                });
              });
            } else {
              // req.flash("error", "Passwords do not match.");
              return res.redirect("/");
            }
          }
        );
      },
      function (user, done) {
        ///EMAIL
        email.send({
          template: "passwordReseted",
          message: {
            to: user.email,
          },
          locals: {
            name: user.username,
          },
        });
        done(err, "done");
      },
    ],
    (err) => {
      res.render("index");
      console.log(err);
    }
  );
  return res.render("forgot", { err: "Your password has been updated!" });
});

//isLoggedIn middleware || checks if the user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/login");
}
/////// END OF LOGIN INFORMATION ============

module.exports = router;
