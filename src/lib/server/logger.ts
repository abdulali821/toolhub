export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = {
	requestId?: string;
	userId?: string;
	toolId?: string;
	err?: unknown;
	[key: string]: unknown;
};

export type Logger = {
	debug: (msg: string, fields?: LogFields) => void;
	info: (msg: string, fields?: LogFields) => void;
	warn: (msg: string, fields?: LogFields) => void;
	error: (msg: string, fields?: LogFields) => void;
	child: (fields: LogFields) => Logger;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40
};

function getMinLevel(): LogLevel {
	const value = typeof process !== 'undefined' ? process.env.LOG_LEVEL : undefined;
	if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
		return value;
	}
	return 'info';
}

function serializeError(err: unknown) {
	if (err instanceof Error) {
		return { name: err.name, message: err.message, stack: err.stack };
	}
	return { message: String(err) };
}

function write(level: LogLevel, msg: string, fields: LogFields = {}) {
	if (LEVEL_ORDER[level] < LEVEL_ORDER[getMinLevel()]) return;

	const { err, ...rest } = fields;
	const entry = {
		level,
		msg,
		time: new Date().toISOString(),
		...rest,
		...(err !== undefined ? { err: serializeError(err) } : {})
	};

	const line = JSON.stringify(entry);
	if (level === 'error') {
		console.error(line);
	} else if (level === 'warn') {
		console.warn(line);
	} else {
		console.log(line);
	}
}

export function createLogger(base: LogFields = {}): Logger {
	const log =
		(level: LogLevel) =>
		(msg: string, fields: LogFields = {}) =>
			write(level, msg, { ...base, ...fields });

	return {
		debug: log('debug'),
		info: log('info'),
		warn: log('warn'),
		error: log('error'),
		child: (fields) => createLogger({ ...base, ...fields })
	};
}
