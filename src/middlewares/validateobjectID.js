import mongoose from 'mongoose';

export const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName}`,
    });
  }

  next();
};