import ah from 'albert-heijn';

console.log('🔍 Nutrition ophalen voor AH Halfvolle melk...\n');

try {
  const url = 'https://www.ah.nl/producten/product/wi33693/ah-halfvolle-melk';
  const nutrition = await ah.getNutritionFacts(url);
  console.log('✅ NUTRITION DATA:');
  console.log(JSON.stringify(nutrition, null, 2));
} catch (e) {
  console.log('❌ Error:', e.message);
}

console.log('\n🔍 Product info ophalen...\n');
try {
  const url = 'https://www.ah.nl/producten/product/wi33693/ah-halfvolle-melk';
  const product = await ah.getProductInfo(url);
  console.log('✅ PRODUCT INFO:');
  console.log(JSON.stringify(product, null, 2));
} catch (e) {
  console.log('❌ Error:', e.message);
}
