import { searchNpmPackage } from "./tools";
import * as readline from "readline";

// Função para buscar informações do pacote
async function searchNpmPackageCLI(packageName: string): Promise<void> {
	try {
		console.log(`\nBuscando informações para o pacote: ${packageName}`);
		const result = await searchNpmPackage(packageName);

		console.log("\nInformações do pacote:");
		console.log("-------------------");
		Object.entries(result).forEach(([key, value]) => {
			if (key === "dependencies") {
				console.log("\nDependências:");
				console.log(JSON.stringify(value, null, 2));
			} else {
				console.log(`${key}: ${value}`);
			}
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
		console.log(`\nErro ao buscar informações do pacote: ${errorMessage}`);
	}
}

// Criar interface de linha de comando
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Função principal para interação com o usuário
function startCLI() {
	console.log("\nBem-vindo ao NPM Package Info!");
	console.log('Digite o nome do pacote para buscar informações ou "sair" para encerrar\n');

	function askPackage() {
		rl.question("Nome do pacote: ", async (input) => {
			if (input.toLowerCase() === "sair") {
				console.log("\nAté logo!");
				rl.close();
				process.exit(0);
			}

			await searchNpmPackageCLI(input);
			console.log("\n-------------------");
			askPackage();
		});
	}

	askPackage();
}

// Iniciar o programa
startCLI();
