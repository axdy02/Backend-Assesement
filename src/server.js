'use strict';

require('dotenv').config();
const app  = require('./app');

const PORT = process.env.PORT || 7002;

app.listen(PORT, () => {
  console.log(`Reimbursements API running on http://localhost:${PORT}`);
});
