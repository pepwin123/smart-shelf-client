import Workspace from "../Models/workspace.js";

const isWorkspaceMember = async (req, res, next) => {
  const workspaceId =
    req.body.workspaceId || req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return res.status(404).json({ message: "Workspace not found" });
  }

  const isMember =
    workspace.owner.equals(req.user.id) ||
    workspace.members.includes(req.user.id);

  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export default isWorkspaceMember;
