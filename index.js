const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const {mongo,Book,User} = require('./db.js');
const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }))
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) { 
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY);
    console.log(decoded); 
    req.currUser = decoded;  
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const rolechecker = (roles = []) => {
  return (req,res,next) => {
    if (!req.currUser) return res.status(401).json({ error: 'Unauthorized. No user context.' });
    if (roles.length && !roles.includes(req.currUser.role))  return res.status(403).json({ error: 'No permission' });
    next();
  }
}

//books
app.post('/books',authenticate,rolechecker(['admin','lib']), async (req, res) => {
    try {
      const {bid,title, author, published_year, genre, available_copies } = req.body;
      const find = await Book.findOne({bid:bid});
      if (find) return res.status(403).json({"Error":`Book with bid ${bid} already exists`});
      if (!(/^[0-9]+$/).test(bid)) {
        return res.status(400).json({"Error":"BID should be numeric"});
      }
      const newBook = new Book({
        bid,
        title,
        author,
        published_year,
        genre,
        available_copies
      });
      if (bid == undefined || !title || !author || !published_year || !available_copies || !genre) return res.status(422).send({"Error":"Data missing"});
      await newBook.save();
      res.status(201).json(newBook);
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Error adding book", error });
    }
  });
  

app.get('/books',authenticate,async (req,res)=>{
    try {
        const all = await Book.find({});
        if (!all.length) return res.status(404).send({"Error" : "Nothing to show"});
        res.status(200).json(all);
    }
    catch (error) {
        res.status(500).json({"Error":"Server error"});
        console.log(error)
    }
});


app.get('/books/:bid',authenticate,async (req,res)=>{
  try {
      let {bid} = req.params;
      if (!(/^[0-9]+$/).test(bid)) {
        return res.status(400).json({"Error":"BID should be numeric"});
      }
      bid = parseInt(bid)
      const all = await Book.findOne({bid:bid});
      if (!all) return res.status(404).send({"Error" : "Book not found"});
      res.status(200).json(all);
  }
  catch (error) {
      res.status(500).json({"Error":"Server error"});
      console.log(error)
  }
});


app.put('/books/:bid',authenticate,rolechecker(['lib','admin']),async(req,res)=>{
    try {
      let {bid} = req.params;
      const upData = req.body;
      if (bid == undefined || Object.keys(upData).length == 0) {
        return res.status(400).json({"Error":"Insufficient Data"});
      }
      if (!(/^[0-9]+$/).test(bid)) {
        return res.status(400).json({"Error":"BID should be numeric"});
      }
      bid = parseInt(bid)
      delete upData.bid;
      const rest = await Book.updateOne(
        {bid:bid},
        {$set:upData},
        {runValidators : true}
      );
      if (rest.modifiedCount == 0) {
        return res.status(404).json({ "error": "No book found with that ID or no changes made." });
      }
      return res.status(200).json({"Success":"Modified","Modified": await Book.findOne({bid:bid})});
    }
    catch(e) {
      res.status(500).json({"error":"server error"});
      console.log(e);
    }
})

app.delete('/books/:bid',authenticate,rolechecker(['lib','admin']),async (req,res) => {
  try {
    let {bid} = req.params;
    if (!(/^[0-9]+$/).test(bid)) {
      return res.status(400).json({"Error":"BID should be numeric"});
    }
    bid = parseInt(bid)
    const result = await Book.findOneAndDelete({bid:bid});
    if (!result) return res.status(400).json({"Error":"Book not found"});
    res.status(200).json({"success":`book with bid ${bid} deleted succesfully`})
  }
  catch(e) {
    console.log(e)
    res.status(500).json({"Error":"Server Error"});
  }
})

app.listen(process.env.PORT || 6960,()=>{console.log("listening")});

//user
app.post('/auth/users',async(req,res) => {
  try {
    let {uid,name,email,password,role,registered_date,membership} = req.body;
    if (!uid || !name || !email || !password) return res.status(400).json({"Error":"Insufficient Details"});
    if (role == "admin") return res.status(401).json({"Error":"Contact admins for admin privileges"});
    if (!(/^[0-9]+$/).test(uid)) {
      return res.status(400).json({"Error":"UID should be numeric"});
    }
    const fetch = await User.findOne({uid:uid});
    if (fetch) return res.status(400).json({"error":`Account already Exists with UID ${uid}`});
    const hashedPassword = await bcrypt.hash(password, 10);
    password =  hashedPassword;
    const upData = new User({
      uid,
      name,
      email,
      password,
      role,
      membership
    })
    await upData.save();
    res.status(200).json({"Success":"Added user",uid,name,email,role,membership});
  }
  catch(e) {
    res.status(500).json({"Error":"Server Error"});
    console.log(e)
  }
})


app.get('/auth/users',authenticate,rolechecker(['admin']),async(req,res) => {
  const rest = await User.find({},'-password');
  if (rest.length == 0) {
    return res.status(400).json({"Error":"Nothing to display"});
  }
  res.status(200).json(rest);
})

app.get('/auth/users/:id',authenticate,rolechecker(['admin']),async(req,res) => {
  try {
    let {id} = req.params
    if (!(/^[0-9]+$/).test(id)) {
      return res.status(400).json({"Error":"UID should be numeric"});
    }
    id = parseInt(id)
    if (!(/^[0-9]+$/).test(id)) {
      return res.status(400).json({"Error":"UID should be numeric"});
    }
    const rest = await User.find({uid:id},'-password -_id');
    if (rest.length == 0) {
      return res.status(404).json({"Error":`No user found with UID ${id}`});
    }
    res.status(200).json(rest);
  }
  catch (e) {
    res.status(400).json({"Error":"Server Error"})
  }
})

app.put('/auth/users/:uid',authenticate,rolechecker(['admin']),async(req,res)=>{
  try {
    let {uid} = req.params;
    const upData = req.body;
    if (uid == undefined || Object.keys(upData).length == 0) {
      return res.status(400).json({"Error":"Insufficient Data"});
    }
    if (!(/^[0-9]+$/).test(uid)) {
      return res.status(400).json({"Error":"UID should be numeric"});
    }
    uid = parseInt(uid)
    delete upData.uid;
    if ("password" in upData) {
      const hashedPassword = await bcrypt.hash(upData["password"], 10); 
      upData["password"] = hashedPassword;
    }
    const rest = await User.updateOne(
      {uid:uid},
      {$set:upData},
      {runValidators : true}
    );
    if (rest.modifiedCount == 0) {
      return res.status(404).json({ "error": "No user found with that ID or no changes made." });
    }
    return res.status(200).json({"Success":"Modified","Modified": await User.findOne({uid:uid},"-password -_id")});
  }
  catch(e) {
    res.status(500).json({"error":"server error"});
    console.log(e);
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { uid, password } = req.body;
    
    if (!uid || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ uid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } 

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { uid: user.uid, role: user.role }, 
      process.env.KEY,  
      { expiresIn: '30m' }  
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/auth/users/:uid',authenticate,rolechecker(['admin']),async (req,res) => {
    try {
      let {uid} = req.params;
      if (!(/^[0-9]+$/).test(uid)) {
        return res.status(400).json({"Error":"UID should be numeric"});
      }
      uid = parseInt(uid);
      const result = await User.findOneAndDelete({uid:uid});
      if (!result) return res.status(404).json({"error":"no user found"});
      return res.status(200).json({"Success":"Deleted Succesfully"});
    }
    catch (e) {
      console.log(e);
      res.status(500).json({"Error":"server error"});
    }
});

