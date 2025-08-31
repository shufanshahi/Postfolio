'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Plus, Minus, Calendar, Filter, RefreshCw, 
  TrendingUp, TrendingDown, Clock, ArrowLeft, History,
  CreditCard, Wallet, Activity, Search, Download
} from 'lucide-react';
import StripePayment from '../../components/StripePayment';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import {
  Badge
} from '@/components/ui/badge';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import {
  Separator
} from '@/components/ui/separator';
import Navbar from '@/components/Navbar';

// Design tokens matching dashboard
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function AddCreditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creditData, setCreditData] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showAddCreditForm, setShowAddCreditForm] = useState(false);
  const [addCreditForm, setAddCreditForm] = useState({
    amount: '',
    description: ''
  });
  const [selectedCreditAmount, setSelectedCreditAmount] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    transactionType: 'all' // all, credit, debit
  });
  const [stats, setStats] = useState({
    totalCredit: 0,
    totalDebits: 0,
    totalCredits: 0
  });

  // Fetch credit data
  const fetchCreditData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push('/login');
        return;
      }

      // Get profile ID
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profile = await profileRes.json();
      const profileId = profile.id;

      // Get credit data
      const creditRes = await fetch(`http://localhost:8080/api/credits/profile/${profileId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!creditRes.ok) {
        throw new Error('Failed to fetch credit data');
      }

      const creditInfo = await creditRes.json();
      setCreditData(creditInfo);
      setFilteredTransactions(creditInfo.transactionHistory || []);
      
      // Calculate stats
      calculateStats(creditInfo.transactionHistory || []);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from transactions
  const calculateStats = (transactions) => {
    let totalCredits = 0;
    let totalDebits = 0;

    transactions.forEach(transaction => {
      if (transaction.includes('CREDIT:')) {
        const match = transaction.match(/CREDIT: \+(\d+\.?\d*)/);
        if (match) {
          totalCredits += parseFloat(match[1]);
        }
      } else if (transaction.includes('DEBIT:')) {
        const match = transaction.match(/DEBIT: -(\d+\.?\d*)/);
        if (match) {
          totalDebits += parseFloat(match[1]);
        }
      }
    });

    setStats({
      totalCredit: creditData?.totalCredit || 0,
      totalCredits,
      totalDebits
    });
  };

  // Filter transactions based on date and type
  const applyFilters = () => {
    if (!creditData?.transactionHistory) return;

    let filtered = [...creditData.transactionHistory];

    // Filter by transaction type
    if (dateFilter.transactionType === 'credit') {
      filtered = filtered.filter(t => t.includes('CREDIT:'));
    } else if (dateFilter.transactionType === 'debit') {
      filtered = filtered.filter(t => t.includes('DEBIT:'));
    }

    // Filter by date range
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(transaction => {
        const dateMatch = transaction.match(/\[(.*?)\]/);
        if (!dateMatch) return true;
        
        const transactionDate = new Date(dateMatch[1]);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
        
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  // Parse transaction for display
  const parseTransaction = (transaction) => {
    const isCredit = transaction.includes('CREDIT:');
    const isDebit = transaction.includes('DEBIT:');
    
    let amount = 0;
    let description = '';
    let date = '';

    if (isCredit) {
      const match = transaction.match(/CREDIT: \+(\d+\.?\d*) - (.*?) \[(.*?)\]/);
      if (match) {
        amount = parseFloat(match[1]);
        description = match[2];
        date = match[3];
      }
    } else if (isDebit) {
      const match = transaction.match(/DEBIT: -(\d+\.?\d*) - (.*?) \[(.*?)\]/);
      if (match) {
        amount = parseFloat(match[1]);
        description = match[2];
        date = match[3];
      }
    } else {
      // Handle other transaction types
      const dateMatch = transaction.match(/\[(.*?)\]/);
      description = transaction.replace(/\[.*?\]/, '').trim();
      date = dateMatch ? dateMatch[1] : '';
    }

    return {
      type: isCredit ? 'credit' : isDebit ? 'debit' : 'other',
      amount,
      description,
      date: new Date(date).toLocaleString(),
      raw: transaction
    };
  };

  // Handle Add Credit button click
  const handleAddCreditClick = () => {
    setShowAddCreditForm(true);
  };

  // Handle form submission for adding credit
  const handleAddCreditSubmit = (e) => {
    e.preventDefault();
    
    if (!addCreditForm.amount || parseFloat(addCreditForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Create a fake mentorship object for Stripe payment
    const creditItem = {
      id: 'credit-add',
      name: 'Add Credit',
      specialization: addCreditForm.description || 'Account Top-up',
      price: parseFloat(addCreditForm.amount)
    };

    setSelectedCreditAmount(creditItem);
    setShowPayment(true);
    setShowAddCreditForm(false);
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Get profile ID
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profile = await profileRes.json();
      const profileId = profile.id;

      // Add credit using the API
      const addCreditRes = await fetch('http://localhost:8080/api/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profileId,
          amount: selectedCreditAmount.price,
          description: `Credit added via Stripe payment - ${selectedCreditAmount.specialization}`
        })
      });

      if (!addCreditRes.ok) throw new Error('Failed to add credit');

      // Close payment modal and refresh data
      setShowPayment(false);
      setSelectedCreditAmount(null);
      setAddCreditForm({ amount: '', description: '' });
      fetchCreditData();
      alert('Credit added successfully!');
    } catch (err) {
      alert('Failed to add credit: ' + err.message);
      setShowPayment(false);
      setSelectedCreditAmount(null);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  // Handle payment close
  const handlePaymentClose = () => {
    setShowPayment(false);
    setSelectedCreditAmount(null);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAddCreditForm(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchCreditData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters();
  }, [dateFilter, creditData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <RefreshCw className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your credit information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>

      <Navbar />
      
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
                Credit Management
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2 mt-1">
                <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Manage your account balance and transactions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchCreditData}
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleAddCreditClick}
              className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Credit
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Credit Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Current Balance</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      ${creditData?.totalCredit?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Credits */}
          <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Credits</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      +${stats.totalCredits.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Debits */}
          <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Debits</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      -${stats.totalDebits.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <History className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Transaction History
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {filteredTransactions.length} transactions found
                </CardDescription>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-auto text-sm"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-auto text-sm"
                />
                <select
                  value={dateFilter.transactionType}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, transactionType: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter({ startDate: '', endDate: '', transactionType: 'all' })}
                  className="text-sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => {
                  const parsed = parseTransaction(transaction);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          parsed.type === 'credit' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : parsed.type === 'debit'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {parsed.type === 'credit' ? <Plus className="h-4 w-4" /> : 
                           parsed.type === 'debit' ? <Minus className="h-4 w-4" /> : 
                           <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {parsed.description}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {parsed.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {parsed.amount > 0 && (
                          <Badge className={`${
                            parsed.type === 'credit' 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {parsed.type === 'credit' ? '+' : '-'}${parsed.amount.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Credit Form Modal */}
        {showAddCreditForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Add Credit
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCreditForm(false)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCreditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Amount (USD)
                    </label>
                    <Input
                      type="number"
                      name="amount"
                      value={addCreditForm.amount}
                      onChange={handleFormChange}
                      placeholder="Enter amount"
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description (Optional)
                    </label>
                    <Input
                      type="text"
                      name="description"
                      value={addCreditForm.description}
                      onChange={handleFormChange}
                      placeholder="e.g., Account top-up"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCreditForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stripe Payment Modal */}
        {showPayment && selectedCreditAmount && (
          <StripePayment
            mentorship={selectedCreditAmount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onClose={handlePaymentClose}
          />
        )}
      </div>
    </div>
  );
}