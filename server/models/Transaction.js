const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: [
                // Income categories
                'salary', 'freelance', 'investments', 'business', 'other-income',
                // Expense categories
                'food', 'transport', 'utilities', 'entertainment', 'shopping',
                'healthcare', 'education', 'rent', 'insurance', 'other-expense'
            ],
            message: '{VALUE} is not a valid category'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);