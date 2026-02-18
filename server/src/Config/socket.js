export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-workspace", (workspaceId) => {
      socket.join(`workspace-${workspaceId}`);
      console.log(`User ${socket.id} joined workspace ${workspaceId}`);
    });

    socket.on("leave-workspace", (workspaceId) => {
      socket.leave(`workspace-${workspaceId}`);
      console.log(`User ${socket.id} left workspace ${workspaceId}`);
    });

    socket.on("card-moved", (data) => {
      const { workspaceId, workspace } = data;
      io.to(`workspace-${workspaceId}`).emit("workspace-updated", workspace);
    });

    socket.on("card-added", (data) => {
      const { workspaceId, workspace, book, userId, username, bookMetadata } = data || {};
      // Always emit updated workspace when available
      if (workspaceId && workspace) {
        io.to(`workspace-${workspaceId}`).emit("workspace-updated", workspace);
      }

      // Emit a book-added notification with enriched metadata
      const bookTitle = bookMetadata?.title || book?.title || (book?.name || null);
      const message = bookTitle
        ? `${username || 'Someone'} added "${bookTitle}" to the shelf`
        : `${username || 'Someone'} added a card to the shelf`;

      io.to(`workspace-${workspaceId}`).emit("book-added-real-time", {
        book: bookMetadata || book || null,
        userId: userId || null,
        username: username || null,
        timestamp: new Date(),
        message,
      });
    });

    socket.on("card-deleted", (data) => {
      const { workspaceId, workspace } = data;
      io.to(`workspace-${workspaceId}`).emit("workspace-updated", workspace);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};