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
		Glob(Path.join(directory,"**/*.html"), null, (error, filePaths) => {
			let waitingForFiles: number = filePaths.length;
			let validations: { fileName: string, messages: any[] }[] = [];

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					this.validate(fileData, (validationMessages) => {
						if(validationMessages.length > 0) {
							validations.push({ fileName: filePath.replace(directory, ''), messages: validationMessages });
						}
						waitingForFiles--;
						if(waitingForFiles == 0) {
							callback(new HtmlReport('W3C HTML Validation', this.reportTemplate, {}, { reports: validations }));
						}
					});
				});
			});
		});
	}

	private validate(fileData, callback: (validationMessages: any[]) => void): void {
		let charset: string = DetectCharacterEncoding(fileData).encoding.toLowerCase();
		let requestConfiguration: any = {
			url: "https://validator.w3.org/nu/?out=json",
			method: "POST",
			headers: {
				"content-type": "text/html",
				"charset": charset
			},
			body: fileData.toString()
		};
		Request(requestConfiguration, (error, response, body) => {
			callback(JSON.parse(body).messages);
		});
	}
}