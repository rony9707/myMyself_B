const { Router } = require('express')

const router = Router()

const bcrypt = require('bcryptjs')

const jwt = require('jsonwebtoken')

const User = require('../models/user')

require('dotenv').config()

const nodemailer = require('nodemailer')

const fs = require('fs');



myEmail = process.env.email
myPassword = process.env.password
frontEndConnectionString = process.env.frontEndConnectionString
jwt_key = process.env.jwt

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

const formatter = new Intl.DateTimeFormat('en-US', options);
const formattedDate = formatter.format(new Date());

// // Define the storage for uploaded files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Specify the directory where the uploaded images will be stored
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

// router.use(fileUpload({
//   useTempFiles: false,
//   tempFileDIR: 'uploads/'
// }))

// const path = require('path')

//Register Route--------------------------------
router.post('/register', async (req, res) => {
  try {
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let userName = req.body.username
    let password = req.body.password
    let email = req.body.email
    let phoneNumber = req.body.phoneNumber
    let gender = req.body.gender
    let dob = req.body.dob
    let age = req.body.age
    let dtecre = formattedDate
    let dteLastLogin = formattedDate
    let dtemod = formattedDate
    let image = req.body.image
    let userGroup = 'user'


    //mail config
    let config = {
      service: 'gmail',
      auth: {
        user: myEmail,
        pass: myPassword
      }
    }

    let transporter = nodemailer.createTransport(config)


    //Hashed Password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //Email Already Exist Code
    const email_already_present = await User.findOne({
      email: email
    })

    //Username Already Exist Code
    const username_already_present = await User.findOne({
      username: userName
    })

    //Phone Number Already Exist Code
    const phonenumber_already_present = await User.findOne({
      phoneNumber: phoneNumber
    })

    //Email Already Exist Code
    if (email_already_present) {
      return res.status(400).send({
        message: "Your Email is already registered"
      })
    }

    //Username Already Exist Code
    else if (username_already_present) {
      return res.status(400).send({
        message: "Your Username is already registered"
      })
    }

    //Phone Number Alreadt Exist Code
    else if (phonenumber_already_present) {
      return res.status(400).send({
        message: "Your Phone Number is already registered"
      })
    }

    else
    //If success, then insert data
    {
      //Upload File
      // let fileName = req.body.username + '-' + req.files.image.name;
      // let newPath = path.join(process.cwd(), 'uploads', fileName)
      // req.files.image.mv(newPath)

      const user = new User({
        firstName: firstName,
        lastName: lastName,
        username: userName,
        password: hashedPassword,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        dob: dob,
        age: age,
        dtecre: dtecre,
        dteLastLogin: dteLastLogin,
        dtemod: dtemod,
        profilePic: image,
        userGroup: userGroup
      })

      let date = user.dtecre;

      //Email Format Config
      const mailOPtions = {
        from: myEmail,
        to: user.email,
        subject: 'Welcome to Rony Inc',
        text:
          `Welcome ${user.firstName}.
Enjoy your stay here.
Your account was registered on ${date}.
    

Thanks,
Rony Inc`
      }

      //Sending the email
      transporter.sendMail(mailOPtions, (err, info) => {
        if (err) {

        }
        else {
          // console.log(info)
        }
      })

      //Saves the data in the DB
      const result = await user.save()

      //JWT token
      const { _id } = await result.toJSON()
      const token = jwt.sign({ _id: _id }, jwt_key)



      //Creates a JWT token in the cookies
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "none", // Adjust as needed
        secure: true, // Required for 'None'
      })


      //Sending Response
      res.json({
        message: `User ${result.username} is Registered.`,
        token: token
      })
    }
  }
  catch (error) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
})


//Login Route--------------------------------
router.post("/login", async (req, res) => {
  try {
    //Username property of the req will have either username or password.
    //This below code checks that if the data present in username property is present in username or email field in db
    const user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.username }],
    });

    //If response is returns nothing, then the code for bcrypt compare code will give error as it cannot handle if user.password is NULL
    if (!user) {
      return res.status(400).send({
        message: "Invalid credentials"
      })
    }

    //Hashes the password in the request and compares it to the password in the db
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).send({
        message: "Invalid credentials"
      })
    }

    //JWT token
    const token = jwt.sign({ _id: user._id }, jwt_key)


    //Creates a JWT token in the cookies
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none", // Adjust as needed
      secure: true, // Required for 'None'
    })


    res.status(200).send({ token })
  }
  catch (error) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during login.' });
  }
})


//ForgotPassword Route--------------------------------
router.post("/forgotPassword", async (req, res) => {
  try {

    //Username property of the req will have either username or password.
    //This below code checks that if the data present in username property is present in username or email field in db
    const user = await User.findOne({
      email: req.body.email
    });

    //If response is returns nothing, then the code for bcrypt compare code will give error as it cannot handle if user.password is NULL
    if (!user) {
      return res.status(400).send({
        message: "Incorrect email"
      })
    }

    //User exist amd mpw create a One time link and valid for 15 min
    const secret = jwt_key + user.password
    const payload = {
      email: user.email,
      id: user.username
    }
    const token = jwt.sign(payload, secret, { expiresIn: '59m' })

    const link = `${frontEndConnectionString}/reset-password/${user.username}/${token}`

    //mail config
    let config = {
      service: 'gmail',
      auth: {
        user: myEmail,
        pass: myPassword
      }
    }

    let transporter = nodemailer.createTransport(config)

    //Email Format Config
    const mailOPtions = {
      from: myEmail,
      to: user.email,
      subject: 'Rony Inc Password Reset',
      text:
        `Hello ${user.firstName}.
Please click the link below to reset your password:
${link}

Please take notice that your link will expire in 15 minutes.


Thanks,
Rony Inc`
    }

    //Sending the email
    transporter.sendMail(mailOPtions, (err, info) => {
      if (err) {

      }
      else {
        // console.log(info)
      }
    })

    res.json({
      message: 'Password resent link has been sent to your email',
      token: token,
      username: user.username
    })
  }
  catch (error) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during generating your forgot password link.' });
  }
})


//Reset Password GET--------------------------------
router.get('/reset-password/:username/:token', async (req, res) => {
  const { username, token } = req.params;
  // Your password reset logic here...

  // Assuming the reset password logic is successful
  const response = {
    username: username,
    token: token,
    message: 'Password reset link received successfully.'
  };

  const user = await User.findOne({
    username: response.username
  });

  if (!user) {
    return res.status(400).send({
      message: "Invalid Email"
    })
  }

  if (response.username != user.username) {
    res.send('Invalid ID')
  }

  //We have a valud id and we have valid use with this id
  const secret = jwt_key + user.password

  try {
    jwt.verify(response.token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          res.send({
            message: err.name
          })
        } else {
          res.send({
            message: err.name
          })
        }
      } else {
      }
    });

    res.send({
      message: "Success",
      response
    })
  } catch (err) {
  }

})

//Reset Password PUT--------------------------------
router.put('/resetPassword', async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.body.username,
    });

    //Hashed Password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    // If response is returns nothing, then the code for bcrypt compare code will give error as it cannot handle if user.password is NULL
    // NOTE: Below if else code is only for Testing with POSTMAN. We don't need if else block here as in Angular, the check is already done
    if (!user) {
      return res.status(400).send({
        message: "Invalid credentials error which came for Password Update"
      })
    }
    else if ((await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).send({
        message: "Old password cannot be the new password"
      })
    }
    else {
      // Use the user's _id to identify the document to update
      const filter = { username: user.username };

      let data = await User.updateOne(
        //{}condition
        filter,
        {
          //set updated data
          $set: {
            password: hashedPassword,
            dtemod: formattedDate
          }
        }
      )

      //Sent Mail
      //mail config
      let config = {
        service: 'gmail',
        auth: {
          user: myEmail,
          pass: myPassword
        }
      }

      let transporter = nodemailer.createTransport(config)

      //Email Format Config
      const mailOPtions = {
        from: myEmail,
        to: user.email,
        subject: 'Rony Inc Password Reset Successfull',
        text:
          `Hello ${user.firstName}.
Your password has been succesfully reset.

Thanks,
Rony Inc`
      }

      //Sending the email
      transporter.sendMail(mailOPtions, (err, info) => {
        if (err) {
        }
        else {
          // console.log(info)
        }
      })

      res.status(200).send({
        message: "Password updated successfully"
      });
    }
  }
  catch (error) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during password reset.' });
  }

})


//User Route--------------------------------
router.get('/user', async (req, res) => {
  try {
    const cookie = req.cookies['jwt']
    const cookie_obj = {
      cookie_id: cookie
    }

    const claims = jwt.verify(cookie, jwt_key)

    if (!claims) {
      return res.status(401).send({
        message: "unauthenticated"
      })
    }

    const user = await User.findOne({ _id: claims._id })

    const { password, ...data } = await user.toJSON()
    // const imageBase64 = fs.readFileSync(data.profilePic, { encoding: 'base64' });

    data1 = Object.assign(data, cookie_obj);
    res.send(data1)
  }
  catch (err) {
    return res.status(401).send({
      message: "unauthenticated"
    })
  }
})


//Update Last Login Route--------------------------------
router.put('/lastLoginUpdate', async (req, res) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true, // Set this option to true for 12-hour format
    timeZone: 'Asia/Kolkata', // Set your desired time zone
  });
  
  const lastLogin = formatter.format(new Date());


  const user = await User.findOne({
    username: req.body.username,
  });
  //If response is returns nothing, then the code for bcrypt compare code will give error as it cannot handle if user.password is NULL
  //NOTE: Below if else code is only for Testing with POSTMAN. We don't need if else block here as in Angular, the check is already done
  // if (!user) {
  //   return res.status(400).send({
  //     message: "Invalid credentials error which came for last login update"
  //   })
  // }
  // else {

  // Use the user's _id to identify the document to update
  const filter = { username: user.username };


  let data = await User.updateOne(
    //{}condition
    filter,
    {
      //set updated data
      $set: { dteLastLogin: lastLogin }
    }
  )




  //NOTE: Below if else code is only for Testing with POSTMAN.
  res.status(200).send({
    message: "Updated successful",
    data
  });



})



//Logout Route--------------------------------
router.post('/logout', (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 })

    res.send({
      message: "success"
    })
  }
  catch (error) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during logout.' });
  }
})


//Sent Birthday EMail to users
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: myEmail,
    pass: myPassword,
  },
});

async function checkBirthday() {
  try {
    // Get the current date and time in IST
    const nowIST1 = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    // Parse the IST date string back into a Date object
    const nowISTDate1 = new Date(nowIST1);
    console.log("IST NOW is",nowISTDate1)


    const today = new Date();
    const currentMonth = nowISTDate1.getMonth() + 1; // Months are zero-based, so add 1 to get the current month
    const currentDay = nowISTDate1.getDate();
    console.log("NOT IST Today is",today);
    console.log("current IST Month is",currentMonth);
    console.log("current NOT IST Day is",today.getDate());
    console.log("current Day is",currentDay);

    const usersWithBirthdaysToday = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dob' }, currentMonth] },
          { $eq: [{ $dayOfMonth: '$dob' }, currentDay] },
        ],
      },
    }).select('dob email username');

    console.log(usersWithBirthdaysToday)


    if (usersWithBirthdaysToday.length > 0) {
      for (const user of usersWithBirthdaysToday) {
        await sendBirthdayEmail(user);
        await sendBirthdayNotificationToMe(user);
      }
    } else {
      await sendNoBirthdayNotification();
    }

    // Calculate the time until the next 12 AM
    // Set the timezone to IST (Indian Standard Time)
    const istOptions = { timeZone: 'Asia/Kolkata' };

    // Get the current date and time in IST
    const nowIST = new Date().toLocaleString('en-US', istOptions);

    // Parse the IST date string back into a Date object
    const nowISTDate = new Date(nowIST);

    // Calculate the time until the next midnight in IST
    const midnightIST = new Date(
      nowISTDate.getFullYear(),
      nowISTDate.getMonth(),
      nowISTDate.getDate() + 1,
      0, // 0 hours (midnight)
      0, // 0 minutes
      0, // 0 seconds
    );

    const timeUntilNextMidnightIST = midnightIST.getTime() - nowISTDate.getTime();

    //console.log(timeUntilNextMidnightIST);

    // Set a timeout to run the function again at the next 12 AM
    setTimeout(checkBirthday, timeUntilNextMidnightIST);
  } catch (error) {

    const mailOptionsToMe = {
      from: myEmail,
      to: myEmail,
      subject: 'Error during Birthday',
      text: `Hello,
There was a error for the check birthday function.
Error is : ${error}
Thanks,
Rony Inc`,
    };

    try {
      await transporter.sendMail(mailOptionsToMe);
    } catch (error) {
      console.error(error);
    }
  }
}

async function sendBirthdayEmail(user) {
  const age = calculateAge(user.dob);
  const mailOptionsUser = {
    from: myEmail,
    to: user.email,
    subject: 'Happy Birthday',
    text: `Happy Birthday! 🎉🎂 Wishing you a fantastic day filled with joy and celebration. May this year be filled with even more accomplishments and happiness. Congratulations on turning ${age} years old! 🥳🎈`,
  };

  try {
    await transporter.sendMail(mailOptionsUser);
  } catch (error) {
    console.error(error);
  }
}


function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const currentDate = new Date();

  let age = currentDate.getFullYear() - dob.getFullYear();

  // Check if the birthday has occurred this year
  if (
    currentDate.getMonth() < dob.getMonth() ||
    (currentDate.getMonth() === dob.getMonth() &&
      currentDate.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

async function sendBirthdayNotificationToMe(user) {
  const mailOptionsToMe = {
    from: myEmail,
    to: myEmail,
    subject: 'User Birthday Notification',
    text: `Hello,
Today is ${user.username}'s Birthday.

Thanks,
Rony Inc`,
  };

  try {
    await transporter.sendMail(mailOptionsToMe);
  } catch (error) {
    console.error(error);
  }
}

async function sendNoBirthdayNotification() {
  const mailOptionsToMe = {
    from: myEmail,
    to: myEmail,
    subject: `No free food today`,
    text: `Hello,
No one has a birthday today.

Thanks,
Rony Inc`,
  };

  try {
    await transporter.sendMail(mailOptionsToMe);
  } catch (error) {
    console.error(error);
  }
}

// Initial call to start checking at 12 AM today
checkBirthday();




module.exports = router