let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let Request = require('request');
let DetectCharacterEncoding = require('detect-character-encoding');

import {Barrier} from "../../domain/model/barrier";
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
			let validations: { fileName: string, messages: any[] }[] = [];
			let barrier: Barrier = new Barrier(filePaths.length).then(() => {
				let templateData = {
					reports: validations,
					statistics: {
						totalCheckedFiles: filePaths.length,
						numberOfFiles: validations.length,
						numberOfMessages: validations.reduce((messages, fileValidations, index) => {
							return messages + fileValidations.messages.length;
						}, 0)
					}
				};
				let report: Report = new HtmlReport(
						'W3C HTML Validation',
						this.reportTemplate,
						{},
						templateData
				);
				callback(report);
			});

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					this.validate(fileData, (validationMessages) => {
						if(fileData && validationMessages && validationMessages.length > 0) {
							validations.push({ fileName: filePath.replace(directory, ''), messages: validationMessages });
						}
						barrier.finishedTask();
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
				"User-Agent": "Node.js",
				"content-type": "text/html",
				"charset": charset
			},
			body: fileData.toString()
		};
		Request(requestConfiguration, (error, response, body) => {
			if (!error && response.statusCode == 200) {
				try {
					let responseObject = JSON.parse(body);
					callback(responseObject.messages);
				} catch (error) {
					callback([]);
				}
			} else {
				// TODO: return error, handle and return to uploadcontroller
				callback([]);
			}
		});
	}
}