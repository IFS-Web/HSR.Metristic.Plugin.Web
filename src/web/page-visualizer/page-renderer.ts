let Webpage = require('webpage');
let System = require('system');

// phantom typings redeclare 'require' -> not usable
declare let phantom: any;


let url: string = System.args[1] || null;
let imagePath: string = System.args[2] || '/tmp/phantom/'+ Math.floor((Math.random() * 1000000000) + 1) + '.png';
let pageSize: number = System.args[3] || 1024;

if(url && url.length > 0) {
	let page = Webpage.create();
	page.viewportSize = { width: pageSize, height: 100 };

	page.open(url, function(status) {
		page.render(imagePath);
		phantom.exit();
	});
} else {
	phantom.exit(1);
}
