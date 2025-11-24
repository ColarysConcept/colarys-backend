// config/logger.ts
import winston from "winston";
import path from "path";

// Déterminer le dossier de logs selon l'environnement
const getLogsDirectory = () => {
  if (process.env.VERCEL) {
    // Sur Vercel, utiliser /tmp qui est le seul endroit accessible en écriture
    return '/tmp/logs';
  }
  return 'logs';
};

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Toujours activer la console
    new winston.transports.Console(),
    
    // Fichier de logs UNIQUEMENT en environnement non-Vercel
    ...(process.env.VERCEL ? [] : [
      new winston.transports.File({ 
        filename: path.join(getLogsDirectory(), "auth.log"),
        level: "info"
      }),
      new winston.transports.File({ 
        filename: path.join(getLogsDirectory(), "error.log"),
        level: "error"
      })
    ])
  ],
});

// Créer le dossier de logs si nécessaire (uniquement en local)
if (!process.env.VERCEL) {
  const fs = require('fs');
  const logsDir = getLogsDirectory();
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}


// // config/logger.ts
// import winston from "winston";

// export const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "logs/auth.log" })
//   ],
// });