import test from "ava";
import VirtualToJson from "../src/index.js";
import { rootContext } from "webmiddle";

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

test("fullConversion", async t => {
  const output = await t.context.context.evaluate(
    <VirtualToJson name="virtual" from={virtualResource} fullConversion />
  );

  t.deepEqual(JSON.parse(JSON.stringify(output.content)), {
    root: [
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
  });
});
