/**
 * Test script for Shopping Search Tool
 */
import { searchShoppingItems } from './tools/shopping';

async function runTests() {
  console.log('Testing Shopping Search Tool...\n');

  // Test 1: Basic search
  console.log('Test 1: Basic search for "wireless headphones"');
  const basicResult = await searchShoppingItems({
    searchTerm: 'wireless headphones'
  });

  if (basicResult.success) {
    console.log(`  SUCCESS: Found ${basicResult.metadata.totalResults} items`);
    console.log(`  Source: ${basicResult.metadata.source}`);
    console.log(`  Search time: ${basicResult.metadata.searchTimeMs}ms`);
    console.log(`  First result: ${basicResult.results[0]?.title}`);
  } else {
    console.log(`  FAILED: ${basicResult.error}`);
  }
  console.log();

  // Test 2: Search with filters
  console.log('Test 2: Search for "lego toy" with price range $20-$100');
  const filteredResult = await searchShoppingItems({
    searchTerm: 'lego toy',
    maxResults: 3,
    priceRange: { min: 20, max: 100 },
    sortBy: 'rating'
  });

  if (filteredResult.success) {
    console.log(`  SUCCESS: Found ${filteredResult.metadata.totalResults} items`);
    filteredResult.results.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.title}`);
      console.log(`      Price: $${item.price?.value} ${item.price?.isOnSale ? '(ON SALE)' : ''}`);
      console.log(`      Rating: ${item.rating?.score}/5 (${item.rating?.reviewCount} reviews)`);
      console.log(`      URL: ${item.url}`);
    });
  } else {
    console.log(`  FAILED: ${filteredResult.error}`);
  }
  console.log();

  // Test 3: Empty search term (should fail validation)
  console.log('Test 3: Empty search term (should fail)');
  const emptyResult = await searchShoppingItems({
    searchTerm: ''
  });

  if (!emptyResult.success) {
    console.log(`  SUCCESS: Correctly rejected with error: ${emptyResult.error}`);
  } else {
    console.log('  FAILED: Should have rejected empty search term');
  }
  console.log();

  // Test 4: Invalid maxResults
  console.log('Test 4: Invalid maxResults (25, should fail)');
  const invalidResult = await searchShoppingItems({
    searchTerm: 'test',
    maxResults: 25
  });

  if (!invalidResult.success) {
    console.log(`  SUCCESS: Correctly rejected with error: ${invalidResult.error}`);
  } else {
    console.log('  FAILED: Should have rejected invalid maxResults');
  }
  console.log();

  console.log('All tests completed!');
}

runTests().catch(console.error);
