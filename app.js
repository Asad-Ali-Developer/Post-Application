const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');
const userModel = require('./models/usermodel')
const postModel = require('./models/postmodel')
const jwt = require("jsonwebtoken");


app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/login', (req, res) => {
    res.render('login')
})


app.get('/profile', isLoggedIn, async (req, res) => {


    let user = await userModel.findOne({email : req.user.email}).populate("posts");


    res.render('profile', {user})

});


app.get('/like/:id', isLoggedIn, async (req, res) => {

    let post  = await postModel.findOne({_id: req.params.id}).populate("user");
    
    // If there is no one user who likes that post we will get that user from telling index and "-1" means it no one will be in the likes array... and then will pushed a new one user.

    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);

    } else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    
    // res.render('profile', {user})

    res.redirect('/profile')

});

app.get('/edit/:id', isLoggedIn, async (req, res) => {

    let post  = await postModel.findOne({_id: req.params.id}).populate("user");


    res.render("edit", {post})
    // res.redirect('/profile')

});

app.post('/update/:id', isLoggedIn, async (req, res) => {

    await postModel.findOneAndUpdate({_id: req.params.id}, {content : req.body.content})


    // res.render("edit", {post})
    res.redirect('/profile')

});

app.post('/post', isLoggedIn, async (req, res) => {

    let user = await userModel.findOne({email : req.user.email});


    let {content} = req.body

    let post = await postModel.create({
        user : user._id,
        content
    })

    user.posts.push(post._id);

    await user.save();

    res.redirect('/profile')
})


app.post('/register', async (req, res) => {

    // Let's do destructuring
    let { username, name, email, age, password } = req.body

    let user = await userModel.findOne({ email })
    
    if (user) res.status(200).send("You are already registered")
        
    else {

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                

                const user = await userModel.create({
                    username,
                    name,
                    email,
                    age,
                    password : hash,
                })

                let token = jwt.sign({email: email, userid : user._id}, "secret")
                res.cookie("token", token)
                // res.send("You are registered!")
                res.redirect('/login')
            })
        })
    }
})


app.post('/login', async (req, res) => {
    
    // Let's destructuring from the login form or page.

    let {email, password} = req.body
    let user = await userModel.findOne({email})

    if(!user){
        res.status(404).send('You are not User')
    }

    // Here, we will compare on basis of email and password. 
    bcrypt.compare(password, user.password, (err, result) => {
        // console.log(result);

        if(result){
           let token =  jwt.sign({email : email, password : password, userid : user._id}, "secret")
           res.cookie("token", token)
        //    res.send('You are User')
        
        res.redirect('/profile')

        } else {
            // res.send('You are not User')
            res.redirect('/login')
        }
    })

})

app.get('/logout', (req, res) => {

    // Both ways are good !
    // res.clearCookie()
    res.cookie('token', "")
    
    res.redirect('/login')
})

function isLoggedIn(req, res, next){
    
    if(req.cookies.token === ""){
        res.redirect('/login')
    
    } else {

        let data = jwt.verify(req.cookies.token, "secret")
        req.user = data
        
        // If data matches the token then runs the middleware.
        next();
    }
}


app.listen(3000);

