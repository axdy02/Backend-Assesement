'use strict';

const employeesService = require('./employees.service');
const asyncHandler     = require('../../utils/asyncHandler');

/**
 * GET /rest/employees
 * Returns the employee list visible to the authenticated user's role.
 * EMP → 403, RM → own reports, APE → EMP+RM, CFO → everyone.
 */
const listEmployees = asyncHandler(async (req, res) => {
  const users = await employeesService.listEmployees(req.user);
  res.status(200).json({ users });
});

/**
 * POST /rest/employees/assign
 * Body: { empId, rmId }
 * CFO-only. Links an EMP to an RM (sets EMP.manager_id).
 */
const assignEmployee = asyncHandler(async (req, res) => {
  const { empId, rmId } = req.body;

  if (!empId || !rmId) {
    return res.status(400).json({ error: 'empId and rmId are required' });
  }

  const user = await employeesService.assignManager(Number(empId), Number(rmId));
  res.status(200).json({ message: 'Employee assigned to manager successfully', user });
});

/**
 * DELETE /rest/employees/assign
 * Body: { empId, rmId }
 * CFO-only. Removes the EMP ↔ RM link.
 */
const removeEmployee = asyncHandler(async (req, res) => {
  const { empId, rmId } = req.body;

  if (!empId || !rmId) {
    return res.status(400).json({ error: 'empId and rmId are required' });
  }

  const user = await employeesService.removeManager(Number(empId), Number(rmId));
  res.status(200).json({ message: 'Employee unassigned from manager successfully', user });
});

module.exports = { listEmployees, assignEmployee, removeEmployee };
