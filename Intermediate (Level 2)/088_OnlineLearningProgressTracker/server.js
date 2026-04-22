const express=require('express');
const app=express();
app.use(express.json());
app.use(express.static('public'));
let users={};
let sessions={};
let timers={};
function auth(req,res,next){
const t=req.headers['x-token'];
if(!t||!sessions[t])return res.status(401).json({error:'Unauthorized'});
req.email=sessions[t];
next();
}
app.post('/api/register',(req,res)=>{
const{name,email,password}=req.body;
if(!name||!email||!password)return res.json({error:'All fields required'});
if(users[email])return res.json({error:'Email already registered'});
users[email]={name,password,courses:[],totalTime:0};
res.json({success:true});
});
app.post('/api/login',(req,res)=>{
const{email,password}=req.body;
if(!users[email]||users[email].password!==password)return res.json({error:'Invalid credentials'});
const token=Math.random().toString(36).slice(2)+Date.now();
sessions[token]=email;
res.json({token,name:users[email].name});
});
app.post('/api/logout',auth,(req,res)=>{
const t=req.headers['x-token'];
delete sessions[t];
res.json({success:true});
});
app.get('/api/dashboard',auth,(req,res)=>{
const u=users[req.email];
const total=u.courses.reduce((a,c)=>a+c.totalTopics,0);
const done=u.courses.reduce((a,c)=>a+c.completedTopics,0);
res.json({name:u.name,courses:u.courses,totalTime:u.totalTime,totalTopics:total,completedTopics:done,progress:total?Math.round(done/total*100):0});
});
app.post('/api/add-course',auth,(req,res)=>{
const{courseName,totalTopics}=req.body;
if(!courseName||!totalTopics||totalTopics<1)return res.json({error:'Invalid course data'});
users[req.email].courses.push({id:Date.now(),courseName,totalTopics:parseInt(totalTopics),completedTopics:0,timeSpent:0,topics:[]});
res.json({success:true});
});
app.post('/api/mark-topic',auth,(req,res)=>{
const{courseId,topicIndex}=req.body;
const u=users[req.email];
const c=u.courses.find(x=>x.id===courseId);
if(!c)return res.json({error:'Course not found'});
if(topicIndex>=c.totalTopics)return res.json({error:'Invalid topic'});
if(!c.topics[topicIndex]){c.topics[topicIndex]=Date.now();c.completedTopics++;}
res.json({success:true,completedTopics:c.completedTopics});
});
app.delete('/api/delete-course',auth,(req,res)=>{
const{courseId}=req.body;
const u=users[req.email];
u.courses=u.courses.filter(x=>x.id!==courseId);
res.json({success:true});
});
app.post('/api/start-timer',auth,(req,res)=>{
if(timers[req.email])return res.json({error:'Timer already running'});
timers[req.email]=Date.now();
res.json({success:true});
});
app.post('/api/stop-timer',auth,(req,res)=>{
const{courseId}=req.body;
if(!timers[req.email])return res.json({error:'No timer running'});
const elapsed=Math.floor((Date.now()-timers[req.email])/1000);
delete timers[req.email];
const u=users[req.email];
u.totalTime+=elapsed;
if(courseId){const c=u.courses.find(x=>x.id===courseId);if(c)c.timeSpent+=elapsed;}
res.json({success:true,elapsed});
});
app.post('/api/admin-login',(req,res)=>{
const{username,password}=req.body;
if(username==='admin'&&password==='admin123')return res.json({success:true});
res.json({error:'Invalid admin credentials'});
});
app.get('/api/admin/users',(req,res)=>{
if(req.headers['x-admin']!=='admin123')return res.status(401).json({error:'Unauthorized'});
const list=Object.entries(users).map(([email,u])=>({email,name:u.name,courses:u.courses.length,totalTime:u.totalTime,progress:u.courses.reduce((a,c)=>a+c.totalTopics,0)?Math.round(u.courses.reduce((a,c)=>a+c.completedTopics,0)/u.courses.reduce((a,c)=>a+c.totalTopics,0)*100):0}));
const stats={totalUsers:list.length,totalCourses:Object.values(users).reduce((a,u)=>a+u.courses.length,0),totalCompleted:Object.values(users).reduce((a,u)=>a+u.courses.reduce((b,c)=>b+c.completedTopics,0),0)};
res.json({users:list,stats});
});
app.get('/api/admin/user/:email',(req,res)=>{
if(req.headers['x-admin']!=='admin123')return res.status(401).json({error:'Unauthorized'});
const u=users[req.params.email];
if(!u)return res.json({error:'User not found'});
res.json({...u,email:req.params.email});
});
app.delete('/api/admin/user/:email',(req,res)=>{
if(req.headers['x-admin']!=='admin123')return res.status(401).json({error:'Unauthorized'});
delete users[req.params.email];
res.json({success:true});
});
app.post('/api/admin/reset',(req,res)=>{
if(req.headers['x-admin']!=='admin123')return res.status(401).json({error:'Unauthorized'});
users={};sessions={};timers={};
res.json({success:true});
});
app.listen(3000,()=>console.log('Server running on port 3000'));