import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// Baca file .env manual sederhana
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function updateEnvFile(key, value) {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, content.trim() + '\n', 'utf-8');
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Clean page ID jika dimasukkan berupa URL Notion
function extractPageId(input) {
  const clean = input.trim();
  // Jika berbentuk URL (contoh: https://www.notion.so/My-Page-abc123def456...)
  const match = clean.match(/([a-f0-9]{32})/i) || clean.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (match) return match[1];
  return clean;
}

async function main() {
  console.log('\n======================================================');
  console.log('   🚀 NOTION DATABASE TEMPLATE CREATOR - KREMES_PEDIA   ');
  console.log('======================================================\n');

  const env = loadEnv();
  let token = process.env.NOTION_TOKEN || env.NOTION_TOKEN;
  let parentPageId = process.env.NOTION_PARENT_PAGE_ID || env.NOTION_PARENT_PAGE_ID;

  if (!token) {
    console.log('📌 NOTION_TOKEN belum ditemukan.');
    console.log('   Buat token integrasi di: https://www.notion.so/my-integrations');
    token = await askQuestion('👉 Masukkan NOTION_TOKEN (Internal Integration Secret): ');
  }

  if (!token) {
    console.error('❌ Token Notion wajib diisi. Batalkan.');
    process.exit(1);
  }

  if (!parentPageId) {
    console.log('\n📌 Buka salah satu Page Notion Anda, pastikan sudah di-share ke integrasi ini:');
    console.log('   (Di Notion: Klik titik 3 di kanan atas page -> Connect to -> Pilih integrasi Anda)');
    console.log('   Lalu copy Link atau ID dari Page tersebut.');
    const rawPage = await askQuestion('👉 Masukkan Page ID atau Link Page Notion induk: ');
    parentPageId = extractPageId(rawPage);
  }

  if (!parentPageId) {
    console.error('❌ Page ID wajib diisi. Batalkan.');
    process.exit(1);
  }

  console.log('\n⏳ Menghubungi Notion API...');
  const notion = new Client({ auth: token });

  try {
    console.log('📦 Membuat Database: "Kremes_Pedia - Blog Posts"...');
    const database = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Kremes_Pedia - Blog Posts',
          },
        },
      ],
      description: [
        {
          type: 'text',
          text: {
            content: 'Database artikel MPASI, Anti-GTM, dan Nutrisi Balita untuk Kremes_Pedia.',
          },
        },
      ],
      properties: {
        Title: {
          title: {},
        },
        Status: {
          select: {
            options: [
              { name: 'Published', color: 'green' },
              { name: 'Draft', color: 'yellow' },
              { name: 'Archived', color: 'gray' },
            ],
          },
        },
        Date: {
          date: {},
        },
        Slug: {
          rich_text: {},
        },
        Excerpt: {
          rich_text: {},
        },
        Tags: {
          multi_select: {
            options: [
              { name: 'Solusi Anti-GTM', color: 'red' },
              { name: 'Inovasi Tekstur & Sensori MPASI', color: 'orange' },
              { name: 'Resep MPASI Sehat', color: 'green' },
              { name: 'Nutrisi Balita', color: 'blue' },
              { name: 'Tips Ibu Bekerja', color: 'pink' },
            ],
          },
        },
        Cover: {
          files: {},
        },
      },
    });

    const dbId = database.id;
    console.log(`\n✅ Database berhasil dibuat!`);
    console.log(`   Database ID: ${dbId}`);
    console.log(`   URL Database: ${database.url}`);

    // Update file .env
    updateEnvFile('NOTION_TOKEN', token);
    updateEnvFile('NOTION_DATABASE_ID', dbId);
    console.log('💾 File .env otomatis diperbarui dengan NOTION_TOKEN dan NOTION_DATABASE_ID!');

    // Masukkan artikel contoh
    console.log('\n📝 Menambahkan 3 artikel contoh ke database Notion...');

    const samplePosts = [
      {
        title: 'Solusi Anak Lahap Makan: 5 Cara Mengatasi GTM Balita dengan Sensasi Kremes Gurih',
        slug: 'solusi-anak-lahap-makan-anti-gtm',
        date: new Date().toISOString().split('T')[0],
        excerpt: 'Si kecil mendadak tutup mulut saat jam makan? Simak 5 trik cerdas berbasis sensori tekstur dan kaldu alami yang bikin mangkuk balita tandas seketika tanpa drama tangisan.',
        tags: ['Solusi Anti-GTM', 'Nutrisi Balita'],
        cover: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
        contentHead: 'Kenalkan Stimulasi Suara & Tekstur yang Menyenangkan',
        body: 'Anak-anak belajar melalui seluruh inderanya. Ketika mereka mendengar suara renyah saat mengunyah makanan, otak mereka memproses proses makan sebagai permainan sensorik yang menggembirakan.',
      },
      {
        title: 'Inovasi Tekstur & Sensori MPASI: Melatih Refleks Mengunyah Bayi Usia 8–24 Bulan',
        slug: 'inovasi-tekstur-sensori-mpasi',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        excerpt: 'Mengapa balita sering mengemut makanan atau mudah hoek? Pelajari tahapan transisi tekstur lumat ke kasar, stimulasi oromotor lidah, serta peran tekstur krenyes yang aman bagi gusi balita.',
        tags: ['Inovasi Tekstur & Sensori MPASI', 'Nutrisi Balita'],
        cover: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
        contentHead: 'Kapan Waktu Tepat Menaikkan Tekstur MPASI?',
        body: 'Pada usia 8 bulan, reflek lidah bayi menjulurkan makanan sudah berkurang drastis, digantikan oleh gerakan lateral (menggeser makanan ke sisi gusi untuk dikunyah).',
      },
      {
        title: 'Manfaat Kaldu Ayam Kampung & Rempah Alami untuk Daya Tahan Tubuh Anak',
        slug: 'manfaat-kaldu-ayam-kampung-balita',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        excerpt: 'Rahasia gizi tersembunyi kaldu ayam murni tanpa pengawet sintetis dan tanpa MSG tambahan, cocok sebagai booster nafsu makan dan pertahanan sistem imun anak.',
        tags: ['Resep MPASI Sehat', 'Tips Ibu Bekerja'],
        cover: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
        contentHead: 'Nutrisi Alami dari Sumsum Tulang & Kolagen',
        body: 'Kaldu ayam kampung yang dimasak perlahan (slow-cooked) mengeluarkan asam amino glisin dan prolin yang sangat berharga untuk melapisi saluran pencernaan bayi.',
      },
    ];

    for (const post of samplePosts) {
      await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          Title: {
            title: [{ text: { content: post.title } }],
          },
          Status: {
            select: { name: 'Published' },
          },
          Date: {
            date: { start: post.date },
          },
          Slug: {
            rich_text: [{ text: { content: post.slug } }],
          },
          Excerpt: {
            rich_text: [{ text: { content: post.excerpt } }],
          },
          Tags: {
            multi_select: post.tags.map((t) => ({ name: t })),
          },
          Cover: {
            files: [
              {
                name: 'Cover Image',
                type: 'external',
                external: { url: post.cover },
              },
            ],
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: post.contentHead } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: post.body } }],
            },
          },
          {
            object: 'block',
            type: 'callout',
            callout: {
              icon: { type: 'emoji', emoji: '💡' },
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Tips Kremes_Pedia: Anda dapat mengedit artikel ini langsung dari Notion kapan saja, dan website akan otomatis menampilkan perubahan terbaru!',
                  },
                },
              ],
            },
          },
        ],
      });
      console.log(`   ✨ Post dibuat: "${post.title.substring(0, 45)}..."`);
    }

    console.log('\n🎉 SELESAI!');
    console.log('Website Kremes_Pedia sekarang siap membaca data langsung dari database Notion Anda.');
    console.log('Silakan restart server dev dengan: npm run dev\n');
  } catch (err) {
    console.error('\n❌ Terjadi kesalahan saat membuat database Notion:');
    if (err.code === 'object_not_found') {
      console.error('👉 Pastikan integrasi Notion Anda sudah ditambahkan ("Connect to") ke Parent Page tersebut!');
    } else {
      console.error(err.message || err);
    }
  }
}

main();
