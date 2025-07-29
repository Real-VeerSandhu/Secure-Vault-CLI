"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const clipboardy_1 = __importDefault(require("clipboardy"));
const vault_1 = require("./vault");
const generator_1 = require("./generator");
class CLI {
    constructor() {
        this.masterPassword = '';
        this.vault = new vault_1.Vault();
    }
    async start() {
        console.log(chalk_1.default.cyan.bold('🔐 SecureVault CLI'));
        console.log(chalk_1.default.gray('Your secure password manager\n'));
        await this.authenticate();
        await this.mainMenu();
    }
    async authenticate() {
        while (true) {
            const { password } = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'password',
                    message: 'Enter master password:',
                    mask: '*'
                }
            ]);
            if (await this.vault.unlock(password)) {
                this.masterPassword = password;
                console.log(chalk_1.default.green('✓ Vault unlocked successfully\n'));
                break;
            }
            else {
                console.log(chalk_1.default.red('✗ Invalid master password\n'));
            }
        }
    }
    async mainMenu() {
        while (true) {
            const { action } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        { name: '🔍 Search passwords', value: 'search' },
                        { name: '➕ Add new password', value: 'add' },
                        { name: '📝 List all passwords', value: 'list' },
                        { name: '🔧 Generate password', value: 'generate' },
                        { name: '🔍 Audit passwords', value: 'audit' },
                        { name: '🔒 Lock vault and exit', value: 'exit' }
                    ]
                }
            ]);
            try {
                switch (action) {
                    case 'search':
                        await this.searchPasswords();
                        break;
                    case 'add':
                        await this.addPassword();
                        break;
                    case 'list':
                        await this.listPasswords();
                        break;
                    case 'generate':
                        await this.generatePassword();
                        break;
                    case 'audit':
                        await this.auditPasswords();
                        break;
                    case 'exit':
                        await this.exit();
                        return;
                }
            }
            catch (error) {
                console.log(chalk_1.default.red('An error occurred:', error));
            }
            console.log(); // Add spacing
        }
    }
    async searchPasswords() {
        const { query } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'query',
                message: 'Search for site or username:'
            }
        ]);
        const results = this.vault.searchEntries(query);
        if (results.length === 0) {
            console.log(chalk_1.default.yellow('No passwords found matching your query.'));
            return;
        }
        await this.displayPasswordList(results);
    }
    async listPasswords() {
        const entries = this.vault.getAllEntries();
        if (entries.length === 0) {
            console.log(chalk_1.default.yellow('No passwords stored yet.'));
            return;
        }
        await this.displayPasswordList(entries);
    }
    async displayPasswordList(entries) {
        const choices = entries.map(entry => ({
            name: `${chalk_1.default.blue(entry.site)} - ${chalk_1.default.gray(entry.username)}`,
            value: entry.id
        }));
        choices.push({ name: chalk_1.default.gray('← Back to main menu'), value: 'back' });
        const { selectedId } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select a password:',
                choices
            }
        ]);
        if (selectedId === 'back')
            return;
        const entry = entries.find(e => e.id === selectedId);
        if (entry) {
            await this.viewPassword(entry);
        }
    }
    async viewPassword(entry) {
        console.log(chalk_1.default.cyan('\n📋 Password Details:'));
        console.log(`Site: ${chalk_1.default.bold(entry.site)}`);
        console.log(`Username: ${chalk_1.default.bold(entry.username)}`);
        console.log(`Password: ${chalk_1.default.yellow('•'.repeat(entry.password.length))} (hidden)`);
        if (entry.notes) {
            console.log(`Notes: ${entry.notes}`);
        }
        console.log(`Created: ${entry.createdAt.toLocaleDateString()}`);
        console.log(`Updated: ${entry.updatedAt.toLocaleDateString()}`);
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '📋 Copy password to clipboard', value: 'copy' },
                    { name: '👁️ Show password', value: 'show' },
                    { name: '✏️ Edit entry', value: 'edit' },
                    { name: '🗑️ Delete entry', value: 'delete' },
                    { name: '← Back', value: 'back' }
                ]
            }
        ]);
        switch (action) {
            case 'copy':
                await clipboardy_1.default.write(entry.password);
                console.log(chalk_1.default.green('✓ Password copied to clipboard!'));
                break;
            case 'show':
                console.log(chalk_1.default.yellow(`Password: ${entry.password}`));
                break;
            case 'edit':
                await this.editPassword(entry);
                break;
            case 'delete':
                await this.deletePassword(entry);
                break;
        }
    }
    async addPassword() {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'site',
                message: 'Site/Service name:',
                validate: (input) => input.trim() !== ''
            },
            {
                type: 'input',
                name: 'username',
                message: 'Username/Email:',
                validate: (input) => input.trim() !== ''
            },
            {
                type: 'list',
                name: 'passwordOption',
                message: 'Password option:',
                choices: [
                    { name: 'Enter manually', value: 'manual' },
                    { name: 'Generate new password', value: 'generate' }
                ]
            }
        ]);
        let password;
        if (answers.passwordOption === 'manual') {
            const { manualPassword } = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'manualPassword',
                    message: 'Enter password:',
                    mask: '*'
                }
            ]);
            password = manualPassword;
        }
        else {
            password = await this.generatePasswordInteractive();
        }
        const { notes } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'notes',
                message: 'Notes (optional):'
            }
        ]);
        const entry = this.vault.addEntry({
            site: answers.site,
            username: answers.username,
            password,
            notes: notes || undefined
        });
        console.log(chalk_1.default.green(`✓ Password for ${entry.site} added successfully!`));
    }
    async editPassword(entry) {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'site',
                message: 'Site/Service name:',
                default: entry.site
            },
            {
                type: 'input',
                name: 'username',
                message: 'Username/Email:',
                default: entry.username
            },
            {
                type: 'input',
                name: 'notes',
                message: 'Notes:',
                default: entry.notes || ''
            }
        ]);
        this.vault.updateEntry(entry.id, answers);
        console.log(chalk_1.default.green('✓ Password updated successfully!'));
    }
    async deletePassword(entry) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete the password for ${entry.site}?`,
                default: false
            }
        ]);
        if (confirm) {
            this.vault.deleteEntry(entry.id);
            console.log(chalk_1.default.green('✓ Password deleted successfully!'));
        }
    }
    async generatePassword() {
        const password = await this.generatePasswordInteractive();
        console.log(chalk_1.default.green(`\n🔑 Generated password: ${chalk_1.default.yellow(password)}`));
        const { copy } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'copy',
                message: 'Copy to clipboard?',
                default: true
            }
        ]);
        if (copy) {
            await clipboardy_1.default.write(password);
            console.log(chalk_1.default.green('✓ Password copied to clipboard!'));
        }
    }
    async generatePasswordInteractive() {
        const questions = [
            {
                type: 'number',
                name: 'length',
                message: 'Password length:',
                default: 16,
                validate: (input) => input >= 4 && input <= 128
            },
            {
                type: 'confirm',
                name: 'includeUppercase',
                message: 'Include uppercase letters?',
                default: true
            },
            {
                type: 'confirm',
                name: 'includeLowercase',
                message: 'Include lowercase letters?',
                default: true
            },
            {
                type: 'confirm',
                name: 'includeNumbers',
                message: 'Include numbers?',
                default: true
            },
            {
                type: 'confirm',
                name: 'includeSymbols',
                message: 'Include symbols?',
                default: true
            },
            {
                type: 'confirm',
                name: 'excludeSimilar',
                message: 'Exclude similar characters (i, l, 1, L, o, 0, O)?',
                default: true
            }
        ];
        const policy = await inquirer_1.default.prompt(questions);
        return generator_1.PasswordGenerator.generate(policy);
    }
    async auditPasswords() {
        const { weak, reused } = this.vault.auditPasswords();
        console.log(chalk_1.default.cyan('\n🔍 Password Audit Results:'));
        if (weak.length > 0) {
            console.log(chalk_1.default.red(`\n⚠️  ${weak.length} weak passwords found:`));
            weak.forEach(entry => {
                console.log(`  • ${chalk_1.default.blue(entry.site)} - ${chalk_1.default.gray(entry.username)}`);
            });
        }
        if (reused.length > 0) {
            console.log(chalk_1.default.yellow(`\n🔄 ${reused.length} reused passwords found:`));
            reused.forEach(entry => {
                console.log(`  • ${chalk_1.default.blue(entry.site)} - ${chalk_1.default.gray(entry.username)}`);
            });
        }
        if (weak.length === 0 && reused.length === 0) {
            console.log(chalk_1.default.green('\n✅ All passwords are strong and unique!'));
        }
    }
    async exit() {
        console.log(chalk_1.default.blue('🔒 Locking vault...'));
        await this.vault.lock(this.masterPassword);
        console.log(chalk_1.default.green('✓ Vault locked successfully. Goodbye!'));
    }
}
exports.CLI = CLI;
