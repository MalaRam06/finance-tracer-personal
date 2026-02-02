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
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import './Dashboard.css';

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
        balance: 0,
        incomeCount: 0,
        expenseCount: 0
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [savingsRate, setSavingsRate] = useState(0);
    const [topExpenseCategory, setTopExpenseCategory] = useState('');
    const [weeklyComparison, setWeeklyComparison] = useState({ current: 0, previous: 0, change: 0 });

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            const now = new Date();
            
            switch(dateRange) {
                case 'week':
                    startDate = startOfWeek(now);
                    endDate = endOfWeek(now);
                    break;
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

            const summaryParams = {};
            if (startDate) summaryParams.startDate = startDate.toISOString();
            if (endDate) summaryParams.endDate = endDate.toISOString();
            
            // Fetch all data
            const [summaryRes, transactionsRes, categoryRes, monthlyRes] = await Promise.all([
                axios.get('/transactions/summary', { params: summaryParams }),
                axios.get('/transactions', { params: { limit: 8, page: 1 } }),
                axios.get('/dashboard/category-breakdown', { params: summaryParams }),
                axios.get('/dashboard/monthly-trend')
            ]);

            const summaryData = summaryRes.data.summary;
            setSummary(summaryData);
            setRecentTransactions(transactionsRes.data.transactions);
            setCategoryData(categoryRes.data.breakdown);
            setMonthlyData(monthlyRes.data.trend);

            // Calculate savings rate
            if (summaryData.income > 0) {
                const savings = ((summaryData.income - summaryData.expense) / summaryData.income * 100).toFixed(1);
                setSavingsRate(Math.max(0, savings));
            }

            // Find top expense category
            if (categoryRes.data.breakdown.length > 0) {
                const topCategory = categoryRes.data.breakdown.reduce((prev, current) => 
                    (prev.amount > current.amount) ? prev : current
                );
                setTopExpenseCategory(topCategory.category);
            }

            // Calculate weekly comparison
            await fetchWeeklyComparison();

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyComparison = async () => {
        try {
            const now = new Date();
            const currentWeekStart = startOfWeek(now);
            const currentWeekEnd = endOfWeek(now);
            const previousWeekStart = startOfWeek(subMonths(now, 1));
            const previousWeekEnd = endOfWeek(subMonths(now, 1));

            const [currentRes, previousRes] = await Promise.all([
                axios.get('/transactions/summary', {
                    params: {
                        startDate: currentWeekStart.toISOString(),
                        endDate: currentWeekEnd.toISOString()
                    }
                }),
                axios.get('/transactions/summary', {
                    params: {
                        startDate: previousWeekStart.toISOString(),
                        endDate: previousWeekEnd.toISOString()
                    }
                })
            ]);

            const current = currentRes.data.summary.expense;
            const previous = previousRes.data.summary.expense;
            const change = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;

            setWeeklyComparison({ current, previous, change });
        } catch (error) {
            console.error('Error fetching weekly comparison:', error);
        }
    };

    // Enhanced chart configurations with gradients
    const createGradient = (ctx, color1, color2) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    };

    const monthlyChartData = {
        labels: monthlyData.map(d => d.month),
        datasets: [
            {
                label: 'Income',
                data: monthlyData.map(d => d.income),
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
            },
            {
                label: 'Expenses',
                data: monthlyData.map(d => d.expense),
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
            }
        ]
    };

    const categoryChartData = {
        labels: categoryData.map(d => d.category.replace('-', ' ').toUpperCase()),
        datasets: [
            {
                data: categoryData.map(d => d.amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)',
                    'rgba(255, 99, 255, 0.8)',
                    'rgba(99, 255, 132, 0.8)',
                ],
                borderWidth: 0,
                hoverOffset: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += '₹' + context.parsed.y.toLocaleString();
                        }
                        return label;
                    }
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };

    const doughnutOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                position: 'right',
                labels: {
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading your financial insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-enhanced">
            <div className="dashboard-header">
                <div>
                    <h1>Financial Dashboard</h1>
                    <p className="dashboard-subtitle">Track your money, build your wealth</p>
                </div>
                <div className="date-filter-group">
                    <button 
                        className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
                        onClick={() => setDateRange('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
                        onClick={() => setDateRange('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={`filter-btn ${dateRange === 'year' ? 'active' : ''}`}
                        onClick={() => setDateRange('year')}
                    >
                        This Year
                    </button>
                    <button 
                        className={`filter-btn ${dateRange === 'all' ? 'active' : ''}`}
                        onClick={() => setDateRange('all')}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="metrics-grid">
                <div className="metric-card income-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-content">
                        <h3>Total Income</h3>
                        <p className="metric-value">₹{summary.income.toLocaleString()}</p>
                        <span className="metric-count">{summary.incomeCount} transactions</span>
                    </div>
                    <div className="metric-trend positive">
                        <span>↑ 12%</span>
                    </div>
                </div>

                <div className="metric-card expense-card">
                    <div className="metric-icon">💸</div>
                    <div className="metric-content">
                        <h3>Total Expenses</h3>
                        <p className="metric-value">₹{summary.expense.toLocaleString()}</p>
                        <span className="metric-count">{summary.expenseCount} transactions</span>
                    </div>
                    <div className="metric-trend negative">
                        <span>↑ {Math.abs(weeklyComparison.change)}%</span>
                    </div>
                </div>

                <div className="metric-card balance-card">
                    <div className="metric-icon">💵</div>
                    <div className="metric-content">
                        <h3>Net Balance</h3>
                        <p className={`metric-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                            ₹{Math.abs(summary.balance).toLocaleString()}
                        </p>
                        <span className="metric-status">
                            {summary.balance >= 0 ? 'Surplus' : 'Deficit'}
                        </span>
                    </div>
                </div>

                <div className="metric-card savings-card">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-content">
                        <h3>Savings Rate</h3>
                        <p className="metric-value">{savingsRate}%</p>
                        <div className="savings-bar">
                            <div 
                                className="savings-progress" 
                                style={{ width: `${Math.min(savingsRate, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="stat-item">
                    <span className="stat-label">Top Expense Category</span>
                    <span className="stat-value">{topExpenseCategory || 'N/A'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Daily Average Expense</span>
                    <span className="stat-value">
                        ₹{dateRange === 'month' ? (summary.expense / 30).toFixed(0) : (summary.expense / 365).toFixed(0)}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">This Week vs Last Week</span>
                    <span className={`stat-value ${weeklyComparison.change >= 0 ? 'negative' : 'positive'}`}>
                        {weeklyComparison.change >= 0 ? '+' : ''}{weeklyComparison.change}%
                    </span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                <div className="chart-card large">
                    <div className="chart-header">
                        <h2>Income vs Expenses Trend</h2>
                        <span className="chart-subtitle">Last 6 months overview</span>
                    </div>
                    <div className="chart-wrapper">
                        <Bar data={monthlyChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card medium">
                    <div className="chart-header">
                        <h2>Expense Breakdown</h2>
                        <span className="chart-subtitle">By category</span>
                    </div>
                    <div className="chart-wrapper">
                        <Doughnut data={categoryChartData} options={doughnutOptions} />
                    </div>
                </div>
            </div>

            {/* Recent Transactions with Enhanced UI */}
            <div className="transactions-section">
                <div className="section-header">
                    <h2>Recent Transactions</h2>
                    <a href="/transactions" className="view-all-link">View All →</a>
                </div>
                <div className="transactions-grid">
                    {recentTransactions.map(transaction => (
                        <div key={transaction._id} className="transaction-card">
                            <div className="transaction-left">
                                <div className="transaction-icon">
                                    {transaction.type === 'income' ? '💰' : 
                                     transaction.category === 'food' ? '🍔' :
                                     transaction.category === 'transport' ? '🚗' :
                                     transaction.category === 'shopping' ? '🛍️' :
                                     transaction.category === 'entertainment' ? '🎮' :
                                     transaction.category === 'healthcare' ? '🏥' :
                                     transaction.category === 'education' ? '📚' :
                                     transaction.category === 'utilities' ? '💡' : '💸'}
                                </div>
                                <div className="transaction-details">
                                    <span className="transaction-category">
                                        {transaction.category.replace('-', ' ')}
                                    </span>
                                    <span className="transaction-description">
                                        {transaction.description || 'No description'}
                                    </span>
                                </div>
                            </div>
                            <div className="transaction-right">
                                <span className={`transaction-amount ${transaction.type}`}>
                                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                </span>
                                <span className="transaction-date">
                                    {format(new Date(transaction.date), 'MMM dd')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;