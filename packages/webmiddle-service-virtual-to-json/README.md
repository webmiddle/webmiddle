# webmiddle-service-virtual-to-json 

> Converts a virtual resource into a JSON resource.

## Install

```bash
npm install --save webmiddle-service-virtual-to-json
```

## Usage

```jsx
import WebMiddle, { PropTypes } from 'webmiddle';
import VirtualToJson from 'webmiddle-service-virtual-to-json';

const virtual = { /*...*/ }; // given an existing virtual resource

const MyService = () => (
  <VirtualToJson
    name="result"
    from={virtual}
  />
);

const webmiddle = new WebMiddle();
webmiddle.evaluate(<MyService />)
.then(resource => {
  console.log(resource.contentType); // "application/json"
});
```

## How it works

Coverts a virtual, which is an object with the following format:

```javascript
{ type : String, attributes : [attr1, attr2, … , attrN ], children }
```

Into the following JSON object:

```javascript
{
  [type]: {
    …convertedAttributes,
    …convertedChildren,
  }
}
```

Namely, an object containing a **single property** which is the value of
the virtual type property.

The property value is an object obtained by converting the virtual
attributes and the virtual children into objects, called
**convertedAttributes** and **convertedChildren**, respectively.

**convertedAttributes** is defined as follows:

```javascript
{   
  '@attribute#0': attr1,
  '@attribute#1': attr2,
  …,
  '@attribute#N-1': attrN,
}
```

Every child can be either **plain data**, such as a string or array, or
another **virtual**.

Note that data and virtual can **alternate** in any order, e.g. the
first two children might be a virtual, the third data, the fourth
another virtual and so on.

**convertedChildren** is thus obtained by processing each child:

-   **If it’s a data**, then it is converted into a **“@data\#i”**
    property, whose value is the result of processing recursively the
    data.<br />
    Here, the **i** variable refers solely to data children, meaning
    that it is increased only after processing a data, while it is kept
    intact when processing a virtual, thus it is the index of the
    current data.

-   **If it’s a virtual** `{ type: childVirtualType, … }`, then it is
    converted into the **childVirtualType** property, whose value is the
    result of processing recursively the virtual.<br />
    From what we have previously seen, converting a virtual generates an
    object with its type as the only property, i.e. in this case:<br />

    ```javascript
    [childVirtualType]: {
      [childVirtualType]: {
        …(child virtual attributes and children)
      }
    }
    ```

    Since this is unnecessarily redundant, we **simplify** such object
    by removing the duplicate nested property, obtaining the following:

    ```javascript
    [childVirtualType]: {
      …(child virtual attributes and children)
    }
    ```

    Moreover, note that the children array can contain multiple virtual
    children with the **same type**. In such a case, we would end up
    adding the same property twice to our convertedChildren, with the
    latter children overwriting the previous ones.<br />
    The system keeps track of this, detecting which types have been
    used; when it detects a duplicate type, it converts all the
    **previous, current and future** virtuals with such type into
    **data**.<br />
    Suppose that there are two children with the “article” type. Then
    such children are converted into the following:

    ```javascript
    "@data#dataCount": {
      "article": {
        …(child virtual attributes and children)
      }
    }
    ```

## Properties

Name                       | Description
---------------------------|------------------------------------------------------
name                       | The name of the returned resource.
from                       | The virtual resource to convert.
