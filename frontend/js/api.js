/* ============================================
   DIYA PHARMA — API Integration
   This file connects the frontend to the Vercel Backend
   ============================================ */

const API = {
  /**
   * Fetch all products from the Vercel backend
   */
  async getProducts() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products from API:', error);
      // Fallback to local data for testing if API is not available
      return window.ProductData || [];
    }
  },

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      return data;
    } catch (error) {
      console.warn('Backend unavailable, using Local Simulation for Registration', error);
      
      // Local Database Simulation
      let mockUsers = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
      
      // Check if email already exists
      const incomingEmail = (userData.email || '').toLowerCase();
      if (mockUsers.find(u => (u.email || '').toLowerCase() === incomingEmail)) {
        throw new Error('Email already exists! Please login instead.');
      }
      
      const newUser = { ...userData, email: incomingEmail, id: 'sim_user_' + Date.now() };
      mockUsers.push(newUser);
      localStorage.setItem('mock_db_users', JSON.stringify(mockUsers));
      
      return {
        user: newUser,
        token: 'sim_token_123'
      };
    }
  },

  /**
   * Login a user
   */
  async login(email, password) {
    // Try backend first
    let backendReachable = false;
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      backendReachable = true;
      const data = await response.json();
      if (!response.ok) {
        // Backend responded with an auth error — translate it
        const msg = (data.error || '').toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid email') || msg.includes('credentials')) {
          throw new Error('Wrong Password. Please try again.');
        }
        if (msg.includes('not found') || msg.includes('no user') || msg.includes('not registered')) {
          throw new Error('Account not registered. Please sign up first.');
        }
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (error) {
      // If backend was reachable and returned an error, throw it directly
      if (backendReachable) {
        throw error;
      }

      console.warn('Backend unreachable, using Local Simulation for Login');
      
      // Local Database Simulation (only when backend is truly offline)
      let mockUsers = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
      
      const searchEmail = (email || '').toLowerCase();
      const foundUser = mockUsers.find(u => (u.email || '').toLowerCase() === searchEmail);
      
      if (!foundUser) {
        throw new Error('Account not registered. Please sign up first.');
      }
      
      if (foundUser.password !== password) {
        throw new Error('Wrong Password. Please try again.');
      }
      
      return {
        user: foundUser,
        token: 'sim_token_456'
      };
    }
  },

  /**
   * Place an order
   */
  async placeOrder(orderData) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order failed');
      return data;
    } catch (error) {
      console.error('API Order Error:', error);
      throw error;
    }
  },

  /**
   * Get user order history
   */
  async getOrders(userId) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/orders/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error('API Fetch Orders Error:', error);
      return [];
    }
  }
};
