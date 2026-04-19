const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const SHOWS = ['10AM','2PM','7PM'];
function makeSeats(){return Array(36).fill(false);}
function makeShows(){return{['10AM']:makeSeats(),['2PM']:makeSeats(),['7PM']:makeSeats()};}

let movies=[
  {id:1,title:'Chhaava',language:'Hindi',duration:'2h 37m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Chhaava_film_poster.jpg/220px-Chhaava_film_poster.jpg',shows:makeShows()},
  {id:2,title:'Singham Again',language:'Hindi',duration:'2h 24m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Singham_Again.jpg/220px-Singham_Again.jpg',shows:makeShows()},
  {id:3,title:'Bhool Bhulaiyaa 3',language:'Hindi',duration:'2h 24m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Bhool_Bhulaiyaa_3_poster.jpg/220px-Bhool_Bhulaiyaa_3_poster.jpg',shows:makeShows()},
  {id:4,title:'Stree 2',language:'Hindi',duration:'2h 17m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/3/31/Stree_2_poster.jpg/220px-Stree_2_poster.jpg',shows:makeShows()},
  {id:5,title:'Kalki 2898 AD',language:'Telugu',duration:'3h 1m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Kalki_2898_AD_poster.jpg/220px-Kalki_2898_AD_poster.jpg',shows:makeShows()},
  {id:6,title:'Fighter',language:'Hindi',duration:'2h 46m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/Fighter_2024_film_poster.jpg/220px-Fighter_2024_film_poster.jpg',shows:makeShows()},
  {id:7,title:'Animal',language:'Hindi',duration:'3h 21m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/Animal_2023_film_poster.jpg/220px-Animal_2023_film_poster.jpg',shows:makeShows()},
  {id:8,title:'Jawan',language:'Hindi',duration:'2h 49m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Jawan_film_poster.jpg/220px-Jawan_film_poster.jpg',shows:makeShows()},
  {id:9,title:'Dunki',language:'Hindi',duration:'2h 41m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/5/57/Dunki_film_poster.jpg/220px-Dunki_film_poster.jpg',shows:makeShows()},
  {id:10,title:'Tiger 3',language:'Hindi',duration:'2h 24m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/e/e7/Tiger_3_film_poster.jpg/220px-Tiger_3_film_poster.jpg',shows:makeShows()},
  {id:11,title:'Sam Bahadur',language:'Hindi',duration:'2h 27m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Sam_Bahadur_film_poster.jpg/220px-Sam_Bahadur_film_poster.jpg',shows:makeShows()},
  {id:12,title:'Laapataa Ladies',language:'Hindi',duration:'2h 1m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Laapataa_Ladies_poster.jpg/220px-Laapataa_Ladies_poster.jpg',shows:makeShows()},
  {id:13,title:'Shaitaan',language:'Hindi',duration:'2h 12m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Shaitaan_film_poster.jpg/220px-Shaitaan_film_poster.jpg',shows:makeShows()},
  {id:14,title:'Teri Baaton Mein Aisa Uljha Jiya',language:'Hindi',duration:'2h 18m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/7/76/Teri_Baaton_Mein_Aisa_Uljha_Jiya_poster.jpg/220px-Teri_Baaton_Mein_Aisa_Uljha_Jiya_poster.jpg',shows:makeShows()},
  {id:15,title:'Article 370',language:'Hindi',duration:'2h 19m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Article_370_film_poster.jpg/220px-Article_370_film_poster.jpg',shows:makeShows()},
  {id:16,title:'Crew',language:'Hindi',duration:'2h 0m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Crew_2024_film_poster.jpg/220px-Crew_2024_film_poster.jpg',shows:makeShows()},
  {id:17,title:'Maidaan',language:'Hindi',duration:'2h 57m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Maidaan_film_poster.jpg/220px-Maidaan_film_poster.jpg',shows:makeShows()},
  {id:18,title:'Yodha',language:'Hindi',duration:'2h 10m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/6/63/Yodha_2024_film_poster.jpg/220px-Yodha_2024_film_poster.jpg',shows:makeShows()},
  {id:19,title:'Madgaon Express',language:'Hindi',duration:'2h 9m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Madgaon_Express_poster.jpg/220px-Madgaon_Express_poster.jpg',shows:makeShows()},
  {id:20,title:'Munjya',language:'Hindi',duration:'1h 57m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/3/38/Munjya_film_poster.jpg/220px-Munjya_film_poster.jpg',shows:makeShows()},
  {id:21,title:'HanuMan',language:'Telugu',duration:'2h 17m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/HanuMan_film_poster.jpg/220px-HanuMan_film_poster.jpg',shows:makeShows()},
  {id:22,title:'Leo',language:'Tamil',duration:'2h 44m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Leo_2023_film_poster.jpg/220px-Leo_2023_film_poster.jpg',shows:makeShows()},
  {id:23,title:'Salaar',language:'Telugu',duration:'2h 53m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Salaar_film_poster.jpg/220px-Salaar_film_poster.jpg',shows:makeShows()},
  {id:24,title:'Gadar 2',language:'Hindi',duration:'2h 50m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Gadar_2_film_poster.jpg/220px-Gadar_2_film_poster.jpg',shows:makeShows()},
  {id:25,title:'OMG 2',language:'Hindi',duration:'2h 26m',poster:'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/OMG_2_film_poster.jpg/220px-OMG_2_film_poster.jpg',shows:makeShows()}
];

let bookings=[];
let nextId=26;
const locks=new Set();

app.get('/movies',(req,res)=>res.json(movies));

app.get('/seats/:movieId/:time',(req,res)=>{
  const m=movies.find(x=>x.id==req.params.movieId);
  if(!m)return res.status(404).json({error:'Movie not found'});
  const s=m.shows[req.params.time];
  if(!s)return res.status(404).json({error:'Show not found'});
  res.json(s);
});

app.post('/book',(req,res)=>{
  const{movieId,showTime,seats,name,phone}=req.body;
  if(!movieId||!showTime||!seats||!name||!phone)return res.status(400).json({error:'Missing fields'});
  const lockKey=`${movieId}-${showTime}`;
  if(locks.has(lockKey))return res.status(409).json({error:'Another booking in progress, try again'});
  locks.add(lockKey);
  try{
    const m=movies.find(x=>x.id==movieId);
    if(!m)return res.status(404).json({error:'Movie not found'});
    const show=m.shows[showTime];
    if(!show)return res.status(404).json({error:'Show not found'});
    for(const i of seats){
      if(show[i])return res.status(409).json({error:`Seat ${i+1} already booked`});
    }
    for(const i of seats)show[i]=true;
    bookings.push({id:bookings.length+1,movieId,movieTitle:m.title,showTime,seats:seats.map(i=>i+1),name,phone,time:new Date().toLocaleString('en-IN')});
    res.json({success:true,message:'Booking confirmed!'});
  }finally{locks.delete(lockKey);}
});

app.get('/bookings',(req,res)=>res.json(bookings));

app.post('/addMovie',(req,res)=>{
  const{title,poster,duration,language}=req.body;
  if(!title)return res.status(400).json({error:'Title required'});
  const m={id:nextId++,title,poster:poster||'https://via.placeholder.com/220x330?text=No+Poster',duration:duration||'N/A',language:language||'Hindi',shows:makeShows()};
  movies.push(m);
  res.json(m);
});

app.delete('/deleteMovie/:id',(req,res)=>{
  const idx=movies.findIndex(x=>x.id==req.params.id);
  if(idx===-1)return res.status(404).json({error:'Not found'});
  movies.splice(idx,1);
  res.json({success:true});
});

app.post('/reset',(req,res)=>{
  movies.forEach(m=>{m.shows=makeShows();});
  bookings=[];
  res.json({success:true});
});

app.listen(3000,()=>console.log('Server running on http://localhost:3000'));