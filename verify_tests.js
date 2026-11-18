// Automated Verification Script for GiftGenie (Updated for Streamlined Apple Theme)
const fs = require('fs');
const path = require('path');

console.log('==============================================');
console.log('   GIFTGENIE AUTOMATED VERIFICATION SUITE     ');
console.log('==============================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. JSON Database Verification
console.log('--- 1. JSON Database Integrity Check ---');
const giftsPath = path.join(__dirname, 'data', 'gifts.json');
assert(fs.existsSync(giftsPath), 'gifts.json exists on disk');

const rawData = fs.readFileSync(giftsPath, 'utf8');
let gifts = [];
try {
  gifts = JSON.parse(rawData);
  assert(true, 'gifts.json is valid parseable JSON');
} catch (e) {
  assert(false, `gifts.json JSON parse error: ${e.message}`);
}

assert(gifts.length >= 80, `Gift database has at least 80 records (found ${gifts.length})`);

// Check uniqueness of IDs and Names
const ids = new Set();
const names = new Set();
let duplicatesFound = false;
let missingFields = 0;

gifts.forEach((g, idx) => {
  if (ids.has(g.id) || names.has(g.name)) {
    duplicatesFound = true;
    console.error(`Duplicate found at index ${idx}: ID ${g.id}, Name: ${g.name}`);
  }
  ids.add(g.id);
  names.add(g.name);

  if (!g.id || !g.name || typeof g.price !== 'number' || !g.category || !g.image) {
    missingFields++;
  }
});

assert(!duplicatesFound, 'All gift records have unique IDs and Names');
assert(missingFields === 0, 'All gift records have mandatory schema fields (id, name, price, category, image)');

// Price distribution check
const under100 = gifts.filter(g => g.price < 100).length;
const under200 = gifts.filter(g => g.price >= 100 && g.price < 200).length;
const under500 = gifts.filter(g => g.price >= 200 && g.price < 500).length;
const over500 = gifts.filter(g => g.price >= 500).length;
console.log(`Price breakdown: <₹100: ${under100}, ₹100-199: ${under200}, ₹200-499: ${under500}, ₹500+: ${over500}`);
assert(under100 > 0 && under200 > 0 && under500 > 0 && over500 > 0, 'Diverse price distribution covering all budget tiers');

// 2. Recommendation Algorithm Verification
console.log('\n--- 2. Recommendation Logic & Budget Boundary Check ---');

const Recommendation = require('./js/recommendation.js');

assert(typeof Recommendation.getRecommendations === 'function', 'Recommendation.getRecommendations exists');
assert(typeof Recommendation.parseBudgetLimit === 'function', 'Recommendation.parseBudgetLimit exists');
assert(typeof Recommendation.isWithinBudget === 'function', 'Recommendation.isWithinBudget exists');

// Budget boundary tests
console.log('\nTesting Budget Boundaries:');
assert(Recommendation.isWithinBudget(499, 500) === true, 'Under ₹500: ₹499 is eligible (strict <)');
assert(Recommendation.isWithinBudget(500, 500) === false, 'Under ₹500: ₹500 is NOT eligible (strict <)');
assert(Recommendation.isWithinBudget(999, 1000) === true, 'Under ₹1000: ₹999 is eligible (strict <)');
assert(Recommendation.isWithinBudget(1000, 1000) === false, 'Under ₹1000: ₹1000 is NOT eligible (strict <)');
assert(Recommendation.isWithinBudget(1500, Infinity) === true, 'No Budget: ₹1500 is eligible');

// Recommendation execution test 1
console.log('\nTesting Recommendation Scenarios:');
const prefs1 = {
  occasion: 'Birthday',
  relationship: 'Brother',
  budget: 'Under ₹500',
  age: 22,
  gender: 'Male',
  interests: ['Gaming', 'Technology'],
  personality: ['Tech-savvy'],
  occupation: 'Student',
  additionalText: ''
};

const recs1 = Recommendation.getRecommendations(gifts, prefs1);
assert(recs1.length > 0 && recs1.length <= 5, `Returned ${recs1.length} recommendations (<= 5)`);

const overBudget1 = recs1.filter(r => r.gift.price >= 500);
assert(overBudget1.length === 0, 'All recommended gifts are strictly Under ₹500');

const recIds1 = new Set(recs1.map(r => r.gift.id));
assert(recIds1.size === recs1.length, 'No duplicate gifts in results');
assert(recs1.every(r => r.reasons && r.reasons.length > 0), 'Every recommended gift has transparent match reasons');

// Recommendation execution test 2: Tight budget Under ₹100
const prefs2 = {
  occasion: 'Diwali',
  relationship: 'Friend',
  budget: 'Under ₹100',
  age: 20,
  gender: 'Female',
  interests: ['Books'],
  personality: ['Creative'],
  occupation: '',
  additionalText: ''
};

const recs2 = Recommendation.getRecommendations(gifts, prefs2);
assert(recs2.length > 0, `Returned ${recs2.length} recommendations for tight budget Under ₹100`);
assert(recs2.every(r => r.gift.price < 100), 'All recommendations for Under ₹100 are strictly < ₹100');

// 3. File and Link Integrity for Active Pages
console.log('\n--- 3. Page & Link Structure Verification ---');
const activeFiles = [
  'index.html',
  'finder.html',
  'results.html',
  'wishlist.html',
  'css/style.css',
  'css/components.css',
  'css/responsive.css',
  'js/app.js',
  'js/finder.js',
  'js/recommendation.js',
  'js/results.js',
  'js/wishlist.js',
  'js/storage.js',
  'data/gifts.json'
];

activeFiles.forEach(f => {
  const full = path.join(__dirname, f);
  assert(fs.existsSync(full), `Active file exists: ${f}`);
});

// Assert removed pages do NOT exist
assert(!fs.existsSync(path.join(__dirname, 'about.html')), 'about.html successfully removed');
assert(!fs.existsSync(path.join(__dirname, 'recipients.html')), 'recipients.html successfully removed');
assert(!fs.existsSync(path.join(__dirname, 'js/recipients.js')), 'js/recipients.js successfully removed');

console.log('\n==============================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('==============================================\n');

if (totalTests === passedTests) {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
