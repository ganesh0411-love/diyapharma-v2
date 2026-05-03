/* ============================================
   DIYA PHARMA — Core Application Logic
   ============================================ */

const DiyaPharma = {
  cart: JSON.parse(localStorage.getItem('dp_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('dp_user') || 'null'),
  orders: JSON.parse(localStorage.getItem('dp_orders') || '[]'),

  saveCart() {
    localStorage.setItem('dp_cart', JSON.stringify(this.cart));
    this.updateCartBadge();
  },
  saveUser() { localStorage.setItem('dp_user', JSON.stringify(this.user)); },
  saveOrders() { localStorage.setItem('dp_orders', JSON.stringify(this.orders)); },

  updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      const count = this.cart.reduce((sum, i) => sum + i.qty, 0);
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  addToCart(productId, qty = 1) {
    const product = ProductData.find(p => p.id === productId);
    if (!product) return;
    const existing = this.cart.find(i => i.id === productId);
    if (existing) { existing.qty += qty; }
    else { this.cart.push({ ...product, qty }); }
    this.saveCart();
    showToast(`${product.name} added to cart`, 'success');
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.saveCart();
  },

  updateQty(productId, qty) {
    const item = this.cart.find(i => i.id === productId);
    if (item) {
      item.qty = Math.max(1, qty);
      this.saveCart();
    }
  },

  getCartTotal() {
    return this.cart.reduce((sum, i) => sum + (i.mrp * i.qty), 0);
  },

  login(email, password, type) {
    this.user = { email, type, name: email.split('@')[0], phone: '', license: '', addresses: [] };
    this.saveUser();
    return true;
  },

  register(data) {
    this.user = { ...data, addresses: [] };
    this.saveUser();
    return true;
  },

  logout() {
    this.user = null;
    localStorage.removeItem('dp_user');
  },

  placeOrder(shippingAddress, paymentMethod) {
    const order = {
      id: 'DP' + Date.now().toString(36).toUpperCase(),
      items: [...this.cart],
      total: this.getCartTotal(),
      gst: this.getCartTotal() * 0.12,
      shipping: this.getCartTotal() > 5000 ? 0 : 99,
      address: shippingAddress,
      payment: paymentMethod,
      status: 'Processing',
      date: new Date().toISOString()
    };
    this.orders.unshift(order);
    this.cart = [];
    this.saveCart();
    this.saveOrders();
    return order;
  }
};

/* ---------- Toast Notification ---------- */
function showToast(message, type = 'success', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="font-size:18px;font-weight:700">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ---------- Header Scroll & Mobile Menu ---------- */
function initHeader() {
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Mobile Menu Toggle
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.menu-toggle');
    const mobileNav = document.getElementById('mobileNav');
    
    if (toggle && mobileNav) {
      toggle.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }
  });

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

function updateNavState() {
  try {
    const user = DiyaPharma.user;
    if (!user) return; // Not logged in, leave defaults (Login button)

    // 1. Update main nav links (Desktop & Mobile) to include Dashboard
    const navLinks = document.querySelector('.nav-links');
    const mobileNav = document.querySelector('.mobile-nav');
    const dashboardHref = user.type === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    
    if (navLinks && !navLinks.querySelector('.nav-dashboard')) {
      const dashLink = document.createElement('a');
      dashLink.href = dashboardHref;
      dashLink.className = 'nav-dashboard';
      dashLink.innerHTML = 'Dashboard';
      navLinks.appendChild(dashLink);
    }
    
    if (mobileNav && !mobileNav.querySelector('.nav-dashboard')) {
      const dashLink = document.createElement('a');
      dashLink.href = dashboardHref;
      dashLink.className = 'nav-dashboard';
      dashLink.innerHTML = 'Dashboard';
      // Insert before the last item (which is usually Logout in mobile)
      mobileNav.insertBefore(dashLink, mobileNav.lastElementChild);
    }

    // 2. Change Login button to Avatar in nav-actions
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      const loginBtn = navActions.querySelector('a[href="login.html"]');
      if (loginBtn) {
        // First letter of name or email
        const firstLetter = (user.name || user.email || 'U').charAt(0).toUpperCase();
        
        // Replace the button with a circular avatar
        loginBtn.outerHTML = `<a href="${dashboardHref}" class="nav-avatar" title="Dashboard" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-600); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; text-decoration: none; font-size: 14px; flex-shrink: 0;">
          ${firstLetter}
        </a>`;
      }
    }
  } catch (error) {
    console.error('Failed to update navigation state:', error);
  }
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => observer.observe(el));
}

/* ---------- Counter Animation ---------- */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString();
    }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(update);
        obs.unobserve(el);
      }
    });
    obs.observe(el);
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateNavState();
  initScrollAnimations();
  animateCounters();
  DiyaPharma.updateCartBadge();
});
