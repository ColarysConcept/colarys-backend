import { Router } from 'express';
import { colarysEmployeeController } from '../controllers/ColarysEmployeeController';

const router = Router();

// ==================== MIDDLEWARE DE LOGGING ====================
router.use((req, res, next) => {
  console.log(`🟢 Colarys Route: ${req.method} ${req.originalUrl}`);
  console.log(`📱 Origin: ${req.headers.origin}`);
  next();
});

// ==================== SANTÉ ====================
router.get('/health', (req, res) => {
  console.log('🔍 Colarys Health check requested');
  colarysEmployeeController.healthCheck(req, res);
});

// ==================== EMPLOYÉS ====================
router.get('/employees', (req, res) => {
  console.log('📋 Fetching all employees');
  colarysEmployeeController.getAllEmployees(req, res);
});

router.get('/employees/:matricule', (req, res) => {
  console.log(`👤 Fetching employee: ${req.params.matricule}`);
  colarysEmployeeController.getEmployee(req, res);
});

router.get('/statistiques', (req, res) => {
  console.log('📊 Fetching statistics');
  colarysEmployeeController.getStatistiques(req, res);
});

router.post('/employees', (req, res) => {
  console.log('➕ Creating new employee');
  colarysEmployeeController.createEmployee(req, res);
});

router.post('/fiche-paie/export', (req, res) => {
  console.log('📄 Exporting payslips');
  colarysEmployeeController.exportFichesPaie(req, res);
});

router.put('/employees/:matricule', (req, res) => {
  console.log(`✏️ Updating employee: ${req.params.matricule}`);
  colarysEmployeeController.updateEmployee(req, res);
});

router.delete('/employees/:matricule', (req, res) => {
  console.log(`🗑️ Deleting employee: ${req.params.matricule}`);
  colarysEmployeeController.deleteEmployee(req, res);
});

// ==================== PRÉSENCES ====================
router.get('/presences', (req, res) => {
  console.log('📅 Fetching all presences');
  colarysEmployeeController.getPresences(req, res);
});

router.get('/presences/:year/:month', (req, res) => {
  console.log(`📅 Fetching presences for: ${req.params.month}/${req.params.year}`);
  colarysEmployeeController.getMonthlyPresences(req, res);
});

router.put('/presences/:matricule/:year/:month/:day', (req, res) => {
  console.log(`🔄 Updating presence: ${req.params.matricule} - ${req.params.day}/${req.params.month}/${req.params.year}`);
  colarysEmployeeController.updatePresence(req, res);
});

// Synchronisation automatique des jours OFF
router.post('/presences/sync-jours-off', (req, res) => {
  console.log('🔄 Syncing days OFF');
  colarysEmployeeController.syncJoursOff(req, res);
});

// ==================== SALAIRES ====================
router.get('/salaires', (req, res) => {
  console.log('💰 Fetching all salaries');
  colarysEmployeeController.getSalaires(req, res);
});

router.get('/salaires/calculate/:year/:month', (req, res) => {
  console.log(`🧮 Calculating salaries for: ${req.params.month}/${req.params.year}`);
  colarysEmployeeController.calculateSalaires(req, res);
});

router.put('/salaires/:matricule/:year/:month', (req, res) => {
  console.log(`✏️ Updating salary: ${req.params.matricule} - ${req.params.month}/${req.params.year}`);
  colarysEmployeeController.updateSalaire(req, res);
});

// ==================== UTILITAIRES ====================
router.post('/update-conges', (req, res) => {
  console.log('🔄 Updating leave balances');
  colarysEmployeeController.updateCongesAutomatique(req, res);
});

// ==================== ROUTE DE TEST SIMPLE ====================
router.get('/test-simple', (req, res) => {
  console.log('🧪 Simple test route');
  try {
    res.json({
      success: true,
      message: '✅ Colarys API is working!',
      timestamp: new Date().toISOString(),
      route: '/api/colarys/test-simple'
    });
  } catch (error: any) {
    console.error('❌ Simple test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// ==================== GESTIONNAIRE D'ERREUR POUR LES ROUTES COLARYS ====================
router.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Colarys Route Error:', error);
  console.error('📱 Request:', req.method, req.originalUrl);
  
  res.status(500).json({
    success: false,
    message: 'Colarys service error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

export default router;