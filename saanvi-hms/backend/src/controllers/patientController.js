const { Op } = require('sequelize');
const { Patient } = require('../models');

// GET /api/patients?search=&page=&limit=
// Supports basic search by name/phone and pagination, since a real
// hospital patient list can grow into the thousands quickly.
async function getPatients(req, res, next) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      patients: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/patients/:id
async function getPatientById(req, res, next) {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ patient });
  } catch (err) {
    next(err);
  }
}

// POST /api/patients
// Allowed for admin, doctor, nurse, receptionist (route-level RBAC handles this).
async function createPatient(req, res, next) {
  try {
    const payload = { ...req.body, registeredBy: req.user.id };
    const patient = await Patient.create(payload);
    res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
}

// PUT /api/patients/:id
async function updatePatient(req, res, next) {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.update(req.body);
    res.json({ patient });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/patients/:id
// Restricted to admin only at the route level — front-desk staff can
// register/edit patients but shouldn't be able to delete records.
async function deletePatient(req, res, next) {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.destroy();
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
