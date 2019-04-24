let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let JsHint = require('jshint').JSHINT;

import {Barrier} from "metristic-core";
import {Check} from "metristic-core";
import {Report} from "metristic-core";
import {HtmlReport} from "metristic-core";


interface Metric {
	fileName: string,
	report: any
}


/**
 * JS Style check (JSHint)
 *
 * options example:
 * 	JsStyleCheck: {
 *		maxstatements: 5
 * 	}
 */
export class JsStyleCheck implements Check {
	private reportTemplate: string;
	private configuration: {[name:string]: any} = {
		curly: true,
		freeze: true,
		funcscope: true,
		latedef: true,
		maxstatements: 25,
		nonew: true,
		notypeof: true,
		shadow: true,
		strict: true,
		unused: true,
		esversion:6,
		globals: {  "console": true }
	};
	private errors: Error[] = [];

	constructor(private options:{ [name: string]: any }) {
		if (options['JsStyleCheck']) {
			Object.keys(options['JsStyleCheck']).forEach((key) => {
				this.configuration[key] = options['JsStyleCheck'][key];
			});
		}
		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/reportTemplate.html'), "utf8");
	}

	public execute(directory:string, callback:(report:Report, errors?: Error[]) => void):void {
		Glob(Path.join(directory, "**/*.js"), null, (error, filePaths) => {
			if (error) {
				this.errors.push(error);
			}
			let reports: Metric[] = [];
			let barrier: Barrier = new Barrier(filePaths.length).then(() => {
				let report: Report = new HtmlReport(
					'JS Hint Check',
					this.reportTemplate,
					{},
					{ reports: reports }
				);
				callback(report, this.errors);
			});

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let relativeFilePath: string = filePath.replace(directory, '');
					if (fileError || !fileData) {
						this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
					} else {
						JsHint(fileData.toString(), this.configuration);
						reports.push({ fileName: relativeFilePath, report: JsHint.data() });
					}
					barrier.finishedTask(filePath);
				});
			});

			if (filePaths.length == 0) {
				callback(null);
			}
		});
	}
}
