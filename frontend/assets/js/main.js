// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://your-backend-url.vercel.app/api'; // Replace with your actual Vercel backend URL

// Utility Functions
const showAlert = (message, type = 'success') => {
  console.log('showAlert called with:', message, type); // Debug log
  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed-alert fixed-alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    min-width: 300px;
    text-align: center;
    border: none;
    margin: 0;
  `;

  if (type === 'success') {
    alertDiv.style.backgroundColor = '#27ae60';
  } else if (type === 'error') {
    alertDiv.style.backgroundColor = '#e74c3c';
  } else {
    alertDiv.style.backgroundColor = '#3498db';
  }

  document.body.appendChild(alertDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
};

const showLoader = (show = true) => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
};

// Donation form handler - DISABLED (using direct contact method)
// Contact: NC Yashwant, Ph: 9538026060
document.addEventListener('DOMContentLoaded', () => {
  const donationForm = document.getElementById('donationForm');
  if (donationForm) {
    // Form removed in favor of direct contact method
    console.log('Donations now handled via direct contact: 9538026060');
  }

  // Volunteer Registration Form
  const volunteerForm = document.getElementById('volunteerForm');
  if (volunteerForm) {
    console.log('Volunteer form found'); // Debug log
    volunteerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted'); // Debug log
      showLoader(true);

      const skills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);

      const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('volunteeremail').value,
        phone: document.getElementById('volunteerPhone').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        education: document.getElementById('education').value,
        profession: document.getElementById('profession').value,
        experience: document.getElementById('experience').value,
        skills: skills,
        area: document.getElementById('area').value,
        availability: document.getElementById('availability').value,
        agreeToTerms: document.getElementById('agreeToTerms').checked
      };

      console.log('Form data:', formData); // Debug log

      try {
        console.log('Making API call to:', `${API_BASE_URL}/volunteers`); // Debug log
        const response = await fetch(`${API_BASE_URL}/volunteers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status); // Debug log
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        if (data.success) {
          console.log('Showing success message'); // Debug log
          showAlert('Registration Successful! Your application is under review.', 'success');
          volunteerForm.reset();
        } else {
          console.log('Showing error message:', data.message); // Debug log
          showAlert(data.message, 'error');
        }
      } catch (error) {
        showAlert('Error submitting volunteer form', 'error');
        console.error(error);
      } finally {
        showLoader(false);
      }
    });
  }

  // Help Request Form
  const helpForm = document.getElementById('helpForm');
  if (helpForm) {
    helpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showLoader(true);

      const helpNeeded = Array.from(document.querySelectorAll('input[name="helpNeeded"]:checked')).map(el => el.value);

      const formData = {
        firstName: document.getElementById('helpFirstName').value,
        lastName: document.getElementById('helpLastName').value,
        email: document.getElementById('helpEmail').value,
        phone: document.getElementById('helpPhone').value,
        state: document.getElementById('helpState').value,
        city: document.getElementById('helpCity').value,
        disasterType: document.getElementById('disasterType').value,
        helpNeeded: helpNeeded,
        description: document.getElementById('description').value,
        familySize: parseInt(document.getElementById('familySize').value)
      };

      try {
        const response = await fetch(`${API_BASE_URL}/help-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
          showAlert('Your help request has been submitted. We will contact you soon.', 'success');
          helpForm.reset();
        } else {
          showAlert(data.message, 'error');
        }
      } catch (error) {
        showAlert('Error submitting help request', 'error');
        console.error(error);
      } finally {
        showLoader(false);
      }
    });
  }

  // Load donation stats
  displayDonationStats();

  // Initialize CountUp animations for impact statistics
  initializeCountUpAnimations();
});

// Initialize CountUp Animations for Impact Statistics
function initializeCountUpAnimations() {
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statCards = entry.target.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
          setTimeout(() => {
            animateCounter(card);
          }, index * 200); // Stagger animations
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const impactStats = document.getElementById('impactStats');
  if (impactStats) {
    observer.observe(impactStats);
  }
}

// Animate individual counter
function animateCounter(card) {
  const numberElement = card.querySelector('.stat-number');
  const targetValue = parseInt(card.dataset.target);
  const isCurrency = numberElement.textContent.includes('₹');

  if (!targetValue || isNaN(targetValue)) return;

  let currentValue = 0;
  const duration = 2000; // 2 seconds
  const increment = targetValue / (duration / 16); // 60fps

  const animate = () => {
    currentValue += increment;
    if (currentValue >= targetValue) {
      currentValue = targetValue;
    }

    if (isCurrency) {
      // Format currency values
      if (targetValue >= 10000000) { // 1 crore
        numberElement.textContent = `₹${(currentValue / 10000000).toFixed(1)}Cr`;
      } else if (targetValue >= 100000) { // 1 lakh
        numberElement.textContent = `₹${(currentValue / 100000).toFixed(1)}L`;
      } else {
        numberElement.textContent = `₹${Math.floor(currentValue).toLocaleString('en-IN')}`;
      }
    } else {
      numberElement.textContent = Math.floor(currentValue).toLocaleString('en-IN');
    }

    if (currentValue < targetValue) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

// Display Donation Statistics
async function displayDonationStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/donations/stats`);
    const data = await response.json();
    if (data.success) {
      const statsContainer = document.getElementById('donationStats');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stat-card">
            <div class="stat-number">${data.data.totalDonations}</div>
            <div class="stat-label">Total Donors</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">₹${(data.data.totalAmount / 100000).toFixed(1)}L</div>
            <div class="stat-label">Total Amount Raised</div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error loading donation stats:', error);
  }
}

// Blog Posts Loader
async function loadBlogPosts() {
  try {
    const response = await fetch(`${API_BASE_URL}/blog`);
    const data = await response.json();
    if (data.success && data.data.length > 0) {
      const blogContainer = document.getElementById('blogPosts');
      if (blogContainer) {
        blogContainer.innerHTML = data.data.slice(0, 3).map(blog => `
          <div class="card">
            <div class="card-image">📰</div>
            <div class="card-body">
              <span class="badge badge-primary">${blog.category}</span>
              <h3 class="card-title">${blog.title}</h3>
              <p class="card-text">${blog.excerpt}</p>
              <small style="color: #95a5a6;">By ${blog.author} • ${new Date(blog.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading blog posts:', error);
  }
}

// Smooth scroll navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
}

// Load blog posts on page load
window.addEventListener('load', () => {
  loadBlogPosts();

  // Load animations script if on visuals of recovery page (homepage or demo page)
  if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.includes('moving-images.html')) {
    const script = document.createElement('script');
    script.src = 'assets/js/animations.js';
    document.head.appendChild(script);
  }
});
