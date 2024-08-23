const mongoose = require('mongoose')
mongoose.connect(`mongodb+srv://uhope1645:67362@notes-app.quk73rc.mongodb.net/?retryWrites=true&w=majority&appName=Notes-App`)


const userSchema = mongoose.Schema({
    username : String,

    name : String,

    email : String,

    age : Number,

    password : String,

    posts : [{type : mongoose.Schema.Types.ObjectId, ref : 'post'}]
    
})

module.exports = mongoose.model('user', userSchema)
