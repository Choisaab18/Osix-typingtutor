/* OSIX Typing Tutor — Local version
   - Users saved in localStorage key 'osix_users_v4'
   - Current user id in 'osix_current_v4'
   - Pre-generated 50 tests (ChatGPT)
*/
const LS_USERS = 'osix_users_v4';
const LS_CUR = 'osix_current_v4';
const LS_DAILY_KEY = 'osix_daily_test_v4'; // stores today's daily paragraph + date

/* ---------------- storage helpers ---------------- */
function readUsers(){ try{ return JSON.parse(localStorage.getItem(LS_USERS))||[] }catch(e){return[]} }
function writeUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)) }
function setCurrent(uid){ localStorage.setItem(LS_CUR, uid) }
function getCurrent(){ return localStorage.getItem(LS_CUR) }
function genId(prefix='x'){ return prefix+Date.now()+Math.floor(Math.random()*900) }

/* ---------- Generated tests (50) ---------- */
const TESTS = (function(){
  const topics = ['CGL Governance','CHSL Maths','Delhi Police Comprehension','Bank PO Economy','RRB Technical','TGT History','UPSSSC GK','Current Affairs','Science & Tech','Environment'];
  const arr=[];
  for(let i=1;i<=50;i++){
    const t=topics[i%topics.length];
    const body = (`Test ${i} — ${t}. ` + ("This paragraph is for typing practice. ").repeat(20)).slice(0,1200);
    arr.push({id:'t'+i,title:`Test ${i} — ${t}`,passage:body,words:200,difficulty:(i%3===0?'high':(i%3===1?'medium':'low'))});
  }
  return arr;
})();

/* ---------- OTP login (index.html) ---------- */
/* Get OTP: random 4 digits shown in alert & on page (demo) */
function getOtpFor(number){
  const otp = String(1000 + Math.floor(Math.random()*9000));
  sessionStorage.setItem('osix_demo_otp', otp);
  sessionStorage.setItem('osix_demo_mobile', number);
  // also display in page (demo)
  return otp;
}

/* Index page bindings */
function initIndexPage(){
  document.getElementById('btnGetOtp').addEventListener('click', ()=>{
    const name = document.getElementById('inpName').value.trim();
    const mobile = document.getElementById('inpMobile').value.trim();
    if(!name || !mobile){ alert('Enter name and mobile'); return; }
    const otp = getOtpFor(mobile);
    document.getElementById('otpNote').innerText = `Demo OTP: ${otp} (displayed for testing)`;
    document.getElementById('otpWrap').classList.remove('hidden');
    alert('OTP (demo) sent: '+otp);
  });
  document.getElementById('btnVerifyOtp').addEventListener('click', ()=>{
    const entered = document.getElementById('inpOtp').value.trim();
    const otp = sessionStorage.getItem('osix_demo_otp');
    const mobile = sessionStorage.getItem('osix_demo_mobile');
    const name = document.getElementById('inpName').value.trim();
    if(entered !== otp){ alert('Incorrect OTP'); return; }
    // login or signup local
    let users = readUsers();
    let user = users.find(u=>u.mobile===mobile);
    if(!user){
      user = { id: genId('u'), name, mobile, email:'', district:'', state:'', joined:new Date().toISOString(), avatar:'', results:[] };
      users.push(user); writeUsers(users);
    } else {
      // update name if empty
      if(!user.name) user.name = name;
      writeUsers(users);
    }
    setCurrent(user.id);
    // clear demo otp
    sessionStorage.removeItem('osix_demo_otp'); sessionStorage.removeItem('osix_demo_mobile');
    // go to dashboard
    location.href = 'dashboard.html';
  });
}

/* ---------- Dashboard (home) init ---------- */
function initDashboard(){
  const cur = getCurrent();
  if(!cur) { location.href='index.html'; return; }
  const users = readUsers(); const u = users.find(x=>x.id===cur);
  if(!u){ location.href='index.html'; return; }
  // top name (3 dots replace avatar)
  document.getElementById('topName').innerText = u.name || u.mobile;
  document.getElementById('sideName').innerText = u.name || u.mobile;
  // render tests (home)
  renderTestsList();
  // daily placeholder
  ensureDailyTest();
}

/* render tests on home page */
function renderTestsList(){
  const container = document.getElementById('testsList');
  if(!container) return;
  container.innerHTML = '';
  TESTS.forEach(t=>{
    const d = document.createElement('div'); d.className='test-card';
    d.innerHTML = `<strong>${t.title}</strong><p class="small">${t.passage.slice(0,120)}...</p><div style="margin-top:8px"><button class="btn" onclick="startTestById('${t.id}')">Start</button></div>`;
    container.appendChild(d);
  });
}

/* start by id -> redirect to choose with preload */
function startTestById(id){
  const test = TESTS.find(t=>t.id===id);
  if(!test) return alert('Test not found');
  localStorage.setItem('osix_preload_test', JSON.stringify({title:test.title,passage:test.passage}));
  location.href = 'choose.html';
}

/* ---------- Choose page init ---------- */
function initChoose(){
  // verify login
  const cur = getCurrent(); if(!cur){ location.href='index.html'; return; }
  const pre = JSON.parse(localStorage.getItem('osix_preload_test')||'null');
  if(pre){
    document.getElementById('chooseTitle').innerText = pre.title;
    document.getElementById('passagePreview').innerText = pre.passage.slice(0,400);
  } else {
    const t = TESTS[Math.floor(Math.random()*TESTS.length)];
    document.getElementById('chooseTitle').innerText = t.title;
    document.getElementById('passagePreview').innerText = t.passage.slice(0,400);
  }
  document.getElementById('startChosen').addEventListener('click', ()=>{
    const time = parseInt(document.getElementById('chooseTime').value,10) || 60;
    const passage = (pre && pre.passage) || TESTS[Math.floor(Math.random()*TESTS.length)].passage;
    beginTest(passage, time);
  });
}

/* ---------- Runner core (shared) ---------- */
let runner = { original:'',typed:'',timeLeft:0,interval:null,startTs:0,settings:{highlight:true,autoscr:true,allowBack:true,fontSize:17} };

function beginTest(passage, seconds){
  sessionStorage.setItem('osix_runner', JSON.stringify({passage,seconds,settings:runner.settings}));
  // if on choose page, open runner view; else go to choose.html and it will auto-start
  if(location.pathname.endsWith('choose.html')){
    openTestView();
  } else {
    location.href='choose.html';
    setTimeout(()=> openTestView(),300);
  }
}

function openTestView(){
  const data = JSON.parse(sessionStorage.getItem('osix_runner')||'null');
  if(!data) return;
  runner.original = data.passage;
  runner.timeLeft = data.seconds;
  runner.typed = '';
  runner.startTs = Date.now();
  // set UI
  document.getElementById('testPass').innerHTML = renderPassageHtml(runner.original,'');
  document.getElementById('testInput').value = '';
  document.getElementById('tLeft').innerText = runner.timeLeft;
  document.getElementById('tWpm').innerText = 0;
  document.getElementById('tAcc').innerText = 0;
  // apply font size if present
  const fontRange = document.getElementById('optFont');
  if(fontRange) document.getElementById('testPass').style.fontSize = fontRange.value + 'px';
  // start timer
  if(runner.interval) clearInterval(runner.interval);
  runner.interval = setInterval(()=>{
    runner.timeLeft--;
    document.getElementById('tLeft').innerText = runner.timeLeft;
    computeLiveRunner();
    if(runner.timeLeft<=0) finishTestRunner();
  },1000);
}

function renderPassageHtml(text, typed){
  const out=[];
  for(let i=0;i<text.length;i++){
    const ch = text[i] === ' ' ? '\u00A0' : text[i];
    const cls = (typed[i]==null)?'': (typed[i]===text[i]?'correct':'wrong');
    out.push(`<span class="${cls}">${escapeHtml(ch)}</span>`);
  }
  return out.join('');
}
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function onTyping(){ // bound in HTML
  const val = document.getElementById('testInput').value;
  runner.typed = val;
  document.getElementById('testPass').innerHTML = renderPassageHtml(runner.original,val);
  computeLiveRunner();
}

function computeLiveRunner(){
  const typed = runner.typed || '';
  const target = runner.original || '';
  let correct=0;
  for(let i=0;i<typed.length;i++) if(typed[i]===target[i]) correct++;
  const total = typed.length;
  const accuracy = total? Math.round((correct/total)*10000)/100:0;
  const elapsed = Math.max(1, Math.floor((Date.now()-runner.startTs)/1000));
  const mins = Math.max(elapsed/60, 1/60);
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round(words/mins);
  document.getElementById('tWpm').innerText = isFinite(wpm)?wpm:0;
  document.getElementById('tAcc').innerText = accuracy;
}

function finishTestRunner(){
  if(runner.interval) clearInterval(runner.interval);
  const typed = runner.typed || '';
  const target = runner.original || '';
  let correct=0;
  for(let i=0;i<typed.length;i++) if(typed[i]===target[i]) correct++;
  const total = typed.length;
  const accuracy = total? Math.round((correct/total)*10000)/100:0;
  const elapsed = Math.max(1, Math.floor((Date.now()-runner.startTs)/1000));
  const mins = Math.max(elapsed/60, 1/60);
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round(words/mins);
  // save to user
  const uid = getCurrent();
  if(uid){
    const users = readUsers(); const u = users.find(x=>x.id===uid);
    if(u){
      const rec = {id:genId('r'),wpm,accuracy,elapsed,date:new Date().toISOString(),passage:runner.original.slice(0,400)};
      u.results = u.results||[]; u.results.unshift(rec); writeUsers(users);
    }
  }
  sessionStorage.removeItem('osix_runner');
  alert(`Test finished — WPM: ${wpm} • Accuracy: ${accuracy}%`);
  location.href='results.html';
}

/* cancel */
function cancelTest(){ if(runner.interval) clearInterval(runner.interval); sessionStorage.removeItem('osix_runner'); location.href='dashboard.html'; }

/* ---------- Daily live test implementation ---------- */
/* ensureDailyTest: if no stored test for today, pick random and save */
function ensureDailyTest(){
  try{
    const today = new Date().toISOString().slice(0,10);
    const s = JSON.parse(localStorage.getItem(LS_DAILY_KEY)||'null');
    if(!s || s.date !== today){
      const t = TESTS[Math.floor(Math.random()*TESTS.length)];
      const obj = {date:today,title:`Daily Test — ${today}`,passage:t.passage,minutes:[60,120,300]}; // 1,2,5 min choices
      localStorage.setItem(LS_DAILY_KEY, JSON.stringify(obj));
    }
  }catch(e){}
}

/* init daily page */
function initDaily(){
  ensureDailyTest();
  const obj = JSON.parse(localStorage.getItem(LS_DAILY_KEY)||'null');
  if(!obj){ document.getElementById('dailyWrap').innerText='No daily test'; return; }
  document.getElementById('dailyTitle').innerText = obj.title;
  document.getElementById('dailyPass').innerText = obj.passage.slice(0,400);
  // start buttons
  document.getElementById('dailyStart1').addEventListener('click', ()=> beginTest(obj.passage, 60));
  document.getElementById('dailyStart2').addEventListener('click', ()=> beginTest(obj.passage, 120));
  document.getElementById('dailyStart3').addEventListener('click', ()=> beginTest(obj.passage, 300));
}

/* ---------- Leaderboard (local) ---------- */
function initLeaderboard(){
  renderLeaderBoard();
}
function renderLeaderBoard(){
  const container = document.getElementById('leaderboardList');
  if(!container) return;
  container.innerHTML = '';
  const users = readUsers(); let all=[];
  users.forEach(u=> (u.results||[]).forEach(r=> all.push({user:u.name||u.mobile,wpm:r.wpm,acc:r.accuracy,date:r.date})));
  all.sort((a,b)=>b.wpm - a.wpm);
  if(all.length===0){ container.innerHTML='<p class="small">No results yet</p>'; return; }
  all.slice(0,50).forEach(r=>{
    const d = document.createElement('div'); d.className='test-card';
    d.innerHTML = `<strong>${r.user}</strong><div class="small">${r.wpm} WPM • ${r.acc}%</div><div class="small">${(new Date(r.date)).toLocaleString()}</div>`;
    container.appendChild(d);
  });
}

/* ---------- Results page ---------- */
function initResults(){
  const uid = getCurrent(); if(!uid){ location.href='index.html'; return; }
  const users = readUsers(); const u = users.find(x=>x.id===uid);
  const el = document.getElementById('myResultsList'); el.innerHTML='';
  if(!u || !u.results || u.results.length===0){ el.innerHTML='<p class="small">No attempts yet</p>'; return; }
  u.results.forEach(r=>{
    const div = document.createElement('div'); div.className='test-card';
    div.innerHTML = `<strong>${r.wpm} WPM</strong><div class="small">${r.accuracy}% • ${(new Date(r.date)).toLocaleString()}</div><p class="small">${r.passage.slice(0,180)}...</p>`;
    el.appendChild(div);
  });
}

/* ---------- Profile page ---------- */
function initProfile(){
  const uid = getCurrent(); if(!uid){ location.href='index.html'; return; }
  const users = readUsers(); const u = users.find(x=>x.id===uid);
  if(!u){ location.href='index.html'; return; }
  // show name in the 3-dots area
  document.getElementById('profNameTop').innerText = u.name || u.mobile;
  // fill fields
  document.getElementById('pfName').value = u.name||'';
  document.getElementById('pfMobile').value = u.mobile||'';
  document.getElementById('pfEmail').value = u.email||'';
  document.getElementById('pfDistrict').value = u.district||'';
  document.getElementById('pfState').value = u.state||'';
  // edit/save
  document.getElementById('editDetails').addEventListener('click', ()=> toggleProfile(true));
  document.getElementById('saveDetails').addEventListener('click', ()=> {
    u.name = document.getElementById('pfName').value.trim();
    u.mobile = document.getElementById('pfMobile').value.trim();
    u.email = document.getElementById('pfEmail').value.trim();
    u.district = document.getElementById('pfDistrict').value.trim();
    u.state = document.getElementById('pfState').value.trim();
    writeUsers(users);
    alert('Saved');
    toggleProfile(false);
    document.getElementById('profNameTop').innerText = u.name || u.mobile;
  });
  toggleProfile(false);
}
function toggleProfile(on){
  ['pfName','pfMobile','pfEmail','pfDistrict','pfState'].forEach(id=> document.getElementById(id).disabled = !on);
}

/* ---------- Utilities for pages call ---------- */
function logout(){ localStorage.removeItem(LS_CUR); location.href='index.html'; }

/* ---------- Expose for HTML to call ---------- */
window.initIndexPage = initIndexPage;
window.initDashboard = initDashboard;
window.initChoose = initChoose;
window.openTestView = openTestView;
window.onTyping = onTyping;
window.finishTestRunner = finishTestRunner;
window.cancelTest = cancelTest;
window.startTestById = startTestById;
window.initDaily = initDaily;
window.initLeaderboard = initLeaderboard;
window.initResults = initResults;
window.initProfile = initProfile;
