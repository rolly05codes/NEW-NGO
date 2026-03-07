// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Utility Functions
const showAlert = (message, type = 'success') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  document.body.insertBefore(alertDiv, document.body.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
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
    volunteerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
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

      try {
        const response = await fetch(`${API_BASE_URL}/volunteers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
          showAlert('Registration Successful! Your application is under review.', 'success');
          volunteerForm.reset();
        } else {
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
});

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
