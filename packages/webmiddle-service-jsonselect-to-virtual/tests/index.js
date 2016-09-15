import test from 'ava';
import JSONSelectToVirtual from '../src/index.js';
import WebMiddle from 'webmiddle';

// TODO: helpers

const jsonResource = {
  name: 'jsonResource',
  contentType: 'application/json',
  content: `
    [
      {
        "id" : "978-0641723445",
        "cat" : ["book","hardcover"],
        "name" : "The Lightning Thief",
        "author" : "Rick Riordan",
        "series_t" : "Percy Jackson and the Olympians",
        "sequence_i" : 1,
        "genre_s" : "fantasy",
        "inStock" : true,
        "price" : 12.50,
        "pages_i" : 384
      },
      {
        "id" : "978-1423103349",
        "cat" : ["book","paperback"],
        "name" : "The Sea of Monsters",
        "author" : "Rick Riordan",
        "series_t" : "Percy Jackson and the Olympians",
        "sequence_i" : 2,
        "genre_s" : "fantasy",
        "inStock" : true,
        "price" : 6.49,
        "pages_i" : 304
      }
    ]
  `,
};

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('must return virtual resource', async t => {
  const output = await t.context.webmiddle.evaluate(
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    />
  );

  t.is(output.name, 'virtual', 'name');
  t.is(output.contentType, 'application/x-webmiddle-virtual', 'contentType');
});

test('fullconversion', async t => {
  const output = await t.context.webmiddle.evaluate(
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
      fullConversion
    />
  );

  t.deepEqual(JSON.parse(output.content), {
    "type": "root",
    "attributes": {},
    "children": [
      [
        [
          {
            "type": "id",
            "attributes": {},
            "children": [
              "978-0641723445"
            ]
          },
          {
            "type": "cat",
            "attributes": {},
            "children": [
              [
                "book",
                "hardcover"
              ]
            ]
          },
          {
            "type": "name",
            "attributes": {},
            "children": [
              "The Lightning Thief"
            ]
          },
          {
            "type": "author",
            "attributes": {},
            "children": [
              "Rick Riordan"
            ]
          },
          {
            "type": "series_t",
            "attributes": {},
            "children": [
              "Percy Jackson and the Olympians"
            ]
          },
          {
            "type": "sequence_i",
            "attributes": {},
            "children": [
              1
            ]
          },
          {
            "type": "genre_s",
            "attributes": {},
            "children": [
              "fantasy"
            ]
          },
          {
            "type": "inStock",
            "attributes": {},
            "children": [
              true
            ]
          },
          {
            "type": "price",
            "attributes": {},
            "children": [
              12.5
            ]
          },
          {
            "type": "pages_i",
            "attributes": {},
            "children": [
              384
            ]
          }
        ],
        [
          {
            "type": "id",
            "attributes": {},
            "children": [
              "978-1423103349"
            ]
          },
          {
            "type": "cat",
            "attributes": {},
            "children": [
              [
                "book",
                "paperback"
              ]
            ]
          },
          {
            "type": "name",
            "attributes": {},
            "children": [
              "The Sea of Monsters"
            ]
          },
          {
            "type": "author",
            "attributes": {},
            "children": [
              "Rick Riordan"
            ]
          },
          {
            "type": "series_t",
            "attributes": {},
            "children": [
              "Percy Jackson and the Olympians"
            ]
          },
          {
            "type": "sequence_i",
            "attributes": {},
            "children": [
              2
            ]
          },
          {
            "type": "genre_s",
            "attributes": {},
            "children": [
              "fantasy"
            ]
          },
          {
            "type": "inStock",
            "attributes": {},
            "children": [
              true
            ]
          },
          {
            "type": "price",
            "attributes": {},
            "children": [
              6.49
            ]
          },
          {
            "type": "pages_i",
            "attributes": {},
            "children": [
              304
            ]
          }
        ]
      ]
    ]
  });
});
