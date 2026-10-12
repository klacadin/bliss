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
   try{const adm=await fs.collection('bliss_admins').doc(user.uid).get();if(!adm.exists)throw 0;}
   catch(e){gate.hidden=false;bar.hidden=true;say('This account doesn’t have Sales Desk access.');await auth.signOut();return;}
   try{const snap=await fs.collection('bliss_sales').doc(user.uid).get();if(snap.exists&&snap.data().payload&&window.blissLoadSales)window.blissLoadSales(snap.data().payload);}catch(e){say('Couldn’t load your records: '+e.message);return;}
   window.blissSaveSales=data=>fs.collection('bliss_sales').doc(user.uid).set({payload:data,updated_at:firebase.firestore.FieldValue.serverTimestamp()});
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
