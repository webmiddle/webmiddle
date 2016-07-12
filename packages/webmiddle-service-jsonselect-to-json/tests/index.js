import test from 'ava';
import JSONSelectToJson from '../src/index.js';
import WebMiddle from 'webmiddle';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('stub', t => {
  t.pass();
});
