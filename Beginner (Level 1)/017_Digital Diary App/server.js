const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

// In-memory storage
let customers = [];
let milkRecords = [];
let payments = {};

let customerIdCounter = 1;
let recordIdCounter = 1;

// ── Customer Routes ──────────────────────────────────────
app.post('/addCustomer', (req, res) => {
  const { name, phone, address, milkType, rate } = req.body;
  if (!name || !phone || !address || !milkType || !rate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone must be 10 digits' });
  }
  const customer = {
    id: customerIdCounter++,
    name,
    phone,
    address,
    milkType,
    rate: parseFloat(rate),
    createdAt: new Date().toISOString()
  };
  customers.push(customer);
  payments[customer.id] = { paid: 0, status: 'Unpaid' };
  res.json({ success: true, customer });
});

app.get('/customers', (req, res) => {
  res.json(customers);
});

app.put('/editCustomer/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  const { name, phone, address, milkType, rate } = req.body;
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone must be 10 digits' });
  }
  customers[idx] = { ...customers[idx], name, phone, address, milkType, rate: parseFloat(rate) };
  res.json({ success: true, customer: customers[idx] });
});

app.delete('/deleteCustomer/:id', (req, res) => {
  const id = parseInt(req.params.id);
  customers = customers.filter(c => c.id !== id);
  delete payments[id];
  res.json({ success: true });
});

// ── Milk Entry Routes ────────────────────────────────────
app.post('/addMilk', (req, res) => {
  const { customerId, morning, evening, date } = req.body;
  const customer = customers.find(c => c.id === parseInt(customerId));
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const totalMilk = parseFloat(morning || 0) + parseFloat(evening || 0);
  const totalAmount = totalMilk * customer.rate;
  const entryDate = date || new Date().toISOString().split('T')[0];

  const record = {
    id: recordIdCounter++,
    customerId: customer.id,
    customerName: customer.name,
    milkType: customer.milkType,
    rate: customer.rate,
    morning: parseFloat(morning || 0),
    evening: parseFloat(evening || 0),
    totalMilk,
    totalAmount,
    date: entryDate
  };
  milkRecords.push(record);
  res.json({ success: true, record });
});

app.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = milkRecords.filter(r => r.date === today);
  const totalMilk = todayRecords.reduce((sum, r) => sum + r.totalMilk, 0);
  const totalAmount = todayRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  res.json({ records: todayRecords, totalMilk, totalAmount });
});

app.get('/monthly/:customerId', (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const { month, year } = req.query;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const now = new Date();
  const targetMonth = parseInt(month) || now.getMonth() + 1;
  const targetYear = parseInt(year) || now.getFullYear();

  const records = milkRecords.filter(r => {
    const d = new Date(r.date);
    return r.customerId === customerId &&
      d.getMonth() + 1 === targetMonth &&
      d.getFullYear() === targetYear;
  });

  const totalMilk = records.reduce((sum, r) => sum + r.totalMilk, 0);
  const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const paid = payments[customerId]?.paid || 0;
  const pending = totalAmount - paid;

  res.json({ customer, records, totalMilk, totalAmount, paid, pending });
});

// ── Payment Routes ───────────────────────────────────────
app.post('/payment', (req, res) => {
  const { customerId, amount, status } = req.body;
  const id = parseInt(customerId);
  if (!payments[id]) payments[id] = { paid: 0, status: 'Unpaid' };
  if (amount) payments[id].paid += parseFloat(amount);
  if (status) payments[id].status = status;
  res.json({ success: true, payment: payments[id] });
});

app.get('/payments', (req, res) => {
  const result = customers.map(c => {
    const customerRecords = milkRecords.filter(r => r.customerId === c.id);
    const totalDue = customerRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const paid = payments[c.id]?.paid || 0;
    return {
      customerId: c.id,
      customerName: c.name,
      phone: c.phone,
      totalDue,
      paid,
      pending: totalDue - paid,
      status: payments[c.id]?.status || 'Unpaid'
    };
  });
  res.json(result);
});

// ── Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🥛 Digital Dairy running at http://localhost:${PORT}`);
});