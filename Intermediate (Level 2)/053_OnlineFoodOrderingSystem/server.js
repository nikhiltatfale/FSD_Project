// ============================================================
// server.js - Online Food Ordering System Backend
// Run: node server.js
// ============================================================

const express = require('express');
const session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'food-ordering-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// ============================================================
// IN-MEMORY STORAGE
// ============================================================

const menu = [
  // ---- VEG ----
  {
    id: 'm1', name: 'Paneer Butter Masala', category: 'Veg',
    price: 220, description: 'Creamy tomato-based curry with soft paneer cubes',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80'
  },
  {
    id: 'm2', name: 'Dal Tadka', category: 'Veg',
    price: 150, description: 'Yellow lentils tempered with ghee & spices',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'
  },
  {
    id: 'm3', name: 'Veg Biryani', category: 'Veg',
    price: 180, description: 'Fragrant basmati rice with seasonal vegetables & saffron',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80'
  },
  {
    id: 'm4', name: 'Aloo Gobi', category: 'Veg',
    price: 140, description: 'Classic dry curry of potatoes and cauliflower',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80'
  },

  // ---- NON-VEG ----
  {
    id: 'm5', name: 'Chicken Tikka Masala', category: 'Non-Veg',
    price: 280, description: 'Tender chicken in rich, smoky tomato-cream sauce',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80'
  },
  {
    id: 'm6', name: 'Mutton Rogan Josh', category: 'Non-Veg',
    price: 350, description: 'Slow-cooked mutton in Kashmiri spice blend',
    image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80'
  },
  {
    id: 'm7', name: 'Chicken Biryani', category: 'Non-Veg',
    price: 260, description: 'Dum-cooked basmati rice layered with spiced chicken',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80'
  },
  {
    id: 'm8', name: 'Fish Curry', category: 'Non-Veg',
    price: 300, description: 'Coastal style fish in tangy coconut-tamarind gravy',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80'
  },

  // ---- DRINKS ----
  {
    id: 'm9', name: 'Mango Lassi', category: 'Drinks',
    price: 80, description: 'Chilled yogurt drink blended with Alphonso mango',
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80'
  },
  {
    id: 'm10', name: 'Masala Chai', category: 'Drinks',
    price: 40, description: 'Aromatic spiced tea brewed with ginger & cardamom',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80'
  },
  {
    id: 'm11', name: 'Fresh Lime Soda', category: 'Drinks',
    price: 60, description: 'Sparkling soda with fresh lime, salt or sweet',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'
  },

  // ---- DESSERTS ----
  {
    id: 'm12', name: 'Gulab Jamun', category: 'Desserts',
    price: 90, description: 'Soft milk-solid dumplings soaked in rose sugar syrup',
    image: 'https://images.unsplash.com/photo-1666500975-30dd7c5bd7c7?w=400&q=80'
  },
  {
    id: 'm13', name: 'Kheer', category: 'Desserts',
    price: 100, description: 'Creamy rice pudding with saffron, cardamom & nuts',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80'
  },
  {
    id: 'm14', name: 'Gajar Halwa', category: 'Desserts',
    price: 110, description: 'Slow-cooked carrot pudding with ghee, milk & raisins',
    image: 'https://images.unsplash.com/photo-1574301588985-7dd01df2a330?w=400&q=80'
  }
];

const orders = []; // In-memory order storage

// ============================================================
// ADMIN CREDENTIALS (hardcoded)
// ============================================================
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ============================================================
// HELPER: Auth middleware for admin routes
// ============================================================
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please login.' });
}

// ============================================================
// HELPER: Generate unique Order ID
// ============================================================
function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

// ============================================================
// HELPER: Validate order payload
// ============================================================
function validateOrder(data) {
  const errors = [];
  if (!data.customerName || data.customerName.trim().length < 2)
    errors.push('Valid customer name is required.');
  if (!data.phone || !/^\d{10}$/.test(data.phone.trim()))
    errors.push('Valid 10-digit phone number is required.');
  if (!data.address || data.address.trim().length < 5)
    errors.push('Valid delivery address is required.');
  if (!data.paymentMethod || !['COD', 'Online'].includes(data.paymentMethod))
    errors.push('Payment method must be COD or Online.');
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0)
    errors.push('Cart cannot be empty.');
  return errors;
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /menu - Return all menu items
app.get('/menu', (req, res) => {
  res.json({ success: true, menu });
});

// POST /order - Place a new order
app.post('/order', (req, res) => {
  const { customerName, phone, address, paymentMethod, items } = req.body;

  const errors = validateOrder(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Calculate total from server-side menu prices (security)
  let total = 0;
  const validatedItems = [];
  for (const cartItem of items) {
    const menuItem = menu.find(m => m.id === cartItem.id);
    if (!menuItem) {
      return res.status(400).json({ success: false, errors: [`Invalid menu item: ${cartItem.id}`] });
    }
    const qty = parseInt(cartItem.quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, errors: ['Invalid item quantity.'] });
    }
    const subtotal = menuItem.price * qty;
    total += subtotal;
    validatedItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      subtotal
    });
  }

  const order = {
    orderId: generateOrderId(),
    customerName: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    paymentMethod,
    items: validatedItems,
    total,
    status: 'Pending',
    timestamp: new Date().toISOString()
  };

  orders.push(order);

  console.log(`[NEW ORDER] ${order.orderId} | ${order.customerName} | ₹${order.total}`);

  res.json({
    success: true,
    message: 'Order placed successfully!',
    orderId: order.orderId,
    total: order.total
  });
});

// ============================================================
// ADMIN AUTH ROUTES
// ============================================================

// POST /admin/login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: 'Login successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// POST /admin/logout
app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /admin/check - Check if session is active
app.get('/admin/check', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.isAdmin) });
});

// ============================================================
// ADMIN DATA ROUTES (protected)
// ============================================================

// GET /orders - Get all orders
app.get('/orders', requireAdmin, (req, res) => {
  res.json({ success: true, orders });
});

// GET /admin/stats - Dashboard statistics
app.get('/admin/stats', requireAdmin, (req, res) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Most ordered item
  const itemCount = {};
  for (const order of orders) {
    for (const item of order.items) {
      itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
    }
  }
  const mostOrdered = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue,
      mostOrdered: mostOrdered ? { name: mostOrdered[0], count: mostOrdered[1] } : null,
      pendingOrders,
      deliveredOrders
    }
  });
});

// PATCH /orders/:orderId/status - Update order status
app.patch('/orders/:orderId/status', requireAdmin, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!['Pending', 'Delivered'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = orders.find(o => o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = status;
  res.json({ success: true, message: `Order marked as ${status}` });
});

// ============================================================
// ADMIN MENU MANAGEMENT ROUTES (protected)
// ============================================================

// GET /admin/menu - Same as public but admin
app.get('/admin/menu', requireAdmin, (req, res) => {
  res.json({ success: true, menu });
});

// POST /admin/menu - Add new menu item
app.post('/admin/menu', requireAdmin, (req, res) => {
  const { name, category, price, description, image } = req.body;

  if (!name || !category || !price || !description) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const validCategories = ['Veg', 'Non-Veg', 'Drinks', 'Desserts'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  const newItem = {
    id: 'm' + Date.now(),
    name: name.trim(),
    category,
    price: parseFloat(price),
    description: description.trim(),
    image: image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'
  };

  menu.push(newItem);
  res.json({ success: true, message: 'Menu item added', item: newItem });
});

// PUT /admin/menu/:id - Edit menu item
app.put('/admin/menu/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image } = req.body;

  const item = menu.find(m => m.id === id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  if (name) item.name = name.trim();
  if (category) item.category = category;
  if (price) item.price = parseFloat(price);
  if (description) item.description = description.trim();
  if (image) item.image = image;

  res.json({ success: true, message: 'Menu item updated', item });
});

// DELETE /admin/menu/:id - Delete menu item
app.delete('/admin/menu/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const index = menu.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  menu.splice(index, 1);
  res.json({ success: true, message: 'Menu item deleted' });
});

// GET /admin/download - Download orders as JSON
app.get('/admin/download', requireAdmin, (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="orders.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(orders, null, 2));
});

// ============================================================
// SERVE ADMIN PAGE
// ============================================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================================
// FALLBACK
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🍽️  Food Ordering Server running at http://localhost:${PORT}`);
  console.log(`🔐  Admin panel at http://localhost:${PORT}/admin`);
  console.log(`    Admin credentials: admin / admin123\n`);
});