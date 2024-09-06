const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', function(req, res){
    res.render('index');
});
app.get('/login', function(req, res){
    res.render('login');
});
app.get('/post', isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email: req.user.email}).populate('posts'); // we need to populate the posts because we have the id's of the posts
    // console.log(user);
    res.render('post', {user});
});
app.get('/edit/:id', isLoggedIn, async function(req, res){
    let post = await postModel.findOne({_id: req.params.id});
    // console.log(post);
    res.render('edit', {post});
});
app.post('/update/:id', isLoggedIn, async function(req, res){
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect('/post');
});

app.post('/post', isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);  // we need to update the post id in the user also so that the user can see the post
    await user.save();
    res.redirect('/post');
});
app.get('/profile', isLoggedIn, async function(req, res){
    // console.log(req.user);
    let user = await userModel.findOne({email: req.user.email});
    res.render('profile', {name: user.name, username: user.username, email: user.email, age: user.age});
});

app.get('/logout', function(req, res){
    res.cookie('token', '');
    res.redirect('/login');
});

app.post('/register', async function(req, res){
    let {name, username, email, password, age} = req.body;

    let user = await userModel.findOne({email});
    if(user) return res.status(400).send('User already exists');

    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(password, salt, async function(arr, hash){
            let user = await userModel.create({
                name,
                username,
                email,
                age,
                password: hash
            });

            let token = jwt.sign({email: email, userid: user._id}, 'yoyoyo');
            res.cookie('token', token);
            res.redirect('/login');
            // res.send('User registered successfully');
        });
    })
});

app.post('/login', async function(req, res){
    let {email, password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(400).send('Wrong Email or password');

    bcrypt.compare(password, user.password, function(err, result){
        let token = jwt.sign({email: email, userid: user._id}, 'yoyoyo');
        res.cookie('token', token);
        if(result){
            res.redirect('/profile');
            // res.status(200).send('User logged in successfully');
        } else res.redirect('/login');
    });
});

function isLoggedIn(req, res, next){
    if(req.cookies.token === '') res.send('You are not logged in');
    else{
        let data = jwt.verify(req.cookies.token, 'yoyoyo');
        req.user = data;
    }
    next();
}

app.listen(3000);