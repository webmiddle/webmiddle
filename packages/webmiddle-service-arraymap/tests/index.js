import test from "ava";
import ArrayMap from "../src/index.js";
import { rootContext } from "webmiddle";

function range(num) {
  return [...Array(num).keys()];
}

test("main", async t => {
  const output = await rootContext.evaluate(
    <ArrayMap
      name="resources"
      array={[1, 2]}
      callback={(num, index) =>
        rootContext.createResource(
          `resource ${index}`,
          "text/plain",
          `${num} ${index}`
        )
      }
    />
  );

  t.is(output.name, "resources", "name");
  t.is(output.contentType, "application/json", "contentType");

  t.is(output.content[0].name, "resource 0");
  t.is(output.content[0].contentType, "text/plain");
  t.is(output.content[0].content, "1 0");

  t.is(output.content[1].name, "resource 1");
  t.is(output.content[1].contentType, "text/plain");
  t.is(output.content[1].content, "2 1");
});

test("expect resource", async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await rootContext.evaluate(
      <ArrayMap name="whatever" array={[0]} callback={() => <Service />} />
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});

test("limit", async t => {
  const limit = 10;
  let current = 0;
  let overLimit = false;

  const Service = (props, context) => {
    current++;
    //console.log('exec', current);
    if (current > limit) {
      overLimit = true;
    }
    return new Promise(resolve => {
      setTimeout(() => {
        current--;
        //console.log('done', current);
        resolve(context.createResource("whatever", "text/plain", "whatever"));
      }, 100);
    });
  };

  current = 0;
  overLimit = false;
  await rootContext.evaluate(
    <ArrayMap
      name="resources"
      array={range(100)}
      callback={num => <Service name={num} />}
      limit={limit}
    />
  );

  t.is(overLimit, false, "with limit");

  current = 0;
  overLimit = false;
  await rootContext.evaluate(
    <ArrayMap
      name="resources"
      array={range(100)}
      callback={num => <Service name={num} />}
      limit={0}
    />
  );

  t.is(overLimit, true, "without limit");
});
