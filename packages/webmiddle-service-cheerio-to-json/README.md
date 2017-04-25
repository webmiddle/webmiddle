# webmiddle-service-cheerio-to-json 

> Service that converts a resource, whose content is parsed by the
[Cheerio](https://github.com/cheeriojs/cheerio) library (a NodeJS implementation of jQuery), to a JSON resource with the given schema.

## Install

```bash
npm install --save webmiddle-service-cheerio-to-json
```

## How it works

It just pipes the resource through the respective [to virtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-cheerio-to-virtual) and [from virtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-virtual-to-json) services.

## Properties


Name                       | Description
---------------------------|------------------------------------------------------
name                       | The name of the returned resource.
from                       | The HTML/XML resource to convert.
fullConversion (optional)  | Set this to true to do a 1:1 conversion, without having to specify a schema.
children                   | The schema for the [CheerioToVirtual](https://github.com/webmiddle/webmiddle/tree/master/packages/webmiddle-service-cheerio-to-virtual) conversion.
