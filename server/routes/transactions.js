const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// All routes are protected
router.use(authMiddleware);

// @route   GET /api/transactions
// @desc    Get all transactions for a user with filters
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = { userId: req.userId };
        
        if (type) query.type = type;
        if (category) query.category = category;
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        // Execute query with pagination
        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Get total count for pagination
        const count = await Transaction.countDocuments(query);
        
        res.json({
            success: true,
            transactions,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;
        
        // Validation
        if (!type || !amount || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide type, amount, and category'
            });
        }
        
        // Create transaction
        const transaction = await Transaction.create({
            userId: req.userId,
            type,
            amount,
            category,
            description,
            date: date || Date.now()
        });
        
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating transaction',
            error: error.message
        });
    }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { type, amount, category, description, date } = req.body;
        
        // Find transaction and check ownership
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        // Update fields
        if (type) transaction.type = type;
        if (amount) transaction.amount = amount;
        if (category) transaction.category = category;
        if (description !== undefined) transaction.description = description;
        if (date) transaction.date = date;
        
        await transaction.save();
        
        res.json({
            success: true,
            message: 'Transaction updated successfully',
            transaction
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating transaction',
            error: error.message
        });
    }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting transaction',
            error: error.message
        });
    }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary (total income, expenses, etc.)
// @access  Private
// @route   GET /api/transactions/summary
// @desc    Get transaction summary (total income, expenses, etc.)
// @access  Private
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchQuery = { userId: new mongoose.Types.ObjectId(req.userId) };
        
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }
        
        const summary = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = {
            income: 0,
            expense: 0,
            balance: 0,
            incomeCount: 0,
            expenseCount: 0
        };
        
        summary.forEach(item => {
            if (item._id === 'income') {
                result.income = item.total;
                result.incomeCount = item.count;
            } else if (item._id === 'expense') {
                result.expense = item.total;
                result.expenseCount = item.count;
            }
        });
        
        result.balance = result.income - result.expense;
        
        res.json({
            success: true,
            summary: result
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching summary',
            error: error.message
        });
    }
});

module.exports = router;