const express = require('express');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require("crypto");

const app = express();
const port = 3000;
const secretKey = crypto.randomBytes(64).toString('hex');


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Mock user data
const users = [
    {"username":"tuthogi","password":"3214"},
    {"username":"ricky","password":"1234"}
];

// Sign-up route
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if the user already exists
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  // Generate OTP and set expiration time
  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
  const otpExpiration = Date.now() + 5 * 60 * 1000; // Set initial expiration time to 5 minutes (adjust as needed)

  // Save user data, OTP, and expiration time
  users.push({ username, password, otp, otpExpiration });

  return res.status(200).json({ message: 'Sign up successful. OTP generated.' });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password, otp } = req.body;

  // Find the user by username
  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if the password is correct
  if (user.password !== password) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Check if the OTP has expired
  if (Date.now() > user.otpExpiration) {
    return res.status(401).json({ message: 'OTP has expired' });
  }

  // Check if the OTP is correct
  if (user.otp !== otp) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  // Renew OTP and update expiration time
  const renewedOtp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
  const renewedOtpExpiration = Date.now() + 1 * 60 * 1000; // Set renewed expiration time to 5 minutes (adjust as needed)
  user.otp = renewedOtp;
  user.otpExpiration = renewedOtpExpiration;

  // Generate JWT token
  const token = jwt.sign({ username }, secretKey, { expiresIn: '15min' });

  // Set JWT token as HTTP-only cookie
  res.cookie('token', token, { httpOnly: true });

  return res.status(200).json({ message: 'Login successful. OTP verified, renewed, and token sent.' });
});

//getting user route 
app.get("/api/users",(req,res)=>{
    res.send(users)
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
