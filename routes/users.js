const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const {  User } = require('../models');
const authenticateUser = require('./authentication');


// ADDED ASYNC HANDLER FUNCTION 
  function asyncHandler(cb) {
    return async (req, res, next) => {
        try {
            await cb(req, res, next);
        } catch(err) {
            next(err);
        }
    }
}

// ** CREATE USER ROUTE (listed in the format HTTP METHOD Route HTTP Status Code) **

// GET /api/users 200 - Returns the currently authenticated user
router.get('/', authenticateUser, asyncHandler(async(req, res, next) => {
    const user = await req.currentUser;
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
    });
    res.status(200);
    res.end();
}));

// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post('/', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for first name'),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for last name'),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for email address'),
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for password'),    
], asyncHandler(async (req, res, next) => {
// Attempt to get the validation result from the Request object.
  const errors = validationResult(req);
  
// If there are validation errors...
  if (!errors.isEmpty()) {
// Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);
  
// Return the validation errors to the client.
    res.status(400).json({ errors: errorMessages });
  } else {
// Get the user from the request body.
    const user = req.body;

// Hash the new user's password.
    user.password = bcryptjs.hashSync(user.password);

// Create new user
    await User.create(user)
      .then(user=> {
// Set location to '/' route
        res.location = '/';
// Set the status to 201 Created and end the response.
        res.status(201).end();
      })
    }
  })
)

module.exports = router;