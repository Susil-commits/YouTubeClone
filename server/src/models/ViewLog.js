import mongoose from "mongoose";

const viewLogSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", index: true, required: true },
  userId: { type: String, index: true, required: true },
  createdAt: { type: Date, default: Date.now }
});

viewLogSchema.index({ videoId: 1, userId: 1 }, { unique: true });

const ViewLog = mongoose.model("ViewLog", viewLogSchema);
export default ViewLog;
