import mongoose from "mongoose";

const shelfSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
    },
    status: {
        type: String,
        enum: ["TO_READ", "READING", "CITED"],
        default: "TO_READ",
    },
    position: {
        type: Number,
        required: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
},
    { timestamps: true }
)

export default mongoose.model("Shelf", shelfSchema);