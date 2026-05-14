import { aigcRepository } from './src/repositories/aigc.repository.js';

async function test() {
  console.log('Testing aigcRepository...');
  
  console.log('\n1. Testing getTools():');
  const tools = await aigcRepository.getTools({ limit: 3 });
  console.log('Found', tools.length, 'tools');
  tools.forEach(t => console.log(' -', t.name));
  
  console.log('\n2. Testing getHotTools():');
  const hotTools = await aigcRepository.getHotTools(3);
  console.log('Found', hotTools.length, 'hot tools');
  hotTools.forEach(t => console.log(' -', t.name, '(views:', t.viewCount, ')'));
  
  console.log('\n3. Testing getFeaturedTools():');
  const featuredTools = await aigcRepository.getFeaturedTools(3);
  console.log('Found', featuredTools.length, 'featured tools');
  featuredTools.forEach(t => console.log(' -', t.name));
  
  console.log('\n4. Testing getLatestTools():');
  const latestTools = await aigcRepository.getLatestTools(3);
  console.log('Found', latestTools.length, 'latest tools');
  latestTools.forEach(t => console.log(' -', t.name));
  
  console.log('\n5. Testing getToolCount():');
  const count = await aigcRepository.getToolCount();
  console.log('Total tools:', count);
}

test().catch(console.error);
