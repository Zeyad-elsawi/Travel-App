var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var { MongoClient } = require('mongodb');

var app = express();

// MongoDB configuration (as required by the project description)
var mongoUrl = 'mongodb://127.0.0.1:27017';
var dbName = 'myDB';
var collectionName = 'myCollection';

// Connect once on startup and store the collection on app.locals
MongoClient.connect(mongoUrl)
  .then(function (client) {
    var db = client.db(dbName);
    var collection = db.collection(collectionName);
    app.locals.usersCollection = collection;
    console.log('Connected to MongoDB:', dbName, '/', collectionName);
  })
  .catch(function (err) {
    console.error('Failed to connect to MongoDB', err);
  });

// Destination metadata used for search and want-to-go list
var DESTINATIONS = {
  inca: { name: 'Inca Trail to Machu Picchu', path: '/inca' },
  annapurna: { name: 'Annapurna Circuit', path: '/annapurna' },
  paris: { name: 'Paris', path: '/paris' },
  rome: { name: 'Rome', path: '/rome' },
  bali: { name: 'Bali Island', path: '/bali' },
  santorini: { name: 'Santorini Island', path: '/santorini' }
};

var ALL_DESTINATIONS_ARRAY = Object.keys(DESTINATIONS).map(function (key) {
  return Object.assign({ key: key }, DESTINATIONS[key]);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// sessions (required for handling multiple users)
app.use(
  session({
    secret: 'very-secret-key',
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// Helper middleware to expose the logged-in user to the views
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Authentication guard: allow only login/registration/logout without session
var publicPaths = ['/', '/login', '/registration', '/register', '/logout'];
app.use(function (req, res, next) {
  if (publicPaths.indexOf(req.path) !== -1) {
    return next();
  }
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
});

// GET / -> redirect depending on login status
app.get('/', function (req, res) {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.redirect('/login');
});

// LOGIN
app.get('/login', function (req, res) {
  var success = req.session.registerSuccess || null;
  req.session.registerSuccess = null;
  res.render('login', {
    error: null,
    success: success
  });
});

app.post('/login', function (req, res, next) {
  var username = (req.body.username || '').trim();
  var password = (req.body.password || '').trim();

  var collection = req.app.locals.usersCollection;
  if (!collection) {
    return next(createError(500, 'Database is not ready yet.'));
  }

  if (!username || !password) {
    return res.status(400).render('login', {
      error: 'Invalid username or password.',
      success: null
    });
  }

  collection
    .findOne({ username: username })
    .then(function (user) {
      if (!user || user.password !== password) {
        return res.status(401).render('login', {
          error: 'Invalid username or password.',
          success: null
        });
      }
      req.session.user = { username: username };
      res.redirect('/home');
    })
    .catch(function (err) {
      next(err);
    });
});

// REGISTRATION
app.get('/registration', function (req, res) {
  res.render('registration', {
    error: null
  });
});

app.post('/register', function (req, res, next) {
  var username = (req.body.username || '').trim();
  var password = (req.body.password || '').trim();

  var collection = req.app.locals.usersCollection;
  if (!collection) {
    return next(createError(500, 'Database is not ready yet.'));
  }

  if (!username || !password) {
    return res.status(400).render('registration', {
      error: 'Username already exists or fields are empty.'
    });
  }

  collection
    .findOne({ username: username })
    .then(function (existing) {
      if (existing) {
        return res.status(400).render('registration', {
          error: 'Username already exists or fields are empty.'
        });
      }
      return collection.insertOne({
        username: username,
        password: password,
        wantToGo: []
      });
    })
    .then(function (result) {
      if (!result) {
        // already handled (duplicate username)
        return;
      }
      req.session.registerSuccess = 'Registration successful. Please log in.';
      res.redirect('/login');
    })
    .catch(function (err) {
      next(err);
    });
});

// HOME PAGE
app.get('/home', function (req, res) {
  res.render('home');
});

// CATEGORY PAGES
app.get('/hiking', function (req, res) {
  res.render('hiking');
});

app.get('/cities', function (req, res) {
  res.render('cities');
});

app.get('/islands', function (req, res) {
  res.render('islands');
});

// DESTINATION PAGES
app.get('/inca', function (req, res) {
  res.render('inca', {
    error: null,
    success: null
  });
});

app.get('/annapurna', function (req, res) {
  res.render('annapurna', {
    error: null,
    success: null
  });
});

app.get('/paris', function (req, res) {
  res.render('paris', {
    error: null,
    success: null
  });
});

app.get('/rome', function (req, res) {
  res.render('rome', {
    error: null,
    success: null
  });
});

app.get('/bali', function (req, res) {
  res.render('bali', {
    error: null,
    success: null
  });
});

app.get('/santorini', function (req, res) {
  res.render('santorini', {
    error: null,
    success: null
  });
});

// ADD TO WANT-TO-GO LIST
app.post('/add-to-wanttogo', function (req, res, next) {
  var destinationKey = req.body.destinationKey;
  var user = req.session.user;

  // Safety check - should not happen due to auth middleware, but just in case
  if (!user || !user.username) {
    return res.status(401).render('error', {
      message: 'You must be logged in to add destinations to your want-to-go list.',
      error: { status: 401 }
    });
  }

  if (!destinationKey || !DESTINATIONS[destinationKey]) {
    return res.status(400).render('error', {
      message: 'Invalid destination.',
      error: { status: 400 }
    });
  }

  var collection = req.app.locals.usersCollection;
  if (!collection) {
    return res.status(500).render('error', {
      message: 'Database is not ready yet. Please try again in a moment.',
      error: { status: 500 }
    });
  }

  collection
    .findOne({ username: user.username })
    .then(function (dbUser) {
      if (!dbUser) {
        return res.status(500).render('error', {
          message: 'User not found in database. Please log out and log back in.',
          error: { status: 500 }
        });
      }
      var list = dbUser.wantToGo || [];
      if (list.indexOf(destinationKey) !== -1) {
        // Return error message to display on the destination page
        var dest = DESTINATIONS[destinationKey];
        var viewName = destinationKey;
        return res.render(viewName, {
          error: 'Destination is already in your want-to-go list.',
          success: null
        });
      }
      list.push(destinationKey);
      return collection
        .updateOne(
          { username: user.username },
          { $set: { wantToGo: list } }
        )
        .then(function (updateResult) {
          if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
            throw new Error('Failed to update database.');
          }
          var dest = DESTINATIONS[destinationKey];
          var viewName = destinationKey;
          return res.render(viewName, {
            error: null,
            success: 'Destination added to your want-to-go list!'
          });
        });
    })
    .catch(function (err) {
      console.error('Error adding to want-to-go list:', err);
      var dest = DESTINATIONS[destinationKey];
      var viewName = destinationKey;
      return res.render(viewName, {
        error: 'An error occurred. Please try again.',
        success: null
      });
    });
});

// VIEW WANT-TO-GO LIST
app.get('/wanttogo', function (req, res, next) {
  var user = req.session.user;
  var collection = req.app.locals.usersCollection;
  if (!collection) {
    return next(createError(500, 'Database is not ready yet.'));
  }

  collection
    .findOne({ username: user.username })
    .then(function (dbUser) {
      var list = (dbUser && dbUser.wantToGo) || [];
      var destinations = list
        .map(function (key) {
          var dest = DESTINATIONS[key];
          if (dest) {
            return Object.assign({ key: key }, dest);
          }
          return null;
        })
        .filter(function (d) {
          return !!d;
        });

      res.render('wanttogo', {
        destinations: destinations
      });
    })
    .catch(function (err) {
      next(err);
    });
});

// REMOVE FROM WANT-TO-GO LIST
app.post('/remove-from-wanttogo', function (req, res, next) {
  var destinationKey = req.body.destinationKey;
  var user = req.session.user;

  if (!user || !user.username) {
    return res.status(401).redirect('/login');
  }

  if (!destinationKey || !DESTINATIONS[destinationKey]) {
    return res.status(400).redirect('/wanttogo');
  }

  var collection = req.app.locals.usersCollection;
  if (!collection) {
    return res.status(500).redirect('/wanttogo');
  }

  collection
    .findOne({ username: user.username })
    .then(function (dbUser) {
      if (!dbUser) {
        return res.status(500).redirect('/wanttogo');
      }
      var list = dbUser.wantToGo || [];
      var index = list.indexOf(destinationKey);
      if (index === -1) {
        // Already not in list, just redirect
        return res.redirect('/wanttogo');
      }
      list.splice(index, 1);
      return collection
        .updateOne(
          { username: user.username },
          { $set: { wantToGo: list } }
        )
        .then(function (updateResult) {
          res.redirect('/wanttogo');
        });
    })
    .catch(function (err) {
      console.error('Error removing from want-to-go list:', err);
      res.redirect('/wanttogo');
    });
});

// SEARCH
app.post('/search', function (req, res) {
  var searchKey = (req.body.Search || '').trim().toLowerCase();

  if (!searchKey) {
    return res.render('searchresults', {
      results: [],
      notFound: true
    });
  }

  var results = ALL_DESTINATIONS_ARRAY.filter(function (dest) {
    return dest.name.toLowerCase().indexOf(searchKey) !== -1;
  });

  if (!results.length) {
    return res.render('searchresults', {
      results: [],
      notFound: true
    });
  }

  res.render('searchresults', {
    results: results,
    notFound: false
  });
});

// LOGOUT - must be before 404 handler
app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

app.post('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
