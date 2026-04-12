import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please use a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // hide password by default
    },

    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
    },

    farmName: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔐 Optional (for future features like reset password)
    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },
    
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
      required: [true, 'You must accept the terms of service'],
    },
    termsAcceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


//  HASH PASSWORD BEFORE SAVE
userSchema.pre('save', async function () {
  try {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
  ;
  } catch (error) {
    next(error);
  }
});


//  COMPARE PASSWORD METHOD
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


//  REMOVE SENSITIVE DATA WHEN SENDING RESPONSE
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};


const User = mongoose.model('User', userSchema);

export default User;