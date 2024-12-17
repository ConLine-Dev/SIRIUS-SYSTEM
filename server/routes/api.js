const express = require('express');
const router = express.Router();
const Users = require('./apiUsers');
const apiDirectMailPricing = require('./apiDirectMailPricing');
const administration_launches_adm = require('./administration_launches_adm');
const api_non_compliance = require('./api-non-compliance');
const api_user_headcargo = require('./api-user-headcargo');
const api_headcargo = require('./api-headcargo');
const api_called_projects = require('./api-called-projects');
const api_called_tickets = require('./api-called-tickets');
const api_called = require('./api-called');
const api_collaborators = require('./api-collaborators');
const api_product = require('./api-product');
const api_safety_inspection = require('./api-safety-inspection');
const api_people = require('./api-people');
const api_moduleManagement = require('./api-module-management');
const api_controlPassword = require('./api-control-password');
const api_userManagement = require('./api-user-management');
const api_collaboratorsRoutes = require('./collaborators-routes');
const api_incentive_management = require('./api-incentive-management');
const api_stock = require('./api-stock');
const api_executive_analytics_dashboard = require('./api-executive-analytics-dashboard');
const api_report_pricing = require('./api-report-pricing');
const api_financial_indicators = require('./api-financial-indicators');
const api_collaborators_certificates = require('./api-collaborators-certificates');
const api_meeting_control = require('./api-meeting-control');
const api_user_tickets = require('./api-user-tickets');
const api_performance_products = require('./api-performance-product');
const api_nps = require('./api-nps');
const api_cash_flow = require('./api-cash-flow');
const dataDecurityHub = require('./api-data-security-hub');
const api_pricing_main = require('./api-pricing-main');
const api_rh_payroll = require('./api-rh-payroll');
const api_internal_comments = require('./api-internal-comments');
const api_part_lot = require('./api-part-lot');
const api_external_systems = require('./api-external-systems');

const apiAppMonitor = require('./apiAppMonitor');
const apiSystem = require('./api-system');
const Posts = require('./apiPosts');
// const Posts = require('./apiPosts');


// Function to set io instance
const setIO = (io) => {
  // Pass the io instance to the apiDirectMailPricing route
  router.use('/direct_mail_pricing', apiDirectMailPricing(io));

  // Use as rotas do arquivo apiUsers.js
  router.use('/users', Users);

  // Use as rotas do arquivo apiUsers.js
  router.use('/launches_adm', administration_launches_adm(io));

  // Use as rotas do arquivo apiPosts.js
  router.use('/posts', Posts(io));

  // Use as rotas do arquivo api-non-compliance.js
  router.use('/non-compliance', api_non_compliance(io));

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/AppMonitor', apiAppMonitor);

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/system', apiSystem);

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/headcargo/user', api_user_headcargo);

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/headcargo/commission', api_headcargo(io));

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/headcargo/searchLog', api_headcargo(io));

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/headcargo/inactive-clients-report', api_headcargo(io));

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/headcargo/repurchase-management', api_headcargo(io));

  // Use as rotas do arquivo apiAppMonitor.js
  // router.use('/called/projects', api_called_projects);

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/called/tickets', api_called_tickets(io));

  // Use as rotas do arquivo apiAppMonitor.js
  router.use('/called', api_called);

  // Use as rotas do arquivo api-collaborators.js
  router.use('/collaborators', api_collaborators);

  // Use as rotas do arquivo api-people.js
  router.use('/people', api_people(io));

  // Use as rotas do arquivo api-people.js
  router.use('/module-management', api_moduleManagement(io));

  // Use as rotas do arquivo control-password.js
  router.use('/control-password', api_controlPassword(io));

  // Use as rotas do arquivo api-user-management.js
  router.use('/user-management', api_userManagement(io));

  // Use as rotas do arquivo collaborators-management.js
  router.use('/collaborators-management', api_collaboratorsRoutes(io));

  // Use as rotas do arquivo api_incentive_management.js
  router.use('/incentive-management', api_incentive_management(io));
  
  // Use as rotas do arquivo api_incentive_management.js
  router.use('/stock', api_stock(io));

  // Use as rotas do arquivo api_incentive_management.js
  router.use('/executive-analytics-dashboard', api_executive_analytics_dashboard(io)); 

  // Use as rotas do arquivo api_report_pricing.js
  router.use('/report-pricing', api_report_pricing(io));

  // Use as rotas do arquivo api_incentive_management.js
  router.use('/financial-indicators', api_financial_indicators(io));

  // Use as rotas do arquivo api_collaborators_by_certificates.js
  router.use('/collaborators-certificates', api_collaborators_certificates(io)); 

  // Use as rotas do arquivo api_meeting_control .js
  router.use('/meeting-control', api_meeting_control(io));

  // Use as rotas do arquivo api_user_tickets .js
  router.use('/user-tickets', api_user_tickets(io));

  // Use as rotas do arquivo api-perfomance-product .js
  router.use('/performance-products', api_performance_products(io));

  // Use as rotas do arquivo api-perfomance-product .js
  router.use('/nps', api_nps(io));

  // Use as rotas do arquivo api-perfomance-product .js
  router.use('/cash-flow', api_cash_flow(io));

  // Use as rotas do arquivo api-product .js oi
  router.use('/product', api_product(io));

  // Use as rotas do arquivo api-safety-inspection .js oi
  router.use('/safety-inspection', api_safety_inspection(io));
  
  // Use as rotas do arquivo api-safety-inspection .js oi
  router.use('/data-security-hub', dataDecurityHub(io));
  
  // Use as rotas do arquivo api-pricing-main .js oi
  router.use('/pricing-main', api_pricing_main(io));

  // Use as rotas do arquivo api-rh-payroll .js oi
  router.use('/rh-payroll', api_rh_payroll(io));

  // Use as rotas do arquivo api-internal-comments .js oi
  router.use('/internal-comments', api_internal_comments(io));

  // Use as rotas do arquivo api-part-lot .js oi
  router.use('/part-lot', api_part_lot(io));

  // Use as rotas do arquivo api-external-systems.js oi
  router.use('/external-systems', api_external_systems(io));

  return router;
};

module.exports = setIO;