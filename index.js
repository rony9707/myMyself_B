const express = require('express')

const mongoose = require('mongoose')

const cors = require('cors')

const cookieParser = require('cookie-parser')

const app=express()

const routes = require('./routes/routes')


require('dotenv').config()




connectionString = process.env.DBConnectionString
frontEndConnectionString = process.env.frontEndConnectionString
PORT = process.env.PORT


//Date Variables
const options = {
  timeZone: 'Asia/Kolkata',
  timeZoneName: 'short',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
};

function getCurrentFormattedDate() {
  const formatter = new Intl.DateTimeFormat('en-US', options);
  return formatter.format(new Date());
}



//Database String----------------
//For running locally
// const db= "mongodb://localhost:27017/testbackend1"

//For running in web
// const db= "mongodb+srv://rony9707:Iloveanimax.@jwt.tyaquof.mongodb.net/jwt?retryWrites=true&w=majority"

app.get('/',(req,res)=>{
  const formattedDate = getCurrentFormattedDate();
  res.send(`Server is running... Date is: ${formattedDate}`);
})



//Connect to angular
app.use(cors({
  credentials: true,
  origin:[frontEndConnectionString]
}))


app.use(cookieParser())

app.use(express.json())

app.use("/api",routes)



//Connection Code
mongoose.connect(connectionString, {
  useNewUrlParser: true
})
  .then(() => {
    console.log("Connected to database")

    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  })