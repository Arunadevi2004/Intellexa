/* =============================================================
   INTELLEXA '26 – script.js
   Backend: register.php (PHP + MySQL)
   ============================================================= */

const API_URL = '/api/register';
let nexaSelected = false;

const allCheckboxes = document.querySelectorAll('.checkbox-card input[type="checkbox"]');
const evtNexa       = document.getElementById('evt-nexa');
const evtPaper      = document.getElementById('evt-paper');

/* ── Pill radio highlight on click ── */
document.querySelectorAll('.pill input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function () {
    const grp = this.closest('.form-group');
    if (grp) grp.classList.remove('has-error');
  });
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
    if ([...document.querySelectorAll('[data-group="technical"]:checked')].length > 1) {
      cb.checked = false; showEventsAlert('Maximum 1 Technical Event allowed.'); updateCardStyle(cb); return;
    }
  }

  if (group === 'nontechnical' && isChecked) {
    if ([...document.querySelectorAll('[data-group="nontechnical"]:checked')].length > 2) {
      cb.checked = false; showEventsAlert('Maximum 2 Non-Technical Events allowed.'); updateCardStyle(cb); return;
    }
  }

  updateCardStyle(cb); handlePaperSection();
}

function showEventsAlert(msg) {
  const el = document.getElementById('err-events');
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

/* ── Paper section toggle ── */
function handlePaperSection() {
  const sec = document.getElementById('paper-section');
  if (evtPaper.checked) { sec.style.display = 'block'; }
  else { sec.style.display = 'none'; clearPaperSection(); }
}

function clearPaperSection() {
  document.getElementById('teamName').value = '';
  document.getElementById('memberCount').value = '';
  document.getElementById('member-names-container').innerHTML = '';
  document.getElementById('paperAbstract').value = '';
  const ctr = document.getElementById('word-counter');
  ctr.textContent = '0 / 300 words'; ctr.classList.remove('valid','error');
}

/* ── Dynamic member inputs ── */
document.getElementById('memberCount').addEventListener('input', function () {
  const count = parseInt(this.value);
  const container = document.getElementById('member-names-container');
  container.innerHTML = '';
  if (!count || count < 1 || count > 10) return;

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

/* ── Word counter ── */
document.getElementById('paperAbstract').addEventListener('input', function () {
  const words = countWords(this.value);
  const ctr = document.getElementById('word-counter');
  ctr.textContent = `${words} / 300 words`;
  ctr.classList.remove('valid','error');
  if (words >= 250 && words <= 300) ctr.classList.add('valid');
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

  if (!document.getElementById('degree').value.trim())
    { setError('grp-degree',true); ok=false; } else setError('grp-degree',false);

  if (!document.getElementById('department').value.trim())
    { setError('grp-dept',true); ok=false; } else setError('grp-dept',false);

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
    if (!mc || mc < 1) { setError('grp-membercount',true); ok=false; }
    else {
      setError('grp-membercount',false);
      for (let i=1; i<=mc; i++) {
        const inp = document.getElementById(`member-${i}`);
        if (inp && !inp.value.trim()) { setError(`grp-member-${i}`,true); ok=false; }
        else if (inp) setError(`grp-member-${i}`,false);
      }
    }
    const wc = countWords(document.getElementById('paperAbstract').value);
    if (wc < 250 || wc > 300) {
      setError('grp-abstract',true,`Abstract must be 250–300 words. Current: ${wc}.`); ok=false;
    } else setError('grp-abstract',false);
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
  fd.append('degree',           document.getElementById('degree').value.trim());
  fd.append('department',       document.getElementById('department').value.trim());
  fd.append('college_name',     document.getElementById('collegeName').value.trim());
  fd.append('college_location', document.getElementById('collegeLocation').value.trim());
  fd.append('email',            document.getElementById('emailId').value.trim());
  fd.append('phone',            document.getElementById('phoneNumber').value.trim());
  fd.append('referral_code',    document.getElementById('referralCode').value.trim());
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
    fd.append('abstract',     document.getElementById('paperAbstract').value.trim());
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