import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import { patientApi } from '../api/patientApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import PatientForm from './PatientForm';
import '../components/common/Input.css';
import './Patients.css';

export default function Patients() {
  const { hasRole } = useAuth();

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [activePatient, setActivePatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', message }

  // RBAC at the UI level: these mirror the backend route restrictions so
  // buttons that would 403 simply aren't shown. The backend re-checks
  // independently, so hiding a button here is purely a UX nicety.
  const canCreate = hasRole([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE]);
  const canEdit = hasRole([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.DOCTOR]);
  const canDelete = hasRole([ROLES.ADMIN]);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await patientApi.getAll({ search: debouncedSearch, page, limit: 8 });
      setPatients(data.patients);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Failed to load patients.' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Debounce the raw search input. Only after typing settles for 300ms do
  // we update debouncedSearch (which triggers exactly one fetch) and reset
  // back to page 1, since a new search query invalidates the old page count.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Auto-dismiss success banners after a few seconds; leave error banners
  // visible until the next action, since the user may need time to read them.
  useEffect(() => {
    if (banner?.type === 'success') {
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const openCreate = () => {
    setActivePatient(null);
    setModalMode('create');
  };

  const openEdit = (patient) => {
    setActivePatient(patient);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActivePatient(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (modalMode === 'edit') {
        await patientApi.update(activePatient.id, formData);
        setBanner({ type: 'success', message: 'Patient record updated.' });
      } else {
        await patientApi.create(formData);
        setBanner({ type: 'success', message: 'Patient added successfully.' });
      }
      closeModal();
      loadPatients();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not save patient.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await patientApi.remove(deleteTarget.id);
      setBanner({ type: 'success', message: `${deleteTarget.firstName} ${deleteTarget.lastName} was removed.` });
      setDeleteTarget(null);
      loadPatients();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not delete patient.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="patients-page__name-cell">{row.firstName} {row.lastName}</span>
      ),
    },
    { key: 'phone', header: 'Phone' },
    { key: 'gender', header: 'Gender', render: (row) => row.gender[0].toUpperCase() + row.gender.slice(1) },
    { key: 'bloodGroup', header: 'Blood group' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="patients-page__row-actions">
          {canEdit && (
            <Button variant="ghost" onClick={() => openEdit(row)} title="Edit">
              <Icon name="pencil" size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" onClick={() => setDeleteTarget(row)} title="Delete">
              <Icon name="trash" size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="patients-page__header">
        <h1 className="patients-page__title">Patients</h1>
        {canCreate && (
          <Button onClick={openCreate}>
            <Icon name="plus" size={16} /> Add patient
          </Button>
        )}
      </div>

      {banner && (
        <div className={`patients-page__banner patients-page__banner--${banner.type}`} role="status">
          {banner.message}
        </div>
      )}

      <Card>
        <div className="patients-page__search" style={{ marginBottom: 16 }}>
          <span className="patients-page__search-icon"><Icon name="search" size={16} /></span>
          <input
            className="field__control"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          rows={patients}
          isLoading={isLoading}
          emptyMessage={search ? 'No patients match your search.' : 'No patients registered yet.'}
        />

        {totalPages > 1 && (
          <div className="patients-page__pagination">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit patient' : 'Add patient'}
        size="lg"
      >
        <PatientForm
          initialValues={activePatient}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete patient record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to delete the record for{' '}
          <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
