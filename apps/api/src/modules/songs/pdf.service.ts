import PDFDocument from 'pdfkit';

export interface PdfSongData {
  title: string;
  content: string;
  /** Horodatage de la dernière révision du texte. */
  updatedAt: Date | string;
}

/** Limite la longueur du nom de fichier et remplace tout caractère non sûr. */
function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug.length > 0 ? slug : 'texte';
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatDateStamp(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Horodatage textuel complet, en français, pour le certificat. */
export function formatRevisionTimestamp(value: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(toDate(value));
}

/** Nom de fichier du PDF : `<titre-slug>-verso-<AAAA-MM-JJ>.pdf`. */
export function buildPdfFilename(title: string, revisionDate: Date | string): string {
  return `${slugifyTitle(title)}-verso-${formatDateStamp(toDate(revisionDate))}.pdf`;
}

export interface PdfCreditData {
  name: string;
  role: 'AUTHOR' | 'FEATURING' | 'PRODUCER' | 'COMPOSER';
  percentage?: number | null;
}

function formatCreditRole(role: string): string {
  switch (role) {
    case 'AUTHOR':
      return 'Auteur des paroles';
    case 'FEATURING':
      return 'Artiste invité (Featuring)';
    case 'PRODUCER':
      return 'Producteur';
    case 'COMPOSER':
      return 'Compositeur / Beatmaker';
    default:
      return role;
  }
}

export function safePdfText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u2026/g, '...');
}

/**
 * Génère un certificat PDF sobre et élégant : titre, auteur, horodatage exact de
 * la dernière révision, cartouche des crédits artistiques et texte intégral (FR-040 & FR-029).
 */
export function generateSongPdf(
  song: PdfSongData,
  authorName: string,
  credits?: PdfCreditData[],
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 64 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const revision = toDate(song.updatedAt);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#8a7f6d')
      .text("VERSO · CERTIFICAT D'ANTÉRIORITÉ", { characterSpacing: 1.2 });

    doc.moveDown(1.4);
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#2b2620')
      .text(safePdfText(song.title || 'Sans titre'));

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor('#5c5346');
    doc.text(safePdfText(`Auteur : ${authorName}`));
    doc.text(safePdfText(`Dernière révision : ${formatRevisionTimestamp(revision)}`));

    if (credits && credits.length > 0) {
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#5c5346').text('Crédits artistiques :');
      doc.font('Helvetica').fontSize(10).fillColor('#5c5346');
      for (const credit of credits) {
        const roleLabel = formatCreditRole(credit.role);
        const percentLabel =
          credit.percentage !== null && credit.percentage !== undefined
            ? ` (${credit.percentage}%)`
            : '';
        doc.text(safePdfText(`- ${credit.name}${percentLabel} : ${roleLabel}`));
      }
    }

    doc.moveDown(1);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#d8cfbf')
      .lineWidth(1)
      .stroke();

    doc.moveDown(1.2);
    doc.font('Helvetica').fontSize(12).fillColor('#2b2620');
    doc.text(safePdfText(song.content.trim() || '(texte vide)'), { lineGap: 5 });

    doc.moveDown(2);
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#8a7f6d')
      .text(
        safePdfText(
          `Document généré par Verso le ${formatRevisionTimestamp(new Date())}. ` +
            "Cet horodatage atteste la date de dernière révision du texte au sein de l'application.",
        ),
      );

    doc.end();
  });
}
