const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

router.use(authMiddleware);

// Get category breakdown
router.get('/category-breakdown', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchQuery = { 
            userId: new mongoose.Types.ObjectId(req.userId),
            type: 'expense'
        };
        
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }
        
        const breakdown = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    amount: { $sum: '$amount' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    amount: 1,
                    _id: 0
                }
            }
        ]);
        
        res.json({
            success: true,
            breakdown
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category breakdown',
            error: error.message
        });
    }
});

// Get monthly trend
router.get('/monthly-trend', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.userId),
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        type: '$type'
                    },
                    total: { $sum: '$amount' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);
        
        // Format the data
        const trendMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        monthlyData.forEach(item => {
            const monthKey = `${months[item._id.month - 1]} ${item._id.year}`;
            if (!trendMap[monthKey]) {
                trendMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
            }
            trendMap[monthKey][item._id.type] = item.total;
        });
        
        const trend = Object.values(trendMap);
        
        res.json({
            success: true,
            trend
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly trend',
            error: error.message
        });
    }
});

module.exports = router;