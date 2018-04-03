import test from "ava";
import CheerioToVirtual from "../src/index.js";
import { elAttr, elJoin, elMap, elPipe, elText } from "../src/helpers";
import { evaluate, createContext } from "webmiddle";

const xmlResource = {
  name: "xmlResource",
  contentType: "text/xml",
  content: `
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
};

const virtualResource = {
  type: "root",
  attributes: {},
  children: [
    {
      type: "root",
      attributes: {},
      children: [
        "\n    ",
        {
          type: "bookstore",
          attributes: {},
          children: [
            "\n      ",
            {
              type: "book",
              attributes: {
                category: "COOKING"
              },
              children: [
                "\n        ",
                {
                  type: "title",
                  attributes: {
                    lang: "en"
                  },
                  children: ["Everyday Italian"]
                },
                "\n        ",
                {
                  type: "author",
                  attributes: {},
                  children: ["Giada De Laurentiis"]
                },
                "\n        ",
                {
                  type: "year",
                  attributes: {},
                  children: ["2005"]
                },
                "\n        ",
                {
                  type: "price",
                  attributes: {},
                  children: ["30.00"]
                },
                "\n      "
              ]
            },
            "\n      ",
            {
              type: "book",
              attributes: {
                category: "CHILDREN"
              },
              children: [
                "\n        ",
                {
                  type: "title",
                  attributes: {
                    lang: "en"
                  },
                  children: ["Harry Potter"]
                },
                "\n        ",
                {
                  type: "author",
                  attributes: {},
                  children: ["J K. Rowling"]
                },
                "\n        ",
                {
                  type: "year",
                  attributes: {},
                  children: ["2005"]
                },
                "\n        ",
                {
                  type: "price",
                  attributes: {},
                  children: ["29.99"]
                },
                "\n      "
              ]
            },
            "\n    "
          ]
        },
        "\n  "
      ]
    }
  ]
};

test.beforeEach(t => {
  t.context.context = createContext();
});

test("must throw if neither fullConversion and children are specified", async t => {
  await t.throws(
    evaluate(
      createContext(t.context.context),
      <CheerioToVirtual name="virtual" from={xmlResource} />
    )
  );
});

test("must return virtual resource", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion />
  );

  t.is(output.name, "virtual", "name");
  t.is(output.contentType, "application/x-webmiddle-virtual", "contentType");
});

test("must default to null in case of evaluation exception", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <title el="title">
        {() => {
          throw new Error("deliberate error");
        }}
      </title>
    </CheerioToVirtual>
  );

  t.deepEqual(output.content, {
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
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <title el="title">{() => undefined}</title>
    </CheerioToVirtual>
  );

  t.deepEqual(output.content, {
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
  const output = await evaluate(
    createContext(t.context.context),
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

  t.deepEqual(output.content, {
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
    evaluate(
      createContext(t.context.context),
      <CheerioToVirtual name="virtual" from={xmlResource}>
        <title el="title" condition="true" />
      </CheerioToVirtual>
    )
  );
});

test("helpers: elMap + elAttr", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource}>
      <categories el="book">
        {elMap(el => <category el={el}>{elAttr("category")}</category>)}
      </categories>
    </CheerioToVirtual>
  );

  t.deepEqual(output.content, {
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
  const output = await evaluate(
    createContext(t.context.context),
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

  t.deepEqual(output.content, {
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
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion />
  );

  t.deepEqual(output.content, virtualResource);
});

test("fullConversion: children must be ignored", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <CheerioToVirtual name="virtual" from={xmlResource} fullConversion>
      <title el="title">{elText()}</title>
    </CheerioToVirtual>
  );

  t.deepEqual(output.content, virtualResource);
});
