import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const Dashboard = () => {
    const [summary, setSummary] = useState({
        income: 0,
        expense: 0,
        balance: 0
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month'); // month, year, all

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Calculate date range
            let startDate, endDate;
            const now = new Date();
            
            switch(dateRange) {
                case 'month':
                    startDate = startOfMonth(now);
                    endDate = endOfMonth(now);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                default:
                    startDate = null;
                    endDate = null;
            }

            // Fetch summary
            const summaryParams = {};
            if (startDate) summaryParams.startDate = startDate.toISOString();
            if (endDate) summaryParams.endDate = endDate.toISOString();
            
            const summaryRes = await axios.get('/transactions/summary', { params: summaryParams });
            setSummary(summaryRes.data.summary);

            // Fetch recent transactions
            const transactionsRes = await axios.get('/transactions', {
                params: { limit: 5, page: 1 }
            });
            setRecentTransactions(transactionsRes.data.transactions);

            // Fetch category-wise data
            const categoryRes = await axios.get('/dashboard/category-breakdown', {
                params: summaryParams
            });
            setCategoryData(categoryRes.data.breakdown);

            // Fetch monthly trend (last 6 months)
            const monthlyRes = await axios.get('/dashboard/monthly-trend');
            setMonthlyData(monthlyRes.data.trend);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Chart configurations
    const monthlyChartData = {
        labels: monthlyData.map(d => d.month),
        datasets: [
            {
                label: 'Income',
                data: monthlyData.map(d => d.income),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: monthlyData.map(d => d.expense),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };

    const categoryChartData = {
        labels: categoryData.map(d => d.category),
        datasets: [
            {
                data: categoryData.map(d => d.amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Financial Dashboard</h1>
                <div className="date-filter">
                    <button 
                        className={dateRange === 'month' ? 'active' : ''}
                        onClick={() => setDateRange('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={dateRange === 'year' ? 'active' : ''}
                        onClick={() => setDateRange('year')}
                    >
                        This Year
                    </button>
                    <button 
                        className={dateRange === 'all' ? 'active' : ''}
                        onClick={() => setDateRange('all')}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card income">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <h3>Total Income</h3>
                        <p className="amount">₹{summary.income.toLocaleString()}</p>
                    </div>
                </div>
                <div className="summary-card expense">
                    <div className="card-icon">💸</div>
                    <div className="card-content">
                        <h3>Total Expenses</h3>
                        <p className="amount">₹{summary.expense.toLocaleString()}</p>
                    </div>
                </div>
                <div className="summary-card balance">
                    <div className="card-icon">💵</div>
                    <div className="card-content">
                        <h3>Balance</h3>
                        <p className={`amount ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                            ₹{summary.balance.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h2>Monthly Trend</h2>
                    <div className="chart-wrapper">
                        <Bar data={monthlyChartData} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-container">
                    <h2>Expense Categories</h2>
                    <div className="chart-wrapper">
                        <Pie data={categoryChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
                <h2>Recent Transactions</h2>
                <div className="transactions-list">
                    {recentTransactions.map(transaction => (
                        <div key={transaction._id} className="transaction-item">
                            <div className="transaction-info">
                                <span className="transaction-category">
                                    {transaction.category}
                                </span>
                                <span className="transaction-description">
                                    {transaction.description || 'No description'}
                                </span>
                                <span className="transaction-date">
                                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </span>
                            </div>
                            <div className={`transaction-amount ${transaction.type}`}>
                                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;