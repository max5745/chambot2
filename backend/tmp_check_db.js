const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            AND table_type='BASE TABLE'
            ORDER BY table_name
        `);
        console.log('\n📦 Tables in Public Schema:');
        console.log('---------------------------');
        tables.rows.forEach(t => console.log(`- ${t.table_name}`));

        console.log('\n📊 Row Counts:');
        console.log('---------------------------');
        const countQueries = tables.rows.map(t =>
            pool.query(`SELECT count(*) FROM public."${t.table_name}"`)
                .then(r => console.log(`${t.table_name.padEnd(25)}: ${r.rows[0].count} rows`))
        );
        await Promise.all(countQueries);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
