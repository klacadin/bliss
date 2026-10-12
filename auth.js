(async function(){
 const gate=document.getElementById('authGate'),status=document.getElementById('authStatus'),bar=document.getElementById('userBar');
 const isAdminPage=location.pathname.includes('sales-desk');
 const cfg=window.BLISS_FIREBASE_CONFIG||{};
 if(!cfg.apiKey||!cfg.projectId||!window.firebase){status.textContent='Online accounts are not configured yet. The owner must connect the Firebase project first.';document.getElementById('authSignIn').disabled=true;document.getElementById('authSignUp').disabled=true;return;}
 firebase.initializeApp(cfg);
 const auth=firebase.auth(),fs=firebase.firestore();
 async function show(user){
  if(!user){gate.hidden=false;bar.hidden=true;return;}
  if(!user.emailVerified){gate.hidden=false;bar.hidden=true;status.textContent='Please confirm your email first (check your inbox), then sign in again.';await auth.signOut();return;}
  if(isAdminPage){
   try{
    const adm=await fs.collection('bliss_admins').doc(user.uid).get();
    if(!adm.exists){gate.hidden=false;bar.hidden=true;status.textContent='This account is not authorized for the Sales Desk.';return;}
    const snap=await fs.collection('bliss_sales').doc(user.uid).get();
    if(snap.exists&&snap.data().payload){db=snap.data().payload;render()}
    window.blissSaveSales=async function(data){try{await fs.collection('bliss_sales').doc(user.uid).set({payload:data,updated_at:firebase.firestore.FieldValue.serverTimestamp()})}catch(e){alert('Cloud save failed: '+e.message)}};
   }catch(e){gate.hidden=false;bar.hidden=true;status.textContent='This account is not authorized for the Sales Desk.';return;}
  }
  gate.hidden=true;bar.hidden=false;document.getElementById('userEmail').textContent=user.email||'Signed in';status.textContent='';
 }
 const email=()=>document.getElementById('authEmail').value,pw=()=>document.getElementById('authPassword').value;
 document.getElementById('authForm').onsubmit=async(e)=>{e.preventDefault();status.textContent='Signing in…';try{await auth.signInWithEmailAndPassword(email(),pw())}catch(err){status.textContent=err.message}};
 document.getElementById('authSignUp').onclick=async()=>{status.textContent='Creating account…';try{const c=await auth.createUserWithEmailAndPassword(email(),pw());await c.user.sendEmailVerification();await auth.signOut();status.textContent='Account created. Check your email to confirm it, then sign in.'}catch(err){status.textContent=err.message}};
 window.blissSignOut=async()=>{await auth.signOut();location.reload()};
 auth.onAuthStateChanged(u=>show(u));
})();
