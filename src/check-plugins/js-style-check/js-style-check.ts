let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let JsHint = require('jshint').JSHINT;

import {Check} from "../../domain/model/check";
import {Report} from "../../domain/model/report";
import {HtmlReport} from "../../domain/model/html-report";


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
		unused: true
	};

	constructor(private options:{ [name: string]: any }) {
		if(options['JsStyleCheck']) {
			Object.keys(options['JsStyleCheck']).forEach((key) => {
				this.configuration[key] = options['JsStyleCheck'][key];
			});
		}
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
	}

	public execute(directory:string, callback:(report:Report) => {}):void {
		Glob(Path.join(directory,"**/*.js"), null, (error, filePaths) => {
			let waitingForFiles: number = filePaths.length;
			let reports: Metric[] = [];
			let errors: string[] = [];

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let fileName = filePath.replace(directory, '');

					if(fileError) {
						errors.push(`Could not read ${fileName}!`);
					} else {
						JsHint(fileData.toString(), this.configuration);
						reports.push({ fileName: fileName, report: JsHint.data() });
					}

					waitingForFiles--;
					if(waitingForFiles == 0) {
						callback(new HtmlReport('JS Hint Check', this.reportTemplate, {}, { reports: reports, errors: errors }));
					}
				});
			});
		});
	}
}