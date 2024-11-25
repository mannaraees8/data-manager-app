"use client";
import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

const Home = () => {
  const [data, setData] = useState({});
  const [keys, setKeys] = useState([]); // Keys for dynamic tabs
  const [activeData, setActiveData] = useState({}); // Active data for each tab
  const [columns, setColumns] = useState({}); // Dynamic columns for each tab

  // Fetch data from JSON file on load
  useEffect(() => {
    const fetchData = async () => {
      const timestamp = new Date().getTime(); // Cache-busting
      const response = await fetch(`/app.json?t=${timestamp}`);
      const jsonData = await response.json();
      setData(jsonData);
      setKeys(Object.keys(jsonData)); // Extract keys for tabs
      setActiveData(jsonData);
      setColumns(generateColumns(jsonData)); // Initialize columns
    };

    fetchData();
  }, []);

  // Helper function to generate columns based on the data
  const generateColumns = (data) => {
    const columns = {};
    Object.keys(data).forEach((key) => {
      columns[key] = Object.keys(data[key][0] || {}); // Get column names for each tab
    });
    return columns;
  };

  // Save all data to the JSON file
  const saveData = async () => {
    try {
      const response = await fetch("/api/saveData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeData), // Send the updated data
      });

      if (response.ok) {
        setData(activeData); // Update the local state with saved data
      } else {
        const error = await response.json();
        alert(`Failed to save data: ${error.error}`);
      }
    } catch (err) {
      alert("An error occurred while saving data.");
      console.error(err);
    }
  };

  // Handle cell updates dynamically for a specific tab
  const handleUpdate = (tabKey, index, field, value) => {
    const updatedTabData = [...activeData[tabKey]];
    updatedTabData[index][field] = value;

    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });
  };

  // Add a new row dynamically for a specific tab
  const addRow = (tabKey) => {
    const newRow = {};
    const currentColumns = columns[tabKey] || [];
    currentColumns.forEach((col) => {
      newRow[col] = col === "id" ? activeData[tabKey].length + 1 : ""; // Default ID or empty
    });

    setActiveData({
      ...activeData,
      [tabKey]: [...activeData[tabKey], newRow],
    });
  };

  // Add a new column to a specific tab
  const addColumn = (tabKey) => {
    const newColumn = prompt("Enter column name:");

    if (newColumn) {
      const updatedColumns = [...(columns[tabKey] || []), newColumn];
      const updatedTabData = activeData[tabKey].map((row) => ({
        ...row,
        [newColumn]: "", // Set the new column value to empty
      }));

      setColumns({
        ...columns,
        [tabKey]: updatedColumns,
      });

      setActiveData({
        ...activeData,
        [tabKey]: updatedTabData,
      });
    }
  };

  // Add a new sheet (tab) dynamically
  const addTab = () => {
    const newTabName = prompt("Enter new tab name:");

    if (newTabName) {
      // Create a new tab with empty data
      const newTabData = { id: 1, name: newTabName };

      setKeys((prevKeys) => [...prevKeys, newTabName]);
      setColumns((prevColumns) => ({
        ...prevColumns,
        [newTabName]: ["id", "name"], // Default columns for new tab
      }));
      setActiveData({
        ...activeData,
        [newTabName]: [newTabData], // Initialize data for the new tab
      });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Your Projects</h1>
      <Tabs>
        <TabList>
          {keys.map((key) => (
            <Tab key={key}>
              {key
                .split("_") // Split by underscore
                .map((word, index) => {
                  return index === 0
                    ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    : word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase();
                })
                .join(" ")}
            </Tab>
          ))}
        </TabList>

        {keys.map((key) => (
          <TabPanel key={key}>
            <div>
              <div className="sticky top-0 bg-white">
                <h2 className="text-xl font-bold mb-2">
                  {key
                    .split("_") // Split by underscore
                    .map((word, index) => {
                      return index === 0
                        ? word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        : word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase();
                    })
                    .join(" ")}
                </h2>
                <button
                  onClick={() => addRow(key)}
                  className="bg-blue-500 text-white px-4 py-2 mb-3 rounded m-2">
                  Add Row
                </button>
                <button
                  onClick={() => addColumn(key)}
                  className="bg-yellow-500 text-white px-6 py-2 mb-3 rounded m-2">
                  Add Column
                </button>
                <button
                  onClick={addTab}
                  className="bg-purple-500 text-white px-6 py-2 mt-4 rounded m-2">
                  Add New Tab
                </button>
                <button
                  onClick={saveData}
                  className="bg-green-500 text-white px-6 py-2 mt-4 rounded">
                  Save Changes
                </button>
              </div>
              <div className="flex overflow-auto mt-2">
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {columns[key]?.map((col) => (
                        <th
                          key={col}
                          className="border border-gray-300 px-4 py-2 min-w-[150px]">
                          {col
                            .split("_") // Split by underscore
                            .map((word, index) => {
                              return index === 0
                                ? word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                : word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase();
                            })
                            .join(" ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeData[key]?.map((row, index) => (
                      <tr key={index}>
                        {columns[key]?.map((col) => (
                          <td key={col} className="border border-gray-300 ">
                            {col === "id" ? (
                              <span className="p-2">{row[col]}</span> // Read-only for ID field
                            ) : (
                              <input
                                type="text"
                                value={row[col]}
                                onChange={(e) =>
                                  handleUpdate(key, index, col, e.target.value)
                                }
                                className="w-full p-2"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Home;
