const { resp } = require('../func');
const User = require('../models/User.model');

// -------------------------------------------------------------------------- //

exports.fetchUserProfile = async (req, res) => {
  return resp(res, 200, 'Fetched Profile Successfully', {
    profile: await User.findById(req.user._id)
  });
};

// -------------------------------------------------------------------------- //

exports.updateUserProfile = async (req, res) => {
  const { name } = req.body || {};
  if (!name) return resp(res, 400, 'Missing or invalid fields (name)');

  const user = await User.findByIdAndUpdate(req.user._id,
    { name }, { returnDocument: 'after' }
  );

  return resp(res, 200, 'Updated Profile Successfully', { profile: user });
};