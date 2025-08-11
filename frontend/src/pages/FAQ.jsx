import React, { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';

const faqs = [
  {
    question: 'What is SkillSwap?',
    answer: 'SkillSwap is a platform where users can exchange skills and knowledge with each other, earning and spending time credits instead of money.'
  },
  {
    question: 'How do I earn time credits?',
    answer: 'You earn time credits by teaching or sharing your skills with other users through swaps or webinars.'
  },
  {
    question: 'How do I spend time credits?',
    answer: 'You spend time credits by learning new skills from other users or joining webinars and sessions.'
  },
  {
    question: 'Is SkillSwap free to use?',
    answer: 'Yes, SkillSwap is free to join and use. You only exchange your time and skills, not money.'
  },
  {
    question: 'How do I contact support?',
    answer: 'You can contact support through the Contact page or email us at support@skillswap.com.'
  },
  {
    question: 'Can I use SkillSwap on mobile?',
    answer: 'Yes, SkillSwap is mobile-friendly and works on all modern devices.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Go to the Login page and click on "Forgot password?" to reset your password.'
  },
  {
    question: 'How do I delete my account?',
    answer: 'Please contact support to request account deletion.'
  }
];

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container bg-white rounded-4 shadow p-4">
        <h2 className="fw-bold text-gradient mb-4">Frequently Asked Questions</h2>
        <div className="accordion" id="faqAccordion">
          {faqs.map((faq, idx) => (
            <div className="accordion-item mb-3 border rounded" key={idx}>
              <button
                className="w-100 d-flex align-items-center justify-content-between p-3 bg-white border-0"
                style={{fontWeight:600, fontSize:'1.1rem', cursor:'pointer'}}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                aria-expanded={openIdx === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span>{faq.question}</span>
                <FaChevronRight style={{transition:'transform 0.2s', transform: openIdx === idx ? 'rotate(90deg)' : 'rotate(0deg)'}} />
              </button>
              {openIdx === idx && (
                <div id={`faq-answer-${idx}`} className="p-3 border-top bg-light">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ; 