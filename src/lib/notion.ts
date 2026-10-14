import { Client } from '@notionhq/client';

/**
 * Interface untuk struktur data artikel blog Kremes_Pedia
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  formattedDate: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  tags: string[];
  readingTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  contentHtml?: string;
}

// Inisialisasi Notion Client
const notionToken = process.env.NOTION_TOKEN || import.meta.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID || import.meta.env.NOTION_DATABASE_ID;

export const notion = notionToken ? new Client({ auth: notionToken }) : null;

/**
 * Fungsi pembantu untuk membuat URL slug yang bersih, lowercase, dan tanpa karakter aneh
 * Contoh: "Solusi Anak GTM!" -> "solusi-anak-gtm"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Menghapus aksen karakter
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '') // Hanya izinkan huruf, angka, spasi, dash
    .replace(/\s+/g, '-') // Ganti spasi dengan strip
    .replace(/-+/g, '-') // Hapus strip ganda
    .replace(/^-+/, '') // Hapus strip di awal
    .replace(/-+$/, ''); // Hapus strip di akhir
}

/**
 * Estimasi waktu membaca berdasarkan jumlah kata
 */
export function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} menit baca`;
}

/**
 * Format tanggal Indonesia (contoh: "14 Oktober 2026")
 */
export function formatIndonesianDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Render Rich Text Notion ke HTML dengan formatting lengkap (bold, italic, links, dll.)
 */
function renderRichText(richTextArray: any[]): string {
  if (!richTextArray || richTextArray.length === 0) return '';

  return richTextArray
    .map((item) => {
      let text = item.plain_text || '';
      
      // Escape HTML dasar untuk keamanan
      text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Format Anotasi
      if (item.annotations?.bold) text = `<strong>${text}</strong>`;
      if (item.annotations?.italic) text = `<em>${text}</em>`;
      if (item.annotations?.strikethrough) text = `<del>${text}</del>`;
      if (item.annotations?.underline) text = `<u>${text}</u>`;
      if (item.annotations?.code) text = `<code>${text}</code>`;

      // Format Link Eksternal (WAJIB rel="noopener" dan target="_blank")
      if (item.href) {
        text = `<a href="${item.href}" target="_blank" rel="noopener noreferrer" class="text-brand-green font-medium underline hover:text-brand-peach transition-colors">${text}</a>`;
      }

      return text;
    })
    .join('');
}

/**
 * Render susunan Blocks dari Notion API menjadi elemen HTML yang rapi
 */
export function renderNotionBlocksToHtml(blocks: any[], postTitle: string = 'Kremes_Pedia'): string {
  let html = '';
  let inBulletedList = false;
  let inNumberedList = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const type = block.type;

    // Tutup list sebelumnya jika tipe berganti
    if (type !== 'bulleted_list_item' && inBulletedList) {
      html += '</ul>';
      inBulletedList = false;
    }
    if (type !== 'numbered_list_item' && inNumberedList) {
      html += '</ol>';
      inNumberedList = false;
    }

    switch (type) {
      case 'paragraph': {
        const text = renderRichText(block.paragraph?.rich_text);
        if (text) {
          html += `<p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">${text}</p>`;
        } else {
          html += `<div class="h-3"></div>`; // Spasi kosong
        }
        break;
      }
      case 'heading_1': {
        const text = renderRichText(block.heading_1?.rich_text);
        html += `<h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">${text}</h2>`;
        break;
      }
      case 'heading_2': {
        const text = renderRichText(block.heading_2?.rich_text);
        html += `<h3 class="text-xl md:text-2xl font-display font-bold text-brand-green dark:text-brand-cream mt-6 mb-3">${text}</h3>`;
        break;
      }
      case 'heading_3': {
        const text = renderRichText(block.heading_3?.rich_text);
        html += `<h4 class="text-lg md:text-xl font-display font-semibold text-[#1C3A18] dark:text-[#F8D2B4] mt-5 mb-2">${text}</h4>`;
        break;
      }
      case 'bulleted_list_item': {
        if (!inBulletedList) {
          html += '<ul class="list-disc pl-6 mb-4 space-y-2 text-[#374438] dark:text-[#CBD5CD]">';
          inBulletedList = true;
        }
        const text = renderRichText(block.bulleted_list_item?.rich_text);
        html += `<li>${text}</li>`;
        break;
      }
      case 'numbered_list_item': {
        if (!inNumberedList) {
          html += '<ol class="list-decimal pl-6 mb-4 space-y-2 text-[#374438] dark:text-[#CBD5CD]">';
          inNumberedList = true;
        }
        const text = renderRichText(block.numbered_list_item?.rich_text);
        html += `<li>${text}</li>`;
        break;
      }
      case 'quote': {
        const text = renderRichText(block.quote?.rich_text);
        html += `<blockquote class="border-l-4 border-brand-peach bg-brand-peach/10 dark:bg-brand-peach/15 rounded-r-xl p-4 my-6 italic text-[#2D5A27] dark:text-brand-cream">${text}</blockquote>`;
        break;
      }
      case 'callout': {
        const icon = block.callout?.icon?.emoji || '💡';
        const text = renderRichText(block.callout?.rich_text);
        html += `
          <div class="notion-callout flex items-start gap-3 p-4 my-6 rounded-2xl bg-brand-cream/30 dark:bg-surface-dark-card border border-brand-cream/80 dark:border-brand-green/40">
            <span class="text-2xl flex-shrink-0">${icon}</span>
            <div class="text-[#2C352E] dark:text-[#E2EBE2] text-sm md:text-base leading-relaxed">${text}</div>
          </div>
        `;
        break;
      }
      case 'image': {
        const url = block.image?.type === 'external' 
          ? block.image.external.url 
          : block.image?.file?.url;
        const caption = block.image?.caption ? renderRichText(block.image.caption) : '';
        const altText = caption ? `${caption} - ${postTitle}` : `${postTitle} - Ilustrasi MPASI Kremes_Pedia`;
        
        if (url) {
          html += `
            <figure class="my-8">
              <img 
                src="${url}" 
                alt="${altText}" 
                loading="lazy" 
                class="w-full h-auto max-h-[500px] object-cover rounded-3xl shadow-soft border border-brand-cream/50" 
              />
              ${caption ? `<figcaption class="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2 italic">${caption}</figcaption>` : ''}
            </figure>
          `;
        }
        break;
      }
      case 'code': {
        const text = block.code?.rich_text?.[0]?.plain_text || '';
        const lang = block.code?.language || 'text';
        html += `
          <div class="my-6 rounded-xl overflow-hidden bg-[#182217] text-amber-100 p-4 text-sm font-mono border border-brand-green/40">
            <div class="text-xs text-brand-peach uppercase mb-2 tracking-wider font-sans">${lang}</div>
            <pre class="overflow-x-auto"><code>${text}</code></pre>
          </div>
        `;
        break;
      }
      case 'divider': {
        html += `<hr class="my-8 border-t border-brand-cream dark:border-brand-green/30" />`;
        break;
      }
      default:
        // Handle unhandled block type gracefully
        break;
    }
  }

  // Bersihkan list tertinggal
  if (inBulletedList) html += '</ul>';
  if (inNumberedList) html += '</ol>';

  return html;
}

/**
 * Data Cadangan Berkualitas Tinggi (Fallback Sample Data)
 * Didesain khusus sesuai dengan 3 Topik Wajib [TOPIK_BLOG] untuk Ibu Bekerja & Balita 8-24 Bulan
 */
export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'mock-1',
    title: 'Solusi Anak Lahap Makan: 5 Cara Mengatasi GTM Balita dengan Sensasi Kremes Gurih',
    slug: 'solusi-anak-lahap-makan-anti-gtm',
    date: '2026-10-10',
    formattedDate: '10 Oktober 2026',
    excerpt: 'Si kecil mendadak tutup mulut saat jam makan? Simak 5 trik cerdas berbasis sensori tekstur dan kaldu alami yang bikin mangkuk balita tandas seketika tanpa drama tangisan.',
    coverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    coverAlt: 'Solusi Anak Lahap Makan Anti-GTM - Kremes_Pedia Balita',
    tags: ['Solusi Anak Lalap Makan (Anti-GTM)', 'Anti-GTM', 'Tips Makan Balita'],
    readingTime: '4 menit baca',
    author: {
      name: 'dr. Nadya Paramita, Sp.A',
      role: 'Konsultan Tumbuh Kembang & Nutrisi Anak',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    },
    contentHtml: `
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Bagi seorang ibu bekerja, momen melihat mangkuk makanan si kecil masih penuh setelah ditinggal seharian bisa menjadi pemicu stres tersendiri. Gerakan Tutup Mulut (GTM) pada bayi usia 8–24 bulan adalah fase adaptasi yang sangat umum, namun jika dibiarkan dapat berisiko menurunkan kurva berat badan ideal balita.
      </p>

      <div class="notion-callout flex items-start gap-3 p-4 my-6 rounded-2xl bg-brand-cream/30 dark:bg-surface-dark-card border border-brand-cream/80 dark:border-brand-green/40">
        <span class="text-2xl flex-shrink-0">💡</span>
        <div class="text-[#2C352E] dark:text-[#E2EBE2] text-sm md:text-base leading-relaxed">
          <strong>Fakta Medis:</strong> Bayi usia 8 bulan ke atas mulai mengembangkan kepekaan terhadap sensorik lidah dan gusi. Makanan yang terlalu lumat membosankan, sedangkan aroma kaldu yang harum serta taburan berbunyi <em>krenyes</em> mampu membangkitkan dopamin nafsu makan mereka!
        </div>
      </div>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        1. Kenalkan Stimulasi Suara & Tekstur yang Menyenangkan
      </h2>
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Anak-anak belajar melalui seluruh inderanya. Ketika mereka mendengar suara renyah saat mengunyah makanan, otak mereka memproses proses makan sebagai permainan sensorik yang menggembirakan. Menaburkan sedikit kremesan khusus MPASI rendah natrium di atas bubur atau nasi lembek memberikan kontras tekstur yang membuat anak penasaran untuk mengunyah lagi.
      </p>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        2. Kunci Aroma Gurih Alami Tanpa Bahan Sintetik
      </h2>
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Jangan gunakan penyedap kimiawi untuk bayi! Sebaliknya, manfaatkan ekstrak kaldu rebusan tulang ayam kampung dan rempah tradisional (bawang putih, daun salam, ketumbar halus) yang direduksi perlahan. Gurih alaminya merangsang kelenjar saliva anak sehingga mereka lebih mudah menelan tanpa tersedak.
      </p>

      <blockquote class="border-l-4 border-brand-peach bg-brand-peach/10 dark:bg-brand-peach/15 rounded-r-xl p-4 my-6 italic text-[#2D5A27] dark:text-brand-cream">
        "Kunci utama keberhasilan MPASI bukan hanya pada seberapa banyak gramasi yang masuk, melainkan seberapa riang dan bahagianya atmosfer saat si kecil bersantap."
      </blockquote>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        3. Ritual Makan Bebas Distraksi Gadget
      </h2>
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Hindari menyuapi anak sambil menyodorkan layar smartphone. Sebagai gantinya, libatkan si kecil untuk menaburkan sendiri kremesan atau abon ayam ke atas piringnya (dengan tangan bersih). Kebanggaan dapat 'menghias makanan sendiri' terbukti meningkatkan penerimaan makan hingga 70%!
      </p>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        4. Evaluasi Interval Jam Makan (Feeding Rules)
      </h2>
      <ul class="list-disc pl-6 mb-4 space-y-2 text-[#374438] dark:text-[#CBD5CD]">
        <li>Berikan jeda minimal 2 jam antara pemberian ASI/susu formula dengan jam makan utama.</li>
        <li>Batasi durasi makan maksimal 30 menit agar anak mengerti batasan waktu.</li>
        <li>Tawarkan air putih hangat di antara suapan untuk menjaga kelembapan rongga mulut.</li>
      </ul>
    `,
  },
  {
    id: 'mock-2',
    title: 'Inovasi Tekstur & Sensori MPASI: Melatih Refleks Mengunyah Bayi Usia 8–24 Bulan',
    slug: 'inovasi-tekstur-sensori-mpasi',
    date: '2026-10-08',
    formattedDate: '8 Oktober 2026',
    excerpt: 'Mengapa balita sering mengemut makanan atau mudah hoek? Pelajari tahapan transisi tekstur lumat ke kasar, stimulasi oromotor lidah, serta peran tekstur krenyes yang aman bagi gusi balita.',
    coverImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    coverAlt: 'Inovasi Tekstur Sensori MPASI - Kremes_Pedia',
    tags: ['Inovasi Tekstur & Sensori MPASI', 'Oromotor Bayi', 'MPASI Sehat'],
    readingTime: '5 menit baca',
    author: {
      name: 'Riani Septiani, S.Gz',
      role: 'Nutritionist & Konsultan MPASI',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    contentHtml: `
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Banyak orang tua khawatir saat bayi mereka mulai mengemut makanan berjam-jam atau reflek muntah (gagging) saat naik tekstur. Padahal, otot oromotor bayi membutuhkan latihan fisik layaknya otot kaki saat mulai belajar melangkah. Di sinilah pentingnya eksplorasi sensori tekstur sejak dini.
      </p>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        Mengapa Anak Membutuhkan Gradasi Tekstur?
      </h2>
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Ketika bayi terlalu lama diberikan bubur saring (puree) halus melebihi usia 9 bulan, saraf di rongga mulut menjadi hipersensitif terhadap butiran kasar. Akibatnya, saat usia 1 tahun, anak menolak nasi keluarga dan berisiko mengalami keterlambatan bicara (speech delay) karena otot rahang yang kurang terlatih.
      </p>

      <div class="notion-callout flex items-start gap-3 p-4 my-6 rounded-2xl bg-brand-cream/30 dark:bg-surface-dark-card border border-brand-cream/80 dark:border-brand-green/40">
        <span class="text-2xl flex-shrink-0">🥑</span>
        <div class="text-[#2C352E] dark:text-[#E2EBE2] text-sm md:text-base leading-relaxed">
          <strong>Tips Ahli Gizi:</strong> Gunakan abon sapi balita berserat super halus atau kremesan yang langsung lumer saat menyentuh air liur (quick-melt texture). Ini memberikan sensasi 'kriuk' di awal gigitan tanpa membahayakan saluran pernapasan.
        </div>
      </div>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        3 Langkah Naik Tekstur Anti Gagal
      </h2>
      <ol class="list-decimal pl-6 mb-4 space-y-2 text-[#374438] dark:text-[#CBD5CD]">
        <li><strong>Fase Cincang Halus (8-10 bulan):</strong> Bubur tim kasar dengan taburan abon halus berserat mikro.</li>
        <li><strong>Fase Nasi Lembek & Kremes Lumer (10-12 bulan):</strong> Nasi tim dengan taburan kremes ayam kampung kaldu kaya zat besi.</li>
        <li><strong>Fase Makanan Meja Keluarga (12-24 bulan):</strong> Nasi hangat dengan lauk bergizi lengkap ditambah kremesan penambah nafsu makan.</li>
      </ol>
    `,
  },
  {
    id: 'mock-3',
    title: 'Trik Menambah Kalori & Protein Harian Balita Tanpa Ribet untuk Ibu Bekerja',
    slug: 'trik-menambah-kalori-protein-harian-tanpa-ribet',
    date: '2026-10-05',
    formattedDate: '5 Oktober 2026',
    excerpt: 'Waktu persiapan makan terbatas sebelum berangkat ke kantor? Temukan trik cerdas boosting protein hewani dan kalori padat gizi cukup dengan 1 sendok tabur praktis setiap hari.',
    coverImage: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80',
    coverAlt: 'Trik Menambah Kalori Protein Balita - Kremes_Pedia',
    tags: ['Trik Menambah Kalori & Protein Harian Tanpa Ribet', 'Booster Kalori', 'Ibu Bekerja'],
    readingTime: '4 menit baca',
    author: {
      name: 'Maya Sartika, M.Psi',
      role: 'Working Mom & Parenting Specialist',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
    contentHtml: `
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Menjadi ibu bekerja dengan balita usia MPASI adalah perlombaan tiada henti dengan waktu. Jam 6 pagi harus bersiap ke kantor, menyiapkan bekal si kecil, sekaligus memastikan kebutuhan 20-25 gram protein harian serta kalori tumbuh kembangnya terpenuhi sempurna.
      </p>

      <h2 class="text-2xl md:text-3xl font-display font-bold text-brand-green dark:text-brand-cream mt-8 mb-4">
        Solusi 'Fat & Protein Booster' dalam Satu Taburan
      </h2>
      <p class="leading-relaxed mb-4 text-[#374438] dark:text-[#CBD5CD]">
        Daripada memaksakan balita menghabiskan porsi mangkuk yang menggunung (yang sering berakhir dengan penolakan), kuncinya adalah meningkatkan <strong>densitas nutrisi per suapan</strong>. 
      </p>

      <ul class="list-disc pl-6 mb-4 space-y-2 text-[#374438] dark:text-[#CBD5CD]">
        <li><strong>Abon Sapi Murni Balita:</strong> Kaya akan zat besi heme yang diserap 3x lebih cepat oleh tubuh dibanding zat besi nabati, mencegah anemia defisiensi zat besi.</li>
        <li><strong>Kremesan Lemak Baik (Healthy Fats):</strong> Diolah dengan kaldu ayam kampung pekat yang mengandung asam amino esensial dan lemak sehat untuk perkembangan sel otak balita.</li>
        <li><strong>Praktis 5 Detik:</strong> Cukup taburkan 1-2 sendok makan di atas nasi hangat, langsung siap disajikan oleh pengasuh di rumah.</li>
      </ul>

      <blockquote class="border-l-4 border-brand-peach bg-brand-peach/10 dark:bg-brand-peach/15 rounded-r-xl p-4 my-6 italic text-[#2D5A27] dark:text-brand-cream">
        "Ibu yang tenang dan bahagia menghasilkan anak yang ceria di meja makan. Lepaskan rasa bersalah (mom guilt), pilih solusi praktis bernutrisi tinggi!"
      </blockquote>
    `,
  },
];

/**
 * Fetch semua artikel yang berstatus 'Published' dari database Notion.
 * Otomatis beralih ke Mock Data jika NOTION_TOKEN atau NOTION_DATABASE_ID belum diatur.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  if (!notion || !databaseId) {
    console.warn('[Kremes_Pedia] Notion token / Database ID belum dikonfigurasi. Menggunakan Fallback Mock Posts.');
    return MOCK_BLOG_POSTS;
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });

    if (!response.results || response.results.length === 0) {
      console.warn('[Kremes_Pedia] Tidak ada post published di database Notion. Menampilkan data cadangan.');
      return MOCK_BLOG_POSTS;
    }

    const posts: BlogPost[] = response.results.map((page: any) => {
      const props = page.properties;

      // Ekstraksi Title
      const titleProp = props.Title || props.title || props.Name || props.name;
      const titleObj = titleProp?.title || [];
      const title = titleObj.map((t: any) => t.plain_text).join('') || 'Artikel Tanpa Judul';

      // Ekstraksi Slug
      const slugProp = props.Slug || props.slug;
      const slugObj = slugProp?.rich_text || [];
      const explicitSlug = slugObj.map((s: any) => s.plain_text).join('').trim();
      const slug = explicitSlug ? slugify(explicitSlug) : slugify(title);

      // Ekstraksi Tanggal
      const dateProp = props.Date || props.date;
      const date = dateProp?.date?.start || new Date().toISOString().split('T')[0];
      const formattedDate = formatIndonesianDate(date);

      // Ekstraksi Excerpt
      const excerptProp = props.Excerpt || props.excerpt;
      const excerptObj = excerptProp?.rich_text || [];
      const excerpt = excerptObj.map((e: any) => e.plain_text).join('') || 'Baca selengkapnya artikel nutrisi dan solusi makan balita di Kremes_Pedia.';

      // Ekstraksi Tags
      const tagsProp = props.Tags || props.tags;
      const tagsObj = tagsProp?.multi_select || [];
      const tags = tagsObj.map((t: any) => t.name);

      // Ekstraksi Cover Image
      const coverProp = props.Cover || props.cover;
      let coverImage = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80';
      if (coverProp?.files?.[0]) {
        const fileItem = coverProp.files[0];
        coverImage = fileItem.type === 'external' ? fileItem.external.url : fileItem.file.url;
      } else if (page.cover) {
        coverImage = page.cover.type === 'external' ? page.cover.external.url : page.cover.file.url;
      }

      return {
        id: page.id,
        title,
        slug,
        date,
        formattedDate,
        excerpt,
        coverImage,
        coverAlt: `${title} - Kremes_Pedia`,
        tags: tags.length > 0 ? tags : ['Nutrisi MPASI'],
        readingTime: calculateReadingTime(excerpt + ' ' + title),
        author: {
          name: 'Tim Ahli Kremes_Pedia',
          role: 'Spesialis Nutrisi & MPASI Balita',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        },
      };
    });

    return posts;
  } catch (error) {
    console.error('[Kremes_Pedia] Error saat fetch Notion API database:', error);
    return MOCK_BLOG_POSTS;
  }
}

/**
 * Fetch detail sebuah post berdasarkan Slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const allPosts = await getPublishedPosts();
  const found = allPosts.find((p) => p.slug === slug);

  if (!found) return null;

  // Jika ini data mock, return langsung dengan konten mock
  if (found.id.startsWith('mock-')) {
    return found;
  }

  // Jika artikel asli Notion, ambil isi konten blocks-nya
  if (notion) {
    try {
      const blocksResponse = await notion.blocks.children.list({
        block_id: found.id,
        page_size: 100,
      });

      const contentHtml = renderNotionBlocksToHtml(blocksResponse.results, found.title);
      return {
        ...found,
        contentHtml,
        readingTime: calculateReadingTime(contentHtml.replace(/<[^>]*>?/gm, '')),
      };
    } catch (err) {
      console.error('[Kremes_Pedia] Gagal mengambil blocks Notion untuk post:', slug, err);
      return found;
    }
  }

  return found;
}

/**
 * Mencari 3 artikel terkait berdasarkan kesamaan Tags
 */
export function getRelatedPosts(currentSlug: string, tags: string[], allPosts: BlogPost[] = MOCK_BLOG_POSTS, limit = 3): BlogPost[] {
  const otherPosts = allPosts.filter((p) => p.slug !== currentSlug);

  const scored = otherPosts.map((post) => {
    const commonTags = post.tags.filter((t) => tags.includes(t));
    return {
      post,
      score: commonTags.length,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
}
