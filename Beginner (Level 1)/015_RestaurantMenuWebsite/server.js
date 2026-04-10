const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

// In-memory menu data
let menuItems = [
  { id: 1, name: "Paneer Tikka", category: "Starter", price: 220, description: "Grilled paneer cubes marinated in smoky spices & yogurt, served with mint chutney", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80" },
  { id: 2, name: "Crispy Spring Rolls", category: "Starter", price: 180, description: "Golden fried rolls stuffed with spiced vegetables and glass noodles", image: "https://images.unsplash.com/photo-1548811591-e280d9e3fca0?w=400&q=80" },
  { id: 3, name: "Soup of the Day", category: "Starter", price: 150, description: "Chef's freshly made soup with artisan bread on the side", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80" },
  { id: 4, name: "Bruschetta", category: "Starter", price: 200, description: "Toasted bread topped with tomatoes, basil, olive oil and garlic", image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80" },
  { id: 5, name: "Dal Makhani", category: "Main Course", price: 280, description: "Slow-cooked black lentils in a rich buttery tomato gravy, a true classic", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80" },
  { id: 6, name: "Butter Chicken", category: "Main Course", price: 350, description: "Tender chicken in a velvety, mildly spiced tomato-cream sauce", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80" },
  { id: 7, name: "Mushroom Risotto", category: "Main Course", price: 320, description: "Creamy Arborio rice with wild mushrooms, parmesan and fresh herbs", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80" },
  { id: 8, name: "Grilled Salmon", category: "Main Course", price: 480, description: "Atlantic salmon fillet with lemon butter sauce and seasonal vegetables", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80" },
  { id: 9, name: "Gulab Jamun", category: "Desserts", price: 120, description: "Soft milk-solid dumplings soaked in rose-flavored sugar syrup", image: "https://images.unsplash.com/photo-1601303516534-bf96a01d3a33?w=400&q=80" },
  { id: 10, name: "Chocolate Lava Cake", category: "Desserts", price: 200, description: "Warm chocolate cake with a molten centre, served with vanilla ice cream", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80" },
  { id: 11, name: "Mango Kulfi", category: "Desserts", price: 140, description: "Traditional Indian ice cream made with condensed milk and Alphonso mango", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80" },
  { id: 12, name: "Tiramisu", category: "Desserts", price: 220, description: "Italian classic of espresso-soaked ladyfingers and mascarpone cream", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80" },
  { id: 13, name: "Mango Lassi", category: "Drinks", price: 100, description: "Chilled yogurt-based drink blended with fresh Alphonso mango pulp", image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80" },
  { id: 14, name: "Masala Chai", category: "Drinks", price: 60, description: "Aromatic spiced tea brewed with ginger, cardamom and cinnamon", image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80" },
  { id: 15, name: "Virgin Mojito", category: "Drinks", price: 130, description: "Refreshing mint and lime cooler with soda, perfect for warm days", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80" },
  { id: 16, name: "Filter Coffee", category: "Drinks", price: 80, description: "South Indian decoction coffee served with frothy hot milk", image: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=400&q=80" },

  // --- NEW DEMO DISHES ---
  // Starters
  { id: 17, name: "Chicken Seekh Kebab", category: "Starter", price: 260, description: "Minced chicken mixed with herbs and spices, skewered and charcoal-grilled to perfection", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80" },
  { id: 18, name: "Samosa Chaat", category: "Starter", price: 130, description: "Crispy samosas crushed and topped with chickpeas, chutneys, yogurt and sev", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80" },
  { id: 19, name: "Tandoori Mushrooms", category: "Starter", price: 190, description: "Button mushrooms marinated in spiced yogurt and roasted in the tandoor oven", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },

  // Main Course
  { id: 20, name: "Lamb Rogan Josh", category: "Main Course", price: 420, description: "Slow-braised Kashmiri lamb with whole spices, dried chilies and aromatic gravy", image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=400&q=80" },
  { id: 21, name: "Palak Paneer", category: "Main Course", price: 260, description: "Cottage cheese cubes in a velvety spiced spinach gravy with a touch of cream", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80" },
  { id: 22, name: "Hyderabadi Biryani", category: "Main Course", price: 380, description: "Fragrant basmati rice layered with slow-cooked spiced meat, saffron and fried onions", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80" },
  { id: 23, name: "Prawn Masala", category: "Main Course", price: 450, description: "Juicy tiger prawns tossed in a bold coastal spice masala with kokum and coconut", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80" },

  // Desserts
  { id: 24, name: "Rasmalai", category: "Desserts", price: 160, description: "Soft cottage cheese patties soaked in chilled saffron-cardamom milk, garnished with pistachios", image: "https://images.unsplash.com/photo-1590080875897-4f18d5d2d53b?w=400&q=80" },
  { id: 25, name: "Paan Ice Cream", category: "Desserts", price: 150, description: "House-made betel leaf ice cream with gulkand and candied fennel — a true Bombay original", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80" },

  // Drinks
  { id: 26, name: "Rose Sharbat", category: "Drinks", price: 90, description: "Chilled rose syrup drink with basil seeds and a squeeze of fresh lime", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
  { id: 27, name: "Watermelon Mint Cooler", category: "Drinks", price: 120, description: "Freshly blended watermelon with mint, black salt and a hint of chaat masala", image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&q=80" },
  { id: 28, name: "Cold Brew Coffee", category: "Drinks", price: 150, description: "12-hour slow-steeped cold brew, served over ice with a hint of vanilla", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80" }
];

let orders = [];
let nextId = 29;

// GET all menu items
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// POST place order
app.post('/api/order', (req, res) => {
  const { items, total } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  const order = {
    id: orders.length + 1,
    items,
    total,
    timestamp: new Date().toISOString(),
    status: 'Received'
  };
  orders.push(order);
  console.log('New Order:', JSON.stringify(order, null, 2));
  res.json({ success: true, orderId: order.id, message: 'Order placed successfully!' });
});

// POST add dish (admin)
app.post('/api/admin/add', (req, res) => {
  const { name, category, price, description, image } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category and price are required' });
  }
  const newItem = { id: nextId++, name, category, price: parseFloat(price), description: description || '', image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' };
  menuItems.push(newItem);
  res.json({ success: true, item: newItem });
});

// PUT edit dish (admin)
app.put('/api/admin/edit/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = menuItems.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  menuItems[idx] = { ...menuItems[idx], ...req.body, id };
  res.json({ success: true, item: menuItems[idx] });
});

// DELETE dish (admin)
app.delete('/api/admin/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = menuItems.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  menuItems.splice(idx, 1);
  res.json({ success: true });
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️  Spice Garden server running at http://localhost:${PORT}`);
});