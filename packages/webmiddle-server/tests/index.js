import test from 'ava';
import server from '../src';
import WebMiddle from 'webmiddle';

test.beforeEach(t => {

});

test('main', async t => {
  const parentWebmiddle = new WebMiddle({
    services: {

    },
    settings: {
      some: 'other',
    },
  });

  const webmiddle = new WebMiddle({
    parent: parentWebmiddle,
    services: {

    },
    settings: {
      foo: 'bar',
    },
  });

  server.start(webmiddle);

  t.pass();
});
