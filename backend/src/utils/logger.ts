type LogLevel = 'INFO' | 'WARN' | 'ERROR';

type LogPayload = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
};

const writeLog = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {})
  };

  const line = JSON.stringify(payload);

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  console.log(line);
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  writeLog('INFO', message, context);
};

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  writeLog('WARN', message, context);
};

export const logError = (message: string, error?: unknown, context?: Record<string, unknown>) => {
  writeLog('ERROR', message, {
    ...(context ?? {}),
    ...(error !== undefined ? { error: serializeError(error) } : {})
  });
};
