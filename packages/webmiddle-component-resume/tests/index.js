import test from "ava";
import Resume from "../src/index.js";
import { rootContext, isResource, isVirtual } from "webmiddle";
import path from "path";
import fs from "fs";

function deleteFolderRecursive(filename) {
  if (fs.existsSync(filename)) {
    fs.readdirSync(filename).forEach(file => {
      const curPath = filename + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(filename);
  }
}

test.beforeEach(t => {
  t.context.context = rootContext.extend({
    outputBasePath: path.resolve(__dirname, "./output")
  });
});

test("expect resource", async t => {
  deleteFolderRecursive(
    path.resolve(t.context.context.options.outputBasePath, "./expectResource")
  );

  const Component = () => 10; // a component that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Resume
        savePath="./expectResource/invalidResource"
        task={<Component />}
      />
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});

test("main", async t => {
  // clear folder
  deleteFolderRecursive(
    path.resolve(t.context.context.options.outputBasePath, "./main")
  );

  let componentExecuted;

  const Component = () => {
    componentExecuted = true;
    return t.context.context.createResource(
      "resource",
      "text/plain",
      "foo bar"
    );
  };

  componentExecuted = false;
  const output = await t.context.context.evaluate(
    <Resume savePath="./main/resource" task={<Component />} />
  );

  t.is(componentExecuted, true, "component executed the first time");
  t.true(isResource(output));
  t.is(output.name, "resource");
  t.is(output.contentType, "text/plain");
  t.is(output.content, "foo bar", "context");

  componentExecuted = false;
  const secondOutput = await t.context.context.evaluate(
    <Resume savePath="./main/resource" task={<Component />} />
  );

  t.is(componentExecuted, false, "component resumed the second time");
  t.true(isResource(secondOutput));
  t.is(secondOutput.name, "resource");
  t.is(secondOutput.contentType, "text/plain");
  t.is(secondOutput.content, "foo bar", "context");
});

test("x-webmiddle-type", async t => {
  // clear folder
  deleteFolderRecursive(
    path.resolve(t.context.context.options.outputBasePath, "./x-webmiddle-type")
  );

  let componentExecuted;

  const Component = () => {
    componentExecuted = true;
    return t.context.context.createResource("resource", "x-webmiddle-type", {
      foo: t.context.context.createVirtual("bar", { some: "more" }, [])
    });
  };

  componentExecuted = false;
  const output = await t.context.context.evaluate(
    <Resume savePath="./x-webmiddle-type/resource" task={<Component />} />
  );

  t.is(componentExecuted, true, "component executed the first time");
  t.true(isResource(output));
  t.is(output.name, "resource");
  t.is(output.contentType, "x-webmiddle-type");

  t.true(isVirtual(output.content.foo));
  t.is(output.content.foo.type, "bar");
  t.deepEqual(output.content.foo.attributes, { some: "more" });
  t.deepEqual(output.content.foo.children, []);

  componentExecuted = false;
  const secondOutput = await t.context.context.evaluate(
    <Resume savePath="./x-webmiddle-type/resource" task={<Component />} />
  );

  t.is(componentExecuted, false, "component resumed the second time");
  t.true(isResource(secondOutput));
  t.is(secondOutput.name, "resource");
  t.is(secondOutput.contentType, "x-webmiddle-type");

  t.true(isVirtual(secondOutput.content.foo));
  t.is(secondOutput.content.foo.type, "bar");
  t.deepEqual(secondOutput.content.foo.attributes, { some: "more" });
  t.deepEqual(secondOutput.content.foo.children, []);
});
