export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
