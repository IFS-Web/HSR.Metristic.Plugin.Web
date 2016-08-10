let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let Htmlparser = require("htmlparser");

import {Check} from "../../domain/model/check";
import {Report} from "../../domain/model/report";
import {HtmlReport} from "../../domain/model/html-report";

interface Metric {
	fileName: string,
	elementUsage: { name: string, count: number }[],
	dom: any
}

export class HtmlMetric implements Check {
	private reportTemplate: string;

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report) => {}): void {
		Glob(Path.join(directory,"**/*.html"), null, (error, filePaths) => {
			let waitingForFiles: number = filePaths.length;
			let metrics: Metric[] = [];

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let configuration: {[name:string]:any} = {
						verbose: false,
						ignoreWhitespace: true
					};
					let handler = new Htmlparser.DefaultHandler((error, dom) => {
						if (error) {
							// TODO handle errors
						} else {
							let elementUsage = {};
							dom.forEach((domElement) => {
								HtmlMetric.walkDOM(elementUsage, domElement)
							});

							metrics.push({
								fileName: filePath.replace(directory, ''),
								elementUsage: (Object.keys(elementUsage).map(
										(name) => { return { name: name, count: elementUsage[name] } })
									)
									.sort((a,b) => (a.name < b.name) ? -1 : 1),
								dom: dom
							});

							waitingForFiles--;
							if(waitingForFiles == 0) {
								callback(new HtmlReport('W3C HTML Validation', this.reportTemplate, {}, { reports: metrics }));
							}
						}
					}, configuration);
					let parser = new Htmlparser.Parser(handler);
					parser.parseComplete(fileData.toString());
				});
			});
		});
	}

	protected static walkDOM(metrics, domElement) {
		if(domElement.type === 'tag') {
			if(metrics[domElement.name]) {
				metrics[domElement.name]++;
			} else {
				metrics[domElement.name] = 1;
			}
		}
		if(domElement.children) {
			domElement.children.forEach((childDomElement) => {
				HtmlMetric.walkDOM(metrics, childDomElement);
			});
		}
	}
}