import test from "ava";
import {
  isResource,
  isVirtual,
  callVirtual,
  rootContext,
  WithOptions
} from "../src/index.js";

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
    isResource({
      name: "some",
      contentType: "text/html",
      content: "<div></div>"
    })
  );
});

test("context extend", t => {
  t.deepEqual(rootContext.options, {});

  t.deepEqual(rootContext.extend({ foo: "bar" }).options, { foo: "bar" });

  const parentContext = rootContext.extend({ foo: "bar" });
  const context = parentContext.extend({ test: "some" });
  t.deepEqual(context.options, { foo: "bar", test: "some" });
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
  const Service = async () => ({
    name: "some",
    contentType: "text/html",
    content: "<div></div>"
  });
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

[0, 1, 2, 3].forEach(n =>
  test(`retries ${n}`, async t => {
    let tries = 0;
    const Service = () => {
      tries++;
      return Promise.reject(`retries service always fails.`);
    };

    const retries = n;
    try {
      await t.context.context
        .extend({
          retries
        })
        .evaluate(<Service />);
    } catch (err) {
      // no-op: the service is going to fail, we're good with that
    }

    t.is(tries, retries + 1);
  })
);

test("service options (WithOptions)", async t => {
  const Service = (props, context) => {
    return (
      context.options.otherOption +
      " " +
      context.options.myCustomOption +
      " " +
      context.options.anotherOption
    );
  };
  Service.options = {
    otherOption: "some",
    myCustomOption: "foo"
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

  t.is(output, "some foo forever");
});

test("service options: as a function", async t => {
  const Service = (props, context) => {
    return (
      context.options.otherOption +
      " " +
      context.options.myCustomOption +
      " " +
      context.options.anotherOption
    );
  };
  Service.options = ({ attr }, context) => ({
    otherOption: attr,
    myCustomOption: context.options.otherOption
  });

  const output = await t.context.context
    .extend({
      otherOption: "bar",
      anotherOption: "again"
    })
    .evaluate(<Service attr="more" />);

  t.is(output, "more bar again");
});

test("catch (createContext from context)", async t => {
  const SuccessService = () => 10;

  const ThrowService = () => {
    return Promise.reject("this service always fails (to test catch)");
  };
  const Service = () => <ThrowService />;

  const output = await t.context.context
    .extend({
      catch: err => <SuccessService />
    })
    .evaluate(<Service />);

  t.is(output, 10, "exception handler is passed down the service call chain");
});

test("must throw when there is no catch", async t => {
  const Service = () => {
    throw new Error("expected throw");
  };

  await t.throws(t.context.context.evaluate(<Service />));
});
