const mongoose = require('mongoose');
const {DateTime} = require('luxon');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  title: String,
  text: String,
  timestamp: Date
})

MessageSchema.virtual('format_timestamp').get(function(){
  return DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_SHORT);
})

MessageSchema.virtual('url').get(function(){
  return `/messages/${this._id}`;
})

module.exports = mongoose.model('Message', MessageSchema);