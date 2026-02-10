import mongoose from "mongoose";

const researchNoteSchema = new mongoose.Schema({
  googleBooksVolumeId: {
    type: String,
    required: true,
    index: true,
    description: "Google Books volume ID associated with this note",
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: String,
  chapterId: String,
  pageNumber: Number,
  content: {
    type: String,
    required: true,
  },
  tags: [String],
  pinned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const ResearchNote =
  mongoose.models.ResearchNote ||
  mongoose.model("ResearchNote", researchNoteSchema);

export default ResearchNote;
