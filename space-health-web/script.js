/* SPACE HEALTH — prototype UI.
   Live device data requires matching BLE service/characteristic UUIDs and a defined payload.
   Do not treat demo values as medical measurements. */
const $ = (id) => document.getElementById(id);
const state = {
  glucose: 108, heart: 72, spo2: 98, temp: 36.7, steps: 3240,
  connected: false, demo: false, device: null, characteristic: null,
  history: [], alerts: []
};
const nowLabel = () => new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'});
const toast = (msg) => { const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); };
$('todayDate').textContent = new Date().toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

function addHistory(source='تجريبي'){
  state.history.unshift({time:new Date().toLocaleString('ar-EG'),glucose:state.glucose,heart:state.heart,spo2:state.spo2,temp:state.temp,source});
  renderHistory();
}
function renderValues(){
  ['glucoseValue','glucoseValue2'].forEach(id=>$(id).textContent=state.glucose);
  ['heartValue','heartValue2'].forEach(id=>$(id).textContent=state.heart);
  ['spo2Value','spo2Value2'].forEach(id=>$(id).textContent=state.spo2);
  ['tempValue','tempValue2'].forEach(id=>$(id).textContent=state.temp.toFixed(1));
  $('stepsValue').textContent=state.steps.toLocaleString('en-US');
  const status=state.glucose<70?'أقل من الحد التجريبي':state.glucose>180?'أعلى من الحد التجريبي':'ضمن النطاق التجريبي';
  ['glucoseStatus','glucoseStatus2'].forEach(id=>{ $(id).textContent=status; $(id).className='status '+(state.glucose<70||state.glucose>180?'warning':'normal'); });
  $('averageValue').textContent=Math.round(state.history.reduce((s,r)=>s+r.glucose,0)/(state.history.length||1));
}
function renderConnection(){
  $('connectionPill').classList.toggle('connected',state.connected);
  $('connectionPill').innerHTML='<i></i> '+(state.connected?'الساعة متصلة':'الساعة غير متصلة');
  $('deviceState').classList.toggle('connected',state.connected);
  $('deviceState').querySelector('span').textContent=state.connected?'متصل':'غير متصل';
  $('deviceStatusText').textContent=state.connected?'الساعة متصلة بنجاح':'لم يتم توصيل الساعة';
  $('deviceSubText').textContent=state.connected?'يتم استقبال البيانات من الجهاز.':'اربط ساعتك لبدء استقبال البيانات.';
  $('connectBtn').textContent=state.connected?'قطع الاتصال':'اتصال بالساعة';
}
function addAlert(title,detail){
  state.alerts.unshift({title,detail,time:nowLabel()}); renderAlerts();
}
function renderAlerts(){
  const html=state.alerts.length?state.alerts.map(a=>`<div class="alert-item"><div class="alert-symbol">♢</div><div><b>${escapeHtml(a.title)}</b><small>${escapeHtml(a.detail)} • ${escapeHtml(a.time)}</small></div></div>`).join(''):'<p class="muted">لا توجد تنبيهات حتى الآن.</p>';
  $('recentAlerts').innerHTML=html; $('allAlerts').innerHTML=html;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderHistory(){
  $('historyRows').innerHTML=state.history.map(r=>`<tr><td>${escapeHtml(r.time)}</td><td>${r.glucose} mg/dL</td><td>${r.heart}</td><td>${r.spo2}%</td><td>${r.temp.toFixed(1)}°</td><td>${escapeHtml(r.source)}</td></tr>`).join('');
}
let labels=['08:00','10:00','12:00','14:00','16:00','18:00'];
let values=[98,112,125,108,116,108];
let overviewChart,glucoseChart;
function chartConfig(){return {type:'line',data:{labels:[...labels],datasets:[{label:'الجلوكوز',data:[...values],borderColor:'#17a89a',backgroundColor:'rgba(23,168,154,.12)',fill:true,tension:.35,pointRadius:3,pointBackgroundColor:'#17a89a'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{family:'Cairo'}}},y:{grid:{color:'#edf1f5'},ticks:{font:{family:'Cairo'}}}}}}}
if(window.Chart){overviewChart=new Chart($('overviewChart'),chartConfig());glucoseChart=new Chart($('glucoseChart'),chartConfig());}
function updateCharts(){[overviewChart,glucoseChart].forEach(c=>{if(c){c.data.datasets[0].data=[...values];c.data.labels=[...labels];c.update();}});}
function simulateReading(){
  state.glucose=Math.max(65,Math.min(190,Math.round(state.glucose+(Math.random()*18-9))));
  state.heart=Math.round(66+Math.random()*22); state.spo2=Math.round(96+Math.random()*3);
  state.temp=+(36.4+Math.random()*.8).toFixed(1); state.steps+=Math.round(5+Math.random()*30);
  labels.push(nowLabel());values.push(state.glucose);if(labels.length>7){labels.shift();values.shift();}
  renderValues();addHistory(state.connected?'الساعة':'محاكاة');$('lastSync').textContent=nowLabel();
  if(state.glucose<70||state.glucose>180)addAlert('تنبيه مستوى الجلوكوز',`قراءة تجريبية: ${state.glucose} mg/dL`);
  updateCharts();
}
function goTo(id){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.toggle('active',s.id===id));
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.section===id));
  const link=document.querySelector(`[data-section="${id}"]`);$('pageTitle').textContent=link?link.textContent.trim():'نظرة عامة';
  if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  $('sidebar').classList.remove('open');
}
document.querySelectorAll('[data-section]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goTo(a.dataset.section);}));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.go)));
$('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('notifyBtn').addEventListener('click',()=>goTo('alerts'));
if(location.hash&&$(location.hash.slice(1)))goTo(location.hash.slice(1));
renderValues();renderConnection();addHistory();renderAlerts();

$('demoBtn').addEventListener('click',()=>{
  state.demo=true;state.connected=false;renderConnection();$('dataSource').textContent='محاكاة محلية';
  $('bleMessage').textContent='المحاكاة تعمل الآن. القيم تتغير تلقائيًا وهي ليست قياسات حقيقية.';
  if(!window.demoTimer)window.demoTimer=setInterval(simulateReading,5000);
  toast('بدأت المحاكاة التجريبية');
});

// IMPORTANT: Replace these example UUIDs with the actual UUIDs implemented by the watch firmware.
const BLE_SERVICE_UUID='0000ffe0-0000-1000-8000-00805f9b34fb';
const BLE_CHARACTERISTIC_UUID='0000ffe1-0000-1000-8000-00805f9b34fb';
$('connectBtn').addEventListener('click',async()=>{
  if(state.connected){try{state.device?.gatt?.disconnect();}catch(e){}state.connected=false;renderConnection();toast('تم قطع الاتصال');return;}
  if(!navigator.bluetooth){$('bleMessage').textContent='هذا المتصفح لا يدعم Web Bluetooth. جرّبي Chrome أو Edge على جهاز متوافق عبر HTTPS.';toast('Web Bluetooth غير متاح في هذا المتصفح');return;}
  try{
    $('bleMessage').textContent='اختاري الساعة من نافذة Bluetooth...';
    const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[BLE_SERVICE_UUID]});
    device.addEventListener('gattserverdisconnected',()=>{state.connected=false;renderConnection();$('bleMessage').textContent='انقطع اتصال الساعة.';});
    const server=await device.gatt.connect();
    const service=await server.getPrimaryService(BLE_SERVICE_UUID);
    const characteristic=await service.getCharacteristic(BLE_CHARACTERISTIC_UUID);
    state.device=device;state.characteristic=characteristic;state.connected=true;state.demo=false;
    $('deviceName').textContent=device.name||'ساعة ذكية';$('dataSource').textContent='Bluetooth LE';renderConnection();
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged',handleBleData);
    $('bleMessage').textContent='تم الاتصال. في انتظار بيانات الساعة.';
    toast('تم الاتصال بالجهاز');
  }catch(err){
    console.error(err);$('bleMessage').textContent='تعذر الاتصال: '+(err.message||'تحققي من توافق الساعة وإعدادات BLE.');
    toast('لم يكتمل الاتصال — راجعي إعدادات BLE');
  }
});
function handleBleData(event){
  // Expected demo payload: JSON text, e.g. {"glucose":108,"heart":72,"spo2":98,"temp":36.7}
  // Your watch firmware must send this agreed format, or this parser must be adapted.
  try{
    const raw=new TextDecoder().decode(event.target.value);const d=JSON.parse(raw);
    if(Number.isFinite(+d.glucose))state.glucose=+d.glucose;
    if(Number.isFinite(+d.heart))state.heart=+d.heart;
    if(Number.isFinite(+d.spo2))state.spo2=+d.spo2;
    if(Number.isFinite(+d.temp))state.temp=+d.temp;
    renderValues();addHistory('الساعة');$('lastSync').textContent=nowLabel();
    $('dataSource').textContent='Bluetooth LE';toast('تم استقبال قراءة من الساعة');
  }catch(e){$('bleMessage').textContent='وصلت بيانات، لكن صيغة الرسالة غير متوافقة. راجعي handleBleData داخل script.js.';}
}
$('clearAlerts').addEventListener('click',()=>{state.alerts=[];renderAlerts();toast('تم مسح سجل التنبيهات');});
$('exportBtn').addEventListener('click',()=>{
  if(!state.history.length){toast('لا توجد بيانات للتصدير');return;}
  const rows=[['Time','Glucose_mg_dL','Heart_BPM','SpO2_percent','Temperature_C','Source'],...state.history.map(r=>[r.time,r.glucose,r.heart,r.spo2,r.temp,r.source])];
  const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='space-health-report.csv';a.click();URL.revokeObjectURL(url);
});
$('saveProfile').addEventListener('click',()=>{
  const profile={name:$('patientName').value,age:$('patientAge').value,contact:$('emergencyContact').value,notes:$('patientNotes').value};
  localStorage.setItem('spaceHealthProfile',JSON.stringify(profile));$('profileSaved').textContent='تم حفظ البيانات على هذا الجهاز.';toast('تم حفظ الملف الشخصي');
});
try{const p=JSON.parse(localStorage.getItem('spaceHealthProfile')||'null');if(p){$('patientName').value=p.name||'';$('patientAge').value=p.age||'';$('emergencyContact').value=p.contact||'';$('patientNotes').value=p.notes||'';}}catch(e){}
