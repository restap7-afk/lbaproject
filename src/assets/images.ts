// High-resolution image assets and ultra-crisp vector graphics matching the official uploaded CV LBA logo

export const LOGO_OFFICIAL_IMG = "/src/assets/images/logo_cv_lba_resmi_1790667720491.jpg";
export const MAP_IMG_HIGHRES = "/src/assets/images/peta_mitra_lampung_1790667332368.jpg";
export const AVATAR_ADMIN_HIGHRES = "/src/assets/images/avatar_budi_santoso_1790667350733.jpg";

// Ultra-sharp vector SVG replicating the official CV. Lintas Batas Agro logo uploaded by user
// Features: Two green leaves on top, bold 'CV. LINTAS BATAS AGRO', '— L A M P U N G —', and italic 'Growing Beyond Limits'
export const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 240" width="100%" height="100%">
  <!-- Top Emblem: Two stylized green leaves -->
  <g transform="translate(195, 10)">
    <!-- Big Leaf (Dark green) -->
    <path d="M 52 110 C 44 85, 8 70, 0 38 C 22 24, 76 28, 96 68 C 104 84, 98 102, 94 114 C 84 118, 64 122, 52 110 Z" fill="#096435"/>
    <path d="M 52 110 C 60 90, 78 72, 94 66 C 88 56, 72 44, 48 38 C 16 38, 8 52, 6 62 C 26 78, 44 94, 52 110 Z" fill="#0f7a42" opacity="0.3"/>
    <!-- Small Leaf (Bright vibrant green) -->
    <path d="M 136 112 C 132 94, 138 78, 154 62 C 168 64, 186 78, 184 94 C 182 108, 166 116, 148 116 C 142 116, 138 114, 136 112 Z" fill="#2eb657"/>
    <!-- Stem accent for small leaf -->
    <path d="M 138 114 C 136 122, 136 128, 138 132" stroke="#096435" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <!-- Stem accent for big leaf -->
    <path d="M 104 114 C 105 124, 106 130, 108 134" stroke="#096435" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Main Company Name: CV. LINTAS BATAS AGRO -->
  <g transform="translate(270, 162)" text-anchor="middle">
    <text font-family="'Segoe UI', Roboto, 'Montserrat', 'Arial Black', sans-serif" font-size="34" font-weight="900" letter-spacing="1.5" fill="#096435">
      CV. LINTAS BATAS AGRO
    </text>
  </g>

  <!-- Subtitle: — L A M P U N G — -->
  <g transform="translate(270, 190)">
    <!-- Left rule -->
    <line x1="-220" y1="-5" x2="-80" y2="-5" stroke="#096435" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Center text -->
    <text x="0" y="0" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="9" fill="#096435">
      LAMPUNG
    </text>
    <!-- Right rule -->
    <line x1="80" y1="-5" x2="220" y2="-5" stroke="#096435" stroke-width="2.2" stroke-linecap="round"/>
  </g>

  <!-- Tagline: Growing Beyond Limits -->
  <g transform="translate(270, 224)" text-anchor="middle">
    <text font-family="'Segoe UI', Roboto, 'Georgia', serif" font-size="20" font-style="italic" font-weight="600" letter-spacing="0.8" fill="#096435">
      Growing Beyond Limits
    </text>
  </g>
</svg>
`)}`;

// Version optimized for dark backgrounds (Login left panel)
export const LOGO_SVG_DARK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 240" width="100%" height="100%">
  <!-- Top Emblem: Two stylized green leaves -->
  <g transform="translate(195, 10)">
    <!-- Big Leaf (Dark / Emerald green) -->
    <path d="M 52 110 C 44 85, 8 70, 0 38 C 22 24, 76 28, 96 68 C 104 84, 98 102, 94 114 C 84 118, 64 122, 52 110 Z" fill="#2ed67c"/>
    <path d="M 52 110 C 60 90, 78 72, 94 66 C 88 56, 72 44, 48 38 C 16 38, 8 52, 6 62 C 26 78, 44 94, 52 110 Z" fill="#3ddc84" opacity="0.4"/>
    <!-- Small Leaf (Bright green) -->
    <path d="M 136 112 C 132 94, 138 78, 154 62 C 168 64, 186 78, 184 94 C 182 108, 166 116, 148 116 C 142 116, 138 114, 136 112 Z" fill="#86efac"/>
    <path d="M 138 114 C 136 122, 136 128, 138 132" stroke="#2ed67c" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M 104 114 C 105 124, 106 130, 108 134" stroke="#2ed67c" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Main Company Name: CV. LINTAS BATAS AGRO in Pure White -->
  <g transform="translate(270, 162)" text-anchor="middle">
    <text font-family="'Segoe UI', Roboto, 'Montserrat', 'Arial Black', sans-serif" font-size="34" font-weight="900" letter-spacing="1.5" fill="#ffffff">
      CV. LINTAS BATAS AGRO
    </text>
  </g>

  <!-- Subtitle: — L A M P U N G — -->
  <g transform="translate(270, 190)">
    <line x1="-220" y1="-5" x2="-80" y2="-5" stroke="#3ddc84" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
    <text x="0" y="0" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="9" fill="#a7f3d0">
      LAMPUNG
    </text>
    <line x1="80" y1="-5" x2="220" y2="-5" stroke="#3ddc84" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>
  </g>

  <!-- Tagline: Growing Beyond Limits in soft mint/white -->
  <g transform="translate(270, 224)" text-anchor="middle">
    <text font-family="'Segoe UI', Roboto, 'Georgia', serif" font-size="20" font-style="italic" font-weight="600" letter-spacing="0.8" fill="#d1fae5">
      Growing Beyond Limits
    </text>
  </g>
</svg>
`)}`;

export const LOGO_IMG = LOGO_SVG;

export function getStatusClass(status: string) {
  if (status === 'Persiapan' || status === 'Pending') return 'tg w';
  if (status === 'Kedaluwarsa' || status === 'Nonaktif' || status === 'Gagal') return 'tg r';
  return 'tg';
}

export function formatRupiah(n: number | string): string {
  const val = Number(n || 0);
  return val.toLocaleString('id-ID');
}

export function calculateDaysRemaining(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function terbilang(n: number): string {
  const num = Math.floor(n);
  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  function convert(val: number): string {
    if (val < 12) return units[val];
    if (val < 20) return convert(val - 10) + ' belas';
    if (val < 100) return convert(Math.floor(val / 10)) + ' puluh ' + convert(val % 10);
    if (val < 200) return 'seratus ' + convert(val - 100);
    if (val < 1000) return convert(Math.floor(val / 100)) + ' ratus ' + convert(val % 100);
    if (val < 2000) return 'seribu ' + convert(val - 1000);
    if (val < 1000000) return convert(Math.floor(val / 1000)) + ' ribu ' + convert(val % 1000);
    if (val < 1000000000) return convert(Math.floor(val / 1000000)) + ' juta ' + convert(val % 1000000);
    return convert(Math.floor(val / 1000000000)) + ' miliar ' + convert(val % 1000000000);
  }
  const result = convert(num).replace(/\s+/g, ' ').trim();
  return (result || 'nol') + ' rupiah';
}
