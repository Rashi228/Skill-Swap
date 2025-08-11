import React, { useState } from 'react';
import { FaUser, FaExchangeAlt, FaStar, FaFlag, FaChartBar, FaCheck, FaBan, FaSignOutAlt } from 'react-icons/fa';

const mockUsers = [
  { id: 1, name: 'Priya Sharma', email: 'priya@email.com', city: 'Delhi', status: 'Active', verified: false },
  { id: 2, name: 'Amit Verma', email: 'amit@email.com', city: 'Mumbai', status: 'Banned', verified: true },
  { id: 3, name: 'Sara Khan', email: 'sara@email.com', city: 'Delhi', status: 'Active', verified: true },
  { id: 4, name: 'John Doe', email: 'john@email.com', city: 'Bangalore', status: 'Active', verified: false },
];

const mockSwaps = [
  { id: 1, userA: 'Priya Sharma', userB: 'Amit Verma', skillA: 'Guitar', skillB: 'Cooking', status: 'Pending' },
  { id: 2, userA: 'Sara Khan', userB: 'John Doe', skillA: 'Spanish', skillB: 'Public Speaking', status: 'Active' },
];
const mockReviews = [
  { id: 1, user: 'Priya Sharma', reviewer: 'Amit Verma', text: 'Great teacher!', rating: 5, helpful: false },
  { id: 2, user: 'Sara Khan', reviewer: 'John Doe', text: 'Very helpful.', rating: 4, helpful: true },
];
const mockReports = [
  { id: 1, reported: 'Amit Verma', reason: 'Spam', status: 'Open' },
  { id: 2, reported: 'John Doe', reason: 'Abuse', status: 'Resolved' },
];

const sections = [
  { key: 'users', label: 'Users', icon: <FaUser /> },
  { key: 'swaps', label: 'Swaps', icon: <FaExchangeAlt /> },
  { key: 'reviews', label: 'Reviews', icon: <FaStar /> },
  { key: 'reports', label: 'Reports', icon: <FaFlag /> },
  { key: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
];

const AdminPanel = () => {
  const [active, setActive] = useState('users');
  const [users, setUsers] = useState(mockUsers);
  const [swaps, setSwaps] = useState(mockSwaps);
  const [reviews, setReviews] = useState(mockReviews);
  const [reports, setReports] = useState(mockReports);

  const verifyUser = id => setUsers(users.map(u => u.id === id ? { ...u, verified: true } : u));
  const banUser = id => setUsers(users.map(u => u.id === id ? { ...u, status: 'Banned' } : u));
  const unverifyUser = id => setUsers(users.map(u => u.id === id ? { ...u, verified: false } : u));
  const unbanUser = id => setUsers(users.map(u => u.id === id ? { ...u, status: 'Active' } : u));
  const approveSwap = id => setSwaps(swaps.map(s => s.id === id ? { ...s, status: 'Active' } : s));
  const rejectSwap = id => setSwaps(swaps.filter(s => s.id !== id));
  const flagSwap = id => setSwaps(swaps.map(s => s.id === id ? { ...s, status: 'Flagged' } : s));
  const removeReview = id => setReviews(reviews.filter(r => r.id !== id));
  const markHelpful = id => setReviews(reviews.map(r => r.id === id ? { ...r, helpful: true } : r));
  const resolveReport = id => setReports(reports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
  const banReportedUser = name => setUsers(users.map(u => u.name === name ? { ...u, status: 'Banned' } : u));

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)'}}>
      <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-gradient-primary text-white">
        <h3 className="fw-bold mb-0">Admin Panel</h3>
        <button className="btn btn-outline-light"><FaSignOutAlt className="me-2" />Logout</button>
      </div>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-md-2 mb-3">
            <div className="list-group">
              {sections.map(sec => (
                <button key={sec.key} className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${active===sec.key?'active':''}`} onClick={()=>setActive(sec.key)}>
                  {sec.icon} {sec.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-md-10">
            {active==='users' && (
              <div className="bg-white rounded-4 shadow p-4">
                <h5 className="fw-bold mb-3">Users</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th><th>Email</th><th>City</th><th>Status</th><th>Verified</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.city}</td>
                          <td><span className={`badge ${u.status==='Active'?'bg-success':'bg-danger'}`}>{u.status}</span></td>
                          <td>{u.verified ? <FaCheck className="text-success" /> : <span className="text-danger">No</span>}</td>
                          <td>
                            {!u.verified && <button className="btn btn-sm btn-outline-success me-2" onClick={()=>verifyUser(u.id)}>Verify</button>}
                            {u.verified && <button className="btn btn-sm btn-outline-warning me-2" onClick={()=>unverifyUser(u.id)}>Unverify</button>}
                            {u.status==='Active' && <button className="btn btn-sm btn-outline-danger me-2" onClick={()=>banUser(u.id)}>Ban</button>}
                            {u.status==='Banned' && <button className="btn btn-sm btn-outline-success" onClick={()=>unbanUser(u.id)}>Unban</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {active==='swaps' && (
              <div className="bg-white rounded-4 shadow p-4">
                <h5 className="fw-bold mb-3">Swaps</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>User A</th><th>Skill A</th><th>User B</th><th>Skill B</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swaps.map(s => (
                        <tr key={s.id}>
                          <td>{s.userA}</td>
                          <td>{s.skillA}</td>
                          <td>{s.userB}</td>
                          <td>{s.skillB}</td>
                          <td><span className={`badge ${s.status==='Active'?'bg-success':s.status==='Flagged'?'bg-warning':'bg-secondary'}`}>{s.status}</span></td>
                          <td>
                            {s.status==='Pending' && <button className="btn btn-sm btn-outline-success me-2" onClick={()=>approveSwap(s.id)}>Approve</button>}
                            {s.status==='Pending' && <button className="btn btn-sm btn-outline-danger me-2" onClick={()=>rejectSwap(s.id)}>Reject</button>}
                            <button className="btn btn-sm btn-outline-warning" onClick={()=>flagSwap(s.id)}>Flag</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {active==='reviews' && (
              <div className="bg-white rounded-4 shadow p-4">
                <h5 className="fw-bold mb-3">Reviews</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>User</th><th>Reviewer</th><th>Review</th><th>Rating</th><th>Helpful</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r.id}>
                          <td>{r.user}</td>
                          <td>{r.reviewer}</td>
                          <td>{r.text}</td>
                          <td>{r.rating}</td>
                          <td>{r.helpful ? <FaCheck className="text-success" /> : <span className="text-danger">No</span>}</td>
                          <td>
                            {!r.helpful && <button className="btn btn-sm btn-outline-success me-2" onClick={()=>markHelpful(r.id)}>Mark Helpful</button>}
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>removeReview(r.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {active==='reports' && (
              <div className="bg-white rounded-4 shadow p-4">
                <h5 className="fw-bold mb-3">Reports</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Reported User</th><th>Reason</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => (
                        <tr key={r.id}>
                          <td>{r.reported}</td>
                          <td>{r.reason}</td>
                          <td><span className={`badge ${r.status==='Open'?'bg-warning':'bg-success'}`}>{r.status}</span></td>
                          <td>
                            {r.status==='Open' && <button className="btn btn-sm btn-outline-success me-2" onClick={()=>resolveReport(r.id)}>Resolve</button>}
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>banReportedUser(r.reported)}>Ban User</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {active==='analytics' && (
              <div className="bg-white rounded-4 shadow p-4">
                <h5 className="fw-bold mb-4">Analytics & Statistics</h5>
                <div className="row g-4">
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-primary"><FaUser /></div>
                      <div className="fw-bold fs-4">{users.length}</div>
                      <div className="text-secondary">Total Users</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-success"><FaUser /></div>
                      <div className="fw-bold fs-4">{users.filter(u=>u.status==='Active').length}</div>
                      <div className="text-secondary">Active Users</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-danger"><FaUser /></div>
                      <div className="fw-bold fs-4">{users.filter(u=>u.status==='Banned').length}</div>
                      <div className="text-secondary">Banned Users</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-info"><FaExchangeAlt /></div>
                      <div className="fw-bold fs-4">{swaps.length}</div>
                      <div className="text-secondary">Total Swaps</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-warning"><FaExchangeAlt /></div>
                      <div className="fw-bold fs-4">{swaps.filter(s=>s.status==='Pending').length}</div>
                      <div className="text-secondary">Pending Swaps</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-success"><FaExchangeAlt /></div>
                      <div className="fw-bold fs-4">{swaps.filter(s=>s.status==='Active').length}</div>
                      <div className="text-secondary">Active Swaps</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-primary"><FaStar /></div>
                      <div className="fw-bold fs-4">{reviews.length}</div>
                      <div className="text-secondary">Total Reviews</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-warning"><FaStar /></div>
                      <div className="fw-bold fs-4">{reviews.length ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : '0.0'}</div>
                      <div className="text-secondary">Avg. Rating</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-danger"><FaFlag /></div>
                      <div className="fw-bold fs-4">{reports.length}</div>
                      <div className="text-secondary">Total Reports</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-warning"><FaFlag /></div>
                      <div className="fw-bold fs-4">{reports.filter(r=>r.status==='Open').length}</div>
                      <div className="text-secondary">Open Reports</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center p-3 shadow-sm border-0">
                      <div className="fs-2 text-success"><FaFlag /></div>
                      <div className="fw-bold fs-4">{reports.filter(r=>r.status==='Resolved').length}</div>
                      <div className="text-secondary">Resolved Reports</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 