import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-copyright">&copy; 2026 Manish Gupta. All rights reserved.</p>
        <p className="footer-crafted">Crafted with <i className="fas fa-heart"></i> using React.js</p>
        <div className="social-links">
          <a href="https://github.com/Manish-G123" target="_blank" rel="noopener noreferrer" className="github-projects-link">
            <i className="fab fa-github"></i> View all projects on GitHub
          </a>
          <a href="https://www.linkedin.com/in/manishgupta-2003/" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin"></i> LinkedIn
          </a>
          <a href="https://github.com/Manish-G123/LinkX" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github"></i> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
