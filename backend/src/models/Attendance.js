import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'absent', 'halfday'], default: 'present' },
  hoursWorked: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

// Unique per worker per site per day
attendanceSchema.index({ site: 1, date: 1, worker: 1 }, { unique: true });

// Auto-calc hoursWorked
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    this.hoursWorked = diff > 0 ? diff / (1000 * 60 * 60) : 0;
  }
  next();
});

attendanceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; }
});

export default mongoose.model('Attendance', attendanceSchema);
