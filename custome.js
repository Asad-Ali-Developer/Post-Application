
app.get('/login', (req, res) => {
    res.render('login')
});

app.get('/profile', isLoggedIn, async (req, res) => {

    // req.user is coming from the current logged in user from "isLoggedIn" function "Okehhhh!". It tells about which specific user is logged in by searching through the email address of user.

    let user  = await userModel.findOne({email : req.user.email}).populate("posts");

    // user.populates("posts") - It shows and populates the posts and data of the user.

    // console.log(user);

    // res.send('You have been logged in');
    
    // It sends the user details to the "profile" page. by using {user}

    res.render('profile', {user})


    // If we wanna see the details of logged in user, we can see through this ...
    
    // let userDetails = req.user.
    // console.log(userDetails);
    // console.log(req.userDetails);/
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

    let post  = await postModel.findOneAndUpdate({_id: req.params.id}, {content : req.body.content})


    // res.render("edit", {post})
    res.redirect('/profile')

});

app.post('/post', isLoggedIn, async (req, res) => {
    
    // It searches on the basis of email of user which coming from is "isLoggedIn" feature   
    let user = await userModel.findOne({email : req.user.email});
    // It shows all the posts 
    
    // We do destructuring here because it pulls out the content from webpage and stores it for us...
    let {content} = req.body

    let post = await postModel.create({
        user : user._id,
        content
    })
    
    console.log(req.user);

    user.posts.push(post._id)

    // We write ⬇️ this because we are manually saving it ...
    await user.save();

    res.redirect('/profile')
});

app.post('/register', async (req, res) => {
    // res.render('index')

    // If we have to register the user and if we have to get that from input section we have destructure that things.
    let { username, name, email, age, password } = req.body

    let user = await userModel.findOne({ email })

    if (user) {
        return res.status(500).send("User already registered!")
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = await userModel.create({
                username,
                name,
                email,
                age,
                password: hash,
            })

            
            let token = jwt.sign({ email: email, userId: user._id }, "secret")
            res.cookie("token", token)
            // res.send("Registered!")
            res.redirect("/login")
        })  
    })
})


// FONT : Consolas, 'Courier New', monospace 		OR      LUCIDA CONSOLE


app.post('/login', async (req, res) => {
    let {email, password, id} = req.body
    

    // Search on the basis of the email
    let User = await userModel.findOne({email})
    
    if(!User) return res.status(500).send("Something went wrong!")

    // bcrypt.compare('from webpage', 'form database')
    // Here, best practice is to write the req.body.password except writing "password" only ... 

    bcrypt.compare(password, User.password, (err, result) => {
        console.log(result);

        if(result){
            
            // Both are OK!
            let token = jwt.sign({email : email, password : password, userid: User._id}, "secret")
            res.cookie("token", token)
            res.status(200).redirect("/profile")
            
            // res.send("Login successfull!")
        }

        else{
            // res.send("Wrong Credentials!")   
            res.redirect('/login')
        }
    })

})

app.get('/logout', (req, res) => {
    // res.clearCookie()
    res.cookie("token", "")   //We can write this also
    // res.send("You are logged out!") 
    res.redirect('/login')   
})


// This is used for protected Routes... Like(profile etc and more). So, that's how we creates this middleware.


function isLoggedIn(req, res, next) {
    // console.log(req.cookies);
    // if(req.cookies.token === "") {
    //     res.redirect("/login");

    // We can do it like this.
    token = req.cookies.token;
    if(!token) {
        res.redirect('/login');
    
    } else {
        let data = jwt.verify(req.cookies.token, "secret")

        // It requests the logged in user details from 'data' and token ...
        req.user = data
        // if the user is logged in then it runs "next()" method
        next();	
    }

}


app.listen(3000);

