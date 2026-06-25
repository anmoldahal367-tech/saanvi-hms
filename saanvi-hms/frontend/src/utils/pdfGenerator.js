// PDF generation using the browser's built-in print API.
// We create a hidden <iframe>, inject styled HTML into it, then
// trigger window.print() on that iframe. This works everywhere without
// needing an external PDF library, and produces a professional-looking
// printable/downloadable document.

function printHTML(html, filename) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:210mm;height:297mm;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Give the iframe a moment to render before printing
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Remove the iframe after a delay (print dialog may still be open)
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

const BASE_STYLES = `
  @page { margin: 20mm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2526; font-size: 13px; line-height: 1.5; margin: 0; padding: 0; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #0F6E64; }
  h2 { font-size: 15px; margin: 20px 0 8px; color: #0F6E64; border-bottom: 2px solid #0F6E64; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; color: #1a2526; }
  p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #0F6E64; color: white; padding: 7px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #DCE4E3; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #0F6E64; padding-bottom: 14px; }
  .hospital-name { font-size: 10px; color: #5B6C6E; margin-top: 4px; }
  .badge { display: inline-block; background: #E3F1EE; color: #0B5650; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; background: #F6F8F8; padding: 12px; border-radius: 6px; margin-bottom: 8px; }
  .info-label { font-size: 11px; color: #5B6C6E; font-weight: 600; text-transform: uppercase; }
  .info-value { font-weight: 500; }
  .medicine-card { background: #F6F8F8; border: 1px solid #DCE4E3; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
  .medicine-name { font-weight: 700; font-size: 14px; color: #0F6E64; }
  .medicine-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #DCE4E3; font-size: 11px; color: #5B6C6E; display: flex; justify-content: space-between; }
  .signature { margin-top: 40px; }
  .sig-line { border-top: 1px solid #1a2526; width: 200px; padding-top: 4px; font-size: 11px; color: #5B6C6E; }
  .no-print-msg { font-size: 11px; color: #5B6C6E; margin-top: 20px; text-align: center; }
`;

// ── Prescription PDF ──────────────────────────────────────────────────────────
export function downloadPrescriptionPDF(prescription, appointment) {
  const patient = appointment?.patient;
  const doctor = appointment?.doctor || prescription?.prescriber;
  const date = new Date(appointment?.scheduledAt || Date.now()).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const medicinesHTML = (prescription.medicines || []).map((m) => `
    <div class="medicine-card">
      <div class="medicine-name">💊 ${m.medicine || '—'}</div>
      <div class="medicine-details">
        <div><div class="info-label">Dosage</div><div>${m.dosage || '—'}</div></div>
        <div><div class="info-label">Frequency</div><div>${m.frequency || '—'}</div></div>
        <div><div class="info-label">Duration</div><div>${m.duration || '—'}</div></div>
      </div>
      ${m.notes ? `<div style="margin-top:6px;font-size:11px;color:#5B6C6E;">Note: ${m.notes}</div>` : ''}
    </div>
  `).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prescription</title><style>${BASE_STYLES}</style></head><body>
    <div class="header">
      <div>
        <h1>SAANVI-HMS</h1>
        <div class="hospital-name">Hospital Management System &nbsp;|&nbsp; Prescription</div>
      </div>
      <div style="text-align:right">
        <div class="badge">Prescription</div>
        <div style="font-size:11px;color:#5B6C6E;margin-top:4px;">${date}</div>
      </div>
    </div>

    <h2>Patient Information</h2>
    <div class="info-grid">
      <div><div class="info-label">Patient name</div><div class="info-value">${patient?.firstName || ''} ${patient?.lastName || ''}</div></div>
      <div><div class="info-label">Date of birth</div><div class="info-value">${patient?.dateOfBirth || '—'}</div></div>
      <div><div class="info-label">Blood group</div><div class="info-value">${patient?.bloodGroup || '—'}</div></div>
      <div><div class="info-label">Phone</div><div class="info-value">${patient?.phone || '—'}</div></div>
    </div>

    <h2>Prescribed Medicines</h2>
    ${medicinesHTML || '<p>No medicines listed.</p>'}

    ${prescription.generalInstructions ? `
      <h2>General Instructions</h2>
      <div style="background:#FBEFE2;border:1px solid #E8D5C0;border-radius:6px;padding:12px;">
        ${prescription.generalInstructions}
      </div>
    ` : ''}

    <div class="signature">
      <div class="sig-line">Dr. ${doctor?.name || '—'}</div>
      <div style="font-size:11px;color:#5B6C6E;margin-top:2px;">Prescribing Doctor</div>
    </div>

    <div class="footer">
      <span>Generated by SAANVI-HMS</span>
      <span>Date: ${new Date().toLocaleDateString()}</span>
    </div>
  </body></html>`;

  printHTML(html, `prescription-${patient?.lastName || 'patient'}.pdf`);
}

// ── Full Patient Record PDF ───────────────────────────────────────────────────
export function downloadPatientRecordPDF(patient, appointments, prescriptions) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const appointmentsHTML = (appointments || []).length === 0
    ? '<p>No appointments on record.</p>'
    : `<table>
        <thead><tr><th>Date</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>
          ${appointments.map((a) => `
            <tr>
              <td>${new Date(a.scheduledAt).toLocaleDateString()}</td>
              <td>${a.doctor?.name || '—'}</td>
              <td>${a.reason || '—'}</td>
              <td>${a.status}</td>
              <td>${a.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

  const prescriptionsHTML = (prescriptions || []).length === 0
    ? '<p>No prescriptions on record.</p>'
    : prescriptions.map((p) => {
        const apptDate = p.appointment ? new Date(p.appointment.scheduledAt).toLocaleDateString() : '—';
        const doctorName = p.prescriber?.name || p.appointment?.doctor?.name || '—';
        const medsHTML = (p.medicines || []).map((m) =>
          `<tr><td>${m.medicine}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`
        ).join('');
        return `
          <h3>Prescription — ${apptDate} (Dr. ${doctorName})</h3>
          <table>
            <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
            <tbody>${medsHTML || '<tr><td colspan="4">No medicines listed</td></tr>'}</tbody>
          </table>
          ${p.generalInstructions ? `<p style="margin-top:6px;font-size:11px;"><strong>Instructions:</strong> ${p.generalInstructions}</p>` : ''}
        `;
      }).join('<hr style="border:none;border-top:1px solid #DCE4E3;margin:12px 0;">');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Patient Record</title><style>${BASE_STYLES}</style></head><body>
    <div class="header">
      <div>
        <h1>SAANVI-HMS</h1>
        <div class="hospital-name">Hospital Management System &nbsp;|&nbsp; Patient Record</div>
      </div>
      <div style="text-align:right">
        <div class="badge">Full Record</div>
        <div style="font-size:11px;color:#5B6C6E;margin-top:4px;">${today}</div>
      </div>
    </div>

    <h2>Patient Information</h2>
    <div class="info-grid">
      <div><div class="info-label">Full name</div><div class="info-value">${patient.firstName} ${patient.lastName}</div></div>
      <div><div class="info-label">Date of birth</div><div class="info-value">${patient.dateOfBirth || '—'}</div></div>
      <div><div class="info-label">Gender</div><div class="info-value">${patient.gender || '—'}</div></div>
      <div><div class="info-label">Blood group</div><div class="info-value">${patient.bloodGroup || '—'}</div></div>
      <div><div class="info-label">Phone</div><div class="info-value">${patient.phone || '—'}</div></div>
      <div><div class="info-label">Email</div><div class="info-value">${patient.email || '—'}</div></div>
      <div><div class="info-label">Address</div><div class="info-value">${patient.address || '—'}</div></div>
      <div><div class="info-label">Medical notes</div><div class="info-value">${patient.medicalNotes || '—'}</div></div>
    </div>

    <h2>Appointment History</h2>
    ${appointmentsHTML}

    <h2>Prescriptions</h2>
    ${prescriptionsHTML}

    <div class="footer">
      <span>Generated by SAANVI-HMS — Confidential</span>
      <span>${new Date().toLocaleString()}</span>
    </div>
  </body></html>`;

  printHTML(html, `patient-record-${patient.lastName}.pdf`);
}
