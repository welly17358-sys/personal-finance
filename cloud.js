/* Cloud sync: no service-role key in browser. Supabase RLS is mandatory. */
(()=>{
 const gate=document.getElementById('authGate'),msg=document.getElementById('authMessage'),status=document.getElementById('cloudStatus');
 const c=window.FINANCE_CONFIG||{};let client=null,user=null,saving=false,timer=null,loading=false;
 if(!c.supabaseUrl||!c.supabaseAnonKey||!window.supabase){msg.textContent='尚未設定 Supabase。請參考 README。';return}
 client=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{flowType:'pkce',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
 const setStatus=t=>status.textContent=t;
 document.getElementById('authLogin').onclick=async()=>{
  const email=document.getElementById('authEmail').value.trim();if(!email){msg.textContent='請輸入Email';return}
  msg.textContent='正在寄送…';const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});msg.textContent=error?error.message:'請到信箱點選登入連結';
 };
 async function load(){if(!user)return;loading=true;setStatus('正在讀取私人雲端參數…');
  const {data,error}=await client.from('user_settings').select('settings,updated_at').eq('user_id',user.id).maybeSingle();
  if(error){setStatus('讀取失敗：'+error.message);loading=false;return}
  if(data?.settings && Array.isArray(data.settings.etfs)){
    cfg=data.settings;normalize();buildInputs();render();setStatus('已同步雲端 · '+new Date(data.updated_at).toLocaleString('zh-TW'));
  }else{cfg=structuredClone(BASE);normalize();buildInputs();render();setStatus('新帳號尚無私人資料。請匯入隨附的私人參數 JSON，再按「儲存到私人雲端」。')}
  loading=false;
  window.FINANCE_UPDATE_MARKET_STATUS?.();
 }
 async function cloudSave(){if(!user||loading||saving)return;saving=true;setStatus('正在儲存私人雲端…');
  const {error}=await client.from('user_settings').upsert({user_id:user.id,settings:cfg,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  setStatus(error?'雲端儲存失敗：'+error.message:'已儲存到私人雲端 · '+new Date().toLocaleString('zh-TW'));saving=false;
 }
 // Existing local save remains as a fallback; cloud save is authoritative when logged in.
 const localSave=save;
 save=()=>{localSave();void cloudSave()};
 document.querySelector('#settings').addEventListener('change',()=>{if(!user||loading)return;clearTimeout(timer);timer=setTimeout(()=>void cloudSave(),850)});
 const origImport=document.getElementById('jsonFile').onchange;
 document.getElementById('jsonFile').onchange=async e=>{await origImport(e);if(user)await cloudSave()};
 const origReset=reset;
 reset=()=>{origReset();if(user)void cloudSave()};
 const logout=document.createElement('button');logout.className='btn';logout.textContent='登出';document.querySelector('.actions').append(logout);
 logout.onclick=async()=>{await client.auth.signOut();user=null;localStorage.removeItem('finance_dashboard_2026');location.reload()};
 async function authChanged(session){const next=session?.user||null;if(next?.id===user?.id)return;user=next;
  if(!user){gate.style.display='flex';setStatus('尚未登入');return}
  gate.style.display='none';localStorage.removeItem('finance_dashboard_2026');await load();
 }
 client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>void authChanged(session),0)});
 void client.auth.getSession().then(({data})=>authChanged(data.session));
 // Public quotes are loaded separately from private Supabase data.
 // No market quote is ever persisted to cfg or user_settings.
 void fetch('./data/market.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
   const el=document.getElementById('marketStatus');
   if(!d||!d.quotes){el.textContent='市場資料：尚未提供；使用私人設定中的手動市值';return}
   const valid={};
   for(const [code,q] of Object.entries(d.quotes)){
     const close=Number(q?.close);
     if(Number.isFinite(close)&&close>0)valid[code]={close};
   }
   window.FINANCE_MARKET_QUOTES=valid;
   const parts=Object.entries(valid).map(([code,q])=>`${code}：${q.close}元`).join(' · ');
   function updateMarketStatus(){
     const holdings=cfg.etfs||[];
     const valuation=holdings.reduce((sum,e)=>sum+(valid[e.code]?Number(e.shares)*valid[e.code].close:Number(e.value||0)),0);
     el.textContent=`行情擷取：${d.fetched_at||'未知'}（非交易日證明，請核對收盤日期）｜${parts||'尚無資料'} ｜ 依持股估算ETF現值：NT$${Math.round(valuation).toLocaleString('zh-TW')}｜已套用至資產預測（不覆寫雲端持倉）`;
   }
   window.FINANCE_UPDATE_MARKET_STATUS=updateMarketStatus;
   updateMarketStatus();
   if(user&&!loading)render();
 }).catch(()=>{document.getElementById('marketStatus').textContent='行情更新暫時不可用；使用私人設定中的手動市值'});
})();
