// assets/js/messages.js

// ====== CẤU HÌNH FIREBASE ======
// Thay object dưới đây bằng cấu hình của bạn từ Firebase Console
// (mình hướng dẫn lấy ở phần hướng dẫn)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCEcJGskF9B-vOxm527KsLahsc-lRkT6ug",
  authDomain: "sayhi-messages.firebaseapp.com",
  databaseURL: "https://sayhi-messages-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sayhi-messages",
  storageBucket: "sayhi-messages.firebasestorage.app",
  messagingSenderId: "133733944842",
  appId: "1:133733944842:web:fc08a79bf18a6db2d359f3",
  measurementId: "G-BFHTD0RF6V"
};

// ====== DANH SÁCH 30 ANH TRAI ======
const BROTHERS = [
"Ngô Kiến Huy (1988)","Karik (1989)","Big Daddy (1991)","Vũ Cát Tường (1992)",
"B Ray (1993)","Phạm Đình Ngân (1993)","Bùi Duy Ngọc (1993)","Lohan (1994)",
"Nhâm Phương Nam (1994)","Cody Nam Võ (1996)","Vương Bình (1996)","Phúc Du (1996)",
"HUSTLANG Robber (1996)","Hải Nam (1996)","Otis (1997)","OgeNus (1997)",
"Jey B (1997)","Khoi Vu (1998)","GILL (1999)","Rio (1999)",
"Buitruonglinh (1999)","Mason Nguyễn (2000)","CONGB (2000)","Dillan Hoàng Phan (2000)",
"Negav (2001)","Sơn.K (2001)","TEZ (2001)","Ryn Lee (2003)",
"Jaysonlei (2003)","Đỗ Nam Sơn (2007)"
];

// Hàm escape text để tránh chèn HTML độc hại
function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

window.initFirebaseMessages = function(){
  if(!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey.includes('FIREBASE_CONFIG_HERE')){
    console.warn('Bạn chưa đặt FIREBASE_CONFIG trong assets/js/messages.js. Vui lòng dán config từ Firebase Console.');
    // vẫn khởi tạo UI local (select) nhưng không kết nối DB
    populateSelect();
    showOfflineNotice();
    return;
  }

  // khởi tạo firebase
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.database();

  // DOM
  const sel = document.getElementById('messageTo');
  const txt = document.getElementById('messageText');
  const btn = document.getElementById('sendMessage');
  const list = document.getElementById('messagesList');

  // điền select bằng danh sách anh trai + tùy chọn "Tất cả"
  function populateSelect(){
    sel.innerHTML = `<option value="all">Gửi đến: Tất cả anh trai</option>` +
      BROTHERS.map((b,i)=>`<option value="${i}">${escapeHtml(b)}</option>`).join('');
  }
  populateSelect();

  // khi gửi
  btn.onclick = function(){
    const text = txt.value.trim();
    const to = sel.value || 'all';
    if(!text){
      alert('Bạn chưa viết lời nhắn!');
      return;
    }

    const payload = {
      text: text,
      to: to,
      toName: to === 'all' ? 'Tất cả' : BROTHERS[parseInt(to)],
      createdAt: Date.now()
    };

    // push vào /messages
    db.ref('messages').push(payload)
      .then(()=>{
        txt.value = '';
        sel.value = 'all';
        // optional: focus lại
        txt.focus();
      })
      .catch(err=>{
        console.error(err);
        alert('Gửi thất bại. Kiểm tra console hoặc cấu hình Firebase.');
      });
  };

  // lắng nghe toàn bộ messages real-time và hiển thị (sắp xếp theo createdAt desc)
  db.ref('messages').on('value', snapshot => {
    const data = snapshot.val() || {};
    // biến thành mảng và sort
    const arr = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    arr.sort((a,b)=> b.createdAt - a.createdAt);
    renderList(arr);
  });

  function renderList(arr){
    if(!list) return;
    if(arr.length === 0){
      list.innerHTML = '<p class="muted">Chưa có lời nhắn nào. Hãy là người đầu tiên gửi!</p>';
      return;
    }
    list.innerHTML = arr.map(item => {
      const time = new Date(item.createdAt).toLocaleString();
      const toLabel = item.to === 'all' ? 'Tất cả' : escapeHtml(item.toName || BROTHERS[parseInt(item.to)]);
      return `<div class="message-item">
                <div class="msg-top"><strong>${toLabel}</strong> <span class="msg-time">${escapeHtml(time)}</span></div>
                <div class="msg-text">${escapeHtml(item.text)}</div>
              </div>`;
    }).join('');
  }

  function showOfflineNotice(){
    const notice = document.createElement('div');
    notice.className = 'muted';
    notice.style.marginTop = '10px';
    notice.textContent = 'Lưu ý: hiện chưa kết nối Firebase. Vui lòng dán FIREBASE_CONFIG vào assets/js/messages.js theo hướng dẫn.';
    const wrapper = document.querySelector('.messages-wrapper');
    if(wrapper) wrapper.prepend(notice);
  }
};
