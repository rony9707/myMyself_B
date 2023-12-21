const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  firstName:{
    type:String,
    required:true
  },
  lastName:{
    type:String,
    required:true
  },
  username:{
    type:String,
    unique:true,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  email:{
    type:String,
    unique:true,
    required:true
  },
  phoneNumber:{
    type: String,  
    required:true
  },
  gender:{
    type:String,
    required:true
  },
  dob:{
    type:Date,
    required:true
  },
  age:{
    type:Number,
    required:true
  },
  dtecre:{
    type:String,
    required:true
  },
  dtemod:{
    type:String,
    required:true
  },
  dteLastLogin:{
    type:String,
    required:true
  },
  profilePic:{
    type:String,
    required:true
  },
  userGroup:{
    type:String,
    required:false
  }
})


module.exports = mongoose.model("User",userSchema)