/* =============================================================
   INTELLEXA '26 – script.js
   Backend: register.php (PHP + MySQL)
   ============================================================= */

const API_URL = '/api/register';
let nexaSelected = false;

const allCheckboxes = document.querySelectorAll('.checkbox-card input[type="checkbox"]');
const evtNexa       = document.getElementById('evt-nexa');
const evtPaper      = document.getElementById('evt-paper');
const evtIpl        = document.getElementById('evt-ipl');


/* ── Pill radio highlight on click (OBSOLETE but keeping for safety if any) ── */
document.querySelectorAll('.pill input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function () {
    const grp = this.closest('.form-group');
    if (grp) grp.classList.remove('has-error');
  });
});

/* ── "Other" dropdown handlers ── */
document.getElementById('degree').addEventListener('change', function() {
  const otherInput = document.getElementById('otherDegree');
  if (this.value === 'Other') {
    otherInput.style.display = 'block';
    otherInput.required = true;
  } else {
    otherInput.style.display = 'none';
    otherInput.required = false;
    otherInput.value = '';
    setError('grp-degree', false);
  }
});

document.getElementById('department').addEventListener('change', function() {
  const otherInput = document.getElementById('otherDept');
  if (this.value === 'OTHERS') {
    otherInput.style.display = 'block';
    otherInput.required = true;
  } else {
    otherInput.style.display = 'none';
    otherInput.required = false;
    otherInput.value = '';
    setError('grp-dept', false);
  }
});

/* ── Checkbox card styling ── */
function updateCardStyle(cb) {
  const card = cb.closest('.checkbox-card');
  cb.checked ? card.classList.add('checked') : card.classList.remove('checked');
}

/* ── Event selection rules ── */
allCheckboxes.forEach(cb => cb.addEventListener('change', function () {
  handleEventChange(this);
}));

function handleEventChange(cb) {
  const group = cb.dataset.group;
  const isChecked = cb.checked;

  if (cb === evtNexa) {
    nexaSelected = isChecked;
    if (isChecked) {
      allCheckboxes.forEach(c => {
        if (c !== evtNexa) { c.checked = false; c.closest('.checkbox-card').classList.add('disabled'); updateCardStyle(c); }
      });
    } else {
      allCheckboxes.forEach(c => c.closest('.checkbox-card').classList.remove('disabled'));
    }
    updateCardStyle(cb); handlePaperSection(); return;
  }

  if (nexaSelected) { cb.checked = false; return; }

  if (group === 'technical' && isChecked) {
    const selectedTech = [...document.querySelectorAll('[data-group="technical"]:checked')];
    if (selectedTech.length >= 1) {
      allCheckboxes.forEach(c => {
        if (c.dataset.group === 'technical' && !c.checked) {
          c.closest('.checkbox-card').classList.add('disabled');
        }
      });
    }
  } else if (group === 'technical' && !isChecked) {
    allCheckboxes.forEach(c => {
      if (c.dataset.group === 'technical') {
        c.closest('.checkbox-card').classList.remove('disabled');
      }
    });
  }

  if (group === 'nontechnical' && isChecked) {
    const selectedNonTech = [...document.querySelectorAll('[data-group="nontechnical"]:checked')];
    if (selectedNonTech.length >= 2) {
      allCheckboxes.forEach(c => {
        if (c.dataset.group === 'nontechnical' && !c.checked) {
          c.closest('.checkbox-card').classList.add('disabled');
        }
      });
    }
  } else if (group === 'nontechnical' && !isChecked) {
    allCheckboxes.forEach(c => {
      if (c.dataset.group === 'nontechnical') {
        c.closest('.checkbox-card').classList.remove('disabled');
      }
    });
  }

  updateCardStyle(cb); handlePaperSection(); handleIplSection();
}


function showEventsAlert(msg) {
  const el = document.getElementById('err-events');
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

/* ── Paper section toggle ── */
function handlePaperSection() {
  const sec = document.getElementById('paper-section');
  if (evtPaper && evtPaper.checked) { sec.style.display = 'block'; }
  else { sec.style.display = 'none'; clearPaperSection(); }
}

function handleIplSection() {
  const sec = document.getElementById('ipl-section');
  if (evtIpl && evtIpl.checked) { sec.style.display = 'block'; }
  else { sec.style.display = 'none'; clearIplSection(); }
}

function clearIplSection() {
  document.getElementById('iplTeamName').value = '';
  for (let i = 1; i <= 4; i++) {
    const inp = document.getElementById(`ipl-member-${i}`);
    if (inp) inp.value = '';
  }
}


function clearPaperSection() {
  document.getElementById('teamName').value = '';
  document.getElementById('memberCount').value = '';
  document.getElementById('member-names-container').innerHTML = '';
  document.getElementById('paperTitle').value = '';
  document.getElementById('paperAbstract').value = '';
  const ctr = document.getElementById('word-counter');
  ctr.textContent = '0 / 250 words'; ctr.classList.remove('valid','error');
}

/* ── Dynamic member inputs ── */
// Moved to end of file to avoid conflict with live error clearing


/* ── Word counter ── */
document.getElementById('paperAbstract').addEventListener('input', function () {
  const words = countWords(this.value);
  const ctr = document.getElementById('word-counter');
  ctr.textContent = `${words} / 250 words`;
  ctr.classList.remove('valid','error');
  if (words >= 200 && words <= 250) ctr.classList.add('valid');
  else if (words > 0) ctr.classList.add('error');
});

function countWords(t) { return t.trim().split(/\s+/).filter(w => w.length > 0).length; }

/* ── File upload preview ── */
document.getElementById('txnScreenshot').addEventListener('change', function () {
  const file = this.files[0];
  const preview = document.getElementById('file-preview');
  const img = document.getElementById('preview-img');
  const nameEl = document.getElementById('file-name-display');
  if (file && file.type.startsWith('image/')) {
    if (file.size > 1 * 1024 * 1024) {
      alert('Image size exceeds 1MB. Please upload a smaller image.');
      this.value = ''; // Clear the input
      preview.style.display = 'none';
      return;
    }
    const r = new FileReader();
    r.onload = e => { img.src = e.target.result; preview.style.display = 'block'; nameEl.textContent = file.name; };
    r.readAsDataURL(file);
  } else { preview.style.display = 'none'; }
});

/* ── Validation helpers ── */
function setError(id, show, msg) {
  const grp = document.getElementById(id); if (!grp) return;
  show ? grp.classList.add('has-error') : grp.classList.remove('has-error');
  if (msg) { const el = grp.querySelector('.error-msg'); if (el) el.textContent = msg; }
}

/* ── Get selected radio value ── */
function getRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

/* ── Form validation ── */
function validateForm() {
  let ok = true;

  if (!document.getElementById('fullName').value.trim())
    { setError('grp-name',true); ok=false; } else setError('grp-name',false);

  if (!document.getElementById('yearOfStudy').value.trim())
    { setError('grp-year',true); ok=false; } else setError('grp-year',false);

  if (!document.getElementById('degree').value)
    { setError('grp-degree',true); ok=false; }
  else if (document.getElementById('degree').value === 'Other' && !document.getElementById('otherDegree').value.trim())
    { setError('grp-degree',true, 'Please specify your degree'); ok=false; }
  else setError('grp-degree',false);

  if (!document.getElementById('department').value)
    { setError('grp-dept',true); ok=false; }
  else if (document.getElementById('department').value === 'OTHERS' && !document.getElementById('otherDept').value.trim())
    { setError('grp-dept',true, 'Please specify your department'); ok=false; }
  else setError('grp-dept',false);

  if (!document.getElementById('collegeName').value.trim())
    { setError('grp-college',true); ok=false; } else setError('grp-college',false);

  if (!document.getElementById('collegeLocation').value.trim())
    { setError('grp-clocation',true); ok=false; } else setError('grp-clocation',false);

  const email = document.getElementById('emailId').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    { setError('grp-email',true); ok=false; } else setError('grp-email',false);

  const phone = document.getElementById('phoneNumber').value.trim();
  if (!phone || !/^\d{10}$/.test(phone))
    { setError('grp-phone',true); ok=false; } else setError('grp-phone',false);

  const anyChecked = [...allCheckboxes].some(c => c.checked);
  const evErr = document.getElementById('err-events');
  if (!anyChecked) {
    evErr.textContent = 'Please select at least one event.'; evErr.style.display = 'block'; ok = false;
  } else evErr.style.display = 'none';

  if (evtPaper.checked) {
    if (!document.getElementById('teamName').value.trim())
      { setError('grp-teamname',true); ok=false; } else setError('grp-teamname',false);
    const mc = parseInt(document.getElementById('memberCount').value);
    if (!mc || mc < 1 || mc > 2) { 
      setError('grp-membercount', true, 'Maximum 2 members allowed for Paper Presentation.'); 
      ok = false; 
    }
    else {
      setError('grp-membercount',false);
      for (let i=1; i<=mc; i++) {
        const inp = document.getElementById(`member-${i}`);
        if (inp && !inp.value.trim()) { setError(`grp-member-${i}`,true); ok=false; }
        else if (inp) setError(`grp-member-${i}`,false);
      }
    }
    if (!document.getElementById('paperTitle').value.trim())
      { setError('grp-abstract-title',true); ok=false; } else setError('grp-abstract-title',false);

    const wc = countWords(document.getElementById('paperAbstract').value);
    if (wc < 200 || wc > 250) {
      setError('grp-abstract',true,`Abstract must be 200–250 words. Current: ${wc}.`); ok=false;
    } else setError('grp-abstract',false);
  }

  if (evtIpl && evtIpl.checked) {
    if (!document.getElementById('iplTeamName').value.trim())
      { setError('grp-ipl-teamname',true); ok=false; } else setError('grp-ipl-teamname',false);
    
    for (let i = 1; i <= 4; i++) {
      const inp = document.getElementById(`ipl-member-${i}`);
      if (inp && !inp.value.trim()) { setError(`grp-ipl-member-${i}`, true); ok = false; }
      else if (inp) setError(`grp-ipl-member-${i}`, false);
    }
  }


  if (!document.getElementById('transactionId').value.trim())
    { setError('grp-txnid',true); ok=false; } else setError('grp-txnid',false);

  if (!document.getElementById('txnScreenshot').files[0])
    { setError('grp-screenshot',true); ok=false; } else setError('grp-screenshot',false);

  return ok;
}

/* ── Form submit → PHP ── */
document.getElementById('regForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!validateForm()) {
    const firstErr = document.querySelector('.has-error');
    if (firstErr) firstErr.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Submitting…'; btn.classList.add('loading');

  const fd = new FormData();
  fd.append('full_name',        document.getElementById('fullName').value.trim());
  fd.append('year_of_study',    document.getElementById('yearOfStudy').value.trim());
  fd.append('degree',           document.getElementById('degree').value === 'Other' ? document.getElementById('otherDegree').value.trim() : document.getElementById('degree').value);
  fd.append('department',       document.getElementById('department').value === 'OTHERS' ? document.getElementById('otherDept').value.trim() : document.getElementById('department').value);
  fd.append('college_name',     document.getElementById('collegeName').value.trim());
  fd.append('college_location', document.getElementById('collegeLocation').value.trim());
  fd.append('email',            document.getElementById('emailId').value.trim());
  fd.append('phone',            document.getElementById('phoneNumber').value.trim());
  fd.append('transaction_id',   document.getElementById('transactionId').value.trim());
  fd.append('screenshot',       document.getElementById('txnScreenshot').files[0]);
  fd.append('events',           JSON.stringify([...allCheckboxes].filter(c=>c.checked).map(c=>c.value)));

  const isPaper = evtPaper.checked;
  fd.append('is_paper', isPaper ? '1' : '0');
  if (isPaper) {
    const mc = parseInt(document.getElementById('memberCount').value);
    const names = [];
    for (let i=1; i<=mc; i++) { const inp=document.getElementById(`member-${i}`); names.push(inp?inp.value.trim():''); }
    fd.append('team_name',    document.getElementById('teamName').value.trim());
    fd.append('member_count', mc);
    fd.append('member_names', JSON.stringify(names));
    fd.append('paper_title', document.getElementById('paperTitle').value.trim());
    fd.append('abstract',     document.getElementById('paperAbstract').value.trim());
  }

  const isIpl = evtIpl && evtIpl.checked;
  fd.append('is_ipl', isIpl ? '1' : '0');
  if (isIpl) {
    const names = [];
    for (let i = 1; i <= 4; i++) {
        const inp = document.getElementById(`ipl-member-${i}`);
        names.push(inp ? inp.value.trim() : '');
    }
    fd.append('ipl_team_name', document.getElementById('iplTeamName').value.trim());
    fd.append('ipl_member_names', JSON.stringify(names));
  }


  try {
    const res  = await fetch(API_URL, { method:'POST', body:fd });
    const data = await res.json();

    if (data.success) {
      this.style.display = 'none';
      const suc = document.getElementById('success-message');
      suc.style.display = 'block';
      const txt = suc.querySelector('.success-text');
      if (txt && data.data) {
        txt.innerHTML = `Thank you, <strong>${data.data.name}</strong>!<br>
          Your registration for <strong>INTELLEXA '26</strong> has been submitted.<br>
          A confirmation will be sent to <strong>${data.data.email}</strong> once verified.<br><br>
          <span style="font-size:13px;opacity:.7">Registration ID: #${data.data.registration_id}</span>`;
      }
    } else {
      btn.textContent = 'Register Now →'; btn.classList.remove('loading');
      const msgs = data.data?.errors ? data.data.errors.join('\n• ') : data.message;
      alert('⚠ Registration failed:\n\n• ' + msgs);
    }
  } catch (err) {
    btn.textContent = 'Register Now →'; btn.classList.remove('loading');
    alert('Network error. Please check your connection.\n\n' + err.message);
  }
});

/* ── Live error clearing ── */
function attachLiveClear(elements) {
  elements.forEach(el => { el.addEventListener('input', clearGrpErr); el.addEventListener('change', clearGrpErr); });
}
function clearGrpErr() { const g = this.closest('.form-group'); if (g) g.classList.remove('has-error'); }
attachLiveClear(document.querySelectorAll('.form-input, .form-textarea'));

/* ── Paper Member Count (Moved here to run after attachLiveClear) ── */
document.getElementById('memberCount').addEventListener('input', function () {
  const count = parseInt(this.value);
  const container = document.getElementById('member-names-container');
  container.innerHTML = '';
  
  if (count > 2) {
    setError('grp-membercount', true, 'Maximum 2 members allowed for Paper Presentation.');
    return;
  } else if (count >= 1 && count <= 2) {
    setError('grp-membercount', false);
  }

  if (!count || count < 1 || count > 2) return;

  const grid = document.createElement('div'); grid.className = 'form-grid';
  for (let i = 1; i <= count; i++) {
    const grp = document.createElement('div');
    grp.className = 'form-group'; grp.id = `grp-member-${i}`;
    grp.innerHTML = `
      <label class="form-label" for="member-${i}">Member ${i} Name <span class="req">*</span></label>
      <input class="form-input" type="text" id="member-${i}" placeholder="Enter member ${i} full name" />
      <span class="error-msg">Member ${i} name is required.</span>`;
    grid.appendChild(grp);
  }
  container.appendChild(grid);
  attachLiveClear(container.querySelectorAll('.form-input'));
});