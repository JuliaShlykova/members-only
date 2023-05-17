const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  title: String,
  text: String,
  timestamp: Date
})

module.exports = mongoose.model('Message', MessageSchema);