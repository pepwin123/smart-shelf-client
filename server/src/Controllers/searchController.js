import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
    try{
        const { q, page=1 } = req.query;

        const response = await axios.get("https://openlibrary.org/search.json", {
            params:{q,page,limit: 10, fields: "key,title,author_name,first_publish_year,cover_i,subject",},
        });
    } catch(err){
        res.status(500).json({success: false, message:"Search failed"})
    }
});

export default router;