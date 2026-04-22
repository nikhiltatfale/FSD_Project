const ADMIN = {user:'admin',pass:'admin123'};
const DEFAULT_PRODUCTS = [
{id:1,name:'iPhone 15 Pro',price:134900,brand:'Apple',category:'Smartphones',rating:4.8,image:'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&h=300&fit=crop',features:['A17 Pro chip','48MP camera','Titanium design','USB-C'],specs:{Display:'6.1" Super Retina XDR',RAM:'8GB',Storage:'256GB',Battery:'3274mAh',OS:'iOS 17'}},
{id:2,name:'Samsung Galaxy S24 Ultra',price:129999,brand:'Samsung',category:'Smartphones',rating:4.7,image:'https://images.unsplash.com/photo-1706220837494-8c5e14cc2d05?w=400&h=300&fit=crop',features:['Snapdragon 8 Gen 3','200MP camera','S Pen included','7 year updates'],specs:{Display:'6.8" Dynamic AMOLED',RAM:'12GB',Storage:'256GB',Battery:'5000mAh',OS:'Android 14'}},
{id:3,name:'Sony WH-1000XM5',price:29990,brand:'Sony',category:'Audio',rating:4.9,image:'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop',features:['Industry-best ANC','30hr battery','Multipoint connect','Speak-to-chat'],specs:{Type:'Over-ear',Driver:'30mm',Frequency:'4Hz-40kHz',Charging:'USB-C',Weight:'250g'}},
{id:4,name:'MacBook Air M3',price:114900,brand:'Apple',category:'Laptops',rating:4.8,image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',features:['Apple M3 chip','18hr battery','15.3" Liquid Retina','MagSafe charging'],specs:{CPU:'Apple M3',RAM:'16GB',Storage:'512GB SSD',Display:'15.3" 2880x1864',Weight:'1.51kg'}},
{id:5,name:'Dell XPS 15',price:159990,brand:'Dell',category:'Laptops',rating:4.5,image:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop',features:['Intel Core i9','RTX 4060','4K OLED display','InfinityEdge'],specs:{CPU:'Intel i9-13900H',RAM:'32GB DDR5',Storage:'1TB NVMe',Display:'15.6" 4K OLED',Weight:'1.86kg'}},
{id:6,name:'iPad Pro M4',price:99900,brand:'Apple',category:'Tablets',rating:4.7,image:'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',features:['Apple M4 chip','Ultra Retina XDR','Apple Pencil Pro','Landscape camera'],specs:{Display:'11" OLED',RAM:'8GB',Storage:'256GB',Chip:'Apple M4',Battery:'31.9Wh'}},
{id:7,name:'OnePlus 12',price:64999,brand:'OnePlus',category:'Smartphones',rating:4.5,image:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',features:['Snapdragon 8 Gen 3','Hasselblad camera','100W SuperVOOC','120Hz ProXDR'],specs:{Display:'6.82" LTPO AMOLED',RAM:'16GB',Storage:'512GB',Battery:'5400mAh',OS:'Android 14'}},
{id:8,name:'Bose QuietComfort 45',price:24990,brand:'Bose',category:'Audio',rating:4.6,image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',features:['World-class ANC','24hr battery','Aware mode','Comfortable fit'],specs:{Type:'Over-ear',Driver:'35mm',Frequency:'20Hz-20kHz',Charging:'USB-C',Weight:'238g'}}
];

let products = [];
let compareList = [];
let editingId = null;

function loadData(){
const saved = localStorage.getItem('cx_products');
products = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}

function saveData(){
localStorage.setItem('cx_products',JSON.stringify(products));
}

function showView(v){
document.querySelectorAll('.view').forEach(el=>el.classList.add('hidden'));
document.getElementById('view-'+v).classList.remove('hidden');
if(v==='home')renderProducts(products);
if(v==='compare')renderCompare();
if(v==='admin'&&!isLoggedIn()){showView('admin-login');return;}
if(v==='admin')renderAdminTable();
}

function isLoggedIn(){return localStorage.getItem('cx_admin')==='1';}

function adminLogin(){
const u=document.getElementById('login-user').value.trim();
const p=document.getElementById('login-pass').value;
if(u===ADMIN.user&&p===ADMIN.pass){
localStorage.setItem('cx_admin','1');
showView('admin');
}else{
document.getElementById('login-error').textContent='Invalid credentials';
}
}

function adminLogout(){
localStorage.removeItem('cx_admin');
showView('home');
}

function stars(r){
const full=Math.floor(r),half=r%1>=0.5?1:0,empty=5-full-half;
return '★'.repeat(full)+(half?'½':'')+' '+r.toFixed(1);
}

function renderProducts(list){
const grid=document.getElementById('product-grid');
if(!list.length){grid.innerHTML='<div style="text-align:center;padding:4rem;color:var(--muted)">No products found</div>';return;}
grid.innerHTML=list.map(p=>`
<div class="product-card${compareList.includes(p.id)?' selected':''}" id="pc-${p.id}">
${p.image?`<img class="card-img" src="${p.image}" alt="${p.name}" onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'>📦</div>'">`:'<div class="card-img-placeholder">📦</div>'}
<div class="card-body">
<div class="card-category">${p.category}</div>
<div class="card-name">${p.name}</div>
<div class="card-brand">${p.brand}</div>
<div class="card-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
<div class="card-rating"><span class="stars">${stars(p.rating)}</span></div>
</div>
<div class="card-actions">
<button class="btn-compare${compareList.includes(p.id)?' active':''}" onclick="toggleCompare(${p.id})">${compareList.includes(p.id)?'✓ Added':'+ Compare'}</button>
</div>
</div>`).join('');
updateBadge();
}

function toggleCompare(id){
const i=compareList.indexOf(id);
if(i>-1){compareList.splice(i,1);}
else{compareList.push(id);}
applyFilters();
updateBadge();
}

function updateBadge(){
document.getElementById('compare-count').textContent=compareList.length;
}

function clearComparison(){
compareList=[];
renderCompare();
updateBadge();
}

function renderCompare(){
const c=document.getElementById('compare-container');
const sel=products.filter(p=>compareList.includes(p.id));
if(!sel.length){c.innerHTML='<div class="no-compare"><h3>Nothing to compare</h3><p>Select products from the Products view</p></div>';return;}
const allSpecs=[...new Set(sel.flatMap(p=>Object.keys(p.specs||{})))];
const allFeatures='Features';
const prices=sel.map(p=>p.price);
const minPrice=Math.min(...prices);
c.innerHTML=`<div class="compare-table-wrap"><table class="compare-table">
<thead><tr><th>Attribute</th>${sel.map(p=>`<th><img class="compare-img" src="${p.image||''}" onerror="this.style.display='none'">${p.name}<br><small style="color:var(--muted);font-weight:400">${p.brand}</small></th>`).join('')}</tr></thead>
<tbody>
<tr><td class="row-label">Price</td>${sel.map(p=>`<td class="${p.price===minPrice?'highlight':''}">₹${Number(p.price).toLocaleString('en-IN')}</td>`).join('')}</tr>
<tr><td class="row-label">Rating</td>${sel.map(p=>`<td><span class="stars">${stars(p.rating)}</span></td>`).join('')}</tr>
<tr><td class="row-label">Category</td>${sel.map(p=>`<td>${p.category}</td>`).join('')}</tr>
<tr><td class="row-label">Features</td>${sel.map(p=>`<td>${(p.features||[]).map(f=>`<span class="tag">${f}</span>`).join(' ')}</td>`).join('')}</tr>
${allSpecs.map(k=>`<tr><td class="row-label">${k}</td>${sel.map(p=>`<td>${(p.specs||{})[k]||'—'}</td>`).join('')}</tr>`).join('')}
</tbody></table></div>`;
}

function applyFilters(){
const search=document.getElementById('search-input').value.toLowerCase();
const cat=document.getElementById('filter-category').value;
const rat=parseFloat(document.getElementById('filter-rating').value)||0;
const sort=document.getElementById('sort-price').value;
const maxP=parseFloat(document.getElementById('filter-price').value)||Infinity;
let list=products.filter(p=>{
return(!search||p.name.toLowerCase().includes(search)||p.brand.toLowerCase().includes(search))&&
(!cat||p.category===cat)&&
(p.rating>=rat)&&
(p.price<=maxP);
});
if(sort==='asc')list.sort((a,b)=>a.price-b.price);
if(sort==='desc')list.sort((a,b)=>b.price-a.price);
renderProducts(list);
}

function populateCategories(){
const cats=[...new Set(products.map(p=>p.category))].sort();
const sel=document.getElementById('filter-category');
const cur=sel.value;
sel.innerHTML='<option value="">All Categories</option>'+cats.map(c=>`<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');
}

function renderAdminTable(){
const w=document.getElementById('admin-table-wrap');
w.innerHTML=`<div class="admin-table-wrap"><table class="admin-table">
<thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Rating</th><th>Actions</th></tr></thead>
<tbody>${products.map(p=>`<tr>
<td>${p.name}</td><td>${p.brand}</td><td>${p.category}</td>
<td>₹${Number(p.price).toLocaleString('en-IN')}</td><td>${p.rating}</td>
<td class="actions"><button class="btn-edit" onclick="openProductForm(${p.id})">Edit</button><button class="btn-danger" onclick="deleteProduct(${p.id})">Delete</button></td>
</tr>`).join('')}</tbody></table></div>`;
}

function openProductForm(id){
editingId=id||null;
document.getElementById('modal-title').textContent=id?'Edit Product':'Add Product';
const p=id?products.find(x=>x.id===id):{};
document.getElementById('form-id').value=p.id||'';
document.getElementById('form-name').value=p.name||'';
document.getElementById('form-price').value=p.price||'';
document.getElementById('form-brand').value=p.brand||'';
document.getElementById('form-category').value=p.category||'';
document.getElementById('form-rating').value=p.rating||'';
document.getElementById('form-image').value=p.image||'';
document.getElementById('form-features').value=(p.features||[]).join(', ');
document.getElementById('form-specs').value=Object.entries(p.specs||{}).map(([k,v])=>`${k}:${v}`).join(', ');
document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(){
document.getElementById('modal-overlay').classList.add('hidden');
editingId=null;
}

function saveProduct(){
const name=document.getElementById('form-name').value.trim();
const price=parseFloat(document.getElementById('form-price').value);
const brand=document.getElementById('form-brand').value.trim();
const category=document.getElementById('form-category').value.trim();
const rating=parseFloat(document.getElementById('form-rating').value);
const image=document.getElementById('form-image').value.trim();
const features=document.getElementById('form-features').value.split(',').map(s=>s.trim()).filter(Boolean);
const specsRaw=document.getElementById('form-specs').value.split(',').map(s=>s.trim()).filter(Boolean);
const specs={};
specsRaw.forEach(s=>{const [k,...v]=s.split(':');if(k)specs[k.trim()]=v.join(':').trim();});
if(!name||isNaN(price)||!brand||!category||isNaN(rating)){alert('Please fill all required fields');return;}
if(editingId){
const idx=products.findIndex(p=>p.id===editingId);
if(idx>-1)products[idx]={...products[idx],name,price,brand,category,rating,image,features,specs};
}else{
const newId=products.length?Math.max(...products.map(p=>p.id))+1:1;
products.push({id:newId,name,price,brand,category,rating,image,features,specs});
}
saveData();
populateCategories();
renderAdminTable();
closeModal();
}

function deleteProduct(id){
if(!confirm('Delete this product?'))return;
products=products.filter(p=>p.id!==id);
compareList=compareList.filter(x=>x!==id);
saveData();
renderAdminTable();
updateBadge();
}

document.getElementById('modal-overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

loadData();
populateCategories();
showView('home');