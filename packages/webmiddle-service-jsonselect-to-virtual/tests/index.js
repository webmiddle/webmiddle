import test from 'ava';
import JSONSelectToVirtual, { helpers } from '../src/index.js';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

const { elGet, elJoin, elMap, elPipe } = helpers;

const jsonResource = {
  name: 'jsonResource',
  contentType: 'application/json',
  content:
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
  ,
};

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('must throw if neither fullConversion and children are specified', async t => {
  await t.throws(evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    />
  ));
});

test('must return a virtual resource', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
      fullConversion
    />
  );

  t.is(output.name, 'virtual', 'name');
  t.is(output.contentType, 'application/x-webmiddle-virtual', 'contentType');
});

test('fullconversion', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
      fullConversion
    />
  );

  t.deepEqual(output.content, {
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

test('elGet', async t => {
  const resource = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    >
      <firstName el=".name">{elGet()}</firstName>
    </JSONSelectToVirtual>
  );

  t.deepEqual(resource.content, {
    type: "root",
    attributes: {},
    children: [
      {
        type: "firstName",
        attributes: {},
        children: [
          "The Lightning Thief",
        ],
      },
    ],
  });
});


test('elGet: selector', async t => {
  const resource = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    >
      <firstName>{elGet('.name')}</firstName>
    </JSONSelectToVirtual>
  );

  t.deepEqual(resource.content, {
    type: "root",
    attributes: {},
    children: [
      {
        type: "firstName",
        attributes: {},
        children: [
          "The Lightning Thief",
        ],
      },
    ],
  });
});

/*
test('elGet: values', async t => {
  // TODO
});*/

test('elJoin', async t => {
  const resource = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    >
      <names el=".name">{elJoin(', ')}</names>
    </JSONSelectToVirtual>
  );

  t.deepEqual(resource.content, {
    type: "root",
    attributes: {},
    children: [
      {
        type: "names",
        attributes: {},
        children: [
          "The Lightning Thief, The Sea of Monsters",
        ],
      },
    ],
  });
});


test('elMap', async t => {
  const resource = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    >
      <names el=".name">
        {elMap(el =>
          <name>{el}</name>
        )}
      </names>
    </JSONSelectToVirtual>
  );

  t.deepEqual(resource.content, {
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
              children: [
                "The Lightning Thief"
              ]
            },
            {
              type: "name",
              attributes: {},
              children: [
                "The Sea of Monsters"
              ]
            }
          ]
        ],
      }
    ],
  });
});

test('elPipe', async t => {
  const resource = await evaluate(createContext(t.context.webmiddle),
    <JSONSelectToVirtual
      name="virtual"
      from={jsonResource}
    >
      <names el=".name">
        {elPipe([
          elJoin(', '),
          text => text.toUpperCase(),
        ])}
      </names>
    </JSONSelectToVirtual>
  );

  t.deepEqual(resource.content, {
    type: "root",
    attributes: {},
    children: [
      {
        type: "names",
        attributes: {},
        children: [
          "THE LIGHTNING THIEF, THE SEA OF MONSTERS",
        ],
      },
    ],
  });
});
