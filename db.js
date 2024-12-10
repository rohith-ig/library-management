const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.DB;

mongoose.connect(uri)
    .then(() => console.log("Connected to MongoDB...."))
    .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

const bookSchema = new mongoose.Schema({
    bid : {type: Number,required: true},
    title: { type: String, required: true },
    author: { type: String, required: true },
    published_year: { type: Number, required: true },
    genre: { type: String, required: true },
    available_copies: { type: Number, required: true }
},
{
    versionKey: false
});

const userSchema = new mongoose.Schema({
    uid : {type: Number,required: true},
    name : {type: String,required: true},
    email : {type: String,required: true},
    membership : {type: String,default:"Regular"},
    registered_date : {type: Date,default:Date.now},
    password : {type: String,required:true},
    role : {type: String,default:"user"}
},{
    versionKey : false
})

const Book = mongoose.model('Book',bookSchema);
const User = mongoose.model('User',userSchema);

module.exports = {mongoose,Book,User}; // Export the connection object
