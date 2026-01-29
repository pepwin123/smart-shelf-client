import mongoose from "mongoose"

const bookSchema = new mongoose.Schema(
    {
        openLibraryId: { type: String, unique: true},
        title: String,
        authors: [String],
        firstPublishYear: Number,
        coverId: Number,
        subjects: [String],
    },
    { timestamps: true }
);

const User = mongoose.model("Book", bookSchema);

export default User;