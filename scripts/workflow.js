#!/usr/bin/env node
/**
 * VersyFlow Workflow CLI
 * Entry point for executing sprint, task, and monitoring workflows.
 */

const { execSync } = require('child_process');
const path = require('path');

// Charger le workflow orchestrator
const orchestratorPath = path.join(__dirname, 'workflows', 'orchestrator');

// Obtenir la commande et les arguments
const command = process.argv[2] || 'help';
const args = process.argv.slice(3);

console.log(`\n=== VersyFlow Workflow CLI ===`);
console.log(`Command: ${command}`);
console.log(`Arguments: ${args.join(' ')}`);
console.log('');

try {
  switch (command) {
    case 'sprint':
    case 'task':
    case 'monitor':
    case 'release':
      // Exécuter le workflow via Node.js
      execSync(`node ${orchestratorPath} ${command} ${args.join(' ')}`, { stdio: 'inherit' });
      break;

    case 'help':
    case '-h':
    case '--help':
      console.log('Available commands:');
      console.log('  sprint <n>        — Exécuter le sprint n (ex: sprint 1)');
      console.log('  task <id> [agent] — Exécuter une tâche (ex: task S1-01 Anvil)');
      console.log('  monitor           — Lancer le monitor de santé continu');
      console.log('  release <ver>     — Préparer la release (ex: release 0.1.0)');
      console.log('  status            — Afficher l\'état actuel du backlog');
      break;

    case 'status':
      // Afficher l'état du projet
      execSync('git log --oneline -5', { stdio: 'inherit' });
      console.log('');
      execSync('git status', { stdio: 'inherit' });
      break;

    default:
      console.log('Commande inconnue. Utilise "help" pour la liste des commandes.');
      process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Erreur d\'exécution du workflow:', error.message);
  process.exit(1);
}
