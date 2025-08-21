const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { isHobbyCronValid } = require('./cron-validator');

test('hourly cron alias is invalid for Hobby plan', () => {
  assert.strictEqual(isHobbyCronValid('@hourly'), false);
});

test('hourly cron expression is invalid for Hobby plan', () => {
  assert.strictEqual(isHobbyCronValid('0 * * * *'), false);
});

test('daily cron expression is valid for Hobby plan', () => {
  assert.strictEqual(isHobbyCronValid('0 0 * * *'), true);
});

test('vercel.json schedule complies with Hobby plan', () => {
  const config = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));
  const schedule = config.crons[0].schedule;
  assert.strictEqual(isHobbyCronValid(schedule), true);
});