import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  bookId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  author: String,
  cover: String,
}, { _id: false });

const columnSchema = new mongoose.Schema({
  id: {
    type: String,
    enum: ["to-read", "reading", "cited"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  cards: [cardSchema],
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  columns: [columnSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);

export default Workspace;
