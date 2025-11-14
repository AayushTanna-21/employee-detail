import EmployeeForm from "../components/EmployeeForm";
export default function FormPage({ onFormSuccess }) {
  const handleFormSubmit = (data) => {
    if (onFormSuccess) onFormSuccess(data);
  };
  return (
    <div className="form-page-container">
      <div className="form-card">
        <EmployeeForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
