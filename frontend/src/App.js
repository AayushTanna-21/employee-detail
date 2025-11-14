import { useState } from "react";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import useEmployees from "./hooks/useEmployees";
import "./App.css";

function App() {
  const { rows, loading, remove, update, addRow } = useEmployees();
  const [route, setRoute] = useState("home");
  const [dtInstance, setDtInstance] = useState(null);

  /**
   * Handles successful form submission.
   * @param {object | undefined} newEmployee 
   */
  const handleFormSuccess = (newEmployee) => {
    if (newEmployee && newEmployee.Id) {
      addRow(newEmployee, dtInstance);
    }

    setRoute("home");
  };
       
  return (
    <div>
      <NavBar route={route} onNavigate={setRoute} />
      <main style={{ padding: 20 }}>
        {route === "home" && (
          <Home
            rows={rows}
            loading={loading}
            remove={remove}
            update={update}
            setDtInstance={setDtInstance}
          />
        )}
        {route === "form" && <FormPage onFormSuccess={handleFormSuccess} />}
      </main>
    </div>
  );
}
export default App;
