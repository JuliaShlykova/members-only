var express = require('express');
var router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const checkedLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'Members Only'});
});

router.get('/sign-up', checkedLoggedIn, function(req, res, next) {
  res.render('signUp', {title: 'Sign Up'});
})

router.post('/sign-up', 
  body('first_name')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('first name must be specified')
    .isLength({max: 40})
    .withMessage('first name mustn\'t exceed 40 characters'),
  body('last_name')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('last name must be specified')
    .isLength({max: 40})
    .withMessage('last name mustn\'t exceed 40 characters'),
  body('email')
    .trim()
    .isEmail()
    .isLength({min: 1})
    .escape()
    .withMessage('email must be specified')
    .isLength({max: 254})
    .withMessage('email mustn\'t exceed 254 characters'),  
  body('password')
    .trim()
    .isLength({min: 8})
    .escape()
    .withMessage('password must be at least 8 characters'),
  body('confirm_password')
    .trim()
    .escape()
    .custom((value, {req}) => {
      if (value!==req.body.password) {
        throw new Error('Passwords must be the same');
      }
      return true;
    }),
  async function(req, res, next){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const user = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        confirm_password: req.body.confirm_password
      }
      return res.render('signUp', {
        title: 'Sign Up',
        user,
        errors: errors.array()
      });
    }
    try {
      const userInDb = await User.findOne({email: req.body.email});
      if (userInDb) {
        return res.render('signUp',{
          title: 'Sign Up',
          user: {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            confirm_password: req.body.confirm_password
          }, 
          errors: [{msg: 'The email is already in the database'}]})
      }
      const hashedPsw = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: hashedPsw
      });
      await user.save();
      req.login(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/');
      });
    } catch(err) {
      return next(err);
    }
})

router.get('/log-in', checkedLoggedIn, function(req, res, next) {
  res.render('logIn', {title: 'Log In'});
})

router.post('/log-in',   passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/log-in"
}))

router.get('/log-out', function(req, res, next) {
  req.logout(function(err){
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})

router.get('/new-post', function(req, res, next) {

})

module.exports = router;