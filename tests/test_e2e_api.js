import http from 'http';

const BASE_URL = 'http://localhost:5000';

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('--- STARTING CINEPULSE API VERIFICATION SUITE ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health Check:', health.status === 200 && health.body.success ? 'PASS' : 'FAIL');

  // 2. Register a new unique test user
  const uniqueEmail = `test_${Date.now()}@cinepulse.io`;
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Test Streamer',
    email: uniqueEmail,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });
  console.log('2. User Registration:', registerRes.status === 201 && registerRes.body.data.user.email === uniqueEmail ? 'PASS' : 'FAIL');

  // 3. User Login
  const loginRes = await request('POST', '/api/auth/login', {
    email: uniqueEmail,
    password: 'Password123!',
  });
  console.log('3. User Login:', loginRes.status === 200 && loginRes.body.data.token ? 'PASS' : 'FAIL');
  const userToken = loginRes.body.data?.token || registerRes.body.data?.token;
  const userProfile = loginRes.body.data?.user?.profiles?.[0] || registerRes.body.data?.user?.profiles?.[0];
  const profileId = userProfile?._id || userProfile?.id;

  // 4. Duplicate registration error handling
  const dupRes = await request('POST', '/api/auth/register', {
    name: 'Test Streamer',
    email: uniqueEmail,
    password: 'Password123',
  });
  console.log('4. Duplicate Email Error Response:', dupRes.status === 400 && dupRes.body.success === false ? 'PASS' : 'FAIL');

  // 5. Fetch Movies
  const moviesRes = await request('GET', '/api/movies');
  console.log('5. Fetch Movies Catalog:', moviesRes.status === 200 && moviesRes.body.data.items.length > 0 ? 'PASS' : 'FAIL');
  const testMovie = moviesRes.body.data.items[0];

  // 6. Profiles CRUD: Create new profile
  const newProfileRes = await request(
    'POST',
    '/api/profiles',
    {
      name: 'Binge Night',
      avatar: 'avatar-5',
      maturityRating: 'R',
    },
    { Authorization: `Bearer ${userToken}` }
  );
  console.log('6. Create Profile:', newProfileRes.status === 201 && newProfileRes.body.data.profile.name === 'Binge Night' ? 'PASS' : 'FAIL');

  // 7. My List: Add & Check
  const addListRes = await request(
    'POST',
    `/api/my-list/${testMovie._id}`,
    { contentModel: 'Movie', contentType: 'movie' },
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  console.log('7. Add to My List:', addListRes.status === 201 ? 'PASS' : 'FAIL');

  const checkListRes = await request(
    'GET',
    `/api/my-list/${testMovie._id}/status`,
    null,
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  console.log('8. Check In List Status:', checkListRes.body.data.inList === true ? 'PASS' : 'FAIL');

  // 9. Save Playback Progress (Continue Watching)
  const saveProgressRes = await request(
    'POST',
    '/api/history',
    {
      contentId: testMovie._id,
      contentModel: 'Movie',
      contentType: 'movie',
      currentTime: 145,
      duration: 720,
    },
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  console.log('9. Save Playback Progress (145s/720s):', saveProgressRes.status === 200 ? 'PASS' : 'FAIL');

  // 10. Verify Continue Watching returns item
  const continueRes = await request(
    'GET',
    '/api/history/continue',
    null,
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  const foundContinue = (continueRes.body.data.items || []).some(
    (item) => (item.contentId?._id || item.contentId) === testMovie._id
  );
  console.log('10. Continue Watching List Retrieval:', foundContinue ? 'PASS' : 'FAIL');

  // 11. Rate Content
  const rateRes = await request(
    'POST',
    '/api/ratings',
    {
      contentId: testMovie._id,
      contentModel: 'Movie',
      score: 5,
      review: 'Stunning cinematography and visuals!',
    },
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  console.log('11. Submit Rating:', rateRes.status === 201 ? 'PASS' : 'FAIL');

  // 12. Personalized Recommendations
  const recRes = await request(
    'GET',
    '/api/recommendations',
    null,
    {
      Authorization: `Bearer ${userToken}`,
      'x-profile-id': profileId,
    }
  );
  console.log('12. Hybrid Recommendations Generated:', recRes.status === 200 && recRes.body.data.items.length > 0 ? 'PASS' : 'FAIL');

  // 13. Search System (Debounced endpoint)
  const searchRes = await request('GET', '/api/search?q=Steel&genre=Sci-Fi');
  console.log('13. Multi-Filter Search:', searchRes.status === 200 && searchRes.body.data.items.length > 0 ? 'PASS' : 'FAIL');

  // 14. Admin Authorization & Analytics
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@cinepulse.io',
    password: 'Password123',
  });
  const adminToken = adminLogin.body.data.token;

  const analyticsRes = await request('GET', '/api/admin/analytics', null, {
    Authorization: `Bearer ${adminToken}`,
  });
  console.log('14. Admin Analytics API:', analyticsRes.status === 200 && analyticsRes.body.data.totalMovies > 0 ? 'PASS' : 'FAIL');

  // 15. Verify Non-Admin Access Forbidden to Admin Route
  const nonAdminAccess = await request('GET', '/api/admin/analytics', null, {
    Authorization: `Bearer ${userToken}`,
  });
  console.log('15. Role-Based Admin Guard (403 Forbidden):', nonAdminAccess.status === 403 ? 'PASS' : 'FAIL');

  console.log('--- ALL 15 AUTOMATED API SUITE TESTS EXECUTED ---');
}

runTests();
