const express = require("express");
const axios = require("axios");
const router = express.Router();

// Route to fetch movie recommendations based on a given movie ID
router.get("/recommend/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params;
        
        // Fetch recommendations from the Flask backend
        const response = await axios.get(`http://127.0.0.1:5001/recommend/${movieId}`);
        
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

module.exports = router;
