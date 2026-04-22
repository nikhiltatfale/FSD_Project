const express=require('express');const path=require('path');const app=express();app.use(express.json());app.use(express.static(path.join(__dirname,'public')));
const ADMIN={username:'admin',password:'admin123'};
let events=[
{id:1,name:'Coldplay World Tour',date:'2025-08-15',location:'Mumbai, Maharashtra',price:2500,totalSeats:500,availableSeats:320,description:'Experience the magic of Coldplay live with their Music of the Spheres World Tour. Spectacular light shows, confetti cannons, and unforgettable music.'},
{id:2,name:'Tech Summit 2025',date:'2025-09-10',location:'Bangalore, Karnataka',price:1200,totalSeats:300,availableSeats:150,description:'Indias biggest tech conference featuring talks from top engineers, startup founders, and product leaders from Google, Microsoft, and more.'},
{id:3,name:'Sunburn Festival',date:'2025-12-20',location:'Pune, Maharashtra',price:3000,totalSeats:2000,availableSeats:1800,description:'Asias biggest electronic music festival returns to Pune with world-class DJs, immersive art installations, and three days of non-stop energy.'},
{id:4,name:'Standup Comedy Night',date:'2025-07-05',location:'Delhi, NCR',price:800,totalSeats:200,availableSeats:0,description:'A sold-out evening with Indias top standup comedians. Laughter guaranteed.'}
];
let bookings=[];
let nextBookingId=1001;
let nextEventId=5;

app.get('/api/events',(req,res)=>res.json(events));
app.get('/api/events/:id',(req,res)=>{const e=events.find(x=>x.id==req.params.id);e?res.json(e):res.status(404).json({error:'Event not found'});});
app.post('/api/book',(req,res)=>{
const{eventId,name,email,phone,tickets}=req.body;
if(!eventId||!name||!email||!phone||!tickets)return res.status(400).json({error:'All fields required'});
const e=events.find(x=>x.id==eventId);
if(!e)return res.status(404).json({error:'Event not found'});
if(e.availableSeats<tickets)return res.status(400).json({error:'Not enough seats available'});
e.availableSeats-=tickets;
const b={bookingId:'BK'+nextBookingId++,eventId:e.id,eventName:e.name,name,email,phone,tickets:Number(tickets)};
bookings.push(b);
res.json(b);
});

app.post('/api/admin/login',(req,res)=>{
const{username,password}=req.body;
if(username===ADMIN.username&&password===ADMIN.password)res.json({success:true});
else res.status(401).json({error:'Invalid credentials'});
});
app.post('/api/admin/event',(req,res)=>{
const{name,date,location,price,totalSeats,description}=req.body;
if(!name||!date||!location||!price||!totalSeats)return res.status(400).json({error:'All fields required'});
const e={id:nextEventId++,name,date,location,price:Number(price),totalSeats:Number(totalSeats),availableSeats:Number(totalSeats),description:description||''};
events.push(e);res.json(e);
});
app.put('/api/admin/event/:id',(req,res)=>{
const i=events.findIndex(x=>x.id==req.params.id);
if(i===-1)return res.status(404).json({error:'Event not found'});
const{name,date,location,price,totalSeats,description}=req.body;
events[i]={...events[i],name:name||events[i].name,date:date||events[i].date,location:location||events[i].location,price:price?Number(price):events[i].price,totalSeats:totalSeats?Number(totalSeats):events[i].totalSeats,description:description||events[i].description};
res.json(events[i]);
});
app.delete('/api/admin/event/:id',(req,res)=>{
const i=events.findIndex(x=>x.id==req.params.id);
if(i===-1)return res.status(404).json({error:'Event not found'});
events.splice(i,1);res.json({success:true});
});
app.get('/api/admin/bookings',(req,res)=>res.json(bookings));
app.delete('/api/admin/booking/:id',(req,res)=>{
const i=bookings.findIndex(x=>x.bookingId===req.params.id);
if(i===-1)return res.status(404).json({error:'Booking not found'});
bookings.splice(i,1);res.json({success:true});
});

app.listen(3000,()=>console.log('Server running at http://localhost:3000'));