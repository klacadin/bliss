(async function(){
 const gate=document.getElementById('authGate'),status=document.getElementById('authStatus'),bar=document.getElementById('userBar');
 const isAdminPage=location.pathname.includes('sales-desk');
 const url=window.BLISS_SUPABASE_URL,key=window.BLISS_SUPABASE_ANON_KEY;
 if(!url||!key||!window.supabase){status.textContent='Online accounts are not configured yet. The owner must connect the Supabase project first.';document.getElementById('authSignIn').disabled=true;document.getElementById('authSignUp').disabled=true;return;}
 const client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 async function show(session){if(!session){gate.hidden=false;bar.hidden=true;return;}
 if(isAdminPage){const {data,error}=await client.from('bliss_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(error||!data){gate.hidden=false;bar.hidden=true;status.textContent='This account is not authorized for the Sales Desk.';return;}
 const res=await client.from('bliss_sales').select('payload').eq('owner_id',session.user.id).maybeSingle();if(res.error){gate.hidden=false;status.textContent='Unable to load private sales records: '+res.error.message;return;}
 if(res.data?.payload){db=res.data.payload;render()}
 window.blissSaveSales=async function(data){const {error}=await client.from('bliss_sales').upsert({owner_id:session.user.id,payload:data,updated_at:new Date().toISOString()},{onConflict:'owner_id'});if(error){alert('Cloud save failed: '+error.message)}};
 }
 gate.hidden=true;bar.hidden=false;document.getElementById('userEmail').textContent=session.user.email||'Signed in';status.textContent='';}
 document.getElementById('authForm').onsubmit=async(e)=>{e.preventDefault();status.textContent='Signing in…';const {error}=await client.auth.signInWithPassword({email:document.getElementById('authEmail').value,password:document.getElementById('authPassword').value});if(error)status.textContent=error.message;else show((await client.auth.getSession()).data.session)};
 document.getElementById('authSignUp').onclick=async()=>{status.textContent='Creating account…';const {data,error}=await client.auth.signUp({email:document.getElementById('authEmail').value,password:document.getElementById('authPassword').value});status.textContent=error?error.message:data.session?'Account created.':'Check your email to confirm your account, then sign in.';if(data.session)show(data.session)};
 window.blissSignOut=async()=>{await client.auth.signOut();location.reload()};
 client.auth.onAuthStateChange((_event,session)=>{if(!session)show(null)});
 const {data}=await client.auth.getSession();await show(data.session);
})();
