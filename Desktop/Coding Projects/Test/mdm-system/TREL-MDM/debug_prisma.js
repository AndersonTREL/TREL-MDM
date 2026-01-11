
const adapterModule = require('@prisma/adapter-better-sqlite3');
console.log('Keys:', Object.keys(adapterModule));
console.log('Export:', adapterModule);
try {
    const { PrismaBetterSqlite } = adapterModule;
    console.log('PrismaBetterSqlite:', PrismaBetterSqlite);
} catch (e) {
    console.log('Error accessing named export');
}
