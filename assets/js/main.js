// assets/js/main.js (phiên bản đã sửa, copy-paste đè lên file cũ)
// --- NOTE: Trước khi dùng file này, hãy chắc bạn đã chèn 3 script Firebase
// vào HTML TRƯỚC script main.js, ví dụ:
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
// <script src="assets/js/main.js"></script>

// ===== FIREBASE CONFIG: dán config của bạn ở đây (đã có sẵn từ bạn) =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDH0JLwVBMK8hrcuB2Q6LC7YeA0UZYx5hs",
  authDomain: "anh-trai-say-hi.firebaseapp.com",
  databaseURL: "https://anh-trai-say-hi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anh-trai-say-hi",
  storageBucket: "anh-trai-say-hi.firebasestorage.app",
  messagingSenderId: "86629873478",
  appId: "1:86629873478:web:4623d90970d53fbc421747"
};
// ======================================================================

// INTERNAL: set up firebase when SDK đã load.
// Vấn đề bạn gặp: nếu main.js chạy trước khi SDK firebase load -> firebase undefined.
// Ở đây mình kiểm tra: nếu firebase có -> init ngay; nếu chưa -> chờ trong tối đa 6s.
(function(){
  function initFirebaseNow(){
    try {
      if(typeof firebase === 'undefined') return false;
      if(firebase.apps && firebase.apps.length) {
        // đã init trước đó
        window.__sayhi_db = firebase.database ? firebase.database() : null;
        return true;
      }
      // init app
      firebase.initializeApp(FIREBASE_CONFIG);
      window.__sayhi_db = firebase.database ? firebase.database() : null;
      // đăng nhập anonymous nếu có auth
      if(firebase.auth) {
        firebase.auth().signInAnonymously().catch(()=>{/* ignore errors */});
      }
      return true;
    } catch(e){
      console.error('initFirebaseNow error', e);
      return false;
    }
  }

  if(!initFirebaseNow()){
    // nếu firebase chưa có, poll đến khi SDK load (max 6s)
    let waited = 0;
    const interval = setInterval(()=>{
      waited += 200;
      if(initFirebaseNow()){
        clearInterval(interval);
        attachVotesListenerIfReady();
      } else if(waited >= 6000){
        clearInterval(interval);
        console.warn('Firebase SDK chưa có sau 6s. Kiểm tra bạn đã chèn script SDK trước main.js chưa.');
      }
    },200);
  } else {
    attachVotesListenerIfReady();
  }

  // Attach listener only after window.__sayhi_db is set
  function attachVotesListenerIfReady(){
    try {
      if(window.__sayhi_db){
        window.__sayhi_db.ref('votes').on('value', function(snapshot){
          window.latestVotesFromDB = snapshot.val() || {};
          const sel = document.getElementById('categorySelect');
          const cat = sel ? sel.value : 'favorite';
          if(typeof renderRanking === 'function') renderRanking(cat);
        });
      }
    } catch(e){
      console.error('attachVotesListenerIfReady error', e);
    }
  }
})();

// ===== file tiếp theo: dữ liệu & các hàm UI (giữ nguyên logic, đã chỉnh để dùng DB nếu có) =====

// Biến dùng làm cache từ DB
window.latestVotesFromDB = window.latestVotesFromDB || null;

// Danh sách 30 anh trai (slug, tên, năm sinh)
window.brothers = [
  {slug:'ngo-kien-huy', name:'Ngô Kiến Huy', birth:1988, description:'Ca sĩ, diễn viên, MC...'},
  {slug:'karik', name:'Karik', birth:1989, description:'apper đình đám của làng nhạc Việt...'},
  {slug:'big-daddy', name:'Big Daddy', birth:1991, description:'Rapper, là chồng của ca sĩ Emily.'},
  {slug:'vu-cat-tuong', name:'Vũ Cát Tường', birth:1992, description:'Ca sĩ, nhạc sĩ, nhà sản xuất âm nhạc.'},
  {slug:'b-ray', name:'B Ray', birth:1993, description:'Rapper trẻ, cá tính mạnh mẽ.'},
  {slug:'pham-dinh-thai-ngan', name:'Phạm Đình Thái Ngân', birth:1993, description:'Ca sĩ/nhạc sĩ.'},
  {slug:'bui-duy-ngoc', name:'Bùi Duy Ngọc', birth:1993, description:'thầy dạy hát, nuôi mèo'},
  {slug:'lohan', name:'Lohan', birth:1994, description:'giỏi về chuẩn bị trang phục, concept'},
  {slug:'nham-phuong-nam', name:'Nhâm Phương Nam', birth:1994, description:'đẹp trai, hài hước'},
  {slug:'cody-nam-vo', name:'Cody Nam Võ', birth:1996, description:'nhảy đẹp'},
  {slug:'vuong-binh', name:'Vương Bình', birth:1996, description:'đẹp trai'},
  {slug:'phuc-du', name:'Phúc Du', birth:1996, description:'rapper nghiêm túc'},
  {slug:'hustlang-robber', name:'HUSTLANG Robber', birth:1996, description:'rapper hài hước'},
  {slug:'hai-nam', name:'Hải Nam', birth:1996, description:'diễn viên đẹp trai'},
  {slug:'otis', name:'Otis', birth:1997, description:'đẹp trai'},
  {slug:'ogenus', name:'OgeNus', birth:1997, description:'rapper, ca sĩ, sáng tác rất hay'},
  {slug:'jey-b', name:'Jey B', birth:1997, description:'đẹp trai hát hay'},
  {slug:'khoi-vu', name:'Khoi Vu', birth:1998, description:'rất giỏi sáng tác'},
  {slug:'gill', name:'GILL', birth:1999, description:'Rapper trẻ, nổi bật với nhạc hiện đại'},
  {slug:'rio', name:'Rio', birth:1999, description:'chồng 52hz'},
  {slug:'buitruonglinh', name:'Buitruonglinh', birth:1999, description:'nhiều hit'},
  {slug:'mason-nguyen', name:'Mason Nguyễn', birth:2000, description:'rapper tốt bụng'},
  {slug:'congb', name:'CONGB', birth:2000, description:'thực tập sinh hàn quốc đẹp trai'},
  {slug:'dillan-hoang-phan', name:'Dillan Hoàng Phan', birth:2000, description:'người lai'},
  {slug:'negav', name:'Negav', birth:2001, description:'quán quân atsh'},
  {slug:'son-k', name:'Sơn.K', birth:2001, description:'đẹp trai, cười rất đẹp'},
  {slug:'tez', name:'TEZ', birth:2001, description:'gang gang hài hước'},
  {slug:'ryn-lee', name:'Ryn Lee', birth:2003, description:'rụt rè'},
  {slug:'jaysonlei', name:'Jaysonlei', birth:2003, description:'đẹp trai, hát hay'},
  {slug:'do-nam-son', name:'Đỗ Nam Sơn', birth:2007, description:'thực tập sinh em út'}
];

// localStorage keys (fallback nếu DB không sẵn sàng)
const VOTES_KEY = 'sayhi_votes';
const USER_VOTE_KEY = 'sayhi_user_votes';
const MESSAGES_KEY = 'sayhi_messages';

// helpers
function readJSON(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function writeJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Render grid of brothers
window.renderBrothersGrid = function(containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '';
  brothers.forEach(b=>{
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = `assets/images/avatars/${b.slug}.jpg`;
    img.alt = b.name;
    img.onerror = ()=>{ img.src = `https://via.placeholder.com/150?text=${encodeURIComponent(b.name)}` };
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = b.name;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = b.birth;
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(meta);
    card.addEventListener('click', ()=> openDetail(b));
    container.appendChild(card);
  });
};

// Modal detail
function openDetail(b){
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <img src='assets/images/avatars/${b.slug}.jpg' style='width:200px;height:200px;border-radius:12px;object-fit:cover' onerror="this.src='https://via.placeholder.com/200?text=Avatar'">
      <div style="flex:1;min-width:200px">
        <h3 style="margin:0 0 8px 0">${b.name}</h3>
        <p style="margin:0 0 6px 0"><strong>Năm sinh:</strong> ${b.birth}</p>
        <p style="margin:0;color: #445"> ${b.description || 'Anh trai năng động, biểu diễn đa dạng và thân thiện với fan.'}</p>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

// Ranking logic
window.initRanking = function(){
  const categorySelect = document.getElementById('categorySelect');
  if(!categorySelect) return;
  categorySelect.addEventListener('change', ()=> renderRanking(categorySelect.value));
  // ensure votes storage exists
  ensureVotes();
  renderRanking(categorySelect.value);
};

function ensureVotes(){
  // Nếu có dữ liệu realtime từ DB (listener đã gán), dùng nó
  if(window.latestVotesFromDB) return window.latestVotesFromDB;

  // Fallback localStorage (cũ)
  let votes = readJSON(VOTES_KEY, null);
  if(!votes){
    votes = {};
    ['favorite','leader','performer','visual','vocal'].forEach(c=>{
      votes[c] = {};
      brothers.forEach(b=> votes[c][b.slug] = 0);
    });
    writeJSON(VOTES_KEY, votes);
  }
  return votes;
}

function renderRanking(category){
  const votes = ensureVotes();
  const categoryData = votes[category] || {};

  const arr = brothers.map(b => ({
    slug: b.slug,
    count: categoryData[b.slug] || 0
  })).sort((a,b)=>b.count - a.count);

  // TOP 3
  const top3Cont = document.getElementById('top3');
  if(top3Cont){
    top3Cont.innerHTML = '';
    const podium = document.createElement('div');
    podium.className = "podium";

    const top3 = arr.slice(0,3);
    const order = [1,0,2]; // Nhì - Nhất - Ba

    order.forEach(pos=>{
      const item = top3[pos];
      if(!item) return;
      const b = brothers.find(x=>x.slug===item.slug);
      const idx = pos;
      const medalColor = idx===0 ? '#FFD700' :
                         idx===1 ? '#C0C0C0' :
                         '#CD7F32';
      const glow = idx===0 ? 'box-shadow:0 0 22px rgba(255,215,0,0.85);' : '';
      const block = document.createElement('div');
      block.className = "podium-item rank-" + (idx+1);
      block.innerHTML = `
        <div class="podium-badge" style="background:${medalColor}">${idx+1}</div>
        <img class="podium-img"
             src="assets/images/avatars/${b.slug}.jpg"
             onerror="this.src='https://via.placeholder.com/150?text=Avatar'"
             style="${glow}">
        <div class="name">${b.name}</div>
        <div class="vote-count">${item.count} votes</div>
        <button class="btn" onclick="vote('${category}','${b.slug}')">Vote</button>
      `;
      podium.appendChild(block);
    });
    top3Cont.appendChild(podium);
  }
  
  // Table
  const table = document.getElementById('rankingTable');
  if(table){
    table.innerHTML = '<table><thead><tr><th>#</th><th>Name</th><th>Votes</th><th>Action</th></tr></thead><tbody>' +
      arr.map((d,i)=>{
        const b = brothers.find(x=>x.slug===d.slug);
        return `<tr>
                  <td>${i+1}</td>
                  <td>${b.name}</td>
                  <td>${d.count}</td>
                  <td><button class="btn" onclick="vote('${category}','${d.slug}')">Vote</button></td>
                </tr>`;
      }).join('') +
      '</tbody></table>';
  }
}

// Vote (dùng Realtime DB nếu có, fallback local nếu không)
window.vote = async function(category, slug){
  if(!category || !slug) return;
  const DB = window.__sayhi_db;
  if(!DB){
    alert('Firebase chưa khởi tạo. Kiểm tra lại: đã thêm 3 script SDK trước main.js trong HTML chưa?');
    return;
  }

  try {
    const user = (firebase.auth && firebase.auth().currentUser) || null;
    const uid = user ? user.uid : null;

    if(uid){
      const userVoteRef = DB.ref(`userVotes/${uid}/${category}/${slug}`);
      const snap = await userVoteRef.once('value');
      if(snap.exists()){
        alert('Bạn đã vote người này rồi trong hạng mục này.');
        return;
      }
    }

    const voteRef = DB.ref(`votes/${category}/${slug}`);
    await voteRef.transaction(current => (current || 0) + 1);

    if(uid){
      await DB.ref(`userVotes/${uid}/${category}/${slug}`).set(true);
    }

    alert('Cảm ơn bạn đã vote!');

    // cập nhật cục bộ (listener DB sẽ trigger render nhưng làm thêm để chắc)
    DB.ref('votes').once('value').then(snap=>{
      window.latestVotesFromDB = snap.val() || {};
      renderRanking(category);
    }).catch(()=>{ /* ignore */ });

  } catch(err){
    console.error('Vote error:', err);
    alert('Vote thất bại. Kiểm tra console hoặc cấu hình Firebase.');
  }
};

// Watch page
window.initWatch = function(){
  const episodes = [
    {id:1, title:'Tập 1', youtubeId:'5X8_IxZo8w8?si=_qZKKI95bsCYwkts'},
    {id:2, title:'Tập 2', youtubeId:'v8WCvNSPSa0?si=inOdiDeHvqb4G2wB'},
    {id:3, title:'Tập 3', youtubeId:'alsFPwMJGOI?si=Igz99NQ3txROBgjv'},
    {id:4, title:'Tập 4', youtubeId:'U_KeF48W4qE?si=8yyJkd84oUdHDZTD'},
    {id:5, title:'Tập 5', youtubeId:'DXNSmHHkARY?si=GrkIt5kncoxQvjvn'},
    {id:6, title:'Tập 6', youtubeId:'DXNSmHHkARY?si=GeFJesDr0gmpZjzp'},
    {id:7, title:'Tập 7', youtubeId:'TH_z2nHyct4?si=68isNwM-vpfTp2Ze'},
    {id:8, title:'Tập 8', youtubeId:'Xdqdt6eobbk?si=P_NZTrnaZA0iPo2t'},
    {id:9, title:'Tập 9', youtubeId:'zjYcqzWbNJE?si=LttsbtBvqoeF0t-Q'},
    {id:10, title:'Tập 10', youtubeId:'DkPgUmAKEgY?si=QDOmhmQxZuur0Iy3'},
    {id:11, title:'Tập 11', youtubeId:'JLE79Jh5e2U?si=Ll0Kxcu60TDYxzyL'},
    {id:12, title:'Tập 12', youtubeId:'bk-lKnwLztc?si=OEcFHG-OANruPALj'},
    {id:13, title:'Tập 13', youtubeId:'e6EPRUnbogw?si=A_zwKR3RJGX-9OCM'}
  ];
  const epList = document.getElementById('episodesList');
  if(!epList) return;
  epList.innerHTML = episodes.map(ep=>`<div class="ep" onclick="playEp('${ep.youtubeId}')">${ep.title}</div>`).join('');
  playEp(episodes[0].youtubeId);
};

window.playEp = function(yid){
  const player = document.getElementById('player');
  if(!player) return;
  player.src = `https://www.youtube.com/embed/${yid}`;
};

// Messages (local fallback)
window.initMessages = function(){
  const select = document.getElementById('messageTo');
  if(!select) return;
  select.innerHTML = '<option value="all">Gửi tới: Tất cả anh trai</option>' + brothers.map(b=>`<option value="${b.slug}">${b.name}</option>`).join('');
  const btn = document.getElementById('sendMessage');
  if(btn) btn.onclick = sendMessage;
  renderMessages();
};

function sendMessage(){
  const txtEl = document.getElementById('messageText');
  const selEl = document.getElementById('messageTo');
  if(!txtEl || !selEl) return;
  const text = txtEl.value.trim();
  const to = selEl.value;
  if(!text){ alert('Viết lời nhắn trước khi gửi'); return; }
  const messages = readJSON(MESSAGES_KEY, []);
  messages.unshift({id:Date.now(), to, text, createdAt:new Date().toISOString()});
  writeJSON(MESSAGES_KEY, messages);
  txtEl.value = '';
  renderMessages();
}

function renderMessages(filterTo){
  const messages = readJSON(MESSAGES_KEY, []);
  const list = document.getElementById('messagesList');
  if(!list) return;
  const filtered = filterTo ? messages.filter(m=>m.to===filterTo) : messages;
  list.innerHTML = filtered.map(m=>{
    const toName = m.to === 'all' ? 'Tất cả' : (brothers.find(b=>b.slug===m.to)||{}).name || m.to;
    return `<div class="msg" style="background:#fff;padding:10px;border-radius:8px;margin-bottom:8px;box-shadow:0 6px 14px rgba(3,10,30,0.04)"><strong>${escapeHtml(toName)}</strong> <small style="color:var(--muted);margin-left:6px">${new Date(m.createdAt).toLocaleString()}</small><div style="margin-top:6px">${escapeHtml(m.text)}</div></div>`;
  }).join('');
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }
