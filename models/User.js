const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: String,
  password: String,
  membership: {type: Boolean, default: false},
  admin: {type: Boolean, default: false}
})

module.exports = mongoose.model('User', UserSchema);