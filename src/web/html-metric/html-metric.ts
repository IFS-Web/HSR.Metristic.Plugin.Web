let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let Htmlparser = require("htmlparser");

import {Barrier} from "metristic-core";
import {Check} from "metristic-core";
import {Report} from "metristic-core";
import {HtmlReport} from "metristic-core";

interface Metric {
	fileName: string,
	elementUsage: { name: string, count: number }[],
	dom: any
}

export class HtmlMetric implements Check {
	static assetsDirectory: string = Path.join(__dirname, './assets');
	static styleSheetFiles: string[] = ['/styles/styles.css'];
	
	private reportTemplate: string;
	private partials: {[name:string]:string};
	private errors: Error[] = [];

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/reportTemplate.html'), "utf8");
		this.partials = {
			domPartial: FS.readFileSync(Path.join(__dirname, './templates/domPartial.html'), "utf8")
		};
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => void): void {
		Glob(Path.join(directory, "**/*.html"), null, (error, filePaths) => {
			if (error) {
				this.errors.push(error);
			}
			let metrics: Metric[] = [];
			let barrier: Barrier = new Barrier(filePaths.length).then(() => {
				let report: Report = new HtmlReport(
					'HTML metrics',
					this.reportTemplate,
					this.partials,
					{ reports: metrics }
				);
				callback(report, this.errors);
			});

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let relativeFilePath: string = filePath.replace(directory, '');
					if (fileError || !fileData) {
						this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
					} else {
						let configuration:{[name:string]:any} = {
							verbose: false,
							ignoreWhitespace: true
						};
						let handler = new Htmlparser.DefaultHandler((parseError, dom) => {
							if (parseError) {
								this.errors.push(parseError);
							} else {
								let elementUsage = {};
								dom.forEach((domElement) => {
									HtmlMetric.walkDOM(elementUsage, domElement);
								});

								metrics.push({
									fileName: relativeFilePath,
									elementUsage: (Object.keys(elementUsage).map(
													(name) => {
														return { name: name, count: elementUsage[ name ] };
													})
									)
											.sort((a, b) => (a.name < b.name) ? -1 : 1),
									dom: dom
								});
								barrier.finishedTask(filePath);
							}
						}, configuration);
						let parser = new Htmlparser.Parser(handler);
						parser.parseComplete(fileData.toString());
					}
				});
			});

			if (filePaths.length == 0) {
				callback(null);
			}
		});
	}

	protected static walkDOM(metrics, domElement) {
		if (domElement.type === 'tag') {
			if (metrics[domElement.name]) {
				metrics[domElement.name]++;
			} else {
				metrics[domElement.name] = 1;
			}
		}
		if (domElement.children) {
			domElement.children.forEach((childDomElement) => {
				HtmlMetric.walkDOM(metrics, childDomElement);
			});
		}
	}
}
