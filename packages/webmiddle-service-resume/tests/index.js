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

  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Resume savePath="./expectResource/invalidResource">
        <Service />
      </Resume>
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

  let serviceExecuted;

  const Service = () => {
    serviceExecuted = true;
    return t.context.context.createResource("resource", "text/plain", {
      foo: "bar"
    });
  };

  serviceExecuted = false;
  const output = await t.context.context.evaluate(
    <Resume savePath="./main/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, true, "service executed the first time");
  t.true(isResource(output));
  t.is(output.name, "resource");
  t.is(output.contentType, "text/plain");
  t.deepEqual(
    output.content,
    {
      foo: "bar"
    },
    "context"
  );

  serviceExecuted = false;
  const secondOutput = await t.context.context.evaluate(
    <Resume savePath="./main/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, false, "service resumed the second time");
  t.true(isResource(secondOutput));
  t.is(secondOutput.name, "resource");
  t.is(secondOutput.contentType, "text/plain");
  t.deepEqual(
    secondOutput.content,
    {
      foo: "bar"
    },
    "context"
  );
});

test("x-webmiddle-type", async t => {
  // clear folder
  deleteFolderRecursive(
    path.resolve(t.context.context.options.outputBasePath, "./x-webmiddle-type")
  );

  let serviceExecuted;

  const Service = () => {
    serviceExecuted = true;
    return t.context.context.createResource("resource", "x-webmiddle-type", {
      foo: t.context.context.createVirtual("bar", { some: "more" }, [])
    });
  };

  serviceExecuted = false;
  const output = await t.context.context.evaluate(
    <Resume savePath="./x-webmiddle-type/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, true, "service executed the first time");
  t.true(isResource(output));
  t.is(output.name, "resource");
  t.is(output.contentType, "x-webmiddle-type");

  t.true(isVirtual(output.content.foo));
  t.is(output.content.foo.type, "bar");
  t.deepEqual(output.content.foo.attributes, { some: "more" });
  t.deepEqual(output.content.foo.children, []);

  serviceExecuted = false;
  const secondOutput = await t.context.context.evaluate(
    <Resume savePath="./x-webmiddle-type/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, false, "service resumed the second time");
  t.true(isResource(secondOutput));
  t.is(secondOutput.name, "resource");
  t.is(secondOutput.contentType, "x-webmiddle-type");

  t.true(isVirtual(secondOutput.content.foo));
  t.is(secondOutput.content.foo.type, "bar");
  t.deepEqual(secondOutput.content.foo.attributes, { some: "more" });
  t.deepEqual(secondOutput.content.foo.children, []);
});
