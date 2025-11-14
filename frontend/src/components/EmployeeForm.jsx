import { useRef, useEffect, useState } from "react";

export default function EmployeeForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    designation: "",
    details: "",
    files: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch (e) {}
      });
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const lettersOnly = /^[A-Za-z\s]*$/;
      if (!lettersOnly.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index) => {
    try {
      URL.revokeObjectURL(imagePreviews[index].url);
    } catch (e) {}
    const newFiles = [...formData.files];
    newFiles.splice(index, 1);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setFormData((prev) => ({ ...prev, files: newFiles }));
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.age, 10) <= 0 || parseInt(formData.age, 10) > 100) {
      alert("Age must be greater then 0 and less then 100");
      return;
    } 

    const body = new FormData();
    body.append("name", formData.name);
    body.append("age", formData.age);
    body.append("designation", formData.designation);
    body.append("details", formData.details);
    formData.files.forEach((file) => body.append("files", file));
    try {
      const res = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        let newEmployeeData = json.data;
        let shouldRefresh = false;
        if (!newEmployeeData || typeof newEmployeeData !== "object") {
          console.error(
            "API success response missing or invalid 'data' object.",
            json
          );
        } else {
          if (!newEmployeeData.Id) {
            newEmployeeData.Id = newEmployeeData.id || newEmployeeData.ID;
          }

          if (!newEmployeeData.Id) {
            console.error(
              "API response does not contain the employee ID. Forcing hard refresh.",
              json
            );
            shouldRefresh = true;
            alert(
              "Employee added, but missing ID in response. Refreshing the full list."
            );
          } else {
            shouldRefresh = true;
          }
        }
        if (shouldRefresh && newEmployeeData && newEmployeeData.Id) {
          if (onSubmit) onSubmit(newEmployeeData);
        }
        if (onSubmit && (!shouldRefresh || !newEmployeeData.Id)) {
          onSubmit();
        }

        imagePreviews.forEach((p) => {
          try {
            URL.revokeObjectURL(p.url);
          } catch (e) {}
        });
        setFormData({
          name: "",
          age: "",
          designation: "",
          details: "",
          files: [],
        });
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert(json.message || "Failed to add employee");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting form");
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {" "}
      <label>
        Upload Image(s){" "}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />{" "}
      </label>{" "}
      {imagePreviews.length > 0 && (
        <div className="preview-container">
          {" "}
          {imagePreviews.map((p, idx) => (
            <div key={`${p.name}-${idx}`} className="preview-wrapper">
              {" "}
              <img
                src={p.url}
                alt={`Preview ${idx + 1}`}
                className="preview-img"
              />{" "}
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveImage(idx)}
                aria-label={`Remove image ${idx + 1}`}
              >
                ×
              </button>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      <label>
        Name{" "}
        <input
          type="text"
          name="name"
          placeholder="Enter name"
          value={formData.name}
          onChange={handleChange}
          required
        />{" "}
      </label>{" "}
      <label>
        Age{" "}
        <input
          type="number"
          name="age"
          placeholder="Enter age"
          value={formData.age}
          onChange={handleChange}
          required
        />{" "}
      </label>{" "}
      <label>
        Designation{" "}
        <select
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          required
        >
          <option>Manager</option>
          <option>Assistant Manager</option>
          <option>Senior Developer</option> <option>Junior Developer</option>{" "}
        </select>{" "}
      </label>{" "}
      <label>
        Details{" "}
        <textarea
          name="details"
          placeholder="Enter employee details"
          value={formData.details}
          onChange={handleChange}
          rows="4"
        />{" "}
      </label>
      <button type="submit">Submit</button>{" "}
    </form>
  );
}
