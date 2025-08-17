import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import React from 'react';
import EmailService from './services/emailService';

import UserProfile from './pages/UserProfile';
import UserDiscovery from './pages/UserDiscovery';
import SwapManagement from './pages/SwapManagement';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import AdminPanel from './pages/AdminPanel';
import Wallet from './pages/Wallet';
import WebinarHost from './components/WebinarHost';
import WebinarParticipant from './components/WebinarParticipant';
import WebinarDiscovery from './components/WebinarDiscovery';
import WebinarSessionManager from './components/WebinarSessionManager';
import Webinars from './pages/Webinars';
import WebinarManager from './pages/WebinarManager';


import { Container, Nav, Navbar as RBNavbar, Button } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <RBNavbar className="navbar-custom" variant="dark" expand="lg">
      <Container fluid>
        <RBNavbar.Brand as={Link} to="/" className="attractive">
          SkillSwap
        </RBNavbar.Brand>
        <Nav className="align-items-center">
          {isAuthenticated ? (
            <>
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/users">Discover Users</Nav.Link>
              {/* <Nav.Link as={Link} to="/webinars">Webinars</Nav.Link> */}
              <Nav.Link as={Link} to="/wallet">Wallet</Nav.Link>
              <Nav.Item className="ms-2">
                <div className="d-flex align-items-center">
                  <div 
                    className="profile-pic-nav me-2" 
                    onClick={() => navigate('/profile')}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: user?.profilePic ? `url(${user.profilePic})` : '#ffffff',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '2px solid #ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e3a8a',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}
                    title="View Profile"
                  >
                    {!user?.profilePic && (user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U')}
                  </div>
                </div>
              </Nav.Item>
            </>
          ) : (
            <>
              <Nav.Item className="ms-2">
                <Button as={Link} to="/login" variant="primary" className="px-4">Login</Button>
              </Nav.Item>
              <Nav.Item className="ms-2">
                <Button as={Link} to="/register" variant="outline-light" className="px-4">Sign Up</Button>
              </Nav.Item>
            </>
          )}
        </Nav>
      </Container>
    </RBNavbar>
  );
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function Footer() {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <footer className="footer-custom py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5 className="text-white mb-3">
              <Link to="/" className="text-white text-decoration-none">SkillSwap</Link>
            </h5>
            <p className=" mb-0">
              Exchange skills, not money. Connect with learners and teachers worldwide.
            </p>
          </div>
          <div className="col-md-6">
            <div className="d-flex flex-wrap justify-content-md-end gap-3">
              <Link to="/about" className="footer-link">About</Link>
              <Link to="/contact" className="footer-link">Contact Us</Link>
              <Link to="/faq" className="footer-link">FAQ</Link>
              {isAuthenticated && (
                <>
                  <Link to="/wallet" className="footer-link">Wallet</Link>
                  <button onClick={logout} className="footer-link logout-btn">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Feedback Form Section */}
        {/* <div className="row mt-4">
          <div className="col-12">
            <div className="feedback-section-footer">
              <h6 className="text-white mb-3">We Value Your Feedback</h6>
              <FeedbackForm />
            </div>
          </div>
        </div> */}
        
        <hr className="footer-divider my-3" />
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="text-muted mb-0">
              © {new Date().getFullYear()} SkillSwap. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="d-flex gap-3 justify-content-md-end">
              <a href="#" className="footer-social-link">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="footer-social-link">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="footer-social-link">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="#" className="footer-social-link">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [showWebinarHost, setShowWebinarHost] = useState(false);
  const [showWebinarParticipant, setShowWebinarParticipant] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  const handleJoinWebinar = (webinar) => {
    setSelectedWebinar(webinar);
    setShowWebinarParticipant(true);
  };

  const handleHostWebinar = (sessionId) => {
    setShowWebinarHost(true);
  };

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SwapManagement />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute>
                <UserDiscovery />
              </ProtectedRoute>
            } />
            <Route path="/user/:userId" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/swaps" element={
              <ProtectedRoute>
                <SwapManagement />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/webinars" element={<Webinars />} />
            <Route path="/webinar-manager" element={<WebinarManager />} />

            
            {/* Future routes for Privacy, Terms, etc. */}
          </Routes>
        </Layout>
              {/* Webinar Modals */}
        {showWebinarHost && (
          <WebinarHost 
            sessionId="demo-session" 
            onClose={() => setShowWebinarHost(false)} 
          />
        )}
        {showWebinarParticipant && selectedWebinar && (
          <WebinarParticipant 
            sessionId={selectedWebinar.id} 
            onLeave={() => setShowWebinarParticipant(false)} 
          />
        )}
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

function FeedbackForm() {
  const [form, setForm] = useState({ name: '', email: '', feedback: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Check if EmailJS is configured
      if (!EmailService.isConfigured()) {
        setError('Email service not configured. Please check the setup guide.');
        return;
      }

      const result = await EmailService.sendFeedbackMessage(form);

      if (result.status === 200) {
        setSuccess(true);
        setForm({ name: '', email: '', feedback: '' });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Email send error:', error);
      setError('Failed to send feedback. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="feedback-section w-100 animate__animated animate__fadeInUp">
      <div className="container">
        <h2 className="text-center fw-bold mb-4" style={{color:'#185a9d'}}>We Value Your Feedback</h2>
        <form onSubmit={handleSubmit} className="feedback-form mx-auto" style={{maxWidth:'600px'}}>
          <div className="mb-3">
            <input 
              type="text" 
              className="form-control" 
              name="name"
              placeholder="Your Name" 
              value={form.name}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <input 
              type="email" 
              className="form-control" 
              name="email"
              placeholder="Your Email" 
              value={form.email}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <textarea 
              className="form-control" 
              rows="4" 
              name="feedback"
              placeholder="Your Feedback" 
              value={form.feedback}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>
          <div className="text-center">
            <button 
              type="submit" 
              className="btn btn-lg btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                'Send Feedback'
              )}
            </button>
          </div>
          
          {success && (
            <div className="alert alert-success mt-3 text-center">
              <i className="bi bi-check-circle me-2"></i>
              Thank you for your feedback! We'll review it and get back to you if needed.
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger mt-3 text-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="landing-page bg-gradient-primary min-vh-100 d-flex flex-column justify-content-between">
      {/* Navbar is already global */}
      <main className="container flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ paddingLeft: 0 }}>
        {/* HERO SECTION */}
        <div className="mt-5 row w-100 align-items-center hero-section animate__animated animate__fadeIn" style={{ marginLeft: 0 }}>
          <div className="col-lg-6 mb-4 mb-lg-0 d-flex flex-column justify-content-center">
            <h1 className="hero-title mb-3">Exchange <span style={{color:'#43cea2'}}>Skills</span>, Not <span style={{color:'#185a9d'}}>Money</span></h1>
            <p className="hero-desc">SkillSwap is a platform where you can teach, learn, and grow. Trade your time and knowledge, earn time credits, and connect with a global community. No money, just skills!</p>
            <div className="d-flex gap-3">
              {isAuthenticated ? (
                <Link to="/profile" className="btn btn-lg btn-primary shadow">View Profile</Link>
              ) : (
                <Link to="/register" className="btn btn-lg btn-primary shadow">Get Started</Link>
              )}
              <Link to="/about" className="btn btn-lg btn-outline-secondary">Learn More</Link>
            </div>
          </div>
          <div className="col-lg-6 text-center">
            <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80" alt="Skill Exchange" className="img-fluid rounded-4 shadow-lg landing-hero-img" />
          </div>
        </div>
        {/* FEATURES SECTION */}
        <section className="features-section w-100 py-5 animate__animated animate__fadeInUp">
          <div className="container">
            <h2 className="text-center fw-bold mb-5 text-gradient" style={{fontSize: '2.5rem'}}>Why SkillSwap?</h2>
            <div className="row g-5">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-search fs-1 text-primary"></i></div>
                  <h5 className="fw-bold mb-2">Skill Discovery</h5>
                  <p className="text-secondary">Find people by skill, location, rating, or availability. Connect with the right match for your learning journey.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-clock-history fs-1 text-success"></i></div>
                  <h5 className="fw-bold mb-2">Time Credits</h5>
                  <p className="text-secondary">Earn credits for teaching, spend them to learn. Your time is your currency—track it in your wallet dashboard.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-chat-dots fs-1 text-info"></i></div>
                  <h5 className="fw-bold mb-2">Secure Chat</h5>
                  <p className="text-secondary">Communicate safely after a swap is accepted. Share files, schedule video calls, and stay connected.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-calendar-check fs-1 text-warning"></i></div>
                  <h5 className="fw-bold mb-2">Swap Calendar</h5>
                  <p className="text-secondary">All your swaps are organized in a calendar. Never miss a session with reminders and notifications.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-star-half fs-1 text-danger"></i></div>
                  <h5 className="fw-bold mb-2">Ratings & Reviews</h5>
                  <p className="text-secondary">Build your reputation. Rate and review after every session to help others find the best matches.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow feature-card text-center p-4 animate__animated animate__zoomIn" style={{background: '#fff', margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-shield-lock fs-1 text-primary"></i></div>
                  <h5 className="fw-bold mb-2">Admin Protection</h5>
                  <p className="text-secondary">Our admin team keeps the platform safe. Accounts are verified, and abuse is monitored for your security.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* HOW IT WORKS SECTION */}
        <section className="w-100 py-5 animate__animated animate__fadeInUp">
          <div className="container">
            <h2 className="text-center fw-bold mb-5" style={{color:'#185a9d'}}>How It Works</h2>
            <div className="row g-5 justify-content-center">
              <div className="col-md-3">
                <div className="card border-0 shadow text-center p-4 h-100" style={{margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-person-plus fs-1 text-primary"></i></div>
                  <h5 className="fw-bold mb-2">Sign Up</h5>
                  <p className="text-secondary">Create your free account and set up your profile with skills you can teach and want to learn.</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow text-center p-4 h-100" style={{margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-search-heart fs-1 text-success"></i></div>
                  <h5 className="fw-bold mb-2">Discover</h5>
                  <p className="text-secondary">Browse and filter users by skills, location, and availability to find your perfect match.</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow text-center p-4 h-100" style={{margin: '1rem'}}>
                  <div className="mb-3"><i className="bi bi-arrow-repeat fs-1 text-info"></i></div>
                  <h5 className="fw-bold mb-2">Swap & Learn</h5>
                  <p className="text-secondary">Send a swap request, agree on a time, and start exchanging skills. Earn and spend time credits!</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* COMMUNITY HIGHLIGHTS SECTION (Timeline/Row) */}
        <section className="w-100 py-5 animate__animated animate__fadeInUp" style={{background:'#e0eafc', borderRadius:'2rem', marginBottom:'2rem'}}>
          <div className="container">
            <h2 className="text-center fw-bold mb-5" style={{color:'#43cea2'}}>Community Highlights</h2>
            <div className="community-row">
              <div className="community-highlight">
                <div className="icon"><i className="bi bi-people"></i></div>
                <h5>10,000+ Members</h5>
                <p>Join a growing community of passionate learners and teachers from around the world.</p>
              </div>
              <div className="community-highlight">
                <div className="icon"><i className="bi bi-award"></i></div>
                <h5>Top Rated Platform</h5>
                <p>Rated 4.9/5 by our users for ease of use, trust, and value. Your skills are in good hands!</p>
              </div>
              <div className="community-highlight">
                <div className="icon"><i className="bi bi-chat-quote"></i></div>
                <h5>Real Success Stories</h5>
                <p>"I learned Spanish and taught guitar! The best way to grow and give back." – Priya S.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
