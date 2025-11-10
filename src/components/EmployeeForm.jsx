import React, { useState } from "react";

export default function EmployeeForm({ onSubmit }) {
  // form state
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [designation, setDesignation] = useState("Manager");
  const [details, setDetails] = useState("");

// inside EmployeeForm.js - replace handleSubmit function with:

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!name || !age || !designation) {
    alert("Please fill all required fields!");
    return;
  }

  const formData = new FormData();
  if (image) formData.append('image', image);
  formData.append('name', name);
  formData.append('age', age);
  formData.append('designation', designation);
  formData.append('details', details);

  try {
    const res = await fetch('http://localhost:5000/api/employees', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();

    if (res.ok && json.success) {
      // Let parent know (you can pass json back)
      onSubmit({
        name, age, designation, details, image,
        serverId: json.id, message: json.message
      });
    } else {
      alert(json.message || 'Failed to add employee');
    }
  } catch (err) {
    console.error(err);
    alert('Network or server error');
  }
};


  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Upload Image:
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
      </label>

      <label>
        Name:
        <input
          type="text"
          placeholder="Enter employee name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        Age:
        <input
          type="number"
          placeholder="Enter age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </label>

      <label>
        Designation:
        <select
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
        >
          <option value="Manager">Manager</option>
          <option value="Assistant Manager">Assistant Manager</option>
          <option value="Senior Developer">Senior Developer</option>
          <option value="Junior Developer">Junior Developer</option>
        </select>
      </label>

      <label>
        Employee Details:
        <textarea
          placeholder="Write details about employee..."
          rows="4"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        ></textarea>
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
