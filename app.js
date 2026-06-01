/**
 * ============================================================================
 * THE "US" PORTAL - Interactive Background, Sessions, and Couple Ledger
 * ============================================================================
 */

// --- App State & Data Management ---
let currentUser = null;
let currentTab = 'all'; // 'all', 'inbox', 'outbox'
let logs = [];

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Player Custom Names
const playerNames = {
  X: 'Player X',
  O: 'Player O'
};

// --- DOM Cache Elements ---
const loginOverlay = document.getElementById('login-overlay');
const portalContainer = document.getElementById('portal-container');
const btnLogout = document.getElementById('btn-logout');
const currentUserNameTag = document.getElementById('current-user-name');

const cardTriggerAppreciation = document.getElementById('card-trigger-appreciation');
const cardTriggerComplaint = document.getElementById('card-trigger-complaint');

const modalAppreciation = document.getElementById('modal-appreciation');
const modalComplaint = document.getElementById('modal-complaint');

const btnCloseAppreciation = document.getElementById('btn-close-appreciation');
const btnCloseComplaint = document.getElementById('btn-close-complaint');

const btnSubmitAppreciation = document.getElementById('btn-submit-appreciation');
const btnSubmitComplaint = document.getElementById('btn-submit-complaint');

const inputAppreciationMsg = document.getElementById('input-appreciation-msg');
const inputComplaintTitle = document.getElementById('input-complaint-title');
const inputComplaintDesc = document.getElementById('input-complaint-desc');

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
let landingParticles = [];
let mouse = { x: null, y: null };
let activeAttractor = { x: null, y: null };
let lastMouseMove = Date.now();
const PARTICLE_COUNT = 800; // Dense dots to replicate antigravity welcome screen
const LANDING_PARTICLE_COUNT = 150; // Dash count for vortex
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

// Landing Particle Class (Vortex of colorful dashes)
class LandingParticle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true); // Initial load spreads them out
  }

  reset(initSpread = false) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.6 + 0.3; // Outward speed
    this.vortexSpeed = (Math.random() * 0.15 + 0.05) * (Math.random() > 0.5 ? 1 : -1); // Vortex spin
    
    if (initSpread) {
      // Spread out randomly between center and screen edge
      const maxDist = Math.max(this.canvas.width, this.canvas.height) * 0.65;
      const dist = Math.random() * maxDist;
      this.x = cx + Math.cos(this.angle) * dist;
      this.y = cy + Math.sin(this.angle) * dist;
    } else {
      // Start directly at center
      this.x = cx;
      this.y = cy;
    }
    
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    
    // Choose colorful dash color
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(156, 163, 175, 0.6)'    // Grey
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.length = Math.random() * 8 + 6; // Dash length
    this.width = Math.random() * 1.5 + 1.2; // Dash thickness
    this.life = 0;
    this.maxLife = Math.random() * 300 + 200;
  }

  draw(ctx) {
    ctx.beginPath();
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 0) {
      const dx = (this.vx / speed) * this.length;
      const dy = (this.vy / speed) * this.length;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - dx, this.y - dy);
    } else {
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.length, this.y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  update() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const dx = this.x - cx;
    const dy = this.y - cy;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 5) {
      const outX = dx / dist;
      const outY = dy / dist;
      const tangentX = -dy / dist;
      const tangentY = dx / dist;
      
      // Update velocity vector with outward + spiral components
      this.vx = outX * this.speed + tangentX * this.vortexSpeed;
      this.vy = outY * this.speed + tangentY * this.vortexSpeed;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    
    // Reset if it goes off screen or lifetime ends
    if (
      this.x < -20 || 
      this.x > this.canvas.width + 20 || 
      this.y < -20 || 
      this.y > this.canvas.height + 20 || 
      this.life > this.maxLife
    ) {
      this.reset(false);
    }
  }
}

// Generate Particle Array
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
  
  landingParticles = [];
  for (let i = 0; i < LANDING_PARTICLE_COUNT; i++) {
    landingParticles.push(new LandingParticle(canvas));
  }
}

// Animation Loop (Dashes on landing page, interactive dots on logged-in page)
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (currentUser === null) {
    landingParticles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
  } else {
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
function getPartnerName(user) {
  return user === 'Aadya' ? 'Rajat' : 'Aadya';
}

function formatDate(timestamp) {
  const dateObj = new Date(timestamp);
  const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
  return `${dateObj.toLocaleDateString('en-US', optionsDate)} - ${dateObj.toLocaleTimeString('en-US', optionsTime)}`;
}

// --- Authentication Session Control ---
function checkSession() {
  const storedUser = localStorage.getItem('us_portal_user');
  if (storedUser === 'Aadya' || storedUser === 'Rajat') {
    login(storedUser);
  } else {
    logout();
  }
}

function login(username) {
  currentUser = username;
  localStorage.setItem('us_portal_user', username);
  
  // Set personalized themes on document body
  document.body.className = `theme-${username.toLowerCase()}`;
  
  // Update header labels
  currentUserNameTag.textContent = username;
  
  // Toggle Visibility
  loginOverlay.classList.add('hidden');
  portalContainer.classList.remove('hidden');
  
  // Refresh feed list
  loadLogs();
  renderFeed();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('us_portal_user');
  document.body.className = '';
  
  portalContainer.classList.add('hidden');
  loginOverlay.classList.remove('hidden');
}

// --- Modals Display Control ---
function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
  // Clear modal inputs
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
  try {
    // Migrate legacy localstorage data to Supabase if present
    const rawLocalLogs = localStorage.getItem('us_portal_logs');
    if (rawLocalLogs) {
      const localLogs = JSON.parse(rawLocalLogs);
      if (localLogs && localLogs.length > 0) {
        console.log(`Found ${localLogs.length} legacy logs in localStorage. Migrating to Supabase...`);
        const { error } = await supabaseClient
          .from('logs')
          .insert(localLogs);
        if (error) {
          console.error('Failed to migrate local logs to Supabase:', error);
        } else {
          console.log('Migration successful. Clearing localStorage logs...');
          localStorage.removeItem('us_portal_logs');
        }
      } else {
        localStorage.removeItem('us_portal_logs');
      }
    }
  } catch (err) {
    console.error('Error during local storage data migration:', err);
  }

  try {
    const { data, error } = await supabaseClient
      .from('logs')
      .select('*')
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
function triggerEmailNotification(sender, type, data) {
  const recipient = sender === 'Rajat' ? 'aadyabackup1@gmail.com' : 'upreti.rajat@gmail.com';
  let subject = '';
  let body = '';

  if (type === 'appreciation') {
    subject = `[US Connection Portal] New Appreciation from ${sender}`;
    body = `Hi,\n\nYou have received a new appreciation from ${sender}:\n\n"${data.message}"\n\nCheck it out in the portal!\n\nSent from US Connection Portal.`;
  } else if (type === 'complaint') {
    subject = `[US Connection Portal] New Complaint: ${data.title}`;
    body = `Hi,\n\n${sender} has raised a new complaint:\n\nTitle: ${data.title}\nDescription: ${data.description}\n\nPlease acknowledge and work on it in the portal.\n\nSent from US Connection Portal.`;
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
    type: 'appreciation',
    sender: currentUser,
    receiver: getPartnerName(currentUser),
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
    triggerEmailNotification(newLog.sender, 'appreciation', { message: message });
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
    type: 'complaint',
    sender: currentUser,
    receiver: getPartnerName(currentUser),
    title: title,
    description: description,
    status: 'Open', // Initial status
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
    triggerEmailNotification(newLog.sender, 'complaint', { title: title, description: description });
  } catch (err) {
    console.error('Failed to submit complaint:', err);
    alert('Failed to save to database: ' + err.message);
  }
}

/**
 * Handles status updates for complaints based on user roles and permissions
 */
async function updateComplaintStatus(id, newStatus) {
  const logIndex = logs.findIndex(log => log.id === id);
  if (logIndex === -1) return;

  const log = logs[logIndex];
  
  // Verification check: Double check authority
  const isSender = log.sender === currentUser;
  const isReceiver = log.receiver === currentUser;

  if (newStatus === 'Closed' && !isSender) {
    alert('Permission Denied: Only the raiser (sender) can close a complaint.');
    return;
  }
  if ((newStatus === 'Acknowledged' || newStatus === 'In Progress') && !isReceiver) {
    alert('Permission Denied: Only the accused (receiver) can advance status.');
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

    // Commit update locally
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

  // Toggle status filter display (only show status filter if appreciations are not exclusively selected)
  if (typeFilter === 'appreciation') {
    statusFilterContainer.classList.add('disabled');
  } else {
    statusFilterContainer.classList.remove('disabled');
  }

  // Sort logs chronologically (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  // Filter logs array
  const filteredLogs = sortedLogs.filter(log => {
    // 1. Tab Direction Filter
    if (currentTab === 'inbox' && log.receiver !== currentUser) return false;
    if (currentTab === 'outbox' && log.sender !== currentUser) return false;

    // 2. Type Filter
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;

    // 3. Status Filter (only applies to complaints)
    if (log.type === 'complaint' && statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (log.type === 'appreciation' && typeFilter === 'all' && statusFilter !== 'all') {
      // If filtering for a specific complaint status, hide appreciations since they don't have statuses
      return false;
    }

    return true;
  });

  // Clear feed container
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

  // Create card items
  filteredLogs.forEach(log => {
    const card = document.createElement('article');
    const isSender = log.sender === currentUser;
    const isReceiver = log.receiver === currentUser;
    
    if (log.type === 'appreciation') {
      // --- Render Appreciation Card ---
      card.className = 'feed-card glass-panel appreciation-card';
      
      card.innerHTML = `
        <div class="card-header">
          <div class="card-meta">
            <span class="badge-type badge-appreciation">❤ Appreciation</span>
            <div class="card-direction">
              From <span>${log.sender}</span> to <span>${log.receiver}</span>
            </div>
          </div>
          <span class="card-timestamp">${formatDate(log.timestamp)}</span>
        </div>
        <div class="card-body">
          <p class="appreciation-text">${escapeHTML(log.message)}</p>
        </div>
      `;
    } else {
      // --- Render Complaint Card ---
      card.className = `feed-card glass-panel complaint-card status-${log.status.replace(' ', '-')}`;
      
      // Determine badge class name based on status
      let statusTagClass = 'status-tag-open';
      if (log.status === 'Acknowledged') statusTagClass = 'status-tag-acknowledged';
      if (log.status === 'In Progress') statusTagClass = 'status-tag-in-progress';
      if (log.status === 'Closed') statusTagClass = 'status-tag-closed';

      let actionsHTML = '';

      // Determine contextual action button elements based on permission matrix
      if (isReceiver && log.status !== 'Closed') {
        // Accused buttons
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
        // Raiser buttons
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

      card.innerHTML = `
        <div class="card-header">
          <div class="card-meta">
            <span class="badge-type badge-complaint">⚠ Complaint</span>
            <div class="card-direction">
              From <span>${log.sender}</span> to <span>${log.receiver}</span>
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
        </div>
        ${actionsHTML ? `<div class="card-actions-footer">${actionsHTML}</div>` : ''}
      `;
    }
    
    feedContainer.appendChild(card);
  });
}

// Simple HTML escaping helper for safety
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

// Expose state update globally for inline card onclick triggers
window.updateComplaintStatus = updateComplaintStatus;

// --- Bind Navigation Events & Load ---
function setupEventListeners() {
  // Direct identity selection login flow
  const partnerBtns = document.querySelectorAll('.partner-btn');
  partnerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-user');
      if (selected) {
        // Apply theme immediately
        document.body.className = `theme-${selected.toLowerCase()}`;
        // Log in
        login(selected);
      }
    });
  });

  btnLogout.addEventListener('click', logout);

  // Modal triggers
  cardTriggerAppreciation.addEventListener('click', () => openModal(modalAppreciation));
  cardTriggerComplaint.addEventListener('click', () => openModal(modalComplaint));

  btnCloseAppreciation.addEventListener('click', () => closeModal(modalAppreciation));
  btnCloseComplaint.addEventListener('click', () => closeModal(modalComplaint));

  btnSubmitAppreciation.addEventListener('click', submitAppreciation);
  btnSubmitComplaint.addEventListener('click', submitComplaint);

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
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup particle system
  initParticles();
  animateParticles();
  
  // Bind resize handler
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 2. Bind inputs/controls
  setupEventListeners();

  // 3. Validate user session
  checkSession();
});
