import ResearchNote from "../Models/researchNoteModel.js";

// Create a new research note
export const createNote = async (req, res) => {
  try {
    const { googleBooksVolumeId, workspaceId, chapterId, pageNumber, content, tags } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const note = await ResearchNote.create({
      googleBooksVolumeId,
      workspaceId,
      userId,
      username,
      chapterId,
      pageNumber,
      content,
      tags: tags || [],
    });

    if (req.io && workspaceId) {
      req.io.to(`workspace-${workspaceId}`).emit("note-created", {
        note,
        timestamp: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      note,
      message: "Note created successfully",
    });
  } catch (error) {
    console.error("CREATE NOTE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create note",
      error: error.message,
    });
  }
};

// Get notes for a specific book
export const getNotesByBook = async (req, res) => {
  try {
    let { googleBooksVolumeId } = req.params;
    // Decode in case it's URL encoded
    googleBooksVolumeId = decodeURIComponent(googleBooksVolumeId);
    
    console.log("Fetching notes for googleBooksVolumeId:", googleBooksVolumeId);

    const notes = await ResearchNote.find({ googleBooksVolumeId })
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("GET NOTES BY BOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
      error: error.message,
    });
  }
};

// Update a research note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags, chapterId, pageNumber, pinned } = req.body;
    const userId = req.user._id;

    const note = await ResearchNote.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if user is owner
    const isOwner = note.userId.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this note",
      });
    }

    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (chapterId) note.chapterId = chapterId;
    if (pageNumber) note.pageNumber = pageNumber;
    // Allow toggling pinned state
    if (typeof pinned === "boolean") note.pinned = pinned;

    note.updatedAt = new Date();
    await note.save();

    if (req.io && note.workspaceId) {
      req.io.to(`workspace-${note.workspaceId}`).emit("note-updated", {
        note,
        timestamp: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    console.error("UPDATE NOTE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
      error: error.message,
    });
  }
};

// Delete a research note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const note = await ResearchNote.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if user is owner
    const isOwner = note.userId.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this note",
      });
    }

    const workspaceId = note.workspaceId;

    await ResearchNote.findByIdAndDelete(id);

    if (req.io && workspaceId) {
      req.io.to(`workspace-${workspaceId}`).emit("note-deleted", {
        noteId: id,
        timestamp: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("DELETE NOTE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: error.message,
    });
  }
};
