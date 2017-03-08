// Dependencies
var express = require("express");
var exphbs = require('express-handlebars');
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Using bluebird promises
var Promise = require("bluebird");

mongoose.Promise = Promise;

// Initialize PORT variable
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Use express-handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

// Make public a static directory
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/newsscraperdb");

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});

// Routes ====== Home route
app.get("/", function(req, res) {
    Article
        .find({
            saved: false
        }, function(error, doc) {
            if (error) {
                console.log(error);
            } else {
                var hbsObject = {
                    articles: doc
                };
                res.render('home', hbsObject);
            }
        });
});

// Saved Articles route
app.get("/saved", function(req, res) {
    Article
        .find({
            saved: true
        }, function(error, doc) {
            if (error) {
                console.log(error);
            } else {
                var hbsObject = {
                    articles: doc
                };
                res.render('article', hbsObject);
            }
        });
});

// A GET request to scrape the Star Wars news website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://http://www.androidcentral.com/", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        var count = 0;

        // Now, we grab every h2 within an article tag, and do the following:
        $("article section.cb-content").each(function(i, element) {

            // Save an empty result object
            var result = {};
            count++;

            // Add the text and href of every link, and save them as properties of the
            // result object
            result.title = $(this)
                .children("div.grid_title")
                .children("a")
                .attr("href");
            result.link = $(this)
                .children("div.grid_title")
                .children("a")
                .attr("href");
            result.body = $(this)
                .children("div.grid_summary")
                .children("p")
                .text();

            // Using our Article model, create a new entry This effectively passes the
            // result object to the entry (and the title and link)
            var entry = new Article(result);

            // Now, save that entry to the db
            entry.save(function(err, doc) {

                if (err) {
                    // Log any errors
                    console.log(err);
                } else {
                    // Log the doc
                    console.log(doc);
                }
            });
        });

        console.log("Count: " + count);
        res.json({ count: count });
    });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article
        .find({}, function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error // Or send the doc to the browser as a json object
                );
            } else {
                res.json(doc);
            }
        });
});

// Grab an article by it's ObjectId and populate with notes
app.get("/notes/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the
    // matching one in our db...
    Article.findOne({ "_id": req.params.id })
        // ..and populate all of the notes associated with it
        .populate("notes")
        // now, execute our query
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error // Otherwise, send the doc to the browser as a json object
                );
            } else {
                res.json(doc);
            }
        });
});

// Create a new note or replace an existing note
app.post("/saveNote/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var result = {};
    result.body = req.body.noteText;

    var newNote = new Note(result);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error // Otherwise
            );
        } else {
            // Use the article id to find and update it's note
            Article.findOneAndUpdate({
                    "_id": req.params.id
                }, {
                    $push: {
                        "notes": doc._id
                    }
                })
                // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    } else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});

app.post("/saveArticle/:id", function(req, res) {
    // Use the article id to find and update it's saved status
    Article.findOneAndUpdate({
            "_id": req.params.id
        }, { "saved": true })
        // Execute the above query
        .exec(function(err, doc) {
            // Log any errors
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
});

app.post("/deleteArticle/:id", function(req, res) {
    // Use the article id to find and update it's saved status
    Article.findOneAndUpdate({
            "_id": req.params.id
        }, { "saved": false })
        // Execute the above query
        .exec(function(err, doc) {
            // Log any errors
            if (err) {
                console.log(err);
            } else {
                res.redirect("/saved");
            }
        });
});

app.post("/deleteNote/:id", function(req, res) {
    var noteID = req.body.noteID;
    // Use the article id to find and update it's saved status
    Article.findOneAndUpdate({
            "_id": req.params.id
        }, {
            $pull: {
                "notes": noteID
            }
        })
        // Execute the above query
        .exec(function(err, doc) {
            // Log any errors
            if (err) {
                console.log(err);
            } else {
                Note.remove({ "_id": noteID })
                    // Execute the above query
                    .exec(function(err, doc) {
                        // Log any errors
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect("/saved");
                        }
                    });
            }
        });
});

// Listen on port 3000
app.listen(PORT, function() {
    console.log("App running on port %s.", PORT);
});