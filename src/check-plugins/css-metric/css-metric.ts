let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let CssParser = require("css");

import {Barrier} from "../../domain/model/barrier";
import {Check} from "../../domain/model/check";
import {Report} from "../../domain/model/report";
import {HtmlReport} from "../../domain/model/html-report";


interface Metric {
	fileName: string,
	ast: any
}

export class CssMetric implements Check {
	private reportTemplate: string;
	private partials: {[name:string]:string};

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
		this.partials = {}
	}

	public execute(directory: string, callback: (report: Report) => {}): void {
		Glob(Path.join(directory,"**/*.css"), null, (error, filePaths) => {
			let barrier: Barrier = new Barrier(filePaths.length).then(() => {
				let report: Report = new HtmlReport(
					'CSS metrics',
					this.reportTemplate,
					this.partials,
					{ reports: metrics }
				);
				callback(report);
			});
			let metrics: Metric[] = [];

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let ast = CssParser.parse(fileData.toString());
					metrics.push({
						fileName: filePath.replace(directory, ''),
						ast: ast
					});
					barrier.finishedTask();
				});
			});
			// TODO: handle 0 files case
			if(filePaths.length == 0) {
				callback(null);
			}
		});
	}
}