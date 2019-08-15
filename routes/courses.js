const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { Course } = require('../models');
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

// ** CREATE COURSE ROUTE (listed in the format HTTP METHOD Route HTTP Status Code) **
// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get('/', asyncHandler(async(req, res, next) => {
    Course.findAll({
        order: [["id", "ASC"]],
        attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId']
    })
    .then(courses => {
        res.json({ courses });
    })
  }))

  // GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
  router.get('/:id', asyncHandler(async(req, res, next) => {
    Course.findOne({
      attributes: ['id', 'userId', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
      where: {
        id: req.params.id
      }
    }).then(course => {
      if(course) {
        res.json({ course })
      } else {
        res.status(404).json({ message: 'Route not found' });
      }
    })
  }))
  
  //POST Add new course POST/api/courses
  //INSERT INTO Courses (title, description, estimatedTime, materialsNeeded) VALUES(...)
  router.post('/', [
    check('title').exists().withMessage('Please provide a value for title'),
    check('description').exists().withMessage('Please provide a value for description')
  ], authenticateUser, asyncHandler(async(req, res, next)=> { 
    const user = req.currentUser.id;
    // Get the validation result from the Request object.
    const errors = validationResult(req);
  
     // If there are validation errors...
     if (!errors.isEmpty()) {
         // Use the Array `map()` method to get a list of error messages.
         const errorMessages = errors.array().map(error => error.msg);
  
          // Return the validation errors to the client.
         res.status(400).json({ errors: errorMessages });
     } else {
        // Create new course with request body
        await Course.create({ ...req.body, userId: user })
        .then((course) => {
            if (course) {
                res.status(201).location(`/api/courses/${course.id}`).end();
            } else {
                next();
            }
        })
     }
  }))
  
  // PUT /api/courses/:id 204 - Updates a course and returns no content
  router.put('/:id', [
    check('title').exists().withMessage('Please provide a value for title'),
    check('description').exists().withMessage('Please provide a value for description')
  ], authenticateUser, asyncHandler(async(req, res, next) => {
    const user = req.currentUser.id;
    // Get the validation result from the Request object.
    const errors = validationResult(req);
  
     // If there are validation errors...
     if (!errors.isEmpty()) {
         // Use the Array `map()` method to get a list of error messages.
         const errorMessages = errors.array().map(error => error.msg);
         // Return the validation errors to the client.
         res.status(400).json({ errors: errorMessages });
        } else {
            await Course.findOne({
              where: [{ id: req.params.id }]
            })
            .then((course) => { 
                // If user has the selected course update it
                if (course.userId === user) {
                    if (course) {
                        course.update(req.body);
                        res.status(204).end();
                    } else {
                      next();
                    }
                } else {
                  res.status(403).json({ message: "Current User doesn't own the requested course" }).end();
                } 
            })
        }
    }))
  
  //DELETE course DELETE/api/courses/id
  //DELETE FROM Courses WHERE id = (req.parms.id)
  router.delete('/:id', authenticateUser, asyncHandler(async (req, res, next)=> {
    const user = req.currentUser.id;
  
    await Course.findOne({ 
      where: [{ id: req.params.id }]
    })
    .then((course) => {
         // If user has the selected course delete it
            if (course.userId === user) {
              if (course) {
                course.destroy();
                res.status(204).end();
            } else {
              next(); 
            }
         } else {
          res.status(403).json({ message: "Current User doesn't own the requested course" }).end(); 
         }
      })    
  }))

  module.exports = router;