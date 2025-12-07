/***** 1. FIREBASE INIT *****/
const firebaseConfig = {
  apiKey: "AIzaSyDH0JLwVBMK8hrcuB2Q6LC7YeA0UZYx5hs",
  authDomain: "anh-trai-say-hi.firebaseapp.com",
  databaseURL: "https://anh-trai-say-hi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anh-trai-say-hi",
  storageBucket: "anh-trai-say-hi.firebasestorage.app",
  messagingSenderId: "86629873478",
  appId: "1:86629873478:web:4623d90970d53fbc421747"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/***** 2. DANH SÁCH 30 ANH TRAI (ID CỐ ĐỊNH) *****/
const brothers = [
  "AnhTrai01","AnhTrai02","AnhTrai03","AnhTrai04","AnhTrai05",
  "AnhTrai06","AnhTrai07","AnhTrai08","AnhTrai09","AnhTrai10",
  "AnhTrai11","AnhTrai12","AnhTrai13","AnhTrai14","AnhTrai15",
  "AnhTrai16","AnhTrai17","AnhTrai18","AnhTrai19","AnhTrai20",
  "AnhTrai21","AnhTrai22","AnhTrai23","AnhTrai24","AnhTrai25",
  "AnhTrai26","AnhTrai27","AnhTrai28","AnhTrai29","AnhTrai30"
];

/***** 3. CHỐNG VOTE LẠI (LOCAL) *****/
const deviceId = localStorage.getItem("device_id") ||
  (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
    return id;
  })();

/***** 4. RENDER + LẮNG NGHE REALTIME *****/
const categorySelect = document.getElementById("categorySelect");
const rankingTable = document.getElementById("rankingTable");
const top3 = document.getElementById("top3");

function listenVotes(category) {
  db.ref("votes/" + category).on("value", snap => {
    const data = snap.val() || {};
    renderRanking(data);
  });
}

function renderRanking(votes) {
  const rows = Object.entries(votes)
    .sort((a,b)=>b[1]-a[1]);

  rankingTable.innerHTML = "";
  top3.innerHTML = "";

  rows.forEach(([id,count],index)=>{
    if(index < 3){
      top3.innerHTML += `<div>${id} – ${count} vote</div>`;
    }
    rankingTable.innerHTML += `
      <div class="ranking-row">
        <span>${index+1}. ${id}</span>
        <button data-id="${id}">❤️ ${count}</button>
      </div>
    `;
  });

  rankingTable.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>vote(btn.dataset.id);
  });
}

/***** 5. VOTE *****/
function vote(brotherId){
  const category = categorySelect.value;
  const voteRef = db.ref(`votes/${category}/${brotherId}`);

  const votedKey = `voted_${category}`;
  if(localStorage.getItem(votedKey)){
    alert("Bạn đã vote rồi!");
    return;
  }

  voteRef.transaction(val => (val || 0) + 1);
  localStorage.setItem(votedKey, "1");
}

/***** 6. KHỞI ĐỘNG *****/
categorySelect.onchange = () => listenVotes(categorySelect.value);
listenVotes(categorySelect.value);
