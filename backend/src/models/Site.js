import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  notes: String,
  createdBy: { type: String, required: true }, // Firebase UID
  deleted: { type: Boolean, default: false },  // soft delete
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Site', siteSchema);
