import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dashboard: {
      workoutDone: {
        type: Number,
        default: 3,
        min: 0,
      },
      workoutGoal: {
        type: Number,
        default: 5,
        min: 1,
      },
      food: {
        calories: { type: Number, default: 1560, min: 0 },
        target: { type: Number, default: 2200, min: 0 },
        protein: { type: Number, default: 92, min: 0 },
        water: { type: Number, default: 5, min: 0 },
      },
      sleepHours: {
        type: Number,
        default: 7.2,
        min: 0,
      },
      heatmapData: {
        type: [Number],
        default: Array.from({ length: 28 }, (_, i) => (i * 37 + 13) % 5),
      },
      tasks: {
        type: [
          {
            label: { type: String, trim: true, required: true },
            done: { type: Boolean, default: false },
          },
        ],
        default: [
          { label: 'Morning stretch (15 min)', done: true },
          { label: '30 min cardio session', done: false },
          { label: 'Log meals for today', done: false },
        ],
      },
      completedDates: {
        type: [String],
        default: [],
      },
      steps: {
        type: Number,
        default: 6400,
        min: 0,
      },
      targetSteps: {
        type: Number,
        default: 10000,
        min: 1,
      },
      activeMinutes: {
        type: Number,
        default: 46,
        min: 0,
      },
      targetActiveMinutes: {
        type: Number,
        default: 60,
        min: 1,
      },
      weightKg: {
        type: Number,
        default: 72,
        min: 0,
      },
      heightCm: {
        type: Number,
        default: 173,
        min: 0,
      },
      restingHeartRate: {
        type: Number,
        default: 62,
        min: 0,
      },
      mood: {
        type: String,
        default: 'Focused',
        trim: true,
      },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
