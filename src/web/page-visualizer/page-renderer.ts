var Webpage = require('webpage');
var System = require('system');

// phantom typings redeclare 'require' -> not usable
declare var phantom: any;


var url: string = System.args[1] || null;
var imagePath: string = System.args[2] ||  './temp/phantom/'+ Math.floor((Math.random() * 1000000000) + 1) + '.png';
var pageSize: number = System.args[3] || 1024;

if(url && url.length > 0) {
	var page = Webpage.create();
	page.viewportSize = { width: pageSize, height: 100 };

	if(url[1] == ":") {
		url = "file:///" + url;
	}
	page.open(url, function(status) {
		page.render(imagePath);
		phantom.exit();
	});
} else {
	phantom.exit(1);
}
