const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

let travels = [
  {id:'T1',type:'Flight',from:'Mumbai',to:'Delhi',date:'2026-05-01',time:'06:00',price:4500},
  {id:'T2',type:'Train',from:'Mumbai',to:'Pune',date:'2026-05-01',time:'07:30',price:350},
  {id:'T3',type:'Bus',from:'Delhi',to:'Agra',date:'2026-05-02',time:'08:00',price:250},
  {id:'T4',type:'Hotel',from:'Goa',to:'Goa',date:'2026-05-03',time:'Check-in 12:00',price:3000},
  {id:'T5',type:'Flight',from:'Delhi',to:'Bangalore',date:'2026-05-02',time:'09:15',price:5200}
];
let bookings = [];
let counter = 1;

app.get('/api/travel',(req,res)=>{
  const {from,to,date,type}=req.query;
  let result=travels.filter(t=>{
    return (!from||t.from.toLowerCase().includes(from.toLowerCase()))&&
           (!to||t.to.toLowerCase().includes(to.toLowerCase()))&&
           (!date||t.date===date)&&
           (!type||t.type===type);
  });
  res.json(result);
});

app.post('/api/travel',(req,res)=>{
  const t={...req.body,id:'T'+Date.now()};
  travels.push(t);
  res.json(t);
});

app.delete('/api/travel/:id',(req,res)=>{
  travels=travels.filter(t=>t.id!==req.params.id);
  res.json({ok:true});
});

app.post('/api/book',(req,res)=>{
  const {name,email,phone,travelId}=req.body;
  if(!name||!email||!phone||!travelId) return res.status(400).json({error:'All fields required'});
  const travel=travels.find(t=>t.id===travelId);
  if(!travel) return res.status(404).json({error:'Travel not found'});
  const booking={bookingId:'BK'+String(counter++).padStart(4,'0'),name,email,phone,travelId,travel};
  bookings.push(booking);
  res.json(booking);
});

app.get('/api/bookings/:email',(req,res)=>{
  res.json(bookings.filter(b=>b.email===req.params.email));
});

app.get('/api/allbookings',(req,res)=>{
  res.json(bookings);
});

app.post('/api/admin/login',(req,res)=>{
  const {username,password}=req.body;
  if(username==='admin'&&password==='admin123') res.json({ok:true});
  else res.status(401).json({error:'Invalid credentials'});
});

app.listen(3000,()=>console.log('Server running on http://localhost:3000'));