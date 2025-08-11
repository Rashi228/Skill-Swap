import React from 'react';

const About = () => (
  <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
    <div className="container bg-white rounded-4 shadow p-4">
      <h2 className="fw-bold text-gradient mb-3">About SkillSwap</h2>
      <p className="lead mb-4">SkillSwap is a platform dedicated to helping people learn, teach, and grow by exchanging skills and time, not money. Our mission is to empower everyone to share their knowledge and connect with a global community.</p>
      <h4 className="fw-bold mt-5 mb-3">Our Team</h4>
      <div className="row g-4">
        {[1,2,3].map(i => (
          <div className="col-md-4 text-center" key={i}>
            <div className="d-flex flex-column align-items-center">
              <div className="rounded-circle bg-gradient-primary mb-2" style={{width:'80px',height:'80px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span className="fs-1 text-white">👤</span>
              </div>
              <h6 className="fw-bold mb-0">Founder {i}</h6>
              <small className="text-secondary">Role {i}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default About; 