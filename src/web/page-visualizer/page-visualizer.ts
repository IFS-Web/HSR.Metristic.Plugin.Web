let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let os = require("os");
var ChildProcess = require('child_process');
var PhantomJS = require('phantomjs-prebuilt');


import {Barrier} from "metristic-core";
import {Check} from "metristic-core";
import {Report} from "metristic-core";
import {HtmlReport} from "metristic-core";


/**
 * Page visualizer (Phantom JS)
 *
 * options example:
 * 	PageVisualizer: {
 *		filePatterns: ['** /test.html', '** /SpecRunner.html'],
 *		pageSize: [320, 960, 1216] // or pageSize: 1152
 * 	}
 */
export class PageVisualizer implements Check {
	static assetsDirectory: string = `${os.tmpdir()}/phantomCaptures/`;

	private reportTemplate: string;
	private errors: Error[] = [];
	private options:{ [name: string]: any };

	constructor(options:{ [name: string]: any }) {
		this.options = options['PageVisualizer'];
		this.options['filePatterns'] = this.options['filePatterns'] || ['**/test.html', '**/SpecRunner.html'];
		this.options['pageSize'] = this.options['pageSize'] || 1152;

		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/reportTemplate.html'), "utf8");
	}

	private cleanup(): void {
		FS.readdirSync(PageVisualizer.assetsDirectory).forEach((file) => {
			FS.unlinkSync(Path.join(PageVisualizer.assetsDirectory, file));
		});
	}

	public execute(directory:string, callback:(report:Report, errors?: Error[]) => void):void {
		this.cleanup();
		let screenshots: { [name: string]: { pageSize:string, image: string}[] } = {};
		let awaiter: Barrier = new Barrier(this.options['filePatterns'].length).then(() => {
			if(Object.keys(screenshots).length > 0) {
				let report: Report = new HtmlReport(
					'Page visualizations',
					this.reportTemplate,
					{},
					{ screenshots: screenshots }
				);
				callback(report, this.errors);
			} else {
				callback(null);
			}
		});

		if (this.options['filePatterns'].length == 0) {
			callback(null);
		} else {
			this.findAndRenderPages(directory, screenshots, awaiter);
		}
	}

	private findAndRenderPages(directory: string, screenshots: { [name: string]: { pageSize:string, image: string}[] }, awaiter: Barrier): void {
		this.options['filePatterns'].forEach((filePattern) => {
			Glob(Path.join(directory, filePattern), null, (error, filePaths) => {
				awaiter.expand(filePaths.length);
				if (error) {
					this.errors.push(error);
				}

				filePaths.forEach((filePath) => {
					if(Number.isInteger(this.options[ 'pageSize' ])) {
						this.renderScreenshot(filePath, screenshots, directory, this.options[ 'pageSize' ], awaiter);
					} else if(Array.isArray(this.options[ 'pageSize' ])) {
						awaiter.expand(this.options[ 'pageSize' ].length);
						this.options[ 'pageSize' ].forEach((pageSize) => {
							this.renderScreenshot(filePath, screenshots, directory, pageSize, awaiter);
						});
						awaiter.finishedTask(filePath);
					} else {
						awaiter.finishedTask(filePath);
					}
				});

				awaiter.finishedTask(filePattern);
			});
		});
	}

	private renderScreenshot(filePath, screenshots: { [name: string]: { pageSize:string, image: string}[] }, directory:string, pageSize, awaiter:Barrier) {
		let imageName:string = `screenshot-${ Date.now() }-${ Math.floor((Math.random() * 1000000) + 1)}.png`;

		let phantomArgs = [
			Path.join(__dirname, 'page-renderer.js'),
			filePath,
			Path.join(PageVisualizer.assetsDirectory, imageName),
			pageSize
		];
		ChildProcess.execFile(PhantomJS.path, phantomArgs, (error, stdout, stderr) => {
			if (error || stderr) {
				this.errors.push(error);
				this.errors.push(stderr);
				console.error(error, stderr);
			} else {
				let relativeFilePath = filePath.replace(directory, '');
				if(!screenshots[relativeFilePath]) {
					screenshots[relativeFilePath] = [];
				}
				screenshots[relativeFilePath].push({
					pageSize: pageSize,
					image: imageName
				});
			}
			awaiter.finishedTask(filePath+pageSize);
		});
	}
}
