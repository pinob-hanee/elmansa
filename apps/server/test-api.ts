import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/v1';

async function runTests() {
  console.log('🧪 Starting API Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`❌ [FAIL] ${name}`);
      console.log(`   Error: ${err.response?.status} - ${JSON.stringify(err.response?.data) || err.message}`);
      failed++;
    }
  };

  // 1. Health Check
  await test('Health check endpoint returns 200 OK', async () => {
    const res = await axios.get('http://127.0.0.1:5000/health');
    if (res.status !== 200) throw new Error('Not 200');
  });

  // 2. Auth Security: Protected routes should reject without token
  await test('Protected route /users/me blocks unauthorized requests (401)', async () => {
    try {
      await axios.get(`${API_URL}/auth/me`);
      throw new Error('Should have failed');
    } catch (err: any) {
      if (err.response?.status !== 401) throw err;
    }
  });

  // 3. Admin Security: Creating a course without Admin token blocks requests
  await test('Admin route /courses blocks unauthorized requests (401/403)', async () => {
    try {
      await axios.post(`${API_URL}/courses`, { title: 'Test' });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) throw err;
    }
  });

  // 4. Public Courses List
  await test('Public courses list returns successfully', async () => {
    const res = await axios.get(`${API_URL}/courses`);
    if (res.status !== 200 || !res.data.success) throw new Error('Failed to fetch courses');
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
