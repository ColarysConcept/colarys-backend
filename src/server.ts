// // src/server.ts - Point d'entrée pour le développement local
// import "reflect-metadata";
// import dotenv from "dotenv";
// import { AppDataSource } from "./config/data-source";
// import app from "./app";

// dotenv.config();

// console.log('🚀 Starting Colarys API Server in LOCAL mode...');

// const startServer = async () => {
//   try {
//     await AppDataSource.initialize();
//     console.log("📦 Connected to database");

//     const PORT = process.env.PORT || 3000;
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//       console.log(`📍 Local: http://localhost:${PORT}`);
//       console.log(`📍 Health: http://localhost:${PORT}/api/health`);
//     });
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     process.exit(1);
//   }
// };

// // Démarrage uniquement en local
// if (!process.env.VERCEL) {
//   startServer();
// }

// export default app;