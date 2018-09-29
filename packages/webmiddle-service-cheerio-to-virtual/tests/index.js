import test from "ava";
import CheerioToVirtual from "../src/index.js";
import { elAttr, elJoin, elMap, elPipe, elText } from "../src/helpers";
import { rootContext, isResource, isVirtual } from "webmiddle";

const xmlResource = rootContext.createResource(
  "xmlResource",
  "text/xml",
  `
    <bookstore>
      <book category="COOKING">
        <title lang="en">Everyday Italian</title>
        <author>Giada De Laurentiis</author>
        <year>2005</year>
        <price>30.00</price>
      </book>
      <book category="CHILDREN">
        <title lang="en">Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
      </book>
    </bookstore>
  `
);

const virtualResource = rootContext.createResource(
  "virtualResource",
  "x-webmiddle-virtual",
  rootContext.createVirtual("root", {}, [
    rootContext.createVirtual("root", {}, [
      "\n    ",
      rootContext.createVirtual("bookstore", {}, [
        "\n      ",
        rootContext.createVirtual(
          "book",
          {
            category: "COOKING"
          },
          [
            "\n        ",
            rootContext.createVirtual(
              "title",
              {
                lang: "en"
              },
              ["Everyday Italian"]
            ),
            "\n        ",
            rootContext.createVirtual("author", {}, ["Giada De Laurentiis"]),
            "\n        ",
            rootContext.createVirtual("year", {}, ["2005"]),
            "\n        ",
            rootContext.createVirtual("price", {}, ["30.00"]),
            "\n      "
          ]
        ),
        "\n      ",
        rootContext.createVirtual(
          "book",
          {
            category: "CHILDREN"
          },
          [
            "\n        ",
            rootContext.createVirtual(
              "title",
              {
                lang: "en"
              },
              ["Harry Potter"]
            ),
            "\n        ",
            rootContext.createVirtual("author", {}, ["J K. Rowling"]),
            "\n        ",
            rootContext.createVirtual("year", {}, ["2005"]),
            "\n        ",
            rootContext.createVirtual("price", {}, ["29.99"]),
            "\n      "
          ]
        ),
        "\n    "
      ]),
      "\n  "
    ])
  ])
);

test("must throw if neither fullConversion and children are specified", async t => {
  await t.throws(
    rootContext.evaluate(<CheerioToVirtual name="virtual" from={xmlResource} />)
  );
});

test("must return virtual resource", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion />
  );

  t.true(isResource(output));
  t.is(output.name, "virtual", "name");
  t.is(output.contentType, "x-webmiddle-virtual", "contentType");
  t.true(isVirtual(output.content));
});

test("must default to null in case of evaluation exception", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <title el="title">
        {() => {
          throw new Error("deliberate error");
        }}
      </title>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "title",
        attributes: {},
        children: [null]
      }
    ]
  });
});

test("undefined should be converted to null", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <title el="title">{() => undefined}</title>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "title",
        attributes: {},
        children: [null]
      }
    ]
  });
});

test("condition", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <book
        el="book"
        condition={el =>
          el
            .find("title")
            .text()
            .trim() === "Harry Potter"
        }
      >
        <author el="author">{elText()}</author>
      </book>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.true(isVirtual(output.content.children[0].children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "book",
        attributes: {},
        children: [
          {
            type: "author",
            attributes: {},
            children: ["J K. Rowling"]
          }
        ]
      }
    ]
  });
});

test("condition: must throw if is not a function", async t => {
  await t.throws(
    rootContext.evaluate(
      <CheerioToVirtual name="virtual" from={xmlResource}>
        <title el="title" condition="true" />
      </CheerioToVirtual>
    )
  );
});

test("helpers: elMap + elAttr", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <categories el="book">
        {elMap(el => (
          <category el={el}>{elAttr("category")}</category>
        ))}
      </categories>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "categories",
        attributes: {},
        children: [
          [
            {
              type: "category",
              attributes: {},
              children: ["COOKING"]
            },
            {
              type: "category",
              attributes: {},
              children: ["CHILDREN"]
            }
          ]
        ]
      }
    ]
  });
});

test("helpers: elPipe + elMap + elText + elJoin", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <books el="book">
        {elMap(el => (
          <book el={el.find("*")}>
            {elPipe([elMap(elText()), elJoin("; ")])}
          </book>
        ))}
      </books>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.true(isVirtual(output.content.children[0]));
  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    type: "root",
    attributes: {},
    children: [
      {
        type: "books",
        attributes: {},
        children: [
          [
            {
              type: "book",
              attributes: {},
              children: ["Everyday Italian; Giada De Laurentiis; 2005; 30.00"]
            },
            {
              type: "book",
              attributes: {},
              children: ["Harry Potter; J K. Rowling; 2005; 29.99"]
            }
          ]
        ]
      }
    ]
  });
});

test("fullconversion", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion />
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.deepEqual(
    JSON.parse(JSON.stringify(output.content)),
    JSON.parse(JSON.stringify(virtualResource.content))
  );
});

test("fullConversion: children must be ignored", async t => {
  const output = await rootContext.evaluate(
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion>
      <title el="title">{elText()}</title>
    </CheerioToVirtual>
  );

  t.true(isResource(output));
  t.true(isVirtual(output.content));
  t.deepEqual(
    JSON.parse(JSON.stringify(output.content)),
    JSON.parse(JSON.stringify(virtualResource.content))
  );
});
