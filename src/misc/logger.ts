import chalk from 'chalk';
import * as dateformat from 'dateformat';

export default class Logger {
	private domain: string;

	constructor(domain: string) {
		this.domain = domain;
	}

	public static log(level: string, message: string): void {
		const time = dateformat(new Date(), 'HH:MM:ss');
		console.log(`[${time} ${level}] ${message}`);
	}

	public static error(message: string): void {
		(new Logger('')).error(message);
	}

	public static warn(message: string): void {
		(new Logger('')).warn(message);
	}

	public static info(message: string): void {
		(new Logger('')).info(message);
	}

	public static succ(message: string): void {
		(new Logger('')).succ(message);
	}

	public log(level: string, message: string) {
		const domain = this.domain.length > 0 ? `[${this.domain}] ` : '';
		Logger.log(level, `${domain}${message}`);
	}

	public error(message: string): void {
		this.log(chalk.red.bold('ERROR'), chalk.red.bold(message));
	}

	public warn(message: string): void {
		this.log(chalk.yellow.bold('WARN'), chalk.yellow.bold(message));
	}

	public info(message: string): void {
		this.log(chalk.blue.bold('INFO'), message);
	}

	public succ(message: string): void {
		this.log(chalk.blue.bold('INFO'), chalk.green.bold(message));
	}
}
