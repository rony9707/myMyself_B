const mongoose = require('mongoose')

const scoreBoardSchema = new mongoose.Schema({
  firstName:{
    type:String,
    required:true
  },
  username:{
    type:String,
    unique:true,
    required:true
  },
  email:{
    type:String,
    unique:true,
    required:true
  },
  targetsHit:{
    type:Number,
    required:true
  },
  Timer:{
    type:Number,
    required:true
  },
  shotsTaken:{
    type:Number,
    required:true
  },
  Accuracy:{
    type:String,
    required:true
  },
  dteSubmit:{
    type:String,
    required:true
  }
})


module.exports = mongoose.model("ScoreBoard",scoreBoardSchema)