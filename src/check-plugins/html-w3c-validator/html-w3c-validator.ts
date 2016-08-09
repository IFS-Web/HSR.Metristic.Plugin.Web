let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let Request = require('request');
let DetectCharacterEncoding = require('detect-character-encoding');

import {Check} from "../../domain/model/check";
import {Report} from "../../domain/model/report";
import {HtmlReport} from "../../domain/model/html-report";


export class HtmlW3cValidator implements Check {
	private reportTemplate: string;

	constructor(private options: { [name: string]: any }) {
		this.reportTemplate = FS.readFileSync(Path.join(__dirname,'./templates/reportTemplate.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report) => {}): void {
		let reportTemplate = this.reportTemplate;
		Glob(Path.join(directory,"**/*.html"), null, function (error, filePaths) {
			let waitingForFiles: number = filePaths.length;
			let reports: { fileName: string, messages: any[] }[] = [];

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let charset: string = DetectCharacterEncoding(fileData).encoding.toLowerCase();
					Request({
						url: "https://validator.w3.org/nu/?out=json",
						method: "POST",
						headers: {
							"content-type": "text/html",
							"charset": charset
						},
						body: fileData.toString()
					}, function (error, response, body){
						let report = JSON.parse(body);
						if(report.messages.length > 0) {
							reports.push({
								fileName: filePath.replace(directory, ''),
								messages: report.messages
							});
						}
						waitingForFiles--;
						if(waitingForFiles == 0) {
							callback(new HtmlReport('W3C HTML Validation', reportTemplate, {}, { reports: reports }));
						}
					});
				});
			});
		});
	}
}