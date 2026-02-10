import Workspace from "../Models/workspaceModel.js";

// Create a new workspace
export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    const columns = [
      { id: "to-read", title: "To Read", cards: [] },
      { id: "reading", title: "Reading", cards: [] },
      { id: "cited", title: "Cited", cards: [] },
    ];

    const workspace = await Workspace.create({
      name,
      description,
      owner: userId,
      columns,
    });

    return res.status(201).json({
      success: true,
      workspace,
      message: "Workspace created successfully",
    });
  } catch (error) {
    console.error("CREATE WORKSPACE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create workspace",
      error: error.message,
    });
  }
};

// Get all workspaces for a user
export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;

    const workspaces = await Workspace.find({
      owner: userId,
    }).populate("owner", "email username");

    return res.status(200).json({
      success: true,
      workspaces,
    });
  } catch (error) {
    console.error("GET WORKSPACES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces",
      error: error.message,
    });
  }
};

// Get a single workspace
export const getWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id.toString();

    const workspace = await Workspace.findById(workspaceId)
      .populate("owner", "email username");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Check if user is owner
    const ownerId = workspace.owner._id.toString();
    
    if (ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this workspace",
      });
    }

    return res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("GET WORKSPACE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspace",
      error: error.message,
    });
  }
};

// Update card position (move between columns)
export const updateCardPosition = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { fromColumnId, toColumnId, fromIndex, toIndex } = req.body;

    // Validate inputs
    if (
      typeof fromIndex !== "number" ||
      typeof toIndex !== "number" ||
      !fromColumnId ||
      !toColumnId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request parameters",
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Find columns
    const fromColumn = workspace.columns.find((col) => col.id === fromColumnId);
    const toColumn = workspace.columns.find((col) => col.id === toColumnId);

    if (!fromColumn || !toColumn) {
      return res.status(400).json({
        success: false,
        message: "Invalid column IDs",
      });
    }

    // Get the card
    if (fromIndex < 0 || fromIndex >= fromColumn.cards.length) {
      return res.status(400).json({
        success: false,
        message: "Card not found at the specified index",
      });
    }

    const card = fromColumn.cards[fromIndex];

    if (!card) {
      return res.status(400).json({
        success: false,
        message: "Card not found",
      });
    }

    // Remove from source column
    fromColumn.cards.splice(fromIndex, 1);

    // Ensure toIndex is valid
    const insertIndex = Math.min(toIndex, toColumn.cards.length);

    // Add to target column
    toColumn.cards.splice(insertIndex, 0, card);

    workspace.updatedAt = new Date();
    await workspace.save();

    return res.status(200).json({
      success: true,
      workspace,
      message: "Card moved successfully",
    });
  } catch (error) {
    console.error("UPDATE CARD POSITION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update card position",
      error: error.message,
    });
  }
};

// Add a card to a column
export const addCard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { columnId, bookId, title, author, cover, previewLink, extractedContent } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const column = workspace.columns.find((col) => col.id === columnId);

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column not found",
      });
    }

    // If client passed a MongoDB _id as bookId (24 hex chars), try to resolve
    // it to the Book.googleBooksVolumeId so reader routes use the correct identifier.
    let bookIdToStore = bookId;
    try {
      if (typeof bookId === "string" && /^[0-9a-fA-F]{24}$/.test(bookId)) {
        // Lazy import Book model to avoid circular deps
        const Book = (await import("../Models/bookModel.js")).default;
        const found = await Book.findById(bookId).lean();
        if (found) {
          bookIdToStore = found.googleBooksVolumeId || found._id.toString();
        }
      }
    } catch (resolveErr) {
      console.warn("Could not resolve bookId to googleBooksVolumeId:", resolveErr.message || resolveErr);
      // fall back to original bookId
      bookIdToStore = bookId;
    }

    // Prevent adding duplicate book cards to the workspace (any column)
    const isAlreadyPresent = workspace.columns.some((col) =>
      col.cards.some((c) => String(c.bookId) === String(bookIdToStore))
    );

    if (isAlreadyPresent) {
      return res.status(200).json({
        success: true,
        message: "Book already added to workspace",
        workspace,
      });
    }

    const newCard = {
      id: `card-${Date.now()}`,
      bookId: bookIdToStore,
      title,
      author,
      cover,
      previewLink: previewLink || null,
      extractedContent: extractedContent || null,
    };

    column.cards.push(newCard);
    workspace.updatedAt = new Date();
    await workspace.save();

    return res.status(201).json({
      success: true,
      workspace,
      message: "Card added successfully",
    });
  } catch (error) {
    console.error("ADD CARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add card",
      error: error.message,
    });
  }
};

// Delete a card
export const deleteCard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { columnId, cardId } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const column = workspace.columns.find((col) => col.id === columnId);

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column not found",
      });
    }

    const cardIndex = column.cards.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Card not found",
      });
    }

    column.cards.splice(cardIndex, 1);
    workspace.updatedAt = new Date();
    await workspace.save();

    return res.status(200).json({
      success: true,
      workspace,
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete card",
      error: error.message,
    });
  }
};

// Delete workspace
export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id.toString();

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Only owner can delete
    if (workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only owner can delete workspace",
      });
    }

    await Workspace.findByIdAndDelete(workspaceId);

    return res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("DELETE WORKSPACE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete workspace",
      error: error.message,
    });
  }
};
