import EmployeeForm from "../components/EmployeeForm";
export default function FormPage({ onFormSuccess }) {
  const handleFormSubmit = (data) => {
    console.log("Submission successful. Redirecting to Home page...");
    if (onFormSuccess) {
      onFormSuccess();
    }
  };
  return (
    <div className="form-page-container">
      <div className="form-card">
        <h2>Add Employee</h2>
        <EmployeeForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
