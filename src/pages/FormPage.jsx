// src/pages/FormPage.jsx
import React, { useState } from "react";
import EmployeeForm from "../components/EmployeeForm";

export default function FormPage() {
  const [employeeAdded, setEmployeeAdded] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);

  const handleFormSubmit = (data) => {
    setEmployeeData(data);
    setEmployeeAdded(true);
  };

  if (employeeAdded) {
    return (
      <div className="success-container">
        <h2>🎉 Employee Added Successfully!</h2>
        <p><strong>Name:</strong> {employeeData.name}</p>
        <p><strong>Age:</strong> {employeeData.age}</p>
        <p><strong>Designation:</strong> {employeeData.designation}</p>
        <p><strong>Details:</strong> {employeeData.details}</p>
        <button onClick={() => setEmployeeAdded(false)}>Add Another Employee</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Add Employee</h2>
      <EmployeeForm onSubmit={handleFormSubmit} />
    </div>
  );
}
