const mongoose = require('mongoose');

require("dotenv").config();

let MONGO_URL = process.env.MONGO_DB_URL;
mongoose.connect(MONGO_URL);

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String, 
    password: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
});

module.exports = mongoose.model('user', userSchema);