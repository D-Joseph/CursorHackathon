/**
 * Direct test of the shopping service
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { searchShoppingItems } from './src/tools/shopping';

async function main() {
  console.log('=== Shopping Service Direct Test ===\n');

  try {
    console.log('Testing: wireless headphones under $100');
    const result = await searchShoppingItems({
      searchTerm: 'wireless headphones',
      maxResults: 5,
      priceRange: { max: 100 },
    });

    console.log('Success:', result.success);
    console.log('Results count:', result.results.length);
    console.log('Total results:', result.metadata.totalResults);
    console.log('Search time:', result.metadata.searchTimeMs, 'ms');
    console.log('Source:', result.metadata.source);

    if (result.results.length > 0) {
      console.log('\nFirst result:');
      console.log('  Title:', result.results[0].title);
      console.log('  Price:', result.results[0].price);
      console.log('  Rating:', result.results[0].rating);
      console.log('  URL:', result.results[0].url);
    }

    if (result.error) {
      console.log('\nError:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
