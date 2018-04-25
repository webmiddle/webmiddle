import test from "ava";
import JSONSelectToVirtual, { helpers } from "../src/index.js";
import { rootContext, isResource, isVirtual } from "webmiddle";

const { elGet, elJoin, elMap, elPipe } = helpers;

const jsonResource = rootContext.createResource(
  "jsonResource",
  "application/json",
  [
    {
      id: "978-0641723445",
      cat: ["book", "hardcover"],
      name: "The Lightning Thief",
      author: "Rick Riordan",
      series_t: "Percy Jackson and the Olympians",
      sequence_i: 1,
      genre_s: "fantasy",
      inStock: true,
      price: 12.5,
      pages_i: 384
    },
    {
      id: "978-1423103349",
      cat: ["book", "paperback"],
      name: "The Sea of Monsters",
      author: "Rick Riordan",
      series_t: "Percy Jackson and the Olympians",
      sequence_i: 2,
      genre_s: "fantasy",
      inStock: true,
      price: 6.49,
      pages_i: 304
    }
  ]
);

const virtualResource = rootContext.createResource(
  "virtualResource",
  "x-webmiddle-virtual",
  {
    type: "root",
    attributes: {},
    children: [
      [
        [
          rootContext.createVirtual("id", {}, ["978-0641723445"]),
          rootContext.createVirtual("cat", {}, [["book", "hardcover"]]),
          rootContext.createVirtual("name", {}, ["The Lightning Thief"]),
          rootContext.createVirtual("author", {}, ["Rick Riordan"]),
          rootContext.createVirtual("series_t", {}, [
            "Percy Jackson and the Olympians"
          ]),
          rootContext.createVirtual("sequence_i", {}, [1]),
          rootContext.createVirtual("genre_s", {}, ["fantasy"]),
          rootContext.createVirtual("inStock", {}, [true]),
          rootContext.createVirtual("price", {}, [12.5]),
          rootContext.createVirtual("pages_i", {}, [384])
        ],
        [
          rootContext.createVirtual("id", {}, ["978-1423103349"]),
          rootContext.createVirtual("cat", {}, [["book", "paperback"]]),
          rootContext.createVirtual("name", {}, ["The Sea of Monsters"]),
          rootContext.createVirtual("author", {}, ["Rick Riordan"]),
          rootContext.createVirtual("series_t", {}, [
            "Percy Jackson and the Olympians"
          ]),
          rootContext.createVirtual("sequence_i", {}, [2]),
          rootContext.createVirtual("genre_s", {}, ["fantasy"]),
          rootContext.createVirtual("inStock", {}, [true]),
          rootContext.createVirtual("price", {}, [6.49]),
          rootContext.createVirtual("pages_i", {}, [304])
        ]
      ]
    ]
  }
);

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("must throw if neither fullConversion and children are specified", async t => {
  await t.throws(
    t.context.context.evaluate(
      <JSONSelectToVirtual name="virtual" from={jsonResource} />
    )
  );
});

test("must default to null in case of evaluation exception", async t => {
  const output = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <name el=".name">{el => el[3].toUpperCase()}</name>
    </JSONSelectToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "name",
        attributes: {},
        children: [null]
      }
    ]
  });
});

test("undefined should be converted to null", async t => {
  const output = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <name el=".name">{el => el["not existing"]}</name>
    </JSONSelectToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "name",
        attributes: {},
        children: [null]
      }
    ]
  });
});

test("must return a virtual resource", async t => {
  const output = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource} fullConversion />
  );

  t.true(isResource(output));
  t.is(output.name, "virtual", "name");
  t.is(output.contentType, "application/x-webmiddle-virtual", "contentType");
  t.true(isVirtual(output.content));
});

test("fullconversion", async t => {
  const output = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource} fullConversion />
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.deepEqual(
    JSON.parse(JSON.stringify(output.content)),
    JSON.parse(JSON.stringify(virtualResource.content))
  );
});

test("fullConversion: children must be ignored", async t => {
  const output = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource} fullConversion>
      <name el=".name">{el => el[0]}</name>
    </JSONSelectToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.deepEqual(
    JSON.parse(JSON.stringify(output.content)),
    JSON.parse(JSON.stringify(virtualResource.content))
  );
});

test("condition", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <name el=".name" condition={el => el.indexOf("Sea") !== -1}>
        {el => el[0]}
      </name>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "name",
        attributes: {},
        children: ["The Sea of Monsters"]
      }
    ]
  });
});

test("condition: must throw if is not a function", async t => {
  await t.throws(
    t.context.context.evaluate(
      <JSONSelectToVirtual name="virtual" from={jsonResource}>
        <name el=".name" condition="true" />
      </JSONSelectToVirtual>
    )
  );
});

test("elGet", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <firstName el=".name">{elGet()}</firstName>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "firstName",
        attributes: {},
        children: ["The Lightning Thief"]
      }
    ]
  });
});

test("elGet: selector", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <firstName>{elGet(".name")}</firstName>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "firstName",
        attributes: {},
        children: ["The Lightning Thief"]
      }
    ]
  });
});

/*
test('elGet: values', async t => {
  // TODO
});*/

test("elJoin", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <names el=".name">{elJoin(", ")}</names>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "names",
        attributes: {},
        children: ["The Lightning Thief, The Sea of Monsters"]
      }
    ]
  });
});

test("elMap", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <names el=".name">{elMap(el => <name>{el}</name>)}</names>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "names",
        attributes: {},
        children: [
          [
            {
              type: "name",
              attributes: {},
              children: ["The Lightning Thief"]
            },
            {
              type: "name",
              attributes: {},
              children: ["The Sea of Monsters"]
            }
          ]
        ]
      }
    ]
  });
});

test("elPipe", async t => {
  const resource = await t.context.context.evaluate(
    <JSONSelectToVirtual name="virtual" from={jsonResource}>
      <names el=".name">
        {elPipe([elJoin(", "), text => text.toUpperCase()])}
      </names>
    </JSONSelectToVirtual>
  );

  t.true(isResource(resource));
  t.true(isVirtual(resource.content));
  t.true(isVirtual(resource.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(resource.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "names",
        attributes: {},
        children: ["THE LIGHTNING THIEF, THE SEA OF MONSTERS"]
      }
    ]
  });
});
