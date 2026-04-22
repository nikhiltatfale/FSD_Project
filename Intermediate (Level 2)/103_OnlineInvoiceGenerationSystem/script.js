const ADMIN_USER='admin',ADMIN_PASS='admin123',STORAGE_KEY='invoiceforge_invoices';
let invoices=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');

function saveToStorage(){localStorage.setItem(STORAGE_KEY,JSON.stringify(invoices));}

function genInvoiceNo(){
  const nums=invoices.map(i=>parseInt(i.invoiceNo.replace(/\D/g,''))||0);
  const next=nums.length?Math.max(...nums)+1:1001;
  return 'INV-'+String(next).padStart(4,'0');
}

function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const map={['form-section']:'nav-create',['history-section']:'nav-history',['admin-section']:'nav-admin'};
  if(map[id])document.getElementById(map[id]).classList.add('active');
  if(id==='history-section')renderHistory();
  if(id==='admin-section')renderAdmin();
}

function addItemRow(item={}){
  const list=document.getElementById('items-list');
  const row=document.createElement('div');
  row.className='item-row';
  row.innerHTML=`<input type="text" placeholder="Item name" value="${item.name||''}" oninput="calcTotals()">
  <input type="number" placeholder="1" min="1" value="${item.qty||''}" oninput="calcTotals()">
  <input type="number" placeholder="0.00" min="0" step="0.01" value="${item.price||''}" oninput="calcTotals()">
  <input type="number" placeholder="0" min="0" max="100" value="${item.tax||''}" oninput="calcTotals()">
  <div class="item-total">₹0.00</div>
  <button class="remove-row" onclick="removeRow(this)">✕</button>`;
  list.appendChild(row);
  calcTotals();
}

function removeRow(btn){btn.closest('.item-row').remove();calcTotals();}

function calcTotals(){
  let sub=0,tax=0;
  document.querySelectorAll('.item-row').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const qty=parseFloat(inputs[1].value)||0;
    const price=parseFloat(inputs[2].value)||0;
    const taxP=parseFloat(inputs[3].value)||0;
    const lineBase=qty*price;
    const lineTax=lineBase*(taxP/100);
    const lineTotal=lineBase+lineTax;
    row.querySelector('.item-total').textContent='₹'+lineTotal.toFixed(2);
    sub+=lineBase;
    tax+=lineTax;
  });
  document.getElementById('subtotal').textContent='₹'+sub.toFixed(2);
  document.getElementById('tax-total').textContent='₹'+tax.toFixed(2);
  document.getElementById('grand-total').textContent='₹'+(sub+tax).toFixed(2);
}

function getFormData(){
  return{
    invoiceNo:document.getElementById('inv-no').value,
    date:document.getElementById('inv-date').value,
    dueDate:document.getElementById('due-date').value,
    seller:{name:document.getElementById('s-name').value,addr:document.getElementById('s-addr').value,email:document.getElementById('s-email').value,phone:document.getElementById('s-phone').value,gst:document.getElementById('s-gst').value},
    client:{name:document.getElementById('c-name').value,addr:document.getElementById('c-addr').value,email:document.getElementById('c-email').value,phone:document.getElementById('c-phone').value,gst:document.getElementById('c-gst').value},
    items:[...document.querySelectorAll('.item-row')].map(row=>{
      const inputs=row.querySelectorAll('input');
      return{name:inputs[0].value,qty:inputs[1].value,price:inputs[2].value,tax:inputs[3].value};
    }),
    subtotal:document.getElementById('subtotal').textContent,
    taxTotal:document.getElementById('tax-total').textContent,
    grandTotal:document.getElementById('grand-total').textContent
  };
}

function validateForm(data){
  const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRx=/^\d{7,15}$/;
  if(!data.seller.name||!data.seller.addr||!data.seller.email||!data.seller.phone||!data.seller.gst)return 'Fill all seller details';
  if(!emailRx.test(data.seller.email))return 'Invalid seller email';
  if(!phoneRx.test(data.seller.phone))return 'Invalid seller phone (numbers only)';
  if(!data.client.name||!data.client.addr||!data.client.email||!data.client.phone||!data.client.gst)return 'Fill all client details';
  if(!emailRx.test(data.client.email))return 'Invalid client email';
  if(!phoneRx.test(data.client.phone))return 'Invalid client phone (numbers only)';
  if(!data.date||!data.dueDate)return 'Fill invoice and due dates';
  if(data.items.length===0)return 'Add at least one item';
  for(const it of data.items){
    if(!it.name)return 'Fill all item names';
    if(!it.qty||isNaN(it.qty)||it.qty<=0)return 'Invalid item quantity';
    if(!it.price||isNaN(it.price)||it.price<0)return 'Invalid item price';
  }
  return null;
}

function buildInvoiceHTML(data){
  const rows=data.items.map(it=>{
    const qty=parseFloat(it.qty)||0,price=parseFloat(it.price)||0,tax=parseFloat(it.tax)||0;
    const base=qty*price,total=base+base*(tax/100);
    return`<tr><td>${it.name}</td><td>${qty}</td><td>₹${price.toFixed(2)}</td><td>${tax}%</td><td>₹${total.toFixed(2)}</td></tr>`;
  }).join('');
  return`<div class="inv-header"><div><div class="inv-brand">Invoice<span>Forge</span></div></div><div class="inv-meta"><div class="inv-no">${data.invoiceNo}</div><div class="inv-dates">Date: ${data.date}<br>Due: ${data.dueDate}</div></div></div>
  <div class="parties"><div><div class="party-label">From</div><div class="party-name">${data.seller.name}</div><div class="party-detail">${data.seller.addr}<br>${data.seller.email}<br>${data.seller.phone}<br>GST: ${data.seller.gst}</div></div><div><div class="party-label">To</div><div class="party-name">${data.client.name}</div><div class="party-detail">${data.client.addr}<br>${data.client.email}<br>${data.client.phone}<br>GST: ${data.client.gst}</div></div></div>
  <table class="inv-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Tax</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="inv-totals"><div class="inv-totals-box"><div class="inv-total-line"><span>Subtotal</span><span>${data.subtotal}</span></div><div class="inv-total-line"><span>Tax</span><span>${data.taxTotal}</span></div><div class="inv-total-line grand"><span>Grand Total</span><span>${data.grandTotal}</span></div></div></div>`;
}

function previewInvoice(){
  const data=getFormData();
  const err=validateForm(data);
  if(err){alert(err);return;}
  document.getElementById('invoice-preview').innerHTML=buildInvoiceHTML(data);
  showSection('preview-section');
}

function saveInvoice(){
  const data=getFormData();
  const err=validateForm(data);
  if(err){alert(err);return;}
  data.id=Date.now();
  invoices.push(data);
  saveToStorage();
  alert('Invoice saved successfully!');
  resetForm();
}

function resetForm(){
  ['s-name','s-addr','s-email','s-phone','s-gst','c-name','c-addr','c-email','c-phone','c-gst','inv-date','due-date'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('items-list').innerHTML='';
  calcTotals();
  initForm();
}

function initForm(){
  const no=genInvoiceNo();
  document.getElementById('inv-no').value=no;
  document.getElementById('invoice-no-display').textContent=no;
  if(!document.querySelectorAll('.item-row').length)addItemRow();
}

function renderHistory(){
  const list=document.getElementById('history-list');
  if(!invoices.length){list.innerHTML='<div class="empty-state">No invoices yet. Create your first invoice!</div>';return;}
  list.innerHTML=invoices.slice().reverse().map(inv=>`<div class="history-item">
    <div class="h-info"><div class="h-no">${inv.invoiceNo}</div><div class="h-meta">${inv.client.name} · ${inv.date}</div></div>
    <div style="display:flex;align-items:center"><span class="h-amount">${inv.grandTotal}</span>
    <div class="h-actions"><button class="btn-ghost" onclick="viewInvoice(${inv.id})" style="padding:0.4rem 0.8rem;font-size:0.75rem">View</button>
    <button class="btn-danger" onclick="deleteInvoice(${inv.id},'history')" style="padding:0.4rem 0.8rem;font-size:0.75rem">Delete</button></div></div>
  </div>`).join('');
}

function viewInvoice(id){
  const inv=invoices.find(i=>i.id===id);
  if(!inv)return;
  document.getElementById('view-invoice-content').innerHTML=buildInvoiceHTML(inv);
  document.getElementById('view-modal').classList.add('open');
}

function closeViewModal(){document.getElementById('view-modal').classList.remove('open');}

function deleteInvoice(id,src){
  if(!confirm('Delete this invoice?'))return;
  invoices=invoices.filter(i=>i.id!==id);
  saveToStorage();
  if(src==='history')renderHistory();
  else renderAdmin();
}

function openAdminModal(){
  document.getElementById('admin-user').value='';
  document.getElementById('admin-pass').value='';
  document.getElementById('login-error').textContent='';
  document.getElementById('admin-modal').classList.add('open');
}

function closeAdminModal(){document.getElementById('admin-modal').classList.remove('open');}

function adminLogin(){
  const u=document.getElementById('admin-user').value;
  const p=document.getElementById('admin-pass').value;
  if(u===ADMIN_USER&&p===ADMIN_PASS){
    closeAdminModal();
    showSection('admin-section');
  }else{
    document.getElementById('login-error').textContent='Invalid credentials. Try again.';
  }
}

function adminLogout(){showSection('form-section');}

function renderAdmin(filter=''){
  const total=invoices.length;
  const amount=invoices.reduce((s,i)=>s+parseFloat(i.grandTotal.replace(/[₹,]/g,'')||0),0);
  document.getElementById('stat-total').textContent=total;
  document.getElementById('stat-amount').textContent='₹'+amount.toFixed(0);
  const list=document.getElementById('admin-invoice-list');
  const filtered=filter?invoices.filter(i=>i.invoiceNo.toLowerCase().includes(filter.toLowerCase())):invoices;
  if(!filtered.length){list.innerHTML='<div class="empty-state">No invoices found.</div>';return;}
  list.innerHTML=filtered.slice().reverse().map(inv=>`<div class="history-item">
    <div class="h-info"><div class="h-no">${inv.invoiceNo}</div><div class="h-meta">${inv.seller.name} → ${inv.client.name} · ${inv.date}</div></div>
    <div style="display:flex;align-items:center"><span class="h-amount">${inv.grandTotal}</span>
    <div class="h-actions"><button class="btn-ghost" onclick="viewInvoice(${inv.id})" style="padding:0.4rem 0.8rem;font-size:0.75rem">View</button>
    <button class="btn-danger" onclick="deleteInvoice(${inv.id},'admin')" style="padding:0.4rem 0.8rem;font-size:0.75rem">Delete</button></div></div>
  </div>`).join('');
}

function adminSearch(){renderAdmin(document.getElementById('admin-search').value);}

function resetSystem(){
  if(!confirm('This will delete ALL invoices. Are you sure?'))return;
  invoices=[];
  saveToStorage();
  renderAdmin();
}

document.getElementById('admin-modal').addEventListener('click',function(e){if(e.target===this)closeAdminModal();});
document.getElementById('view-modal').addEventListener('click',function(e){if(e.target===this)closeViewModal();});
document.getElementById('admin-pass').addEventListener('keydown',e=>{if(e.key==='Enter')adminLogin();});

initForm();