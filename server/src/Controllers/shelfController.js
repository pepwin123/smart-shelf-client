import Shelf from "../Models/shelfModel.js";

export const addBookToShelf = async (req,res) => {
    const {workspaceId, bookId} = req.body;

    const exists = await Shelf.findOne({workspaceId, bookId});
    if (exists) {
        return res.status(400).json({success: true, message: "Book already added"});
    }

    const lastItem = await Shelf.find({workspaceId, status: "TO_READ"}).sort({position:-1}).limit(1);

    const position = lastItem.length? lastItem[0].position + 1 : 0;

    const shelfItem = await Shelf.create({
        workspaceId,
        bookId,
        position,
        addedBy: req.user.id,
    });

    req.io.to(workspaceId.toString()).emit("Shelf:added", shelfItem);
    res.status(201).json({success:true, shelfItem});
}

export const getShelfByWorkspace = async (req, res) => {
    const { workspaceId } = req.params;

    const items = await Shelf.find({ workspaceId }).populate("bookId").sort({ position: 1});

    const board = {
        TO_READ: [],
        READING: [],
        CITED: []
    };

    items.forEach((item) => {
        board[item.status].push(item);
    });

    res.json(board);
}

export const moveBook = async (req,res) =>{
    const {id} = req.params;
    const {newStatus, newPosition} = req.body;

    const item = await Shelf.findById(id);
    if(!item){
        return res.status(404).json({success: false, message: "Item not found"});
    }

    const oldStatus = item.status;

    await Shelf.updateMany({
        workspaceId: item.workspaceId,
        status: oldStatus,
        position: {$gt: item.position},
    },{$inc:{position: -1}});

    await Shelf.updateMany({
        workspaceId: item.workspaceId,
        status: newStatus,
        position: {$gte: newPosition},
    }, {$inc: {position: 1}});

    item.status = newStatus;
    item.position = newPosition;
    await item.save();

    req.io.to(item.workspaceId.toString()).emit("Shelf:moved", item);

    res.json({success: true, item});
}


export const removeBook = async (req,res) => {
    const {id} = req.params;

    const item = await Shelf.findById(id);
    if(!item){
        return res.status(404).json({status: false, message: "item not found"});
    }

    await item.deleteOne();

    req.io.to(item.workspaceId.toString()).emit("Shelf:removed", id);

    res.json({success: true});
} 