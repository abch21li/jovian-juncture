const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const SQLiteStore = require("connect-sqlite3")(expressSession);
const bcrypt = require("bcrypt");

const messageRouter = require("./routers/message-router");

const adminUsername = "admin";
const adminPassword =
  "$2b$10$iI5lehyoaSke9GjnS5wHBub5pSuGqjGKZqqnndr24aFo9eHRwoSvO";

const db = new sqlite3.Database("jovian-database.db");

const MIN_REVIEW_NAME_LENGTH = 2;

const app = express();

app.use(
  expressSession({
    secret: "askj487rjdask2",
    saveUninitialized: false,
    resave: false,
    store: new SQLiteStore(),
  })
);

db.run(
  "CREATE TABLE IF NOT EXISTS faqs (question TEXT, answer TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS reviews (text TEXT, name TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS bookings (booking TEXT, artist TEXT, project TEXT, email TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS messages (name TEXT, email TEXT, subject TEXT, message TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn;

  response.locals.isLoggedIn = isLoggedIn;

  next();
});

//ROUTERS

app.use("/contact", messageRouter);

app.get("/", function (request, response) {
  response.render("start.hbs");
});

app.get("/start", function (request, response) {
  response.render("start.hbs");
});

app.get("/about", function (request, response) {
  response.render("about.hbs");
});

/* -------------------------------CONTACT PAGE OPERATIONS */

/* -------------------------------LOGIN PAGE OPERATIONS */

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  if (
    enteredUsername == adminUsername &&
    bcrypt.compareSync(enteredPassword, adminPassword)
  ) {
    //Login
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model);
  }
});

app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/start");
});

/* -------------------------------BOOKINGS PAGE CRUD OPERATIONS */

//DELETE BOOKING
app.get("/booking/delete/:id", function (request, response) {
  const id = request.params.id;
  const query = "DELETE FROM bookings WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error) {
    if (error) {
      console.log(error);
      //display error
    } else {
      response.redirect("/bookings/");
    }
  });
});

//FETCH BOOKINGS
app.get("/bookings", function (request, response) {
  const query = "SELECT * FROM bookings ORDER BY id";

  db.all(query, function (error, bookings) {
    if (error) {
      console.log(error);
      //send back an error page

      const model = {
        dbError: true,
      };
      response.render("bookings.hbs", model);
    } else {
      const model = {
        bookings,
        dbError: false,
      };
      response.render("bookings.hbs", model);
    }
  });
});

function getValidationErrorsForBooking(artist, project, email) {
  const validationErrors = [];

  if (artist.length == 0 || project.length == 0 || email.length == 0) {
    validationErrors.push("You need to fill out all of the available fields.");
  }

  return validationErrors;
}

//ADD BOOKING
app.post("/booking/add", function (request, response) {
  const newBooking = request.body.bookingSlot;
  const artist = request.body.artist;
  const project = request.body.projectdescription;
  const email = request.body.emailaddress;

  const errors = getValidationErrorsForBooking(artist, project, email);

  if (errors.length == 0) {
    const query =
      "INSERT INTO bookings (booking, artist, project, email) VALUES (?, ?, ?, ?)";
    const values = [newBooking, artist, project, email];
    let is_checked = "true";

    if (is_checked) {
      db.run(query, values, function (error) {
        if (error) {
          console.log(error);
          //display error message
        } else {
          response.redirect("/bookings/");
          console.log(request.body);
        }
      });
    } else {
      is_checked = "false";
    }
  } else {
    const model = {
      errors,
      newBooking,
      artist,
      project,
      email,
    };
    response.render("bookings.hbs", model);
  }
});

app.get("/bookings/add/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM bookings WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, booking) {
    if (error) {
      console.log(error);
      //display error
    } else {
      const model = {
        booking,
      };
      response.render("booking.hbs", model);
    }
  });
});

//UPDATE BOOKING

app.get("/booking/update/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM bookings WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, result) {
    if (error) {
      console.log(error);
      //display error
    } else {
      response.render("update-booking.hbs", result);
    }
  });
});

app.post("/booking/update/:id", function (request, response) {
  const newartist = request.body.artist;
  const newproject = request.body.project;
  const newemail = request.body.email;
  const id = request.params.id;

  const errors = getValidationErrorsForBooking(newartist, newproject, newemail);

  if (errors.length == 0) {
    const query =
      "UPDATE bookings SET artist = ?, project = ?, email = ? WHERE id = ?";
    const values = [newartist, newproject, newemail, id];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.redirect("/bookings/");
      }
    });
  } else {
    const model = {
      errors,
      newartist,
      newproject,
      newemail,
      id,
    };
    response.render("update-booking.hbs", model);
  }
});

/* -------------------------------REVIEW PAGE CRUD OPERATIONS */

function getValidationErrorsForReview(text, name) {
  const validationErrors = [];

  if (text.length < MIN_REVIEW_NAME_LENGTH) {
    validationErrors.push(
      "Your name needs at least " + MIN_REVIEW_NAME_LENGTH + " characters."
    );
  }

  if (name.length < MIN_REVIEW_NAME_LENGTH) {
    validationErrors.push(
      "Your review needs at least " + MIN_REVIEW_NAME_LENGTH + " characters."
    );
  }

  return validationErrors;
}

//DELETE REVIEW

app.get("/review/delete/:id", function (request, response) {
  const id = request.params.id;
  const query = "DELETE FROM reviews WHERE id = ?";
  const values = [id];

  const text = request.body.reviewtext;
  const name = request.body.artistname;

  const errors = getValidationErrorsForReview(text, name);

  if (!request.session.isLoggedIn) {
    errors.push("You have to login to delete reviews.");
  } else {
    response.redirect("/login");
  }

  if (errors.length == 0) {
    db.get(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error
      } else {
        response.redirect("/reviews/");
      }
    });
  } else {
    const model = {
      errors,
      text,
      name,
      id,
    };
    response.render("reviews.hbs", model);
  }
});

//UPDATE REVIEW

app.get("/review/update/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, result) {
    if (error) {
      console.log(error);
      //display error
    } else {
      response.render("update-review.hbs", result);
    }
  });
});

app.post("/review/update/:id", function (request, response) {
  const newtext = request.body.reviewtext;
  const newname = request.body.artistname;
  const id = request.params.id;
  const query = "UPDATE reviews SET text = ?, name = ? WHERE id = ?";
  const values = [newtext, newname, id];

  const errors = getValidationErrorsForReview(newtext, newname);

  if (!request.session.isLoggedIn) {
    errors.push("You have to login to update reviews.");
  } else {
    response.redirect("/login");
  }

  if (errors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.redirect("/reviews/");
      }
    });
  } else {
    const model = {
      errors,
      newtext,
      newname,
      id,
    };
    response.render("update-review.hbs", model);
  }
});

//FETCH REVIEWS

app.get("/reviews", function (request, response) {
  const query = "SELECT * FROM reviews ORDER BY id";

  db.all(query, function (error, reviews) {
    if (error) {
      console.log(error);
      //send back an error page

      const model = {
        dbError: true,
      };
      response.render("reviews.hbs", model);
    } else {
      const model = {
        reviews,
        dbError: false,
      };
      response.render("reviews.hbs", model);
    }
  });
});

//ADD REVIEW

app.post("/reviews/add", function (request, response) {
  const name = request.body.artistname;
  const text = request.body.reviewtext;

  const errors = getValidationErrorsForReview(text, name);

  if (errors.length == 0) {
    const query = "INSERT INTO reviews (text, name) VALUES (?, ?)";
    const values = [text, name];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.redirect("/reviews/");
      }
    });
  } else {
    const model = {
      errors,
      text,
      name,
    };
    response.render("reviews.hbs", model);
  }
});

app.get("/reviews/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    if (error) {
      console.log(error);
      //display error
    } else {
      const model = {
        review,
      };
      response.render("review.hbs", model);
    }
  });
});

/* -------------------------------FAQ PAGE OPERATIONS */

function getValidationErrorsForFaq(question, answer) {
  const validationErrors = [];

  if (question.length == 0 || answer.length == 0) {
    validationErrors.push("You need to fill out all of the available fields.");
  }

  return validationErrors;
}

//FETCH FAQS

app.get("/faqs", function (request, response) {
  const query = "SELECT * FROM faqs ORDER BY id";

  db.all(query, function (error, faqs) {
    if (error) {
      console.log(error);
      //send back an error page

      const model = {
        dbError: true,
      };
      response.render("faqs.hbs", model);
    } else {
      const model = {
        faqs,
        dbError: false,
      };
      response.render("faqs.hbs", model);
    }
  });
});

//ADD FAQ

app.post("/faqs/add", function (request, response) {
  const question = request.body.questiontext;
  const answer = request.body.answertext;

  const query = "INSERT INTO faqs (question, answer) VALUES (?, ?)";
  const values = [question, answer];

  const errors = getValidationErrorsForFaq(question, answer);

  if (!request.session.isLoggedIn) {
    errors.push("You have to login to add an FAQ");
  }

  if (errors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.redirect("/faqs/");
      }
    });
  } else {
    const model = {
      errors,
      question,
      answer,
    };
    response.render("faqs.hbs", model);
  }
});

//DELETE FAQ

app.get("/faq/delete/:id", function (request, response) {
  const id = request.params.id;
  const query = "DELETE FROM faqs WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error) {
    if (error) {
      console.log(error);
      //display error
    } else {
      response.redirect("/faqs/");
    }
  });
});

//UPDATE FAQ

app.get("/faq/update/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM faqs WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, result) {
    if (error) {
      console.log(error);
      //display error
    } else {
      response.render("update-faq.hbs", result);
    }
  });
});

app.post("/faq/update/:id", function (request, response) {
  const newQuestion = request.body.question;
  const newAnswer = request.body.answer;
  const id = request.params.id;
  const query = "UPDATE faqs SET question = ?, answer = ? WHERE id = ?";
  const values = [newQuestion, newAnswer, id];

  faqErrors = getValidationErrorsForFaq(newQuestion, newAnswer);

  if (!request.session.isLoggedIn) {
    faqErrors.push("You have to login to edit FAQs");
  }

  if (faqErrors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        //display error message
      } else {
        response.redirect("/faqs/");
      }
    });
  } else {
    const model = {
      faqErrors,
      newQuestion,
      newAnswer,
      id,
    };
    response.render("update-faq.hbs", model);
  }
});

//FETCH FAQS

app.get("/faqs/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM faqs WHERE id = ?";

  const values = [id];

  db.get(query, values, function (error, faq) {
    if (error) {
      console.log(error);
      //display error message
    } else {
      const model = {
        faq,
      };
      response.render("faq.hbs", model);
    }
  });
});

/* -------------------------------------------------- */

app.listen(8080);
