if (process.env.NODE_ENV!=='production') {
  require('dotenv').config();
}
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const User = require('./models/User');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//mongodb connection
mongoose.set('strictQuery', false);
const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().catch(err=>console.log(err));

var app = express();

// limit requests from one IP
const limiter = rateLimit({
  windowMs: 1*60*1000,
  max:40
});
app.use(limiter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//passport settings
passport.use(new LocalStrategy({usernameField: 'email'}, async(email, password, done) => {
  try {
    const user = await User.findOne({email: email});
    if (!user) {
      return done(null, false);
    }
    const pswMatch = await bcrypt.compare(password, user.password);
    if (!pswMatch) {
      return done(null, false);
    }
    return done(null, user);
  } catch(err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  }
})

app.use(session({secret: 'dogs', resave: false, saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//adding local variables to access them from anywhere
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
