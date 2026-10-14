import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';

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

async function testConnection() {
  console.log('\n--- DIAGNOSIS KONEKSI NOTION ---');
  const env = loadEnv();
  const token = process.env.NOTION_TOKEN || env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID || env.NOTION_DATABASE_ID;

  if (!token) {
    console.log('❌ NOTION_TOKEN: KOSONG di file .env');
  } else {
    console.log(`✅ NOTION_TOKEN: Terisi (${token.substring(0, 10)}...)`);
  }

  if (!databaseId) {
    console.log('❌ NOTION_DATABASE_ID: KOSONG di file .env');
  } else {
    console.log(`✅ NOTION_DATABASE_ID: Terisi (${databaseId})`);
  }

  if (!token || !databaseId) {
    console.log('\n⚠️ Kesimpulan: Silakan isi NOTION_TOKEN dan NOTION_DATABASE_ID pada file .env lalu simpan (Ctrl+S).\n');
    return;
  }

  try {
    const notion = new Client({ auth: token });
    console.log('\n🔍 Menguji akses ke database Notion...');
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const dbTitle = db.title?.[0]?.plain_text || 'Database Tanpa Judul';
    console.log(`✅ Berhasil terhubung ke database: "${dbTitle}"`);

    // Periksa kolom yang dibutuhkan
    const props = db.properties;
    const expected = ['Title', 'Status', 'Date', 'Slug', 'Excerpt', 'Tags', 'Cover'];
    console.log('\n🔍 Memeriksa kecocokan kolom database:');
    let allPropsOk = true;
    for (const key of expected) {
      const match = Object.keys(props).find(k => k.toLowerCase() === key.toLowerCase());
      if (match) {
        console.log(`   ✔️ Kolom '${match}' (${props[match].type}) ditemukan`);
      } else {
        console.log(`   ❌ Kolom '${key}' TIDAK DITEMUKAN`);
        allPropsOk = false;
      }
    }

    // Query artikel Published
    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status',
        select: { equals: 'Published' },
      },
    });

    console.log(`\n📊 Jumlah artikel dengan status 'Published': ${query.results.length}`);
    if (query.results.length === 0) {
      console.log('⚠️ Belum ada artikel dengan Status = "Published". Website akan menggunakan mock post cadangan sampai ada artikel published.');
    } else {
      console.log('🎉 Sukses! Website siap menampilkan data artikel langsung dari Notion.');
    }
  } catch (err) {
    console.log('\n❌ Gagal terhubung ke Notion:');
    if (err.code === 'object_not_found') {
      console.log('   Penyebab: Database ID salah atau integrasi belum di-connect ke database tersebut di Notion.');
      console.log('   Solusi: Buka Notion -> Klik titik tiga (...) di kanan atas database -> Connect to -> Pilih integrasi Anda.');
    } else if (err.code === 'unauthorized') {
      console.log('   Penyebab: NOTION_TOKEN tidak valid atau kedaluwarsa.');
    } else {
      console.log('   Error:', err.message || err);
    }
  }
  console.log('--------------------------------\n');
}

testConnection();
