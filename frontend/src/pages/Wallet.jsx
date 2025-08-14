import React, { useState, useEffect } from 'react';
import { FaWallet, FaArrowDown, FaArrowUp, FaPlus, FaMinus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import walletService from '../services/walletService';

const Wallet = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [wallet, setWallet] = useState({
    balance: 0,
    earned: 0,
    spent: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and pagination
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  


  // Load wallet data
  useEffect(() => {
    loadWalletData();
  }, [token]);

  // Load transactions when filters change
  useEffect(() => {
    if (token) {
      loadTransactions();
    }
  }, [token, currentPage, typeFilter, search]);

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!socket) return;

    const handleWalletUpdate = (data) => {
      console.log('Real-time wallet update received:', data);
      setWallet({
        balance: data.balance,
        earned: data.earned,
        spent: data.spent
      });
      setTransactions(data.transactions || transactions);
      setSuccess('Wallet updated in real-time!');
      setTimeout(() => setSuccess(''), 3000);
    };

    socket.on('wallet_balance_updated', handleWalletUpdate);

    return () => {
      socket.off('wallet_balance_updated', handleWalletUpdate);
    };
  }, [socket, transactions]);

  const loadWalletData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const result = await walletService.getWalletBalance(token);
      if (result.success) {
        setWallet({
          balance: result.balance,
          earned: result.earned,
          spent: result.spent
        });
      } else {
        setError('Failed to load wallet data');
      }
    } catch (error) {
      setError('Error loading wallet data');
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!token) return;
    
    try {
             const options = {
         page: currentPage,
         limit: 10,
         search: search || undefined,
         type: typeFilter === 'Earned' ? 'credit' : typeFilter === 'Spent' ? 'debit' : undefined
       };
      
             const result = await walletService.getTransactions(token, options);
       if (result.success) {
         setTransactions(result.transactions);
         setTotalPages(result.pagination.pages);
       } else {
         setError(result.error || 'Failed to load transactions');
       }
    } catch (error) {
      setError(error.message || 'Error loading transactions');
      console.error('Error loading transactions:', error);
    }
  };



  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="py-5 d-flex justify-content-center align-items-center" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container">
        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        

         {/* Wallet Summary Cards */}
         <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card text-center p-4 shadow-sm border-0">
              <div className="fs-2 text-primary"><FaWallet /></div>
              <div className="fw-bold fs-3">{wallet.balance.toFixed(1)} <span className="fs-6 text-secondary">credits</span></div>
              <div className="text-secondary">Current Balance</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center p-4 shadow-sm border-0">
              <div className="fs-2 text-success"><FaArrowDown /></div>
              <div className="fw-bold fs-3">{wallet.earned.toFixed(1)}</div>
              <div className="text-secondary">Total Earned</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center p-4 shadow-sm border-0">
              <div className="fs-2 text-danger"><FaArrowUp /></div>
              <div className="fw-bold fs-3">{wallet.spent.toFixed(1)}</div>
              <div className="text-secondary">Total Spent</div>
            </div>
          </div>
        </div>



        {/* Transaction History */}
        <div className="bg-white rounded-4 shadow p-4">
          <h5 className="fw-bold mb-3">Transaction History</h5>
          
          {/* Filters */}
          <div className="row mb-3 g-2 align-items-end">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search description..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={typeFilter}
                onChange={handleTypeFilter}
              >
                <option value="All">All Types</option>
                <option value="Earned">Earned</option>
                <option value="Spent">Spent</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-secondary">
                      {loading ? 'Loading transactions...' : 'No transactions found.'}
                    </td>
                  </tr>
                ) : (
                                     transactions.map((tx, index) => (
                     <tr key={tx._id || index}>
                       <td>{formatDate(tx.timestamp)}</td>
                       <td>
                         {tx.type === 'credit' ? 
                           <span className="badge bg-success">Earned</span> : 
                           <span className="badge bg-danger">Spent</span>
                         }
                       </td>
                       <td className={tx.type === 'credit' ? 'text-success' : 'text-danger'}>
                         {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(1)}
                       </td>
                       <td>{tx.reason}</td>
                     </tr>
                   ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Wallet; 