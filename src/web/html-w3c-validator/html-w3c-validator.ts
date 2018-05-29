let Path = require('path');
let FS = require('fs');
let Glob = require("glob");
let Request = require('request');
let Domain = require('domain');

import {Barrier} from "metristic-core";
import {Check} from "metristic-core";
import {Report} from "metristic-core";
import {HtmlReport} from "metristic-core";


/**
 * W3C Validator check
 *
 * Uses the W3C validator api to check all *.html files
 **/
export class HtmlW3cValidator implements Check {
	private errors: Error[] = [];
	private reportTemplate: string;
	private options: { [name: string]: any };

	/**
	 * @options available params:
	 * 	{
	 * 		HtmlW3cValidator: {
	 * 			connectionTimeout: 10000, // ms
	 *			fileNamePattern: "**\/*.html"
	 * 		}
	 * 	}
	 **/
	constructor(options: { [name: string]: any }) {
		this.options = options['HtmlW3cValidator'];
		this.options['connectionTimeout'] = this.options['connectionTimeout'] || 10000;
		this.options['fileNamePattern'] = this.options['fileNamePattern'] || "**/*.html";

		this.reportTemplate = FS.readFileSync(Path.join(__dirname, './templates/reportTemplate.html'), "utf8");
	}

	public execute(directory: string, callback: (report: Report, errors?: Error[]) => void): void {
		Glob(Path.join(directory, this.options['fileNamePattern']), null, (error, filePaths) => {
			if (error) {
				this.errors.push(error);
			}
			let validations: { fileName: string, messages: any[] }[] = [];
			let awaiter: Barrier = new Barrier(filePaths.length).then(() => {
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
				callback(report, this.errors);
			});

			filePaths.forEach((filePath) => {
				FS.readFile(filePath, (fileError, fileData) => {
					let relativeFilePath: string = filePath.replace(directory, '');
					if (fileError || !fileData) {
						this.errors.push(new Error(`Could not read file ${relativeFilePath}. Error ${fileError.message}`));
					} else {
						this.validate(relativeFilePath, fileData, (validationMessages) => {
							if (validationMessages && validationMessages.length > 0) {
								validations.push({
									fileName: relativeFilePath,
									messages: validationMessages
								});
							}
							awaiter.finishedTask(filePath);
						});
					}
				});
			});

			if (filePaths.length == 0) {
				callback(null);
			}
		});
	}

	private validate(filePath: string, fileData, callback: (validationMessages: any[]) => void): void {
		let requestConfiguration: any = {
			url: "https://validator.w3.org/nu/?out=json",
			method: "POST",
			headers: {
				"User-Agent": "Node.js",
				"content-type": "text/html"
			},
			body: fileData.toString(),
			timeout: this.options['connectionTimeout']
		};

		let validationDomain = Domain.create();
		validationDomain.on('error', (error) => {
			this.errors.push(error);
		});

		Request(requestConfiguration, (error, response, body) => {
			let statusCode: number = (response) ? response.statusCode : null;
			if (!error && statusCode == 200 && body && body.length > 2) {
				let responseObject = JSON.parse(body);
				callback(responseObject.messages);
			} else {
				this.errors.push(new Error(`Ẁ3C validation of "${filePath}" failed. Status Code: "${statusCode}",` +
					` ${(error) ? error + "," : ""} Body: "${body}".`));
				callback(null);
			}
		});
	}
}
