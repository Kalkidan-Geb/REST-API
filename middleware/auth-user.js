const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const authUser = async (req, res, next) => {
  let message;
  const credentials = auth(req);

  // if credentials exist
  if (credentials) {
    // Get user from database
    const user = await User.findOne({
      where: {
        emailAddress: credentials.name,
      },
    });

    // If user exists in the database
    if (user) {
      const validPassword = bcrypt.compareSync(credentials.pass, user.password);

      // If entered password matches saved password
      if (validPassword) {
        req.currentUser = user;
      } else {
        message = 'Authentication failed';
      }
    } else {
      message = 'User not found';
    }
  } else {
    message = 'Authorization header not found';
  }

  if (message) {
    res.status(401).json({ message: 'Access Denied' });
    return;
  }
  next();
};

module.exports = authUser;