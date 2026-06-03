/**
 * ============================================================================
 * THE "US" PORTAL - Interactive Background, Sessions, and Couple Ledger
 * ============================================================================
 */

// --- App State & Data Management ---
let currentUser = null;         // Supabase Auth User object
let currentUserProfile = null;  // Profile from public.users
let partnerProfile = null;      // Partner profile from public.users
let currentTab = 'all';         // 'all', 'inbox', 'outbox'
let logs = [];
let usersChannel = null;        // Real-time channel for partner-join sync
let clerk = null;               // Clerk instance

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// --- DOM Cache Elements ---
// Page Container Views
const landingPage = document.getElementById('landing-page');
const loginPage = document.getElementById('login-page');
const signupPage = document.getElementById('signup-page');
const waitingRoom = document.getElementById('waiting-room');
const portalContainer = document.getElementById('portal-container');

// Forms & Inputs
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

const signupFirstName = document.getElementById('signup-first-name');
const signupLastName = document.getElementById('signup-last-name');
const signupDob = document.getElementById('signup-dob');
const signupGender = document.getElementById('signup-gender');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupInviteCoupleId = document.getElementById('signup-invite-couple-id');

const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');

// Control Buttons
const btnSubmitSignup = document.getElementById('btn-submit-signup');
const btnSubmitLogin = document.getElementById('btn-submit-login');
const btnLogoutList = document.querySelectorAll('.btn-logout');

// Waiting Room Controls
const waitingRoomGreeting = document.getElementById('waiting-room-greeting');
const inviteLinkDisplay = document.getElementById('invite-link-display');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnWhatsappInvite = document.getElementById('btn-whatsapp-invite');
const inviteEmailInput = document.getElementById('invite-email-input');
const btnEmailInvite = document.getElementById('btn-email-invite');
const btnManualRefreshPair = document.getElementById('btn-manual-refresh-pair');

// Dashboard Controls
const currentUserNameTag = document.getElementById('current-user-name');
const partnerConnectionBadge = document.getElementById('partner-connection-badge');

const cardTriggerAppreciation = document.getElementById('card-trigger-appreciation');
const cardTriggerComplaint = document.getElementById('card-trigger-complaint');

const modalAppreciation = document.getElementById('modal-appreciation');
const modalComplaint = document.getElementById('modal-complaint');
const modalComment = document.getElementById('modal-comment');

const btnCloseAppreciation = document.getElementById('btn-close-appreciation');
const btnCloseComplaint = document.getElementById('btn-close-complaint');
const btnCloseComment = document.getElementById('btn-close-comment');

const btnSubmitAppreciation = document.getElementById('btn-submit-appreciation');
const btnSubmitComplaint = document.getElementById('btn-submit-complaint');
const btnSubmitComment = document.getElementById('btn-submit-comment');

const inputAppreciationMsg = document.getElementById('input-appreciation-msg');
const inputComplaintTitle = document.getElementById('input-complaint-title');
const inputComplaintDesc = document.getElementById('input-complaint-desc');
const inputCommentText = document.getElementById('input-comment-text');

let activeCommentLogId = null;

const feedContainer = document.getElementById('feed-container');
const tabAllBtn = document.getElementById('tab-all');
const tabInboxBtn = document.getElementById('tab-inbox');
const tabOutboxBtn = document.getElementById('tab-outbox');

const filterType = document.getElementById('filter-type');
const filterStatus = document.getElementById('filter-status');
const statusFilterContainer = document.getElementById('status-filter-container');

// --- Canvas Interactive Particle System (Antigravity Bubble) ---
const canvas = document.getElementById('canvas-background');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: null, y: null };
let activeAttractor = { x: null, y: null };
let lastMouseMove = Date.now();
const PARTICLE_COUNT = 800; // Dense dots to replicate antigravity welcome screen
const REPULSION_RADIUS = 150;
const REPULSION_FORCE = 4.5;
const FRICTION = 0.94;

// Adjust Canvas sizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles(); // Reinitialize dots to fit new dimensions
}

// Mouse Move Tracking
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  lastMouseMove = Date.now();
});
window.addEventListener('mouseleave', () => {
  mouse.x = null;
  mouse.y = null;
});

// Particle Class Definition (with anchor spring physics)
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.baseX = this.x; // Gravity anchor X
    this.baseY = this.y; // Gravity anchor Y
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 1.5 + 0.8; // Tiny, elegant particles
    this.baseSize = this.size;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.4 + 0.1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(29, 78, 216, 0.7)'; // Darker, highly visible blue dots
    ctx.fill();
  }

  update() {
    // 1. Natural gentle drift orbit around base anchors
    this.angle += 0.005;
    const targetX = this.baseX + Math.cos(this.angle) * 8;
    const targetY = this.baseY + Math.sin(this.angle) * 8;

    // 2. Spring pull back to target anchor position
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    this.vx += dx * 0.008;
    this.vy += dy * 0.008;

    // Apply friction to dampen movements
    this.vx *= FRICTION;
    this.vy *= FRICTION;

    // 3. Antigravity repulsion from active attractor
    if (activeAttractor.x !== null && activeAttractor.y !== null) {
      const mdx = this.x - activeAttractor.x;
      const mdy = this.y - activeAttractor.y;
      const mdist = Math.hypot(mdx, mdy);

      if (mdist < REPULSION_RADIUS) {
        const force = (REPULSION_RADIUS - mdist) / REPULSION_RADIUS;
        const pushX = (mdx / mdist) * force * REPULSION_FORCE;
        const pushY = (mdy / mdist) * force * REPULSION_FORCE;

        this.vx += pushX;
        this.vy += pushY;
        this.size = this.baseSize * (1 + force * 0.5);
      } else {
        if (this.size > this.baseSize) this.size -= 0.05;
      }
    } else {
      if (this.size > this.baseSize) this.size -= 0.05;
    }

    // Move particle
    this.x += this.vx;
    this.y += this.vy;
  }
}

// Generate Particle Array
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

// Animation Loop (interactive dots on logged-in/auth pages)
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Show particles only when logged in (dashboard & waiting room)
  if (currentUser !== null) {
    // Keep animation alive even when user is inactive (no mouse moves for > 4 seconds)
    if (mouse.x !== null && mouse.y !== null && (Date.now() - lastMouseMove < 4000)) {
      activeAttractor.x = mouse.x;
      activeAttractor.y = mouse.y;
    } else {
      // Inactive or mouse off-screen: wander the attractor using a Lissajous curve
      const time = Date.now() * 0.001;
      activeAttractor.x = canvas.width / 2 + Math.cos(time * 0.8) * (canvas.width * 0.35);
      activeAttractor.y = canvas.height / 2 + Math.sin(time * 0.6) * (canvas.height * 0.35);
    }
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
  }
  
  requestAnimationFrame(animateParticles);
}

// --- Helper Functions ---
let heartInterval = null;

function startFloatingHearts() {
  if (heartInterval) return;
  
  const activeAuthPage = window.location.hash === '#/login' ? loginPage : signupPage;
  if (!activeAuthPage) return;
  
  let container = activeAuthPage.querySelector('.heart-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'heart-container';
    activeAuthPage.appendChild(container);
  }

  heartInterval = setInterval(() => {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = '❤️';
    
    const size = Math.random() * 12 + 10; // 10px to 22px
    const left = Math.random() * 100;
    const duration = Math.random() * 6 + 6; // 6s to 12s
    const opacity = Math.random() * 0.12 + 0.04; // 0.04 to 0.16 (very subtle)
    
    heart.style.left = `${left}%`;
    heart.style.fontSize = `${size}px`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.setProperty('--target-opacity', opacity);
    
    container.appendChild(heart);
    
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }, 300); // Spawns hearts 3x faster (every 300ms)
}

function stopFloatingHearts() {
  if (heartInterval) {
    clearInterval(heartInterval);
    heartInterval = null;
  }
  document.querySelectorAll('.heart-container').forEach(c => c.remove());
}

function getPartnerName() {
  return partnerProfile ? partnerProfile.first_name : 'Partner';
}

function formatDate(timestamp) {
  const dateObj = new Date(timestamp);
  const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
  return `${dateObj.toLocaleDateString('en-US', optionsDate)} - ${dateObj.toLocaleTimeString('en-US', optionsTime)}`;
}

// --- Dynamic Route Handler ---
async function router() {
  const hash = window.location.hash || '#/';
  const path = hash.split('?')[0];
  const queryStr = hash.split('?')[1] || '';
  const params = new URLSearchParams(queryStr);
  const inviteCoupleId = params.get('invite_couple_id');

  // Hide all screens
  landingPage.classList.add('hidden');
  loginPage.classList.add('hidden');
  signupPage.classList.add('hidden');
  waitingRoom.classList.add('hidden');
  portalContainer.classList.add('hidden');

  stopFloatingHearts();

  // Cancel any active subscriptions
  if (usersChannel) {
    usersChannel.unsubscribe();
    usersChannel = null;
  }

  // Mount Clerk User Button in navbars if user is logged in
  if (clerk && clerk.user) {
    const waitingBtn = document.getElementById('user-button-waiting');
    const portalBtn = document.getElementById('user-button-portal');
    if (waitingBtn) clerk.mountUserButton(waitingBtn);
    if (portalBtn) clerk.mountUserButton(portalBtn);
  }

  // Redirect / Route logic based on auth
  if (clerk && clerk.user) {
    // If logged in to Clerk but profile hasn't loaded / doesn't exist yet, show onboarding
    if (!currentUserProfile) {
      if (currentUser) {
        // Show onboarding (reuse signup page)
        signupPage.classList.remove('hidden');
        document.body.className = '';
        startFloatingHearts();
        
        // Prefill from Clerk
        signupFirstName.value = clerk.user.firstName || '';
        signupLastName.value = clerk.user.lastName || '';
        
        // Hide email & password fields since clerk handles them
        const emailField = document.getElementById('signup-email');
        const passField = document.getElementById('signup-password');
        if (emailField) emailField.closest('.form-group').classList.add('hidden');
        if (passField) passField.closest('.form-group').classList.add('hidden');
        
        document.getElementById('signup-title-text').textContent = "Complete Your Profile";
        document.getElementById('signup-subtitle-text').textContent = "Tell us a bit about yourself to activate your portal.";
        btnSubmitSignup.textContent = "Complete Profile";
        
        if (inviteCoupleId) {
          signupInviteCoupleId.value = inviteCoupleId;
        }
      } else {
        console.log("Session exists but user profile not loaded yet. Waiting...");
      }
      return;
    }

    // Check if the user is paired or unpaired
    const { data: coupleUsers, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('couple_id', currentUserProfile.couple_id);

    if (error) {
      console.error("Router error fetching couple status:", error);
      return;
    }

    if (coupleUsers.length === 1) {
      // Unpaired -> Enforce waiting room routing
      if (path !== '#/waiting-room') {
        window.location.hash = '#/waiting-room';
        return;
      }

      waitingRoom.classList.remove('hidden');
      waitingRoomGreeting.innerHTML = `Hello, <strong>${currentUserProfile.first_name}</strong>`;
      
      // Update invite link to point to signup hash route
      const inviteLink = window.location.origin + window.location.pathname + `#/signup?invite_couple_id=${currentUserProfile.couple_id}`;
      inviteLinkDisplay.value = inviteLink;

      applyUserTheme(currentUserProfile.gender);
      subscribeToPartnerJoin();
    } else if (coupleUsers.length >= 2) {
      // Paired -> Enforce dashboard routing
      if (path !== '#/dashboard') {
        window.location.hash = '#/dashboard';
        return;
      }

      partnerProfile = coupleUsers.find(u => u.id !== currentUserProfile.id);
      portalContainer.classList.remove('hidden');

      currentUserNameTag.textContent = currentUserProfile.first_name;
      partnerConnectionBadge.textContent = `Connected with ${partnerProfile.first_name}`;
      applyUserTheme(currentUserProfile.gender);
      loadLogs();
    }
  } else {
    // Guest Routing
    if (path === '#/login') {
      if (clerk) {
        clerk.openSignIn();
      }
      window.location.hash = '#/';
      return;
    } else if (path === '#/signup') {
      if (clerk) {
        clerk.openSignUp();
      }
      window.location.hash = '#/';
      return;
    } else {
      // Force base landing hash
      if (hash !== '#/') {
        window.location.hash = '#/';
        return;
      }
      landingPage.classList.remove('hidden');
      document.body.className = '';
    }
  }
}

function applyUserTheme(gender) {
  if (gender === 'Female') {
    document.body.className = 'theme-aadya';
  } else {
    // Male or Other gets blue theme
    document.body.className = 'theme-rajat';
  }
}

// --- Authentication Session Control ---
async function waitForClerk() {
  return new Promise((resolve) => {
    if (window.Clerk) {
      resolve(window.Clerk);
      return;
    }
    const interval = setInterval(() => {
      if (window.Clerk) {
        clearInterval(interval);
        resolve(window.Clerk);
      }
    }, 50);
  });
}

async function checkClerkSession() {
  if (!clerk) return;
  
  if (clerk.user) {
    await syncClerkWithSupabase(clerk.user);
  } else {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Supabase sign out error:", err);
    }
    currentUser = null;
    currentUserProfile = null;
    partnerProfile = null;
    await router();
  }
}

async function syncClerkWithSupabase(clerkUser) {
  if (!clerkUser) return;

  const email = clerkUser.primaryEmailAddress.emailAddress;
  const clerkId = clerkUser.id;
  const deterministicPassword = 'ClerkShadow_' + clerkId + '_SecureSalt!';

  try {
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: deterministicPassword
    });

    if (signInError) {
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: email,
        password: deterministicPassword
      });

      if (signUpError) {
        console.error("Supabase shadow signup failed:", signUpError);
        return;
      }
      currentUser = signUpData.user;
    } else {
      currentUser = signInData.user;
    }

    await loadUserProfile(currentUser.id);
  } catch (err) {
    console.error("Failed to sync Clerk with Supabase:", err);
  }
}

async function loadUserProfile(userId) {
  try {
    const { data: profiles, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (error) throw error;
    
    if (profiles && profiles.length > 0) {
      currentUserProfile = profiles[0];
    } else {
      currentUserProfile = null;
    }
    await router();
  } catch (err) {
    console.error("Failed to load user profile:", err);
    alert("Error loading profile: " + err.message);
  }
}

async function handleRegister(e) {
  if (e) e.preventDefault();

  const firstName = signupFirstName.value.trim();
  const lastName = signupLastName.value.trim();
  const dob = signupDob.value;
  const gender = signupGender.value;
  const inviteCoupleId = signupInviteCoupleId.value;

  if (!firstName || !dob || !gender) {
    alert("Please fill in all required fields.");
    return;
  }

  btnSubmitSignup.disabled = true;
  btnSubmitSignup.textContent = "Saving Profile...";

  try {
    if (!currentUser) {
      throw new Error("Supabase Auth user session not active.");
    }

    const coupleId = inviteCoupleId || 'couple_' + Date.now() + Math.random().toString(36).substr(2, 9);

    const { error: profileError } = await supabaseClient
      .from('users')
      .insert([{
        id: currentUser.id,
        first_name: firstName,
        last_name: lastName || null,
        dob: dob,
        gender: gender,
        email: clerk.user.primaryEmailAddress.emailAddress,
        couple_id: coupleId
      }]);

    if (profileError) throw profileError;

    alert("Profile set up successfully!");
    await loadUserProfile(currentUser.id);
  } catch (err) {
    console.error("Setup failed:", err);
    alert("Setup failed: " + err.message);
    btnSubmitSignup.disabled = false;
    btnSubmitSignup.textContent = "Complete Profile";
  }
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  if (clerk) clerk.openSignIn();
}

async function handleLogout() {
  try {
    if (clerk) {
      await clerk.signOut();
    }
  } catch (err) {
    console.error("Failed to sign out:", err);
  }
}

// --- Realtime Subscriptions ---
function subscribeToPartnerJoin() {
  if (usersChannel) {
    usersChannel.unsubscribe();
  }

  usersChannel = supabaseClient
    .channel('public:users')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'users',
      filter: `couple_id=eq.${currentUserProfile.couple_id}`
    }, async (payload) => {
      console.log("Realtime partner join event triggered:", payload.new);
      partnerProfile = payload.new;
      
      // Auto-unlock & redirect
      await loadUserProfile(currentUser.id);
      
      alert(`Success! ${partnerProfile.first_name} has joined. Your portal is now active.`);
    })
    .subscribe();
}

// --- Inviting & Pairing Logic ---
function copyInviteLink() {
  const inviteLink = inviteLinkDisplay.value;
  navigator.clipboard.writeText(inviteLink).then(() => {
    btnCopyLink.textContent = "Copied!";
    setTimeout(() => { btnCopyLink.textContent = "Copy"; }, 2000);
  }).catch(err => {
    console.error("Clipboard copy failed:", err);
    alert("Failed to copy link. Please manually copy the text in the input box.");
  });
}

function inviteViaWhatsApp() {
  const inviteLink = inviteLinkDisplay.value;
  const message = `Hey! ${currentUserProfile.first_name} is inviting you to join their private couple's portal. It's a space for us to track our appreciations and resolve things better together. Click here to accept the invite and set up your account: ${inviteLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function inviteViaEmail() {
  const email = inviteEmailInput.value.trim();
  if (!email) {
    alert("Please enter your partner's email address.");
    return;
  }

  const inviteLink = inviteLinkDisplay.value;
  const subject = `Join my private couples portal on US.`;
  const body = `Hey! ${currentUserProfile.first_name} is inviting you to join their private couple's portal. It's a space for us to track our appreciations and resolve things better together. Click here to accept the invite and set up your account: ${inviteLink}`;
  
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
}

// --- Modals Display Control ---
function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
  const inputs = modal.querySelectorAll('input[type="text"], textarea');
  inputs.forEach(input => input.value = "");
}

// Close modals when clicking overlay background directly
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target);
  }
});

// --- Supabase Database Operations ---
async function loadLogs() {
  if (!currentUserProfile) return;

  try {
    const { data, error } = await supabaseClient
      .from('logs')
      .select('*')
      .eq('couple_id', currentUserProfile.couple_id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    logs = data || [];
  } catch (err) {
    console.error('Failed to load connection ledger logs:', err);
    logs = [];
  }
  renderFeed();
}

// --- Email Notification Trigger ---
function triggerEmailNotification(type, data) {
  if (!partnerProfile) return;

  const recipient = partnerProfile.email;
  const senderName = currentUserProfile.first_name;
  let subject = '';
  let body = '';

  if (type === 'appreciation') {
    subject = `[US Connection Portal] New Appreciation from ${senderName}`;
    body = `Hi,\n\nYou have received a new appreciation from ${senderName}:\n\n"${data.message}"\n\nCheck it out in the portal!\n\nSent from US Connection Portal.`;
  } else if (type === 'complaint') {
    subject = `[US Connection Portal] New Complaint: ${data.title}`;
    body = `Hi,\n\n${senderName} has raised a new complaint:\n\nTitle: ${data.title}\nDescription: ${data.description}\n\nPlease acknowledge and work on it in the portal.\n\nSent from US Connection Portal.`;
  }

  const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
}

// --- Submit Handlers ---
async function submitAppreciation() {
  const message = inputAppreciationMsg.value.trim();
  if (!message) {
    alert('Please enter a message of appreciation!');
    return;
  }

  const newLog = {
    id: 'app_' + Date.now() + Math.random().toString(36).substr(2, 5),
    couple_id: currentUserProfile.couple_id,
    type: 'appreciation',
    sender_id: currentUserProfile.id,
    receiver_id: partnerProfile.id,
    message: message,
    timestamp: Date.now()
  };

  try {
    const { error } = await supabaseClient
      .from('logs')
      .insert([newLog]);
    
    if (error) throw error;

    logs.push(newLog);
    closeModal(modalAppreciation);
    renderFeed();
    triggerEmailNotification('appreciation', { message: message });
  } catch (err) {
    console.error('Failed to submit appreciation:', err);
    alert('Failed to save to database: ' + err.message);
  }
}

async function submitComplaint() {
  const title = inputComplaintTitle.value.trim();
  const description = inputComplaintDesc.value.trim();

  if (!title) {
    alert('Please enter a summary title for the complaint!');
    return;
  }
  if (!description) {
    alert('Please enter details or description!');
    return;
  }

  const newLog = {
    id: 'comp_' + Date.now() + Math.random().toString(36).substr(2, 5),
    couple_id: currentUserProfile.couple_id,
    type: 'complaint',
    sender_id: currentUserProfile.id,
    receiver_id: partnerProfile.id,
    title: title,
    description: description,
    status: 'Open',
    timestamp: Date.now()
  };

  try {
    const { error } = await supabaseClient
      .from('logs')
      .insert([newLog]);
    
    if (error) throw error;

    logs.push(newLog);
    closeModal(modalComplaint);
    renderFeed();
    triggerEmailNotification('complaint', { title: title, description: description });
  } catch (err) {
    console.error('Failed to submit complaint:', err);
    alert('Failed to save to database: ' + err.message);
  }
}

async function updateComplaintStatus(id, newStatus) {
  const logIndex = logs.findIndex(log => log.id === id);
  if (logIndex === -1) return;

  const log = logs[logIndex];
  
  const isSender = log.sender_id === currentUserProfile.id;
  const isReceiver = log.receiver_id === currentUserProfile.id;

  if (newStatus === 'Closed' && !isSender) {
    alert('Permission Denied: Only the raiser (sender) can close a complaint.');
    return;
  }
  if ((newStatus === 'Acknowledged' || newStatus === 'In Progress') && !isReceiver) {
    alert('Permission Denied: Only the receiver can advance status.');
    return;
  }
  if (newStatus === 'Open' && !isSender && log.status === 'Closed') {
    alert('Permission Denied: Only the raiser can reopen a closed complaint.');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('logs')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) throw error;

    log.status = newStatus;
    renderFeed();
  } catch (err) {
    console.error('Failed to update complaint status:', err);
    alert('Failed to update status in database: ' + err.message);
  }
}

// --- Feed Rendering Engine ---
function renderFeed() {
  const typeFilter = filterType.value;
  const statusFilter = filterStatus.value;

  if (typeFilter === 'appreciation') {
    statusFilterContainer.classList.add('disabled');
  } else {
    statusFilterContainer.classList.remove('disabled');
  }

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const filteredLogs = sortedLogs.filter(log => {
    if (currentTab === 'inbox' && log.receiver_id !== currentUserProfile.id) return false;
    if (currentTab === 'outbox' && log.sender_id !== currentUserProfile.id) return false;

    if (typeFilter !== 'all' && log.type !== typeFilter) return false;

    if (log.type === 'complaint' && statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (log.type === 'appreciation' && typeFilter === 'all' && statusFilter !== 'all') return false;

    return true;
  });

  feedContainer.innerHTML = '';

  if (filteredLogs.length === 0) {
    feedContainer.innerHTML = `
      <div class="feed-empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No matches found in the ledger. Try adjusting filters or logging a new interaction.</p>
      </div>
    `;
    return;
  }

  const getUserName = (id) => {
    if (id === currentUserProfile.id) return currentUserProfile.first_name;
    if (partnerProfile && id === partnerProfile.id) return partnerProfile.first_name;
    return "Partner";
  };

  filteredLogs.forEach(log => {
    const card = document.createElement('article');
    const isSender = log.sender_id === currentUserProfile.id;
    const isReceiver = log.receiver_id === currentUserProfile.id;
    
    if (log.type === 'appreciation') {
      card.className = 'feed-card glass-panel appreciation-card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-meta">
            <span class="badge-type badge-appreciation">❤ Appreciation</span>
            <div class="card-direction">
              From <span>${getUserName(log.sender_id)}</span> to <span>${getUserName(log.receiver_id)}</span>
            </div>
          </div>
          <span class="card-timestamp">${formatDate(log.timestamp)}</span>
        </div>
        <div class="card-body">
          <p class="appreciation-text">${escapeHTML(log.message)}</p>
        </div>
      `;
    } else {
      card.className = `feed-card glass-panel complaint-card status-${log.status.replace(' ', '-')}`;
      
      let statusTagClass = 'status-tag-open';
      if (log.status === 'Acknowledged') statusTagClass = 'status-tag-acknowledged';
      if (log.status === 'In Progress') statusTagClass = 'status-tag-in-progress';
      if (log.status === 'Closed') statusTagClass = 'status-tag-closed';

      let actionsHTML = '';

      if (isReceiver && log.status !== 'Closed') {
        if (log.status === 'Open') {
          actionsHTML = `
            <button class="btn-status-action btn-action-ack" onclick="updateComplaintStatus('${log.id}', 'Acknowledged')">
              Acknowledge Issue
            </button>
          `;
        } else if (log.status === 'Acknowledged') {
          actionsHTML = `
            <button class="btn-status-action btn-action-progress" onclick="updateComplaintStatus('${log.id}', 'In Progress')">
              Mark In Progress
            </button>
          `;
        }
      } else if (isSender) {
        if (log.status !== 'Closed') {
          actionsHTML = `
            <button class="btn-status-action btn-action-close" onclick="updateComplaintStatus('${log.id}', 'Closed')">
              Close Complaint
            </button>
          `;
        } else {
          actionsHTML = `
            <button class="btn-status-action btn-action-reopen" onclick="updateComplaintStatus('${log.id}', 'Open')">
              Reopen
            </button>
          `;
        }
      }

      if (log.status !== 'Open') {
        actionsHTML += `
          <button class="btn-status-action btn-action-comment" onclick="openCommentModal('${log.id}')">
            Add Comment
          </button>
        `;
      }

      card.innerHTML = `
        <div class="card-header">
          <div class="card-meta">
            <span class="badge-type badge-complaint">⚠ Complaint</span>
            <div class="card-direction">
              From <span>${getUserName(log.sender_id)}</span> to <span>${getUserName(log.receiver_id)}</span>
            </div>
          </div>
          <div class="card-meta">
            <span class="badge-status ${statusTagClass}">${log.status}</span>
            <span class="card-timestamp">${formatDate(log.timestamp)}</span>
          </div>
        </div>
        <div class="card-body">
          <h4 class="card-title">${escapeHTML(log.title)}</h4>
          <p class="card-description">${escapeHTML(log.description)}</p>
          ${(log.comments && log.comments.length > 0) ? `
            <div class="card-comments-thread">
              ${log.comments.map(c => `
                <div class="comment-item">
                  <div class="comment-item-header">
                    <span class="comment-item-sender sender-${getUserName(c.sender_id).toLowerCase()}">${getUserName(c.sender_id)}</span>
                    <span class="comment-item-timestamp">${formatDate(c.timestamp)}</span>
                  </div>
                  <p class="comment-item-text">${escapeHTML(c.text)}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        ${actionsHTML ? `<div class="card-actions-footer">${actionsHTML}</div>` : ''}
      `;
    }
    
    feedContainer.appendChild(card);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function openCommentModal(id) {
  activeCommentLogId = id;
  inputCommentText.value = '';
  openModal(modalComment);
}

async function submitComment() {
  const commentText = inputCommentText.value.trim();
  if (!commentText) {
    alert('Please enter a comment!');
    return;
  }
  if (!activeCommentLogId) return;

  const log = logs.find(l => l.id === activeCommentLogId);
  if (!log) return;

  const newComment = {
    sender_id: currentUserProfile.id,
    text: commentText,
    timestamp: Date.now()
  };

  const updatedComments = [...(log.comments || []), newComment];

  try {
    const { error } = await supabaseClient
      .from('logs')
      .update({ comments: updatedComments })
      .eq('id', activeCommentLogId);
    
    if (error) throw error;

    log.comments = updatedComments;
    closeModal(modalComment);
    renderFeed();
  } catch (err) {
    console.error('Failed to submit comment:', err);
    alert('Failed to save comment to database: ' + err.message);
  }
}

// Expose status updates globally for inline card onclick triggers
window.updateComplaintStatus = updateComplaintStatus;
window.openCommentModal = openCommentModal;

// --- Bind Navigation Events & Load ---
function setupEventListeners() {
  // Form Submit Triggers
  signupForm.addEventListener('submit', handleRegister);
  loginForm.addEventListener('submit', handleLogin);
  
  // Multiple logout buttons (both waiting-room and dashboard)
  btnLogoutList.forEach(btn => btn.addEventListener('click', handleLogout));

  // Waiting Room Invite Control Hooks
  btnCopyLink.addEventListener('click', copyInviteLink);
  btnWhatsappInvite.addEventListener('click', inviteViaWhatsApp);
  btnEmailInvite.addEventListener('click', inviteViaEmail);
  btnManualRefreshPair.addEventListener('click', () => {
    if (currentUser) loadUserProfile(currentUser.id);
  });

  // Dashboard modal triggers
  cardTriggerAppreciation.addEventListener('click', () => openModal(modalAppreciation));
  cardTriggerComplaint.addEventListener('click', () => openModal(modalComplaint));

  btnCloseAppreciation.addEventListener('click', () => closeModal(modalAppreciation));
  btnCloseComplaint.addEventListener('click', () => closeModal(modalComplaint));
  btnCloseComment.addEventListener('click', () => closeModal(modalComment));

  btnSubmitAppreciation.addEventListener('click', submitAppreciation);
  btnSubmitComplaint.addEventListener('click', submitComplaint);
  btnSubmitComment.addEventListener('click', submitComment);

  // Tab controls
  const tabs = [
    { btn: tabAllBtn, tabName: 'all' },
    { btn: tabInboxBtn, tabName: 'inbox' },
    { btn: tabOutboxBtn, tabName: 'outbox' }
  ];

  tabs.forEach(t => {
    t.btn.addEventListener('click', () => {
      tabs.forEach(item => item.btn.classList.remove('active'));
      t.btn.classList.add('active');
      currentTab = t.tabName;
      renderFeed();
    });
  });

  // Dropdown filter changes
  filterType.addEventListener('change', renderFeed);
  filterStatus.addEventListener('change', renderFeed);

  // Hash-based router listener
  window.addEventListener('hashchange', router);
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  // Staggered letter reveal for subtitle text on landing page
  const subtitleEl = document.querySelector('.hero-subtitle');
  if (subtitleEl) {
    const text = subtitleEl.textContent.trim();
    subtitleEl.textContent = '';
    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space for layout
      span.className = 'char-item';
      const delay = 0.4 + index * 0.018;
      span.style.animationDelay = `${delay}s`;
      subtitleEl.appendChild(span);
    });
  }

  // 1. Setup particle system
  initParticles();
  animateParticles();
  
  // Bind resize handler
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 2. Bind inputs/controls & router
  setupEventListeners();

  // 3. Wait for Clerk and initialize
  waitForClerk().then(async (clerkInstance) => {
    clerk = clerkInstance;
    await clerk.load();

    // Attach click listeners to landing buttons
    const landingBtnLogin = document.getElementById('landing-btn-login');
    const landingBtnSignupNav = document.getElementById('landing-btn-signup-nav');
    const landingBtnSignupHero = document.getElementById('landing-btn-signup-hero');

    if (landingBtnLogin) {
      landingBtnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        clerk.openSignIn();
      });
    }
    if (landingBtnSignupNav) {
      landingBtnSignupNav.addEventListener('click', (e) => {
        e.preventDefault();
        clerk.openSignUp();
      });
    }
    if (landingBtnSignupHero) {
      landingBtnSignupHero.addEventListener('click', (e) => {
        e.preventDefault();
        clerk.openSignUp();
      });
    }

    clerk.addListener(async ({ user }) => {
      console.log("Clerk state changed. User:", user ? user.id : "null");
      await checkClerkSession();
    });

    await checkClerkSession();
  });
});
