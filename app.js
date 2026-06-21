/**
 * ============================================================================
 * THE "US" PORTAL - Interactive Background, Sessions, and Couple Ledger
 * ============================================================================
 */

// --- App State & Data Management ---
const PROFILES = {
  user_1: {
    id: 'user_1',
    first_name: 'Aadya',
    gender: 'Female',
    couple_id: 'couple_1',
    email: 'aadya@example.com'
  },
  user_2: {
    id: 'user_2',
    first_name: 'Rajat',
    gender: 'Male',
    couple_id: 'couple_1',
    email: 'rajat@example.com'
  }
};

let currentUserProfile = PROFILES.user_1; // fallback
let partnerProfile = PROFILES.user_2;     // fallback
let currentTab = 'all';         // 'all', 'inbox', 'outbox'
let logs = [];

// --- DOM Cache Elements ---
// Page Container Views
const portalContainer = document.getElementById('portal-container');

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

// Animation Loop
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
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
  
  requestAnimationFrame(animateParticles);
}

// --- Helper Functions ---
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
function router() {
  const selectedUserId = localStorage.getItem('selected_user_id');
  const landingPage = document.getElementById('landing-page');
  const portalContainer = document.getElementById('portal-container');

  if (!selectedUserId) {
    if (landingPage) landingPage.classList.remove('hidden');
    if (portalContainer) portalContainer.classList.add('hidden');
    initLandingPageEffects();
    return;
  }

  // Set active profile configuration
  if (selectedUserId === 'user_1') {
    currentUserProfile = PROFILES.user_1;
    partnerProfile = PROFILES.user_2;
  } else {
    currentUserProfile = PROFILES.user_2;
    partnerProfile = PROFILES.user_1;
  }

  if (landingPage) landingPage.classList.add('hidden');
  if (portalContainer) portalContainer.classList.remove('hidden');

  if (currentUserNameTag) {
    currentUserNameTag.textContent = currentUserProfile.first_name;
  }
  if (partnerConnectionBadge) {
    partnerConnectionBadge.textContent = `Connected with ${partnerProfile.first_name}`;
  }
  
  applyUserTheme(currentUserProfile.gender);
  loadLogs();
}

function selectUser(userId) {
  localStorage.setItem('selected_user_id', userId);
  router();
}

function handleSwitchUser() {
  localStorage.removeItem('selected_user_id');
  currentUserProfile = null;
  partnerProfile = null;
  router();
}

// --- Landing Page Animations & Visual Effects ---
let heartsInterval = null;

function initLandingPageEffects() {
  if (heartsInterval) clearInterval(heartsInterval);

  const subtitleEl = document.querySelector('.hero-subtitle');
  if (subtitleEl && !subtitleEl.dataset.animated) {
    const text = subtitleEl.textContent.trim();
    subtitleEl.textContent = '';
    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'char-item';
      const delay = 0.2 + index * 0.025;
      span.style.animationDelay = `${delay}s`;
      subtitleEl.appendChild(span);
    });
    subtitleEl.dataset.animated = 'true';
  }

  const container = document.getElementById('heart-container');
  if (container) {
    for (let i = 0; i < 5; i++) {
      createHeart(container);
    }
    heartsInterval = setInterval(() => {
      createHeart(container);
    }, 1800);
  }
}

function createHeart(container) {
  if (!container) return;
  const heart = document.createElement('span');
  heart.className = 'floating-heart';
  heart.innerHTML = '❤';
  
  const size = Math.random() * 20 + 12;
  heart.style.fontSize = `${size}px`;
  heart.style.left = `${Math.random() * 100}%`;
  
  const duration = Math.random() * 8 + 6;
  heart.style.animationDuration = `${duration}s`;
  heart.style.opacity = (Math.random() * 0.4 + 0.25).toString();
  
  container.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, duration * 1000);
}

function applyUserTheme(gender) {
  if (gender === 'Female') {
    document.body.className = 'theme-aadya';
  } else {
    // Male or Other gets blue theme
    document.body.className = 'theme-rajat';
  }
}

// --- Modals Display Control ---
function openModal(modal) {
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modal) {
  if (modal) {
    modal.classList.add('hidden');
    const inputs = modal.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => input.value = "");
  }
}

// Close modals when clicking overlay background directly
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target);
  }
});

// --- Local Storage Database Operations ---
function loadLogs() {
  try {
    const storedLogs = localStorage.getItem('us_portal_logs');
    if (storedLogs) {
      logs = JSON.parse(storedLogs);
    } else {
      logs = [];
    }
  } catch (err) {
    console.error('Failed to parse connection ledger logs:', err);
    logs = [];
  }
  renderFeed();
}

function saveLogs() {
  localStorage.setItem('us_portal_logs', JSON.stringify(logs));
}

// --- Email Notification Trigger ---
function triggerEmailNotification(type, data) {
  if (!partnerProfile || !partnerProfile.email) return;

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
function submitAppreciation() {
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

  logs.push(newLog);
  saveLogs();
  
  closeModal(modalAppreciation);
  renderFeed();
  triggerEmailNotification('appreciation', { message: message });
}

function submitComplaint() {
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
    timestamp: Date.now(),
    comments: []
  };

  logs.push(newLog);
  saveLogs();
  
  closeModal(modalComplaint);
  renderFeed();
  triggerEmailNotification('complaint', { title: title, description: description });
}

function updateComplaintStatus(id, newStatus) {
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

  log.status = newStatus;
  saveLogs();
  renderFeed();
}

// --- Feed Rendering Engine ---
function renderFeed() {
  const typeFilter = filterType.value;
  const statusFilter = filterStatus.value;

  if (typeFilter === 'appreciation') {
    if (statusFilterContainer) statusFilterContainer.classList.add('disabled');
  } else {
    if (statusFilterContainer) statusFilterContainer.classList.remove('disabled');
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

  if (!feedContainer) return;
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
  if (!str) return '';
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
  if (inputCommentText) inputCommentText.value = '';
  openModal(modalComment);
}

function submitComment() {
  if (!inputCommentText) return;
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

  if (!log.comments) log.comments = [];
  log.comments.push(newComment);

  saveLogs();
  
  closeModal(modalComment);
  renderFeed();
}

// Expose status updates globally for inline card onclick triggers
window.updateComplaintStatus = updateComplaintStatus;
window.openCommentModal = openCommentModal;

// --- Bind Navigation Events & Load ---
function setupEventListeners() {
  // Identity selection controls
  const btnLoginAadya = document.getElementById('btn-login-aadya');
  const btnLoginRajat = document.getElementById('btn-login-rajat');
  const btnSwitchUser = document.getElementById('btn-switch-user');

  if (btnLoginAadya) btnLoginAadya.addEventListener('click', () => selectUser('user_1'));
  if (btnLoginRajat) btnLoginRajat.addEventListener('click', () => selectUser('user_2'));
  if (btnSwitchUser) btnSwitchUser.addEventListener('click', handleSwitchUser);

  // Dashboard modal triggers
  if (cardTriggerAppreciation) cardTriggerAppreciation.addEventListener('click', () => openModal(modalAppreciation));
  if (cardTriggerComplaint) cardTriggerComplaint.addEventListener('click', () => openModal(modalComplaint));

  if (btnCloseAppreciation) btnCloseAppreciation.addEventListener('click', () => closeModal(modalAppreciation));
  if (btnCloseComplaint) btnCloseComplaint.addEventListener('click', () => closeModal(modalComplaint));
  if (btnCloseComment) btnCloseComment.addEventListener('click', () => closeModal(modalComment));

  if (btnSubmitAppreciation) btnSubmitAppreciation.addEventListener('click', submitAppreciation);
  if (btnSubmitComplaint) btnSubmitComplaint.addEventListener('click', submitComplaint);
  if (btnSubmitComment) btnSubmitComment.addEventListener('click', submitComment);

  // Tab controls
  const tabs = [
    { btn: tabAllBtn, tabName: 'all' },
    { btn: tabInboxBtn, tabName: 'inbox' },
    { btn: tabOutboxBtn, tabName: 'outbox' }
  ];

  tabs.forEach(t => {
    if (t.btn) {
      t.btn.addEventListener('click', () => {
        tabs.forEach(item => { if (item.btn) item.btn.classList.remove('active'); });
        t.btn.classList.add('active');
        currentTab = t.tabName;
        renderFeed();
      });
    }
  });

  // Dropdown filter changes
  if (filterType) filterType.addEventListener('change', renderFeed);
  if (filterStatus) filterStatus.addEventListener('change', renderFeed);
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup particle system
  initParticles();
  animateParticles();
  
  // Bind resize handler
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 2. Bind inputs/controls & router
  setupEventListeners();

  // 3. Render portal immediately
  router();
});
