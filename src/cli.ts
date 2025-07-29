import inquirer, { QuestionCollection } from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { Vault, VaultEntry } from './vault';
import { PasswordGenerator, PasswordPolicy } from './generator';

export class CLI {
  private vault: Vault;
  private masterPassword: string = '';

  constructor() {
    this.vault = new Vault();
  }

  async start(): Promise<void> {
    console.log(chalk.cyan.bold('🔐 SecureVault CLI'));
    console.log(chalk.gray('Your secure password manager\n'));

    await this.authenticate();
    await this.mainMenu();
  }

  private async authenticate(): Promise<void> {
    while (true) {
      const { password } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter master password:',
          mask: '*'
        }
      ]);

      if (await this.vault.unlock(password)) {
        this.masterPassword = password;
        console.log(chalk.green('✓ Vault unlocked successfully\n'));
        break;
      } else {
        console.log(chalk.red('✗ Invalid master password\n'));
      }
    }
  }

  private async mainMenu(): Promise<void> {
    while (true) {
      const { action } = await inquirer.prompt([
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
      } catch (error) {
        console.log(chalk.red('An error occurred:', error));
      }

      console.log(); // Add spacing
    }
  }

  private async searchPasswords(): Promise<void> {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Search for site or username:'
      }
    ]);

    const results = this.vault.searchEntries(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow('No passwords found matching your query.'));
      return;
    }

    await this.displayPasswordList(results);
  }

  private async listPasswords(): Promise<void> {
    const entries = this.vault.getAllEntries();
    
    if (entries.length === 0) {
      console.log(chalk.yellow('No passwords stored yet.'));
      return;
    }

    await this.displayPasswordList(entries);
  }

  private async displayPasswordList(entries: VaultEntry[]): Promise<void> {
    const choices = entries.map(entry => ({
      name: `${chalk.blue(entry.site)} - ${chalk.gray(entry.username)}`,
      value: entry.id
    }));

    choices.push({ name: chalk.gray('← Back to main menu'), value: 'back' });

    const { selectedId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Select a password:',
        choices
      }
    ]);

    if (selectedId === 'back') return;

    const entry = entries.find(e => e.id === selectedId);
    if (entry) {
      await this.viewPassword(entry);
    }
  }

  private async viewPassword(entry: VaultEntry): Promise<void> {
    console.log(chalk.cyan('\n📋 Password Details:'));
    console.log(`Site: ${chalk.bold(entry.site)}`);
    console.log(`Username: ${chalk.bold(entry.username)}`);
    console.log(`Password: ${chalk.yellow('•'.repeat(entry.password.length))} (hidden)`);
    if (entry.notes) {
      console.log(`Notes: ${entry.notes}`);
    }
    console.log(`Created: ${entry.createdAt.toLocaleDateString()}`);
    console.log(`Updated: ${entry.updatedAt.toLocaleDateString()}`);

    const { action } = await inquirer.prompt([
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
        await clipboardy.write(entry.password);
        console.log(chalk.green('✓ Password copied to clipboard!'));
        break;
      case 'show':
        console.log(chalk.yellow(`Password: ${entry.password}`));
        break;
      case 'edit':
        await this.editPassword(entry);
        break;
      case 'delete':
        await this.deletePassword(entry);
        break;
    }
  }

  private async addPassword(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'site',
        message: 'Site/Service name:',
        validate: (input: string) => input.trim() !== ''
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username/Email:',
        validate: (input: string) => input.trim() !== ''
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

    let password: string;
    if (answers.passwordOption === 'manual') {
      const { manualPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'manualPassword',
          message: 'Enter password:',
          mask: '*'
        }
      ]);
      password = manualPassword;
    } else {
      password = await this.generatePasswordInteractive();
    }

    const { notes } = await inquirer.prompt([
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

    console.log(chalk.green(`✓ Password for ${entry.site} added successfully!`));
  }

  private async editPassword(entry: VaultEntry): Promise<void> {
    const answers = await inquirer.prompt([
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
    console.log(chalk.green('✓ Password updated successfully!'));
  }

  private async deletePassword(entry: VaultEntry): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete the password for ${entry.site}?`,
        default: false
      }
    ]);

    if (confirm) {
      this.vault.deleteEntry(entry.id);
      console.log(chalk.green('✓ Password deleted successfully!'));
    }
  }

  private async generatePassword(): Promise<void> {
    const password = await this.generatePasswordInteractive();
    console.log(chalk.green(`\n🔑 Generated password: ${chalk.yellow(password)}`));
    
    const { copy } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'copy',
        message: 'Copy to clipboard?',
        default: true
      }
    ]);

    if (copy) {
      await clipboardy.write(password);
      console.log(chalk.green('✓ Password copied to clipboard!'));
    }
  }

  private async generatePasswordInteractive(): Promise<string> {
    const questions: QuestionCollection = [
      {
        type: 'number',
        name: 'length',
        message: 'Password length:',
        default: 16,
        validate: (input: number) => input >= 4 && input <= 128
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

    const policy = await inquirer.prompt(questions) as PasswordPolicy;
    return PasswordGenerator.generate(policy);
  }

  private async auditPasswords(): Promise<void> {
    const { weak, reused } = this.vault.auditPasswords();
    
    console.log(chalk.cyan('\n🔍 Password Audit Results:'));
    
    if (weak.length > 0) {
      console.log(chalk.red(`\n⚠️  ${weak.length} weak passwords found:`));
      weak.forEach(entry => {
        console.log(`  • ${chalk.blue(entry.site)} - ${chalk.gray(entry.username)}`);
      });
    }

    if (reused.length > 0) {
      console.log(chalk.yellow(`\n🔄 ${reused.length} reused passwords found:`));
      reused.forEach(entry => {
        console.log(`  • ${chalk.blue(entry.site)} - ${chalk.gray(entry.username)}`);
      });
    }

    if (weak.length === 0 && reused.length === 0) {
      console.log(chalk.green('\n✅ All passwords are strong and unique!'));
    }
  }

  private async exit(): Promise<void> {
    console.log(chalk.blue('🔒 Locking vault...'));
    await this.vault.lock(this.masterPassword);
    console.log(chalk.green('✓ Vault locked successfully. Goodbye!'));
  }
}