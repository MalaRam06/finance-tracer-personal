const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Placeholder for budget routes
router.get('/', async (req, res) => {
    res.json({
        success: true,
        budgets: []
    });
});

module.exports = router;