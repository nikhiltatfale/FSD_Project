let data={lists:[]};
let adminMode=false;
let dragCard=null,dragSourceList=null;
let editingCard=null,editingListId=null;

const board=document.getElementById('board');
const modal=document.getElementById('modal');
const adminPanel=document.getElementById('adminPanel');
const adminToggle=document.getElementById('adminToggle');
const statsBox=document.getElementById('statsBox');

function save(){localStorage.setItem('taskboard',JSON.stringify(data));}

function load(){
  const d=localStorage.getItem('taskboard');
  if(d){data=JSON.parse(d);}
  else{data={lists:[
    {id:'l'+Date.now(),title:'To Do',cards:[]},
    {id:'l'+(Date.now()+1),title:'In Progress',cards:[]},
    {id:'l'+(Date.now()+2),title:'Done',cards:[]}
  ]};save();}
}

function render(){
  board.innerHTML='';
  data.lists.forEach(list=>{
    const el=document.createElement('div');
    el.className='list';
    el.dataset.id=list.id;
    el.innerHTML=`
      <div class="list-header">
        <span class="list-title" contenteditable="true">${list.title}</span>
        <button class="list-del${adminMode?' visible':''}" data-id="${list.id}">✕</button>
      </div>
      <div class="cards" data-list="${list.id}"></div>
      <div class="list-footer"><button data-add="${list.id}">+ Add Card</button></div>`;
    const cardsEl=el.querySelector('.cards');
    list.cards.forEach(card=>{
      const c=document.createElement('div');
      c.className=`card priority-${card.priority}`;
      c.draggable=true;
      c.dataset.id=card.id;
      c.dataset.list=list.id;
      c.innerHTML=`
        <div class="card-title">${card.title}</div>
        <div class="card-meta">
          ${card.due?`<span>📅 ${card.due}</span>`:''}
          <span>${card.priority}</span>
        </div>
        ${card.desc?`<div class="card-meta" style="margin-top:4px;font-style:italic">${card.desc}</div>`:''}
        <div class="card-actions">
          <button data-edit="${card.id}" data-list="${list.id}">Edit</button>
          <button class="card-del${adminMode?' visible':''}" data-del="${card.id}" data-list="${list.id}">Delete</button>
        </div>`;
      c.addEventListener('dragstart',e=>{dragCard=card.id;dragSourceList=list.id;e.dataTransfer.effectAllowed='move';});
      cardsEl.appendChild(c);
    });
    cardsEl.addEventListener('dragover',e=>{e.preventDefault();cardsEl.classList.add('dragover');});
    cardsEl.addEventListener('dragleave',()=>cardsEl.classList.remove('dragover'));
    cardsEl.addEventListener('drop',e=>{
      e.preventDefault();
      cardsEl.classList.remove('dragover');
      if(!dragCard)return;
      const srcList=data.lists.find(l=>l.id===dragSourceList);
      const tgtList=data.lists.find(l=>l.id===list.id);
      if(!srcList||!tgtList)return;
      const idx=srcList.cards.findIndex(c=>c.id===dragCard);
      if(idx===-1)return;
      const [moved]=srcList.cards.splice(idx,1);
      tgtList.cards.push(moved);
      dragCard=null;dragSourceList=null;
      save();render();
    });
    const titleEl=el.querySelector('.list-title');
    titleEl.addEventListener('blur',()=>{
      list.title=titleEl.textContent.trim()||list.title;
      save();
    });
    board.appendChild(el);
  });
  if(adminMode)updateStats();
}

function updateStats(){
  const cards=data.lists.flatMap(l=>l.cards);
  const h=cards.filter(c=>c.priority==='High').length;
  const m=cards.filter(c=>c.priority==='Medium').length;
  const lo=cards.filter(c=>c.priority==='Low').length;
  statsBox.innerHTML=`Lists: <span>${data.lists.length}</span> &nbsp; Cards: <span>${cards.length}</span> &nbsp; High: <span>${h}</span> &nbsp; Med: <span>${m}</span> &nbsp; Low: <span>${lo}</span>`;
}

function openModal(listId,card=null){
  editingListId=listId;
  editingCard=card;
  document.getElementById('modalTitle').textContent=card?'Edit Card':'New Card';
  document.getElementById('cardTitle').value=card?card.title:'';
  document.getElementById('cardDesc').value=card?card.desc:'';
  document.getElementById('cardDue').value=card?card.due:'';
  document.getElementById('cardPriority').value=card?card.priority:'Low';
  modal.classList.remove('hidden');
}

document.getElementById('saveCard').addEventListener('click',()=>{
  const title=document.getElementById('cardTitle').value.trim();
  if(!title)return alert('Title is required.');
  const list=data.lists.find(l=>l.id===editingListId);
  if(!list)return;
  if(editingCard){
    const c=list.cards.find(c=>c.id===editingCard.id);
    if(c){c.title=title;c.desc=document.getElementById('cardDesc').value;c.due=document.getElementById('cardDue').value;c.priority=document.getElementById('cardPriority').value;}
  } else {
    list.cards.push({id:'c'+Date.now(),title,desc:document.getElementById('cardDesc').value,due:document.getElementById('cardDue').value,priority:document.getElementById('cardPriority').value});
  }
  save();modal.classList.add('hidden');render();
});

document.getElementById('cancelCard').addEventListener('click',()=>modal.classList.add('hidden'));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});

board.addEventListener('click',e=>{
  if(e.target.dataset.add){openModal(e.target.dataset.add);}
  if(e.target.dataset.edit){
    const list=data.lists.find(l=>l.id===e.target.dataset.list);
    const card=list?.cards.find(c=>c.id===e.target.dataset.edit);
    if(list&&card)openModal(list.id,card);
  }
  if(e.target.dataset.del&&adminMode){
    if(!confirm('Delete this card?'))return;
    const list=data.lists.find(l=>l.id===e.target.dataset.list);
    if(list){list.cards=list.cards.filter(c=>c.id!==e.target.dataset.del);save();render();}
  }
  if(e.target.classList.contains('list-del')&&adminMode){
    if(!confirm('Delete this list?'))return;
    data.lists=data.lists.filter(l=>l.id!==e.target.dataset.id);
    save();render();
  }
});

document.getElementById('addListBtn').addEventListener('click',()=>{
  data.lists.push({id:'l'+Date.now(),title:'New List',cards:[]});
  save();render();
});

adminToggle.addEventListener('click',()=>{
  adminMode=!adminMode;
  adminToggle.textContent=`Admin Mode: ${adminMode?'ON':'OFF'}`;
  adminToggle.classList.toggle('active',adminMode);
  adminPanel.classList.toggle('hidden',!adminMode);
  render();
});

document.getElementById('clearBoard').addEventListener('click',()=>{
  if(!confirm('Clear all data?'))return;
  data={lists:[]};save();render();
});

document.getElementById('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='taskboard.json';a.click();
});

document.getElementById('importFile').addEventListener('change',e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{data=JSON.parse(ev.target.result);save();render();}
    catch{alert('Invalid JSON file.');}
  };
  reader.readAsText(file);
  e.target.value='';
});

load();render();