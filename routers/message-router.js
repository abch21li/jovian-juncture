const express = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("jovian-database.db");

const router = express.Router();

router.get("/", function (request, response) {
  response.render("contact.hbs");
});

router.post("/message/add", function (request, response) {
  const name = request.body.artistname;
  const email = request.body.email;
  const subject = request.body.subject;
  const message = request.body.yourmessage;
  const values = [name, email, subject, message];

  const validationErrors = [];

  if (
    name.length == 0 ||
    email.length == 0 ||
    subject.length == 0 ||
    message.length == 0
  ) {
    validationErrors.push("You need to fill out all of the available fields.");
  }

  const query =
    "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)";

  if (validationErrors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.render("contact-confirmation.hbs");
      }
    });
  } else {
    const model = {
      validationErrors,
      name,
      email,
      subject,
      message,
    };
    response.render("contact.hbs", model);
  }
});

module.exports = router;
