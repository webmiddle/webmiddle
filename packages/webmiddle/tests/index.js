import test from "ava";
import { isVirtual, rootContext, WithOptions } from "../src/index.js";
import callVirtual from "../src/utils/callVirtual";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("h -> isVirtual", t => {
  t.true(
    isVirtual(
      <some foo="bar">
        <other />
      </some>
    )
  );
});

test("isVirtual -> true", t => {
  t.true(
    isVirtual({
      type: "element",
      attributes: {},
      children: []
    })
  );
});

test("isResource -> true", t => {
  t.true(
    t.context.context.isResource(
      t.context.context.createResource("some", "text/html", "<div></div>")
    )
  );
});

test("isResource -> false (plain object)", t => {
  t.false(
    t.context.context.isResource({
      id: "0",
      name: "some",
      contentType: "text/html",
      content: "<div></div>"
    })
  );
});

test("context extend: options", t => {
  t.deepEqual(rootContext.options, {});

  t.deepEqual(rootContext.extend({ foo: "bar" }).options, { foo: "bar" });

  const parentContext = rootContext.extend({ foo: "bar" });
  const context = parentContext.extend({ test: "some" });
  t.deepEqual(context.options, { foo: "bar", test: "some" });
});

test("context extend: hierarchy", t => {
  const baseContextPath = String(rootContext.children.length);
  const baseContext = rootContext.extend();

  const firstChildContext = baseContext.extend();
  const secondChildContext = baseContext.extend();
  const subFirstChildContext = firstChildContext.extend();

  // every context should have its own callState
  t.not(baseContext._callState, firstChildContext._callState);
  t.not(firstChildContext._callState, secondChildContext._callState);
  t.not(secondChildContext._callState, subFirstChildContext._callState);

  // every context should have its own emitter
  t.not(baseContext.emitter, firstChildContext.emitter);
  t.not(firstChildContext.emitter, secondChildContext.emitter);
  t.not(secondChildContext.emitter, subFirstChildContext.emitter);

  // cookie manager should be shared
  t.is(baseContext.cookieManager, firstChildContext.cookieManager);
  t.is(firstChildContext.cookieManager, secondChildContext.cookieManager);
  t.is(secondChildContext.cookieManager, subFirstChildContext.cookieManager);

  // parent
  t.is(baseContext, firstChildContext.parent);
  t.is(baseContext, secondChildContext.parent);
  t.is(firstChildContext, subFirstChildContext.parent);

  // children
  t.is(baseContext.children[0], firstChildContext);
  t.is(baseContext.children[1], secondChildContext);
  t.is(baseContext.children.length, 2);
  t.is(firstChildContext.children[0], subFirstChildContext);
  t.is(firstChildContext.children.length, 1);
  t.is(subFirstChildContext.children.length, 0);

  // path
  t.is(rootContext.path, "");
  t.is(baseContext.path, baseContextPath);
  t.is(firstChildContext.path, baseContext.path + ".0");
  t.is(secondChildContext.path, baseContext.path + ".1");
  t.is(subFirstChildContext.path, firstChildContext.path + ".0");
});

test("callVirtual: when type is not a function", async t => {
  const virtual = <element />;
  const output = await callVirtual(t.context.context, virtual);
  t.is(output.result, virtual, "result");
});

test("callVirtual: service must be called correctly", async t => {
  const Service = async ({ children, ...args }, context) => ({
    args,
    children,
    context
  });
  const virtual = (
    <Service foo="bar">
      <element />
    </Service>
  );

  const output = await callVirtual(t.context.context, virtual);
  t.deepEqual(
    output.result.args,
    {
      foo: "bar"
    },
    "attributes"
  );

  t.is(output.result.children[0].type, "element", "children");
});

test("callVirtual: resource overrides", async t => {
  // bottom to parent
  const Service = async () =>
    t.context.context.createResource("some", "text/html", "<div></div>");
  const TopService = () => <Service name="rawtext" contentType="text/plain" />;

  const output = await t.context.context.evaluate(<TopService name="other" />);

  t.is(output.name, "other", "name");
  t.is(output.contentType, "text/plain", "contentType");
  t.is(output.content, "<div></div>", "content");
});

test("evaluate: NaN", async t => {
  // regression test: NaN result should not cause infinite loop
  await t.context.context.evaluate(NaN);
  t.pass();
});

test("evaluate: function", async t => {
  const output = await t.context.context
    .extend({
      functionParameters: [3]
    })
    .evaluate(num => num * 2);
  t.is(output, 6);
});

test("evaluate: promise", async t => {
  const output = await t.context.context.evaluate(Promise.resolve(10));
  t.is(output, 10);

  try {
    await t.context.context.evaluate(Promise.reject());
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});

test("evaluate: virtual", async t => {
  const Service = ({ num }) => num * 2;
  const output = await t.context.context.evaluate(<Service num={6} />);
  t.is(output, 12);
});

test("evaluate: expectResource", async t => {
  try {
    await t.context.context
      .extend({
        expectResource: true
      })
      .evaluate(() => 3);
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});

test("WithOptions", async t => {
  const Service = (props, context) => {
    return (
      context.options.otherOption +
      " " +
      context.options.myCustomOption +
      " " +
      context.options.anotherOption
    );
  };

  const context = t.context.context.extend({
    otherOption: "bar",
    anotherOption: "again"
  });
  const output = await context.evaluate(
    <WithOptions myCustomOption="fun" anotherOption="forever">
      <Service />
    </WithOptions>
  );

  t.is(output, "bar fun forever");
});

test("must throw when the service throws", async t => {
  const Service = () => {
    throw new Error("expected throw");
  };

  await t.throws(t.context.context.evaluate(<Service />));
});
