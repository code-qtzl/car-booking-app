const User = require('../model/user.model');

const findUserByEmail = (emailId) => {
	return User.findOne({ emailId });
};

const findUserById = (userId) => {
	return User.findById(userId);
};

const createUser = (userData) => {
	return User.create(userData);
};

module.exports = {
	findUserByEmail,
	findUserById,
	createUser,
};
