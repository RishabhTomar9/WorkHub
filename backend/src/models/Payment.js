import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: String, required: true }, // YYYY-MM-DD format
  paymentType: { 
    type: String, 
    enum: ['wage', 'bonus', 'advance', 'other'], 
    default: 'wage' 
  },
  notes: String,
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
paymentSchema.index({ worker: 1, date: 1 });
paymentSchema.index({ site: 1, date: 1 });

paymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; }
});

export default mongoose.model('Payment', paymentSchema);
