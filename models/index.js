const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite', // Update with your database path
});

const User = require('./user')(sequelize);
const Course = require('./course')(sequelize);

module.exports = {
  User,
  Course,
  sequelize,
};

middleware/auth-user.js:
// middleware/auth-user.js
const { User } = require('../models');

const authenticateUser = async (req, res, next) => {
  let message;
  const credentials = requireHeader(req);
  if (credentials) {
    const user = await User.findOne({
      where: {
        emailAddress: credentials.name,
      },
    });

    if (user) {
      const authenticated = await user.authenticate(credentials.pass);
      if (authenticated) {
        console.log(`Authentication successful for username: ${user.emailAddress}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
};

function requireHeader(req) {
  const authorization = req.headers.authorization;
  if (authorization) {
    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii').split(':');
    return {
      name: credentials[0],
      pass: credentials[1],
    };
  }
  return null;
}

module.exports = { authenticateUser };