var express = require('express');
var router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const Message = require('../models/Message');
const {name_format} = require('../helper');

const checkLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

const checkNotLoggedIn = (req, res, next) => {
  if(!req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

const checkAdmin = (req, res, next) => {
  if(!req.user.admin) {
    return res.redirec('/');
  }
  next();
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  try{
    const messages = await Message.find({}).populate('user', 'first_name last_name').sort({timestamp: 1});
    res.render('index', {title: 'Members Only', messages});
  } catch(err) {
    return next(err);
  }
});

router.get('/sign-up', checkLoggedIn, function(req, res, next) {
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
        first_name: name_format(req.body.first_name),
        last_name: name_format(req.body.last_name),
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

router.get('/log-in', checkLoggedIn, function(req, res, next) {
  const errors = req.session.messages?[{msg: req.session.messages[req.session.messages.length-1]}]:undefined;
  res.render('logIn', {title: 'Log In', errors});
})

router.post('/log-in',   passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/log-in",
  failureMessage: true
}))

router.get('/log-out', function(req, res, next) {
  req.logout(function(err){
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})

router.get('/join-club', checkNotLoggedIn, function(req, res, next) {
  res.render('joinClub', {title: "Join Club"});
})

router.post('/join-club', async function(req, res, next) {
  if(req.body.secret_code.toLowerCase()==='pseudocode') {
    try{
      await User.findByIdAndUpdate(req.user.id, {membership: true});
      return res.redirect('/');
    } catch(err) {
      return next(err);
    }
  }
  return res.render('joinClub', {title: "Join Club", wrongWord: req.body.secret_code});;
})

router.get('/new-post', checkNotLoggedIn, function(req, res, next) {
  return res.render('newPost', {title: 'New Post'});
})

router.post('/new-post', 
  body('msg_title')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('title must be specified')
    .isLength({max: 40})
    .withMessage('title mustn\'t exceed 40 characters'),
  body('msg_text')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('message must be specified')
    .isLength({max: 1000})
    .withMessage('message mustn\'t exceed 1000 characters'),
  async function(req, res, next) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.render('newPost', {
        title: 'New Post',
        message: {
          title: req.body.msg_title,
          text: req.body.msg_text
        },
        errors: errors.array()
      })
    }
    if(!req.user) {
      return res.redirect('/log-in');
    }
    const message = new Message({
      user: req.user._id,
      title: req.body.msg_title,
      text: req.body.msg_text,
      timestamp: Date.now()
    })
    try {
      await message.save();
      res.redirect('/');
    } catch(err) {
      return next(err);
    }
  }
)

router.get('/become-admin', checkNotLoggedIn, function(req, res, next) {
  return res.render('becomeAdmin', {title: 'Become Admin'});
})

router.post('/become-admin', checkNotLoggedIn, async function(req, res, next) {
  if(req.body.secret_code.toLowerCase()==='eleven'||req.body.secret_code==11) {
    try{
      await User.findByIdAndUpdate(req.user.id, {admin: true});
      return res.redirect('/');
    } catch(err) {
      return next(err);
    }
  }
  return res.render('becomeAdmin', {title: 'Become Admin', wrongWord: req.body.secret_code});;
})

router.get('/messages/:id/delete', checkNotLoggedIn, checkAdmin, function(req, res, next) {
  return res.render('messageDelete', {title: 'Delete message', message: {id: req.params.id}});
})

router.post('/messages/:id/delete', checkNotLoggedIn, checkAdmin, async function(req, res, next) {
  try {
    await Message.findByIdAndRemove(req.body.messageid);
    return res.redirect('/');
  } catch(err) {
    return next(err);
  }
})

module.exports = router;