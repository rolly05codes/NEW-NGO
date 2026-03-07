// Animation JavaScript for Visuals of Recovery
document.addEventListener('DOMContentLoaded', function() {

  // Counter Animation
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-counter[data-target]');

    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000; // 2 seconds
      const step = target / (duration / 16); // 60fps
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          counter.textContent = target.toLocaleString();
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current).toLocaleString();
        }
      }, 16);
    });
  }

  // Trigger counter animation when section is visible
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const statsSection = document.querySelector('.stats');
  if (statsSection) {
    observer.observe(statsSection);
  }

  // Carousel Indicators
  function updateCarouselIndicators() {
    const indicators = document.querySelectorAll('.carousel-indicator');
    let currentSlide = 0;

    // Update indicators every 4 seconds (matching animation)
    setInterval(() => {
      indicators.forEach(ind => ind.classList.remove('active'));
      indicators[currentSlide].classList.add('active');
      currentSlide = (currentSlide + 1) % indicators.length;
    }, 4000);
  }

  updateCarouselIndicators();

  // Image Hover Effects
  const imageContainers = document.querySelectorAll('.image-hover-zoom, .image-hover-lift');

  imageContainers.forEach(container => {
    container.addEventListener('mouseenter', function() {
      this.style.transform = this.classList.contains('image-hover-lift') ? 'translateY(-10px)' : 'scale(1.05)';
    });

    container.addEventListener('mouseleave', function() {
      this.style.transform = 'none';
    });
  });

  // Parallax Effect
  function parallaxScroll() {
    const parallaxSections = document.querySelectorAll('.parallax-section');

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;

      parallaxSections.forEach(section => {
        const rate = scrolled * -0.5;
        section.style.transform = `translateY(${rate}px)`;
      });
    });
  }

  // Only enable parallax on desktop
  if (window.innerWidth > 768) {
    parallaxScroll();
  }

  // Floating Animation Randomizer
  function randomizeFloatAnimations() {
    const floatingElements = document.querySelectorAll('.float-animation, .float-delayed');

    floatingElements.forEach(element => {
      const randomDelay = Math.random() * 4; // Random delay up to 4 seconds
      element.style.animationDelay = `${randomDelay}s`;
    });
  }

  randomizeFloatAnimations();

  // Morphing Border Animation
  function addMorphingBorders() {
    const morphingElements = document.querySelectorAll('.morphing-border');

    morphingElements.forEach(element => {
      // Add subtle rotation on hover
      element.addEventListener('mouseenter', function() {
        this.style.transform = 'rotateY(2deg) scale(1.02)';
      });

      element.addEventListener('mouseleave', function() {
        this.style.transform = 'rotateY(0deg) scale(1)';
      });
    });
  }

  addMorphingBorders();

  // Sliding Panels Interaction
  function initSlidingPanels() {
    const panels = document.querySelectorAll('.sliding-panel');

    panels.forEach(panel => {
      panel.addEventListener('mouseenter', function() {
        // Reset all panels
        panels.forEach(p => p.style.flex = '1');

        // Expand hovered panel
        this.style.flex = '2';
      });
    });

    // Reset on mouse leave container
    const container = document.querySelector('.sliding-panels');
    if (container) {
      container.addEventListener('mouseleave', function() {
        panels.forEach(p => p.style.flex = '1');
      });
    }
  }

  initSlidingPanels();

  // Rotating Gallery Animation
  function initRotatingGallery() {
    const items = document.querySelectorAll('.rotating-item');

    // Add staggered animation delays
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });

    // Add click interaction
    items.forEach(item => {
      item.addEventListener('click', function() {
        // Add a bounce effect
        this.style.animation = 'none';
        setTimeout(() => {
          this.style.animation = 'bounce 0.6s ease';
        }, 10);
      });
    });
  }

  initRotatingGallery();

  // Add bounce keyframe if not already in CSS
  if (!document.querySelector('#bounce-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bounce-keyframes';
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Performance optimization: Reduce animations on low-performance devices
  function optimizeAnimations() {
    const isLowPerformance = navigator.hardwareConcurrency <= 2 ||
                           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isLowPerformance) {
      // Reduce animation intensity
      document.documentElement.style.setProperty('--animation-duration', '0.5s');
      document.body.classList.add('reduced-motion');
    }
  }

  optimizeAnimations();

  // Accessibility: Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  console.log('🎨 Visuals of Recovery initialized successfully!');
});