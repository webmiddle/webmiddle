import test from 'ava';
import ArrayMap from '../src/index.js';
import WebMiddle from 'webmiddle';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('main', async t => {
  const output = await t.context.webmiddle.evaluate(
    <ArrayMap name="resources" array={[1, 2]}>
      {(num, index) => ({
        name: `resource ${index}`,
        contentType: 'text/plain',
        content: `${num} ${index}`,
      })}
    </ArrayMap>
  );

  t.is(output.name, 'resources', 'name');
  t.is(output.contentType, 'application/json', 'contentType');
  t.deepEqual(output.content, [
    {
      name: 'resource 0',
      contentType: 'text/plain',
      content: '1 0',
    },
    {
      name: 'resource 1',
      contentType: 'text/plain',
      content: '2 1',
    },
  ], 'content');
});

test('expect resource', async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.webmiddle.evaluate(
      <ArrayMap array={[0]}>
        <Service />
      </ArrayMap>
    );
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});
