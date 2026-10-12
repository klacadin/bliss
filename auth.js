(function(){
 const $=id=>document.getElementById(id);
 const gate=$('authGate'),msg=$('authStatus'),bar=$('userBar');
 const isAdminPage=location.pathname.includes('sales-desk');
 const cfg=window.BLISS_FIREBASE_CONFIG||{};
 let mode='signin',pendingUser=null;
 const say=(t,kind)=>{msg.textContent=t||'';msg.className='auth-msg '+(kind||'err')};
 function setMode(m){mode=m;pendingUser=null;
  $('authTitle').textContent=m==='signup'?'Create your account':m==='reset'?'Reset your password':m==='verify'?'Confirm your email':'Welcome back';
  $('pwWrap').hidden=(m==='reset'||m==='verify');$('authEmailWrap').hidden=(m==='verify');
  $('authSubmit').textContent=m==='signup'?'Create account':m==='reset'?'Send reset link':m==='verify'?'I’ve confirmed — continue':'Sign in';
  $('authPassword').autocomplete=m==='signup'?'new-password':'current-password';
  $('authPassword').required=!(m==='reset'||m==='verify');$('authEmail').required=m!=='verify';
  $('authForgot').hidden=m!=='signin';$('authResend').hidden=m!=='verify';
  $('authSwitch').innerHTML=m==='signup'?'Already have an account? <button type="button" class="link" data-m="signin">Sign in</button>':m==='signin'?'New to BLISS? <button type="button" class="link" data-m="signup">Create an account</button>':'<button type="button" class="link" data-m="signin">Back to sign in</button>';
  $('authSwitch').querySelector('button').onclick=e=>{say('');setMode(e.target.dataset.m)};
 }
 const friendly=e=>({'auth/invalid-credential':'That email and password don’t match. Try again or reset your password.','auth/wrong-password':'Wrong password. Try again or reset it.','auth/user-not-found':'No account with that email. Create one below.','auth/email-already-in-use':'You already have an account with this email. Sign in instead.','auth/weak-password':'Use at least 8 characters for your password.','auth/invalid-email':'Please check your email address.','auth/too-many-requests':'Too many tries. Please wait a few minutes and try again.','auth/network-request-failed':'No internet connection. Please check and try again.'}[e.code]||e.message);
 $('pwToggle').onclick=()=>{const p=$('authPassword');p.type=p.type==='password'?'text':'password';$('pwToggle').textContent=p.type==='password'?'Show':'Hide'};
 $('authForgot').onclick=()=>{say('');setMode('reset')};
 setMode('signin');
 if(!cfg.apiKey||!cfg.projectId||!window.firebase){say('Accounts are not set up yet. Please contact BLISS.');$('authSubmit').disabled=true;return;}
 firebase.initializeApp(cfg);
 const auth=firebase.auth(),fs=firebase.firestore();
 window.blissAuthReady=true;
 async function show(user){
  if(!user){gate.hidden=false;bar.hidden=true;return;}
  if(!user.emailVerified){pendingUser=user;gate.hidden=false;bar.hidden=true;setMode('verify');pendingUser=user;say('We sent a link to '+user.email+'. Open it, then tap the button below.','ok');return;}
  if(isAdminPage){
   let adm;
   try{adm=await fs.collection('bliss_admins').doc(user.uid).get();}catch(e){adm=null}
   if(!adm||!adm.exists){gate.hidden=false;bar.hidden=true;setMode('signin');
    say('You\u2019re signed in, but not on the BLISS sales team yet. Send this code to the owner so they can add you:','ok');
    msg.insertAdjacentHTML('beforeend','<div style="margin-top:8px;display:flex;gap:6px"><input readonly value="'+user.uid+'" style="font-size:13px;min-height:40px" onclick="this.select()"><button type="button" class="sm" onclick="navigator.clipboard.writeText(\''+user.uid+'\').then(()=>this.textContent=\'Copied \u2713\')">Copy</button></div><button type="button" class="link" onclick="blissSignOut()" style="margin-top:6px">Sign out</button>');
    return;}
   const role=adm.data().role||'owner',shared=fs.collection('bliss_sales').doc('shared');
   try{let snap=await shared.get(),data=snap.exists?snap.data().payload:null;
    if(!data){const old=await fs.collection('bliss_sales').doc(user.uid).get();if(old.exists&&old.data().payload){data=old.data().payload;await shared.set({payload:data,updated_at:firebase.firestore.FieldValue.serverTimestamp(),updated_by:user.email})}}
    if(data&&window.blissLoadSales)window.blissLoadSales(data);
    shared.onSnapshot(s=>{if(!s.metadata.hasPendingWrites&&s.exists&&window.blissLoadSales)window.blissLoadSales(s.data().payload,true)});
   }catch(e){say('Couldn\u2019t load the sales records: '+e.message);return;}
   window.blissSaveSales=data=>shared.set({payload:data,updated_at:firebase.firestore.FieldValue.serverTimestamp(),updated_by:user.email});
   window.blissUser={uid:user.uid,email:user.email,role};
   window.blissTeam={
    list:async()=>(await fs.collection('bliss_admins').get()).docs.map(d=>({uid:d.id,...d.data()})),
    add:(uid,name)=>fs.collection('bliss_admins').doc(uid).set({role:'sales',name:name||'',added_by:user.email,added_at:firebase.firestore.FieldValue.serverTimestamp()}),
    remove:uid=>fs.collection('bliss_admins').doc(uid).delete()};
   if(window.blissOnReady)window.blissOnReady();
  }
  gate.hidden=true;bar.hidden=false;$('userEmail').textContent=user.email||'';say('');
 }
 $('authResend').onclick=async()=>{const u=pendingUser||auth.currentUser;if(!u)return setMode('signin');try{await u.sendEmailVerification();say('Sent again. Check your inbox and spam folder.','ok')}catch(e){say(friendly(e))}};
 $('authForm').onsubmit=async e=>{e.preventDefault();const em=$('authEmail').value.trim(),pw=$('authPassword').value,btn=$('authSubmit');btn.disabled=true;
  try{
   if(mode==='signin'){say('Signing in…','ok');await auth.signInWithEmailAndPassword(em,pw)}
   else if(mode==='signup'){if(pw.length<8){say('Use at least 8 characters for your password.');return}say('Creating your account…','ok');const c=await auth.createUserWithEmailAndPassword(em,pw);await c.user.sendEmailVerification();}
   else if(mode==='reset'){await auth.sendPasswordResetEmail(em);setMode('signin');say('Reset link sent to '+em+'. Check your inbox.','ok')}
   else if(mode==='verify'){const u=auth.currentUser;if(!u){setMode('signin');return}await u.reload();if(auth.currentUser.emailVerified){await auth.currentUser.getIdToken(true);setMode('signin');await show(auth.currentUser)}else say('Not confirmed yet. Open the link in your email first.')}
  }catch(err){say(friendly(err))}finally{btn.disabled=false}
 };
 window.blissSignOut=async()=>{await auth.signOut();location.reload()};
 auth.onAuthStateChanged(u=>show(u));
})();
