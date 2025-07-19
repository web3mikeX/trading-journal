const fs = require('fs');

// Read the CalendarDayModal component
const componentContent = fs.readFileSync('./src/components/CalendarDayModal.tsx', 'utf8');

// Check if AI Summary tab is in the tabs array
const tabsMatch = componentContent.match(/const tabs = \[([\s\S]*?)\]/);
if (tabsMatch) {
  const tabsContent = tabsMatch[1];
  console.log('Tabs defined:');
  console.log(tabsContent);
  
  // Check for AI Summary tab
  if (tabsContent.includes('ai-summary') && tabsContent.includes('Brain')) {
    console.log('\n✅ AI Summary tab found in tabs array');
  } else {
    console.log('\n❌ AI Summary tab NOT found in tabs array');
  }
} else {
  console.log('❌ Tabs array not found');
}

// Check if AI Summary tab content exists
if (componentContent.includes("activeTab === 'ai-summary'")) {
  console.log('✅ AI Summary tab content found');
} else {
  console.log('❌ AI Summary tab content NOT found');
}

// Check activeTab type definition
const activeTabMatch = componentContent.match(/useState<([^>]+)>\('overview'\)/);
if (activeTabMatch) {
  const typeDefinition = activeTabMatch[1];
  console.log('\nActiveTab type definition:', typeDefinition);
  
  if (typeDefinition.includes('ai-summary')) {
    console.log('✅ ai-summary included in type definition');
  } else {
    console.log('❌ ai-summary NOT included in type definition');
  }
} else {
  console.log('❌ ActiveTab type definition not found');
}

console.log('\n=== Summary ===');
console.log('1. Check if your browser cache is cleared');
console.log('2. Restart the development server');
console.log('3. Open calendar and click on a day with trades');
console.log('4. Look for the "AI Summary" tab with brain icon');