# webmiddle-service-jsonselect-to-json 

> Service that converts a resource, whose content is parsed by the
[JSONSelect](https://github.com/lloyd/JSONSelect) library, to a JSON resource with the given schema.

## Install

```bash
npm install --save webmiddle-service-jsonselect-to-json
```

## How it works

It just pipes the resource through the respective [to virtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-jsonselect-to-virtual) and [from virtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-virtual-to-json) services.

## Properties


Name                       | Description
---------------------------|------------------------------------------------------
name                       | The name of the returned resource.
from                       | The JSON resource to convert.
fullConversion (optional)  | Set this to true to do a 1:1 conversion, without having to specify a schema.
children                   | The schema for the [JSONSelectToVirtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-jsonselect-to-virtual) conversion.
