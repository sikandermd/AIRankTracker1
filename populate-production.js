// Production database population script
const fetch = require('node-fetch');

const PRODUCTION_URL = 'https://ai-rank-tracker-nv.replit.app';

async function populateProduction() {
  console.log('🚀 Populating production database...');
  
  // Sample brands to create
  const brands = [
    { name: "OpenAI", description: "AI research company behind ChatGPT" },
    { name: "Anthropic", description: "AI safety company behind Claude" },
    { name: "Google", description: "Tech giant with Gemini AI" },
    { name: "Microsoft", description: "Technology company with Copilot" },
    { name: "Meta", description: "Social media and VR company" }
  ];

  const createdBrands = [];

  // Create brands
  console.log('\n📋 Creating brands...');
  for (const brand of brands) {
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand)
      });
      
      if (response.ok) {
        const result = await response.json();
        createdBrands.push(result);
        console.log(`✅ Created: ${brand.name}`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed to create ${brand.name}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${brand.name}: ${error.message}`);
    }
  }

  // Create keywords if brands were created successfully
  if (createdBrands.length > 0) {
    console.log('\n🔍 Creating keywords...');
    const keywords = [
      { keyword: "best AI chatbot", brandId: createdBrands[0].id, category: "AI Tools" },
      { keyword: "AI writing assistant", brandId: createdBrands[0].id, category: "Productivity" },
      { keyword: "large language model", brandId: createdBrands[1].id, category: "Technology" },
      { keyword: "AI search engine", brandId: createdBrands[2].id, category: "Search" },
      { keyword: "machine learning platform", brandId: createdBrands[3].id, category: "Development" }
    ];

    for (const keyword of keywords) {
      try {
        const response = await fetch(`${PRODUCTION_URL}/api/keywords`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(keyword)
        });
        
        if (response.ok) {
          console.log(`✅ Created keyword: "${keyword.keyword}"`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create keyword "${keyword.keyword}": ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating keyword "${keyword.keyword}": ${error.message}`);
      }
    }
  }

  // Check final status
  console.log('\n🔍 Checking final status...');
  try {
    const brandsResponse = await fetch(`${PRODUCTION_URL}/api/brands`);
    const keywordsResponse = await fetch(`${PRODUCTION_URL}/api/keywords`);
    
    const finalBrands = await brandsResponse.json();
    const finalKeywords = await keywordsResponse.json();
    
    console.log(`\n📊 Final Results:`);
    console.log(`   Brands: ${finalBrands.length}`);
    console.log(`   Keywords: ${finalKeywords.length}`);
    
    if (finalBrands.length > 0) {
      console.log('\n🎉 Production database populated successfully!');
      console.log(`🌐 Visit: ${PRODUCTION_URL}`);
    } else {
      console.log('\n⚠️  No brands found. There may be API validation issues.');
    }
    
  } catch (error) {
    console.log('❌ Error checking final status:', error.message);
  }
}

// Run the script
populateProduction().catch(console.error);