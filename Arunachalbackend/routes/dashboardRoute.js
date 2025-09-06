import express from 'express';
import {
  getDashboardOverview,
  getAreaChartData,
  getBarChartData,
  getPieChartData,
  getRadarChartData,
  getQuickActions,
  getDashboardSettings,
  updateDashboardSettings
} from '../controller/dashboardController.js';

const router = express.Router();

// Dashboard Overview Routes
router.get('/overview', getDashboardOverview);
router.get('/area-chart', getAreaChartData);
router.get('/bar-chart', getBarChartData);
router.get('/pie-chart', getPieChartData);
router.get('/radar-chart', getRadarChartData);
router.get('/quick-actions', getQuickActions);

// Dashboard Settings Routes
router.get('/settings', getDashboardSettings);
router.put('/settings', updateDashboardSettings);

export default router;
