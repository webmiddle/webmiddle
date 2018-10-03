# webmiddle-manager-cookie

> Wrapper on top of the **[tough-cookie](https://github.com/salesforce/tough-cookie)** library, acts as a
cookie jar.

## Install

```bash
npm install --save webmiddle-manager-cookie
```

## How it works

Differently from most of the other core packages, this isn't a webmiddle component.

It is a wrapper on top of the **[tough-cookie](https://github.com/salesforce/tough-cookie)** library and it acts as a
cookie jar.

It is **shared** among all the contexts extending `rootContext` and by `rootContext` itself,
and can be used by components such as HttpRequest and Browser to store and retrieve cookies.

This package makes sure that cookies can be preserved and shared when
evaluating different components.

## Properties

Name                   | Description
-----------------------|------------------------------------------------------
jar                    | The cookie jar from the **[tough-cookie](https://github.com/salesforce/tough-cookie)** library. Cookies are read in “loose mode” so that the system won’t fail in case of cookies that don’t strictly adhere to the cookie specification.

## Static properties

Name                   | Description
-----------------------|------------------------------------------------------
Cookie                 | A class representing a cookie, it is taken directly from the tough-cookie library. Useful for creating and parsing cookies.
