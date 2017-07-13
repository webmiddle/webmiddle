import test from "ava";
import Resume from "../src/index.js";
import WebMiddle, { evaluate, createContext } from "webmiddle";
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
  t.context.webmiddle = new WebMiddle({
    settings: {
      outputBasePath: path.resolve(__dirname, "./output")
    }
  });
});

test("main", async t => {
  // clear folder
  deleteFolderRecursive(
    path.resolve(t.context.webmiddle.setting("outputBasePath"), "./main")
  );

  let serviceExecuted;

  const Service = () => {
    serviceExecuted = true;
    return {
      name: "resource",
      contentType: "text/json",
      content: {
        foo: "bar"
      }
    };
  };

  serviceExecuted = false;
  const output = await evaluate(
    createContext(t.context.webmiddle),
    <Resume savePath="./main/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, true, "service executed the first time");
  t.is(output.name, "resource", "name");
  t.is(output.contentType, "text/json", "contentType");
  t.deepEqual(
    output.content,
    {
      foo: "bar"
    },
    "context"
  );

  serviceExecuted = false;
  const secondOutput = await evaluate(
    createContext(t.context.webmiddle),
    <Resume savePath="./main/resource">
      <Service />
    </Resume>
  );

  t.is(serviceExecuted, false, "service resumed the second time");
  t.is(secondOutput.name, "resource", "name");
  t.is(secondOutput.contentType, "text/json", "contentType");
  t.deepEqual(
    secondOutput.content,
    {
      foo: "bar"
    },
    "context"
  );
});

test("expect resource", async t => {
  deleteFolderRecursive(
    path.resolve(
      t.context.webmiddle.setting("outputBasePath"),
      "./expectResource"
    )
  );

  const Service = () => 10; // a service that doesn't return a resource

  try {
    await evaluate(
      createContext(t.context.webmiddle),
      <Resume savePath="./expectResource/invalidResource">
        <Service />
      </Resume>
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});
