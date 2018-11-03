import test from "ava";
import Parallel from "../src/index.js";
import { rootContext, isResource } from "webmiddle";

function range(num) {
  return [...Array(num).keys()];
}

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("main: tasks as object", async t => {
  let firstStart;
  let secondStart;
  let firstEnd;
  let secondEnd;

  const FirstComponent = () =>
    new Promise(resolve => {
      firstStart = Date.now();
      setTimeout(() => {
        firstEnd = Date.now();
        resolve(
          t.context.context.createResource("firstResource", "text/plain", "1")
        );
      }, 100);
    });
  const SecondComponent = () =>
    new Promise(resolve => {
      secondStart = Date.now();
      setTimeout(() => {
        secondEnd = Date.now();
        resolve(
          t.context.context.createResource("secondResource", "text/plain", "2")
        );
      }, 100);
    });

  const output = await t.context.context.evaluate(
    <Parallel
      tasks={{
        firstResource: <FirstComponent />,
        secondResource: <SecondComponent />
      }}
    />
  );

  t.true(typeof output === "object" && output !== null);
  t.deepEqual(Object.keys(output), ["firstResource", "secondResource"]);

  t.true(isResource(output.firstResource));
  t.is(output.firstResource.name, "firstResource");
  t.is(output.firstResource.contentType, "text/plain");
  t.is(output.firstResource.content, "1");

  t.true(isResource(output.secondResource));
  t.is(output.secondResource.name, "secondResource");
  t.is(output.secondResource.contentType, "text/plain");
  t.is(output.secondResource.content, "2");

  t.true(
    firstStart < secondEnd && secondStart < firstEnd,
    "components must run concurrently"
  );
});

test("main: tasks as array", async t => {
  const output = await rootContext.evaluate(
    <Parallel
      tasks={[1, 2].map((num, index) =>
        rootContext.createResource(
          `resource ${index}`,
          "text/plain",
          `${num} ${index}`
        )
      )}
    />
  );

  t.true(Array.isArray(output));
  t.is(output.length, 2);

  t.true(isResource(output[0]));
  t.is(output[0].name, "resource 0");
  t.is(output[0].contentType, "text/plain");
  t.is(output[0].content, "1 0");

  t.true(isResource(output[1]));
  t.is(output[1].name, "resource 1");
  t.is(output[1].contentType, "text/plain");
  t.is(output[1].content, "2 1");
});

test("limit", async t => {
  const limit = 10;
  let current = 0;
  let overLimit = false;

  const Component = () => {
    current++;
    //console.log('exec', current);
    if (current > limit) {
      overLimit = true;
    }
    return new Promise(resolve => {
      setTimeout(() => {
        current--;
        //console.log('done', current);
        resolve(
          t.context.context.createResource("whatever", "text/plain", "whatever")
        );
      }, 100);
    });
  };

  current = 0;
  overLimit = false;
  await t.context.context.evaluate(
    <Parallel
      limit={limit}
      tasks={range(100).map(i => (
        <Component />
      ))}
    />
  );

  t.is(overLimit, false, "with limit");

  current = 0;
  overLimit = false;
  await t.context.context.evaluate(
    <Parallel
      limit={0}
      tasks={range(100).map(i => (
        <Component />
      ))}
    />
  );

  t.is(overLimit, true, "without limit");
});

test("does not expect resource", async t => {
  const Component = () => 10; // a component that doesn't return a resource

  try {
    await t.context.context.evaluate(<Parallel tasks={[<Component />]} />);
    t.pass();
  } catch (e) {
    t.fail();
  }
});
