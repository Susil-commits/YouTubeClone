import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  bannerUrl: { type: String },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creatorName: { type: String, default: "" },
  creatorLogo: { type: String, default: "" },
  description: { type: String, default: "" },
  timestamps: [{ time: String, label: String }],
  category: { type: String, enum: ["music", "gaming", "comedy", "movies", "tech", "travel", "other"], default: "other" },
  settings: {
    isMuted: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    adminMuteOverride: { type: Boolean, default: false },
    visibility: { type: String, enum: ["public", "private", "unlisted"], default: "public" }
  },
  stats: { views: { type: Number, default: 0 } },
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.model("Video", videoSchema);
export default Video;
