<<<<<<< HEAD
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';  // Caminho relativo
import { Handler, Callback, Context } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'aws-serverless-express';
import express from 'express'; // Importação do Express

let cachedServer: any;  // Variável para armazenar o servidor (usando 'any' para evitar erro de tipos)

async function bootstrapServer(): Promise<any> {  // Função assíncrona que inicializa o servidor
  try {
    console.log('Inicializando o servidor....');
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);  // Adaptador NestJS para o Express
    const app = await NestFactory.create(AppModule, adapter); // Criação do app NestJS com Express
    app.enableCors();  // Habilitar CORS
    await app.init();  // Inicialização do app NestJS..

    console.log('Servidor inicializado com sucesso!');
    return serverless.createServer(expressApp);  // Criar o servidor serverless para AWS Lambda
  } catch (error) {
    console.error('Erro ao inicializar o servidor:', error);
    throw error;  // Lançar erro para que o handler possa lidar com isso
  }
}

// Exportando o handler para a AWS Lambda, responsável por manipular as requisições
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  try {
    if (!cachedServer) {
      console.log('Servidor não encontrado em cache, inicializando...');
      cachedServer = await bootstrapServer();  // Inicializa o servidor se não estiver em cache
    } else {
      console.log('Servidor encontrado em cache, reutilizando...');
    }

    // Retorna a resposta do servidor em formato promisso
    console.log('Processando a requisição...');
    return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    callback(error);  // Passa o erro para o callback para que a Lambda possa processar..
  }
};
=======
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';  // Caminho relativo
import { Handler, Callback, Context } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'aws-serverless-express';
import express from 'express'; // Importação do Express

let cachedServer: any;  // Variável para armazenar o servidor (usando 'any' para evitar erro de tipos)

async function bootstrapServer(): Promise<any> {  // Função assíncrona que inicializa o servidor
  try {
    console.log('Inicializando o servidor...');
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);  // Adaptador NestJS para o Express
    const app = await NestFactory.create(AppModule, adapter); // Criação do app NestJS com Express
    app.enableCors();  // Habilitar CORS
    await app.init();  // Inicialização do app NestJS.

    console.log('Servidor inicializado com sucesso!');
    return serverless.createServer(expressApp);  // Criar o servidor serverless para AWS Lambda
  } catch (error) {
    console.error('Erro ao inicializar o servidor:', error);
    throw error;  // Lançar erro para que o handler possa lidar com isso
  }
}

// Exportando o handler para a AWS Lambda, responsável por manipular as requisições
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  try {
    if (!cachedServer) {
      console.log('Servidor não encontrado em cache, inicializando...');
      cachedServer = await bootstrapServer();  // Inicializa o servidor se não estiver em cache
    } else {
      console.log('Servidor encontrado em cache, reutilizando...');
    }

    // Retorna a resposta do servidor em formato promisso
    console.log('Processando a requisição...');
    return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    callback(error);  // Passa o erro para o callback para que a Lambda possa processar..
  }
};
>>>>>>> 5bd87ddc6102c11e5c62fb22f6f92a411637e9ed
