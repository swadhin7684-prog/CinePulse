import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const fetchFromAPI = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method: 'GET',
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
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const postToAPI = (path, body) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

async function fullDump() {
  try {
    // 1. Authenticate as admin
    const adminLogin = await postToAPI('/api/auth/login', {
      email: 'admin@cinepulse.io',
      password: 'Password123',
    });
    const adminToken = adminLogin.data?.token;

    // 2. Authenticate as user to get user-scoped records
    const userLogin = await postToAPI('/api/auth/login', {
      email: 'user@cinepulse.io',
      password: 'Password123',
    });
    const userToken = userLogin.data?.token;
    const userProfiles = userLogin.data?.user?.profiles || [];
    const activeProfileId = userProfiles[0]?._id;

    // 3. Fetch all datasets
    const [
      analyticsRes,
      usersRes,
      moviesRes,
      showsRes,
      genresRes,
      historyRes,
      listRes,
    ] = await Promise.all([
      fetchFromAPI('/api/admin/analytics', { Authorization: `Bearer ${adminToken}` }),
      fetchFromAPI('/api/admin/users', { Authorization: `Bearer ${adminToken}` }),
      fetchFromAPI('/api/admin/movies', { Authorization: `Bearer ${adminToken}` }),
      fetchFromAPI('/api/admin/shows', { Authorization: `Bearer ${adminToken}` }),
      fetchFromAPI('/api/admin/genres', { Authorization: `Bearer ${adminToken}` }),
      fetchFromAPI('/api/history', { Authorization: `Bearer ${userToken}`, 'x-profile-id': activeProfileId }),
      fetchFromAPI('/api/my-list', { Authorization: `Bearer ${userToken}`, 'x-profile-id': activeProfileId }),
    ]);

    console.log(JSON.stringify({
      analytics: analyticsRes.data,
      users: usersRes.data?.users,
      movies: moviesRes.data?.items,
      shows: showsRes.data?.items,
      genres: genresRes.data?.genres,
      history: historyRes.data?.items,
      myList: listRes.data?.items,
    }, null, 2));

  } catch (err) {
    console.error('Error generating dump:', err);
  }
}

fullDump();
