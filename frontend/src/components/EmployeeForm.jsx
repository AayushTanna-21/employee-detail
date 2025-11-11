import { useRef, useState, useEffect } from "react";
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
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
    const newPreviews = [...imagePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData((prev) => ({ ...prev, files: newFiles }));
    setImagePreviews(newPreviews);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.age, 10) <= 0) {
      alert("Age cannot be negative");
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
        if (onSubmit) onSubmit(json.data);
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
      <label>
        Upload Image(s)
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
      {imagePreviews.length > 0 && (
        <div className="preview-container">
          {imagePreviews.map((p, idx) => (
            <div key={`${p.name}-${idx}`} className="preview-wrapper">
              <img
                src={p.url}
                alt={`Preview ${idx + 1}`}
                className="preview-img"
              />
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveImage(idx)}
                aria-label={`Remove image ${idx + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <label>
        Name
        <input
          type="text"
          name="name"
          placeholder="Enter name of employee"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Age
        <input
          type="number"
          name="age"
          placeholder="Enter Age of employee"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Designation
        <select
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          required
        >
          <option>Manager</option>
          <option>Assistant Manager</option>
          <option>Senior Developer</option>
          <option>Junior Developer</option>
        </select>
      </label>
      <label>
        Details
        <textarea
          name="details"
          placeholder="Enter Employee Details"
          value={formData.details}
          onChange={handleChange}
          rows="4"
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
