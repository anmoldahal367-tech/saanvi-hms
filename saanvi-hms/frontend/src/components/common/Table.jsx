import './Table.css';

/**
 * Generic data table.
 *
 * columns: [{ key: 'firstName', header: 'First name', render?: (row) => JSX }]
 * rows: array of data objects
 * isLoading: shows skeleton rows
 * emptyMessage: shown when rows is empty and not loading
 *
 * <Table columns={columns} rows={patients} isLoading={loading} />
 */
export default function Table({
  columns,
  rows,
  isLoading = false,
  emptyMessage = 'Nothing to show yet.',
  getRowKey = (row) => row.id,
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="skeleton" style={{ height: 14, width: '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table__empty">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!isLoading &&
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
