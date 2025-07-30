// Sample data setup script for deployed application
const API_BASE = 'https://ai-rank-tracker-nv.replit.app';

async function setupSampleData() {
  console.log('Setting up sample data for deployment...');
  
  try {
    // Create sample brands
    const brands = [
      { name: "OpenAI" },
      { name: "Anthropic" },
      { name: "Google" },
      { name: "Microsoft" },
      { name: "Meta" }
    ];

    console.log('Creating brands...');
    const createdBrands = [];
    for (const brand of brands) {
      try {
        const response = await fetch(`${API_BASE}/api/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brand)
        });
        const result = await response.json();
        if (response.ok) {
          createdBrands.push(result);
          console.log(`✓ Created brand: ${brand.name}`);
        } else {
          console.log(`✗ Failed to create brand ${brand.name}:`, result);
        }
      } catch (error) {
        console.log(`✗ Error creating brand ${brand.name}:`, error.message);
      }
    }

    // Create sample keywords
    if (createdBrands.length > 0) {
      console.log('Creating keywords...');
      const keywords = [
        { keyword: "best AI chatbot", brandId: createdBrands[0].id, category: "AI Tools", platforms: ["gpt", "claude", "gemini"] },
        { keyword: "AI writing assistant", brandId: createdBrands[0].id, category: "Productivity", platforms: ["gpt", "claude"] },
        { keyword: "large language model", brandId: createdBrands[1].id, category: "Technology", platforms: ["claude", "gemini"] },
        { keyword: "AI search engine", brandId: createdBrands[2].id, category: "Search", platforms: ["gemini", "perplexity"] },
        { keyword: "machine learning platform", brandId: createdBrands[3].id, category: "Development", platforms: ["gpt", "gemini"] }
      ];

      for (const keyword of keywords) {
        try {
          const response = await fetch(`${API_BASE}/api/keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(keyword)
          });
          const result = await response.json();
          if (response.ok) {
            console.log(`✓ Created keyword: "${keyword.keyword}"`);
          } else {
            console.log(`✗ Failed to create keyword "${keyword.keyword}":`, result);
          }
        } catch (error) {
          console.log(`✗ Error creating keyword "${keyword.keyword}":`, error.message);
        }
      }
    }

    console.log('Sample data setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupSampleData();