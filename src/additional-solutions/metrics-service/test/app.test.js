const supertest = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../', 'app.js'));

it('should be listening', async () => {
  await supertest(app).get('/healthcheck').expect(200);
});

