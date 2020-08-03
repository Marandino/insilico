const email = require("/email");

email.send({
  template: "welcome",
  message: {
    to: user.email,
  },
  locals: {
    name: user.firstName,
    verificationLink: verifyURL`${user.email}${user.verificationToken}`,
  },
});
