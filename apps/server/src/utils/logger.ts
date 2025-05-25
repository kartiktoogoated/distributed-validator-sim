import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const info = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const error = (message: string, meta?: any) => {
  logger.error(message, meta);
};

export const warn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const debug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger; 