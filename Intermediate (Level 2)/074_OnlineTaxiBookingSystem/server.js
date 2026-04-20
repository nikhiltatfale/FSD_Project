const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

let rides = [];
let rideCounter = 1;

function calcFare(carType) {
  const km = Math.floor(Math.random() * 20) + 2;
  const rates = { Mini: [10, 50], Sedan: [15, 70], SUV: [20, 100] };
  const [perKm, base] = rates[carType] || [10, 50];
  return { fare: perKm * km + base, distance: km };
}

app.post('/bookRide', (req, res) => {
  const { userName, phone, pickup, drop, carType } = req.body;
  if (!userName || !phone || !pickup || !drop || !carType) return res.status(400).json({ error: 'All fields required' });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone' });
  const { fare, distance } = calcFare(carType);
  const ride = { rideId: rideCounter++, userName, phone, pickup, drop, carType, fare, distance, status: 'Pending', driverName: null, createdAt: Date.now() };
  rides.push(ride);
  res.json(ride);
});

app.get('/rides', (req, res) => res.json(rides));

app.post('/acceptRide', (req, res) => {
  const { rideId, driverName } = req.body;
  const ride = rides.find(r => r.rideId == rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'Pending') return res.status(400).json({ error: 'Ride not available' });
  const driverBusy = rides.find(r => r.driverName === driverName && ['Accepted', 'Started'].includes(r.status));
  if (driverBusy) return res.status(400).json({ error: 'Driver already on a ride' });
  ride.status = 'Accepted';
  ride.driverName = driverName;
  res.json(ride);
});

app.post('/startRide', (req, res) => {
  const { rideId, driverName } = req.body;
  const ride = rides.find(r => r.rideId == rideId && r.driverName === driverName);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'Accepted') return res.status(400).json({ error: 'Cannot start ride' });
  ride.status = 'Started';
  res.json(ride);
});

app.post('/completeRide', (req, res) => {
  const { rideId, driverName } = req.body;
  const ride = rides.find(r => r.rideId == rideId && r.driverName === driverName);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'Started') return res.status(400).json({ error: 'Cannot complete ride' });
  ride.status = 'Completed';
  res.json(ride);
});

app.post('/cancelRide', (req, res) => {
  const { rideId } = req.body;
  const ride = rides.find(r => r.rideId == rideId);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'Pending') return res.status(400).json({ error: 'Cannot cancel after driver assigned' });
  ride.status = 'Cancelled';
  res.json(ride);
});

app.get('/adminData', (req, res) => {
  const users = [...new Map(rides.map(r => [r.phone, { name: r.userName, phone: r.phone }])).values()];
  const drivers = [...new Set(rides.filter(r => r.driverName).map(r => r.driverName))].map(name => ({
    name,
    earnings: rides.filter(r => r.driverName === name && r.status === 'Completed').reduce((s, r) => s + r.fare, 0),
    rides: rides.filter(r => r.driverName === name).length
  }));
  const totalEarnings = rides.filter(r => r.status === 'Completed').reduce((s, r) => s + r.fare, 0);
  res.json({ rides, users, drivers, totalEarnings });
});

app.post('/deleteRide', (req, res) => {
  const { rideId } = req.body;
  rides = rides.filter(r => r.rideId != rideId);
  res.json({ ok: true });
});

app.post('/reset', (req, res) => {
  rides = [];
  rideCounter = 1;
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));