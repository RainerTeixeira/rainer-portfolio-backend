import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

class log {
    private logFilePath: string;
    private cloudWatchLogs: AWS.CloudWatchLogs;
    private logGroupName: string;
    private logStreamName: string;

    constructor(logFileName: string = 'application.log') {
        this.logFilePath = path.join(__dirname, logFileName);

        // Configuração do CloudWatch Logs
        this.cloudWatchLogs = new AWS.CloudWatchLogs({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP || 'ApplicationLogs';
        this.logStreamName = `${process.env.CLOUDWATCH_LOG_STREAM || 'DefaultStream'}-${new Date().toISOString()}`;

        this.createLogGroupAndStream();
    }

    private async createLogGroupAndStream(): Promise<void> {
        try {
            // Cria o grupo de logs se não existir
            await this.cloudWatchLogs.createLogGroup({ logGroupName: this.logGroupName }).promise();
        } catch (err: any) {
            if (err.code !== 'ResourceAlreadyExistsException') {
                console.error(`[log ERROR]: Falha ao criar log group - ${err.message}`);
            }
        }

        try {
            // Cria o stream de logs
            await this.cloudWatchLogs.createLogStream({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
            }).promise();
        } catch (err: any) {
            console.error(`[log ERROR]: Falha ao criar log stream - ${err.message}`);
        }
    }

    private async writeToCloudWatch(level: string, message: string): Promise<void> {
        const timestamp = Date.now();
        const logMessage = `[${new Date(timestamp).toISOString()}] [${level.toUpperCase()}]: ${message}`;

        try {
            const params = {
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [
                    {
                        timestamp,
                        message: logMessage,
                    },
                ],
            };

            await this.cloudWatchLogs.putLogEvents(params).promise();
        } catch (err: any) {
            console.error(`[log ERROR]: Falha ao enviar log para CloudWatch - ${err.message}`);
        }
    }

    private writeLog(level: string, message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;

        // Escreve no console
        console[level](logMessage);

        // Escreve no arquivo
        fs.appendFile(this.logFilePath, logMessage, (err) => {
            if (err) {
                console.error(`[log ERROR]: Falha ao escrever no arquivo de log - ${err.message}`);
            }
        });

        // Envia para o CloudWatch Logs
        this.writeToCloudWatch(level, message).catch((err) => {
            console.error(`[log ERROR]: Falha ao enviar log para CloudWatch - ${err.message}`);
        });
    }

    info(message: string): void {
        this.writeLog('info', message);
    }

    warn(message: string): void {
        this.writeLog('warn', message);
    }

    error(message: string): void {
        this.writeLog('error', message);
    }

    debug(message: string): void {
        this.writeLog('debug', message);
    }
}

export const log = new log();
