const express = require('express');
const { authenticateUser } = require('./middleware/auth-user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { User, Course } = require('./models');
const router = express.Router();
// Middleware to authenticate user for protected routes
router.use(authenticateUser);
// Reusable validation function
const validateInput = (fields) => {
  return async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};
// GET /api/users
router.get('/users', (req, res) => {
  const user = req.currentUser;
  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddress: user.emailAddress,
  });
});
// POST /api/users
router.post('/users', [
  validateInput(['firstName', 'lastName', 'emailAddress', 'password']),
], async (req, res) => {
  try {
    // Create user
    const user = await User.create(req.body);
    // Set Location header to "/"
    res.location('/').status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Email address must be unique' });
    } else {
      throw error;
    }
  }
});
// GET /api/courses
router.get('/courses', async (req, res) => {
  const courses = await Course.findAll({
    include: [{
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
    }],
  });
  res.json(courses);
});
// GET /api/courses/:id
router.get('/courses/:id', async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [{
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
    }],
  });
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});
// POST /api/courses
router.post('/courses', [
  validateInput(['title', 'description']),
], async (req, res) => {
  // Create course
  const course = await Course.create(req.body);
  // Set Location header to the URI for the newly created course
  res.location(`/api/courses/${course.id}`).status(201).end();
});
// PUT /api/courses/:id
router.put('/courses/:id', [
  validateInput(['title', 'description']),
], async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (course && course.userId === req.currentUser.id) {
    // Update course
    await course.update(req.body);
    res.status(204).end();
  } else {
    res.status(403).json({ message: 'Access denied. User does not own the course.' });
  }
});
// DELETE /api/courses/:id
router.delete('/courses/:id', async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (course && course.userId === req.currentUser.id) {
    // Delete course
    await course.destroy();
    res.status(204).end();
  } else {
    res.status(403).json({ message: 'Access denied. User does not own the course.' });
  }
});
module.exports = router;