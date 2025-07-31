const fs = require('fs');
const path = require('path');

console.log('📊 Trading Journal Chart Components Audit');
console.log('=========================================\n');

const componentsDir = path.join(__dirname, 'src', 'components');
const chartFiles = [];

// Find all chart-related files
function findChartFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findChartFiles(filePath);
    } else if (file.includes('Chart') && file.endsWith('.tsx')) {
      chartFiles.push(filePath);
    }
  }
}

findChartFiles(componentsDir);

console.log(`Found ${chartFiles.length} chart components:\n`);

const chartAnalysis = [];

for (const chartFile of chartFiles) {
  const fileName = path.basename(chartFile);
  const content = fs.readFileSync(chartFile, 'utf8');
  
  const analysis = {
    name: fileName,
    path: chartFile,
    size: Math.round(fs.statSync(chartFile).size / 1024) + 'KB',
    lines: content.split('\n').length,
    features: {
      usesRealData: false,
      usesSyntheticData: false,
      hasErrorHandling: false,
      hasLoadingState: false,
      hasCaching: false,
      usesAPI: false,
      hasMarkers: false,
      isResponsive: false
    },
    dependencies: [],
    issues: []
  };
  
  // Analyze features
  if (content.includes('getEnhancedMarketData') || content.includes('marketData') || content.includes('/api/market-data')) {
    analysis.features.usesRealData = true;
  }
  
  if (content.includes('synthetic') || content.includes('generateSyntheticData')) {
    analysis.features.usesSyntheticData = true;
  }
  
  if (content.includes('try {') || content.includes('catch') || content.includes('error')) {
    analysis.features.hasErrorHandling = true;
  }
  
  if (content.includes('loading') || content.includes('Loading') || content.includes('isLoading')) {
    analysis.features.hasLoadingState = true;
  }
  
  if (content.includes('cache') || content.includes('Cache')) {
    analysis.features.hasCaching = true;
  }
  
  if (content.includes('/api/') || content.includes('fetch(')) {
    analysis.features.usesAPI = true;
  }
  
  if (content.includes('marker') || content.includes('Marker') || content.includes('trade')) {
    analysis.features.hasMarkers = true;
  }
  
  if (content.includes('responsive') || content.includes('width') || content.includes('height')) {
    analysis.features.isResponsive = true;
  }
  
  // Find dependencies
  const importMatches = content.match(/import.*from ['"](.+?)['"]/g);
  if (importMatches) {
    importMatches.forEach(imp => {
      const match = imp.match(/from ['"](.+?)['"]/);
      if (match && match[1]) {
        analysis.dependencies.push(match[1]);
      }
    });
  }
  
  // Identify potential issues
  if (!analysis.features.hasErrorHandling) {
    analysis.issues.push('Missing error handling');
  }
  
  if (!analysis.features.hasLoadingState) {
    analysis.issues.push('No loading state');
  }
  
  if (analysis.dependencies.includes('lightweight-charts') && !content.includes('dynamic import')) {
    analysis.issues.push('Static import of heavy library');
  }
  
  if (content.includes('console.log') || content.includes('console.error')) {
    analysis.issues.push('Has debug console statements');
  }
  
  chartAnalysis.push(analysis);
}

// Sort by complexity (more features = more complex)
chartAnalysis.sort((a, b) => {
  const aFeatures = Object.values(a.features).filter(Boolean).length;
  const bFeatures = Object.values(b.features).filter(Boolean).length;
  return bFeatures - aFeatures;
});

// Display results
chartAnalysis.forEach((chart, index) => {
  console.log(`${index + 1}. ${chart.name} (${chart.size}, ${chart.lines} lines)`);
  
  const featureCount = Object.values(chart.features).filter(Boolean).length;
  const featureList = Object.entries(chart.features)
    .filter(([key, value]) => value)
    .map(([key]) => key)
    .join(', ');
  
  console.log(`   Features (${featureCount}): ${featureList || 'None detected'}`);
  
  if (chart.dependencies.length > 0) {
    const relevantDeps = chart.dependencies.filter(dep => 
      dep.includes('chart') || 
      dep.includes('market') || 
      dep.includes('lightweight') ||
      dep.includes('apex') ||
      dep.includes('tradingview')
    );
    if (relevantDeps.length > 0) {
      console.log(`   Key deps: ${relevantDeps.join(', ')}`);
    }
  }
  
  if (chart.issues.length > 0) {
    console.log(`   ⚠️  Issues: ${chart.issues.join(', ')}`);
  }
  
  console.log();
});

// Summary statistics
console.log('📈 Summary Statistics:');
console.log('=====================');

const totalComponents = chartAnalysis.length;
const withRealData = chartAnalysis.filter(c => c.features.usesRealData).length;
const withSynthetic = chartAnalysis.filter(c => c.features.usesSyntheticData).length;
const withErrorHandling = chartAnalysis.filter(c => c.features.hasErrorHandling).length;
const withLoadingStates = chartAnalysis.filter(c => c.features.hasLoadingState).length;
const withIssues = chartAnalysis.filter(c => c.issues.length > 0).length;

console.log(`Total chart components: ${totalComponents}`);
console.log(`Using real data: ${withRealData} (${Math.round(withRealData/totalComponents*100)}%)`);
console.log(`Using synthetic data: ${withSynthetic} (${Math.round(withSynthetic/totalComponents*100)}%)`);
console.log(`With error handling: ${withErrorHandling} (${Math.round(withErrorHandling/totalComponents*100)}%)`);
console.log(`With loading states: ${withLoadingStates} (${Math.round(withLoadingStates/totalComponents*100)}%)`);
console.log(`With potential issues: ${withIssues} (${Math.round(withIssues/totalComponents*100)}%)`);

// Identify most used components (check usage in other files)
console.log('\n🔍 Usage Analysis:');
console.log('==================');

const srcDir = path.join(__dirname, 'src');
const usageMap = new Map();

function findUsages(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      findUsages(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      chartAnalysis.forEach(chart => {
        const componentName = chart.name.replace('.tsx', '');
        if (content.includes(componentName) && !filePath.includes(componentName)) {
          const count = usageMap.get(componentName) || 0;
          usageMap.set(componentName, count + 1);
        }
      });
    }
  }
}

findUsages(srcDir);

const sortedUsage = Array.from(usageMap.entries())
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

console.log('Most used chart components:');
sortedUsage.forEach(([component, count]) => {
  console.log(`  ${component}: used in ${count} files`);
});

if (sortedUsage.length === 0) {
  console.log('  No component usage detected (components may be unused)');
}

console.log('\n💡 Recommendations:');
console.log('===================');

console.log(`1. Consider consolidating ${totalComponents} chart components - many may be redundant`);
console.log(`2. ${totalComponents - withErrorHandling} components need error handling`);
console.log(`3. ${totalComponents - withLoadingStates} components need loading states`);
console.log(`4. Focus on the ${sortedUsage.slice(0, 3).map(([name]) => name).join(', ')} components as they are most used`);
console.log(`5. Remove unused components to reduce bundle size`);