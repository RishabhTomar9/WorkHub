import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  workerId: {
    type: String,
    required: true,
    unique: true // ensures uniqueness
  },
  name: { type: String, required: true },
  role: { type: String, default: 'Worker' },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'absent' },
  wageRate: { type: Number, default: 0 },
  wageType: { type: String, enum: ['hour', 'day', 'month'], default: 'day' },
  phone: { type: String, default: ''},
  address: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Worker', workerSchema);
