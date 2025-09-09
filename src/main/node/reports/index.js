const reportRoutes = require('./routes/reportRoutes');

module.exports = {
  routes: reportRoutes,
  helpers: {
    summaryHelper: require('./helpers/summaryHelper')
  }
};
