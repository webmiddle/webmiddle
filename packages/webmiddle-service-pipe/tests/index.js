import test from 'ava';
import Pipe from '../src/index.js';
import WebMiddle from 'webmiddle';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('main', async t => {
  const FirstService = () => ({
    name: 'firstResource',
    contentType: 'text/plain',
    content: '10',
  });
  const SecondService = ({ num }) => ({
    name: 'secondResource',
    contentType: 'text/plain',
    content: (num * 10).toString(),
  });

  const output = await t.context.webmiddle.evaluate(
    <Pipe>
      <FirstService />

      {({ firstResource }) => (
        <SecondService
          name="secondResource"
          num={parseInt(firstResource.content, 10)}
        />
      )}
    </Pipe>
  );

  t.is(output.name, 'secondResource', 'must return the last resource');
  t.is(output.content, '100', 'must pipe resources through listed services');
});

test('expect resource', async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.webmiddle.evaluate(
      <Pipe>
        <Service />
      </Pipe>
    );
    t.fail('expected rejection');
  } catch (e) {
    t.pass();
  }
});
