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
	private errors: Error[] = [];

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
		this.partials = {}
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => {}): void {
		Glob(Path.join(directory,"**/*.css"), null, (error, filePaths) => {
			if(error) {
				this.errors.push(error);
			}
			let metrics: Metric[] = [];
			let barrier: Barrier = new Barrier(filePaths.length).then(() => {
				let report: Report = new HtmlReport(
					'CSS metrics',
					this.reportTemplate,
					this.partials,
					{ reports: metrics }
				);
				callback(report, this.errors);
			});

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let relativeFilePath: string = filePath.replace(directory, '');
					if(fileError || !fileData) {
						this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
					} else {
						let ast = CssParser.parse(fileData.toString());
						metrics.push({
							fileName: relativeFilePath,
							ast: ast
						});
						barrier.finishedTask(filePath);
					}
				});
			});

			if(filePaths.length == 0) {
				callback(null);
			}
		});
	}
}