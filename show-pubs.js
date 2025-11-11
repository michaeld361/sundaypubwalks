import fs from 'fs/promises';
import path from 'path';

/**
 * Display all pubs that have been posted
 */
async function showUsedPubs() {
  const logPath = path.join(process.cwd(), 'logs', 'posts.jsonl');
  
  try {
    const data = await fs.readFile(logPath, 'utf-8');
    const lines = data.trim().split('\n');
    const posts = lines.map(line => JSON.parse(line));
    
    console.log('\n🍺 Sunday Pub Walks - Pub History\n');
    console.log('=' .repeat(60));
    console.log(`Total posts: ${posts.length}\n`);
    
    // Group by pub
    const pubMap = new Map();
    posts.forEach(post => {
      if (post.pubName) {
        if (!pubMap.has(post.pubName)) {
          pubMap.set(post.pubName, []);
        }
        pubMap.get(post.pubName).push({
          date: new Date(post.timestamp).toLocaleDateString(),
          walk: post.walkTitle,
          area: post.area
        });
      }
    });
    
    // Display each pub
    const sortedPubs = Array.from(pubMap.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );
    
    sortedPubs.forEach(([pubName, visits]) => {
      console.log(`📍 ${pubName}`);
      visits.forEach(visit => {
        console.log(`   • ${visit.date} - ${visit.walk}`);
        console.log(`     (${visit.area})`);
      });
      if (visits.length > 1) {
        console.log(`   ⚠️  Used ${visits.length} times!`);
      }
      console.log('');
    });
    
    console.log('=' .repeat(60));
    console.log(`\n✅ ${pubMap.size} unique pubs featured`);
    
    // Show duplicates if any
    const duplicates = Array.from(pubMap.entries()).filter(([_, visits]) => visits.length > 1);
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} pubs used multiple times:\n`);
      duplicates.forEach(([pubName, visits]) => {
        console.log(`   • ${pubName} (${visits.length} times)`);
      });
    } else {
      console.log('🎉 No duplicates - every pub is unique!');
    }
    
    console.log('\n');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('\n📝 No posts yet! Run "npm test" or "npm start" to generate your first walk.\n');
    } else {
      console.error('Error reading logs:', error.message);
    }
  }
}

showUsedPubs();
