import test from 'ava';
import WebMiddle from '../src/index.js';

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('h -> isVirtual', t => {
  t.true(t.context.webmiddle.isVirtual((
    <some foo="bar">
      <other />
    </some>
  )));
});

test('isVirtual -> true', t => {
  t.true(t.context.webmiddle.isVirtual({
    type: 'element',
    attributes: {},
    children: [],
  }));
});

test('isResource -> true', t => {
  t.true(t.context.webmiddle.isResource({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  }));
});

test('callVirtual: when type is not a function', t => {
  const virtual = <element />;
  return t.context.webmiddle.callVirtual(virtual).then(output => {
    t.is(output.result, virtual, 'result');
    t.is(output.webmiddle, t.context.webmiddle, 'webmiddle');
  });
});

test('callVirtual: service must be called correctly', t => {
  const Service = async ({ children, webmiddle, ...args }) => ({
    args,
    children,
    webmiddle,
  });
  const virtual = (
    <Service foo="bar">
      <element />
    </Service>
  );

  return t.context.webmiddle.callVirtual(virtual).then(output => {
    t.deepEqual(output.result.args, {
      foo: 'bar',
    }, 'attributes');

    t.is(output.result.children[0].type, 'element', 'children');

    t.is(output.webmiddle, t.context.webmiddle, 'webmiddle');
  });
});

test('callVirtual: resource overrides', t => {
  const Service = async () => ({
    name: 'some',
    contentType: 'text/html',
    content: '<div></div>',
  });
  const virtual = (
    <Service name="rawtext" contentType="text/plain" />
  );

  return t.context.webmiddle.callVirtual(virtual).then(output => {
    const resource = output.result;
    t.is(resource.name, 'rawtext', 'name');
    t.is(resource.contentType, 'text/plain', 'contentType');
  });
});

test('registerService', t => {
  const Service = () => {};
  t.context.webmiddle.registerService('foo', <Service />);
  t.truthy(t.context.webmiddle.services['foo']);
  t.falsy(t.context.webmiddle.services['bar']);
});

test('service', t => {
  const Service = () => {};
  t.context.webmiddle.registerService('foo', <Service />);
  t.truthy(t.context.webmiddle.service('foo'));
  t.falsy(t.context.webmiddle.service('bar'));
});

test('service: with parent and constructor options', t => {
  const Service = () => {};
  const webmiddle = new WebMiddle({
    parent: new WebMiddle({
      services: {
        foo: <Service />,
      },
    }),
  });

  t.truthy(webmiddle.service('foo'));
  t.falsy(webmiddle.service('bar'));
});

// TODO: evaluate fn