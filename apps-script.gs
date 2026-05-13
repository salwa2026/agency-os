// ═══════════════════════════════════════════════════════
//  Coco-Trans — Google Apps Script (Google Sheets)
//  Déployer comme : Application Web (accès Anonyme)
// ═══════════════════════════════════════════════════════

const SPREADSHEET_ID = '1TrULf4yxt0K3I7zvmMBF0QOMkotj0ongRn9HSCtPenY';
const SHEET_GID      = 64978180;

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // Cherche l'onglet par GID
  const sheets = ss.getSheets();
  for (const s of sheets) {
    if (s.getSheetId() === SHEET_GID) return s;
  }
  // Fallback : crée un onglet 'Leads' si introuvable
  return ss.insertSheet('Leads');
}

function doPost(e) {
  try {
    const sheet = getTargetSheet();

    // Ajouter les en-têtes si la feuille est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date', 'Nom', 'Fonction', 'Entreprise', 'Secteur',
        'Email', 'Téléphone', 'Type de besoin', 'Volume', 'Pays', 'Urgent', 'Message', 'Page source'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.date      || new Date().toLocaleString('fr-BE'),
      data.nom       || '',
      data.fonction  || '',
      data.societe   || '',
      data.secteur   || '',
      data.email     || '',
      data.tel       || '',
      data.besoin    || '',
      data.volume    || '',
      data.pays      || '',
      data.urgent    || 'Non, standard',
      data.message   || '',
      data.page      || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Répondre aux requêtes OPTIONS (CORS preflight)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'Coco-Trans Leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}
