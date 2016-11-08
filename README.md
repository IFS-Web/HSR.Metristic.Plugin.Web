# HSR.Metristic.Plugin.Web
Metristic web check plugin (HTML, CSS, JavaScript).


## Lisence
![Apache License Version 2.0](https://www.apache.org/img/asf_logo.png)
[Apache License Version 2.0](./LICENSE)


## Releases / Production

⬇ Download on the [Release page](https://github.com/wasabideveloper/HSR.Metristic.Plugin.Web/releases)


## Installation

* Install [node.js](https://nodejs.org/en/)
* Extract archive
* Enter the extracted directory, e.g. `cd Metristic-1.0`.
* Run `npm install --production` to install the dependencies.


## Usage

Import the plugins in the project.js of your main project:
```javascript
"use strict";

var HtmlW3cValidator = require("metristic-plugin-web").HtmlW3cValidator;
var HtmlMetric = require("metristic-plugin-web").HtmlMetric;
var CssMetric = require("metristic-plugin-web").CssMetric;
var JsStyleCheck = require("metristic-plugin-web").JsStyleCheck;

module.exports = {
	...

	"webMetrics": {
		name: 'Web project metrics',
		description: 'Show metrics of HTML, CSS',
		checks: [StructureMetric, HtmlMetric, CssMetric],
		options: {}
	},
	"webCheck": {
		name: 'Web project checking',
		description: 'Validate HTML by W3C and check JS code style',
		checks: [StructureMetric, HtmlW3cValidator, JsStyleCheck],
		options: {}
	},
	...
};
```


## Development / build the project from source

See [HSR.Metristic documentation: development](https://github.com/wasabideveloper/HSR.Metristic#development)


### Commands

Deploy app to directory `app`:
```shell
npm run gulp deploy
# or
npm deploy
```

Compile TS and run tests:
```shell
npm run gulp test
# or
npm test
```
