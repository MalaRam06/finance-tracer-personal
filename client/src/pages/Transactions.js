import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        startDate: '',
        endDate: ''
    });
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const categories = {
        income: ['salary', 'freelance', 'investments', 'business', 'other-income'],
        expense: ['food', 'transport', 'utilities', 'entertainment', 'shopping', 
                  'healthcare', 'education', 'rent', 'insurance', 'other-expense']
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...filters
            };
            
            const response = await axios.get('/transactions', { params });
            setTransactions(response.data.transactions);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingTransaction) {
                await axios.put(`/transactions/${editingTransaction._id}`, formData);
            } else {
                await axios.post('/transactions', formData);
            }
            
            setShowModal(false);
            resetForm();
            fetchTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Error saving transaction. Please try again.');
        }
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description || '',
            date: format(new Date(transaction.date), 'yyyy-MM-dd')
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await axios.delete(`/transactions/${id}`);
                fetchTransactions();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Error deleting transaction. Please try again.');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'expense',
            amount: '',
            category: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd')
        });
        setEditingTransaction(null);
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            category: '',
            startDate: '',
            endDate: ''
        });
        setCurrentPage(1);
    };

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1>Transactions</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    + Add Transaction
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <select 
                    name="type" 
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>

                <select 
                    name="category" 
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {[...categories.income, ...categories.expense].map(cat => (
                        <option key={cat} value={cat}>
                            {cat.replace('-', ' ').toUpperCase()}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="filter-date"
                    placeholder="Start Date"
                />

                <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="filter-date"
                    placeholder="End Date"
                />

                <button 
                    className="btn btn-secondary"
                    onClick={clearFilters}
                >
                    Clear Filters
                </button>
            </div>

            {/* Transactions Table */}
            <div className="transactions-table-container">
                {loading ? (
                    <div className="loading">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="no-data">No transactions found</div>
                ) : (
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(transaction => (
                                <tr key={transaction._id}>
                                    <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                                    <td>
                                        <span className={`type-badge ${transaction.type}`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td>{transaction.category.replace('-', ' ')}</td>
                                    <td>{transaction.description || '-'}</td>
                                    <td className={`amount ${transaction.type}`}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        ₹{transaction.amount.toLocaleString()}
                                    </td>
                                    <td className="actions">
                                        <button 
                                            className="btn-icon edit"
                                            onClick={() => handleEdit(transaction)}
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-icon delete"
                                            onClick={() => handleDelete(transaction._id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTransaction ? 'Edit' : 'Add'} Transaction</h2>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="transaction-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                type: e.target.value,
                                                category: '' // Reset category when type changes
                                            });
                                        }}
                                        required
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            amount: e.target.value
                                        })}
                                        placeholder="Enter amount"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            category: e.target.value
                                        })}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories[formData.type].map(cat => (
                                            <option key={cat} value={cat}>
                                                {cat.replace('-', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            date: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        description: e.target.value
                                    })}
                                    placeholder="Enter description"
                                    rows="3"
                                />
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTransaction ? 'Update' : 'Add'} Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;