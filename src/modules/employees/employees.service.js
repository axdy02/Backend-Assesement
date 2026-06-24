'use strict';

const repo = require('./employees.repository');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');

/**
 * Return the employee list visible to the requesting user based on their role.
 *
 * EMP is blocked entirely at the route layer via authorize(['RM','APE','CFO']).
 * This service still returns an empty array rather than crashing for unknown roles.
 *
 * @param {object} requester - req.user
 */
async function listEmployees(requester) {
  switch (requester.role) {
    case 'RM':
      return repo.listByManager(requester.id);

    case 'APE':
      return repo.listEmpsAndRms();

    case 'CFO':
      return repo.listAll();

    default:
      throw new ForbiddenError();
  }
}

/**
 * Assign an EMP to an RM (set EMP.manager_id = rmId).
 *
 * Validations:
 * - empId must exist and have role EMP.
 * - rmId must exist and have role RM.
 * - Re-assigning an EMP who already has a manager is allowed (overwrite).
 *   The old manager relationship is simply replaced. This is documented
 *   in the README as the chosen behaviour.
 *
 * @param {number} empId
 * @param {number} rmId
 */
async function assignManager(empId, rmId) {
  const emp = await repo.findById(empId);
  if (!emp) {
    throw new NotFoundError(`User with id ${empId} does not exist`);
  }
  if (emp.role !== 'EMP') {
    throw new ValidationError(`User ${empId} is not an EMP (role: ${emp.role})`);
  }

  const rm = await repo.findById(rmId);
  if (!rm) {
    throw new NotFoundError(`User with id ${rmId} does not exist`);
  }
  if (rm.role !== 'RM') {
    throw new ValidationError(`User ${rmId} is not an RM (role: ${rm.role})`);
  }

  const updated = await repo.setManager(empId, rmId);
  return updated;
}

/**
 * Remove the EMP ↔ RM link (set EMP.manager_id = NULL).
 *
 * Fails with 400 if the pair isn't actually linked — we don't silently
 * no-op because the caller probably has stale data and should know.
 *
 * @param {number} empId
 * @param {number} rmId
 */
async function removeManager(empId, rmId) {
  const emp = await repo.findById(empId);
  if (!emp) {
    throw new NotFoundError(`User with id ${empId} does not exist`);
  }
  if (emp.role !== 'EMP') {
    throw new ValidationError(`User ${empId} is not an EMP (role: ${emp.role})`);
  }

  const rm = await repo.findById(rmId);
  if (!rm) {
    throw new NotFoundError(`User with id ${rmId} does not exist`);
  }
  if (rm.role !== 'RM') {
    throw new ValidationError(`User ${rmId} is not an RM (role: ${rm.role})`);
  }

  // clearManager returns null when the pair wasn't linked
  const updated = await repo.clearManager(empId, rmId);
  if (!updated) {
    throw new ValidationError(
      `Employee ${empId} is not currently assigned to RM ${rmId}`
    );
  }

  return updated;
}

module.exports = { listEmployees, assignManager, removeManager };
