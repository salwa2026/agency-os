/* ============================================================
   NA MEDIA AGENCY — Contact Form Backend
   Node.js + Express + Nodemailer
   ============================================================ */

require('dotenv').config();
const express   = require('express');
const nodemailer = require('nodemailer');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve the static site from the parent directory
app.use(express.static(path.join(__dirname, '..')));

/* ---- SMTP transporter ---- */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ---- Contact form endpoint ---- */
app.post('/api/contact', async (req, res) => {
  const { nom, prenom, email, telephone, service, date, heure, message } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  const clientName = `${prenom || ''} ${nom}`.trim();

  /* ---- Email to agency ---- */
  const agencyMail = {
    from:    `"NA Media Agency" <${process.env.SMTP_USER}>`,
    to:      process.env.AGENCY_EMAIL || 'contact@agencymedia.fr',
    replyTo: email,
    subject: `Nouveau contact — ${clientName} (${service || 'Non précisé'})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D14;color:#e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background:#7ED955;padding:24px 32px;">
          <h1 style="color:#0B0D14;margin:0;font-size:1.4rem;font-weight:800;">Nouveau message de contact</h1>
        </div>
        <div style="padding:32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#7ED955;font-weight:700;width:140px;">Prénom & Nom</td><td style="padding:10px 0;color:#e0e0e0;">${clientName}</td></tr>
            <tr><td style="padding:10px 0;color:#7ED955;font-weight:700;">Email</td><td style="padding:10px 0;"><a href="mailto:${email}" style="color:#7ED955;">${email}</a></td></tr>
            ${telephone ? `<tr><td style="padding:10px 0;color:#7ED955;font-weight:700;">Téléphone</td><td style="padding:10px 0;">${telephone}</td></tr>` : ''}
            ${service ? `<tr><td style="padding:10px 0;color:#7ED955;font-weight:700;">Service</td><td style="padding:10px 0;">${service}</td></tr>` : ''}
            ${date ? `<tr><td style="padding:10px 0;color:#7ED955;font-weight:700;">Date souhaitée</td><td style="padding:10px 0;">${date}${heure ? ` à ${heure}` : ''}</td></tr>` : ''}
          </table>
          ${message ? `
          <div style="margin-top:24px;padding:20px;background:#1a1d2e;border-radius:8px;border-left:3px solid #7ED955;">
            <p style="color:#7ED955;font-weight:700;margin:0 0 10px;">Message :</p>
            <p style="color:#ccc;margin:0;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
          </div>` : ''}
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid #333;">
            <a href="mailto:${email}" style="display:inline-block;background:#7ED955;color:#0B0D14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Répondre à ${clientName}</a>
          </div>
        </div>
      </div>`,
  };

  /* ---- Auto-reply to client ---- */
  const clientMail = {
    from:    `"NA Media Agency" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `Votre demande a bien été reçue — NA Media Agency`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0D14;color:#e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background:#7ED955;padding:24px 32px;">
          <h1 style="color:#0B0D14;margin:0;font-size:1.4rem;font-weight:800;">Merci pour votre message !</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#e0e0e0;font-size:1rem;line-height:1.7;">Bonjour ${clientName},</p>
          <p style="color:#ccc;font-size:.95rem;line-height:1.7;">
            Nous avons bien reçu votre demande et notre équipe reviendra vers vous dans les <strong style="color:#7ED955;">24 heures ouvrées</strong>.
          </p>
          <p style="color:#ccc;font-size:.95rem;line-height:1.7;">
            En attendant, n'hésitez pas à parcourir notre blog pour découvrir nos stratégies et insights marketing.
          </p>
          <div style="margin:32px 0;padding:20px 24px;background:#1a1d2e;border-radius:8px;border-left:3px solid #7ED955;">
            <p style="color:#7ED955;font-weight:700;margin:0 0 8px;">Votre demande :</p>
            <p style="color:#ccc;margin:0;">Service : <strong style="color:#e0e0e0;">${service || 'Non précisé'}</strong></p>
            ${date ? `<p style="color:#ccc;margin:6px 0 0;">Date souhaitée : <strong style="color:#e0e0e0;">${date}${heure ? ` à ${heure}` : ''}</strong></p>` : ''}
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://agencymedia.fr/blog.html" style="display:inline-block;background:#7ED955;color:#0B0D14;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Lire nos articles →</a>
          </div>
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid #333;color:#666;font-size:.82rem;">
            <p style="margin:0;">NA Media Agency — Casablanca, Maroc</p>
            <p style="margin:4px 0 0;"><a href="mailto:contact@agencymedia.fr" style="color:#7ED955;">contact@agencymedia.fr</a> | <a href="tel:+212660466428" style="color:#7ED955;">+212 660 466 428</a></p>
          </div>
        </div>
      </div>`,
  };

  try {
    await transporter.sendMail(agencyMail);
    await transporter.sendMail(clientMail);
    res.status(200).json({ success: true, message: 'Email envoyé avec succès.' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email.' });
  }
});

/* ---- Catch-all: serve index.html for SPA-style routing ---- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NA Media Agency server running on http://localhost:${PORT}`);
});
