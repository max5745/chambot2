const express = require("express");
const router = express.Router();
const { reindexAll, getStatus, semanticSearch } = require("../controllers/embeddingController");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.use(authenticate, requireAdmin);

// Status — how many products have embeddings
router.get("/status", getStatus);

// Re-embed all active products
router.post("/reindex", reindexAll);

// Semantic search (test endpoint for admin)
router.post("/search", semanticSearch);

module.exports = router;
