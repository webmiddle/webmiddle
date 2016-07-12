import test from 'ava';
import Parallel from '../src/index.js';
import WebMiddle from 'webmiddle';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('main', async t => {
  let firstStart;
  let secondStart;
  let firstEnd;
  let secondEnd;

  const FirstService = () => new Promise(resolve => {
    firstStart = Date.now();
    setTimeout(() => {
      firstEnd = Date.now();
      resolve({
        name: 'firstResource',
        contentType: 'text/plain',
        content: '1',
      });
    }, 100);
  });
  const SecondService = () => new Promise(resolve => {
    secondStart = Date.now();
    setTimeout(() => {
      secondEnd = Date.now();
      resolve({
        name: 'secondResource',
        contentType: 'text/plain',
        content: '2',
      });
    }, 100);
  });

  const output = await t.context.webmiddle.evaluate(
    <Parallel name="resources">
      <FirstService />
      <SecondService />
    </Parallel>
  );

  t.is(output.name, 'resources', 'name');
  t.is(output.contentType, 'text/json', 'contentType');
  t.deepEqual(JSON.parse(output.content), {
    firstResource: {
      name: 'firstResource',
      contentType: 'text/plain',
      content: '1',
    },
    secondResource: {
      name: 'secondResource',
      contentType: 'text/plain',
      content: '2',
    },
  }, 'content');

  t.true(firstStart < secondEnd && secondStart < firstEnd, 'services must run concurrently');
});

test('expect resource', async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.webmiddle.evaluate(
      <Parallel>
        <Service />
      </Parallel>
    );
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});
