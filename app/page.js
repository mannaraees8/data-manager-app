"use client";
import { useState, useEffect, useRef } from "react";

const Home = () => {
  const [data, setData] = useState({});
  const [keys, setKeys] = useState([]); // Keys for dynamic tabs
  const [activeData, setActiveData] = useState({}); // Active data for each tab
  const [columns, setColumns] = useState({}); // Dynamic columns for each tab
  const [activeTab, setActiveTab] = useState(0); // Track the active tab index
  const inputRefs = useRef({});

  // Fetch data from Google Drive on load
  useEffect(() => {
    const fetchData = async () => {
      const timestamp = new Date().getTime(); // Cache-busting
      const response = await fetch(`/api/driveData?t=${timestamp}`);
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

  // Save all data to Google Drive
  const saveData = async () => {
    try {
      const response = await fetch("/api/driveData", {
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

    // Save data after adding the row
    saveData();
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

      // Save data after adding the column
      saveData();
    }
  };

  // Delete a row from a specific tab
  const deleteRow = (tabKey, index) => {
    const updatedTabData = activeData[tabKey].filter((_, i) => i !== index);
    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });

    // Save data after deleting the row
    saveData();
  };

  // Delete a column from a specific tab
  const deleteColumn = (tabKey, col) => {
    const updatedColumns = columns[tabKey].filter((column) => column !== col);
    const updatedTabData = activeData[tabKey].map((row) => {
      const { [col]: _, ...rest } = row; // Remove the column from each row
      return rest;
    });

    setColumns({
      ...columns,
      [tabKey]: updatedColumns,
    });

    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });

    // Save data after deleting the column
    saveData();
  };

  // Delete a tab dynamically
  const deleteTab = (tabKey) => {
    const updatedKeys = keys.filter((key) => key !== tabKey);
    const updatedData = { ...activeData };
    delete updatedData[tabKey];

    setKeys(updatedKeys);
    setActiveData(updatedData);
    setActiveTab(0);

    // Save data after deleting the tab
    saveData();
  };

  // Add a new sheet (tab) dynamically
  const addTab = () => {
    const newTabName = prompt("Enter new tab name:");

    if (newTabName) {
      // Create a new tab with empty data
      const newTabData = { id: 1, name: newTabName };

      // Update the keys and columns state
      setKeys((prevKeys) => [...prevKeys, newTabName]);
      setColumns((prevColumns) => ({
        ...prevColumns,
        [newTabName]: ["id", "name"], // Default columns for new tab
      }));

      // Update the activeData state
      setActiveData({
        ...activeData,
        [newTabName]: [newTabData], // Initialize data for the new tab
      });

      // Save data after adding the tab
      saveData();
    }
  };

  const handleKeyDown = (e, rowIndex, colIndex, tabKey) => {
    if (e.key === "Enter") {
      const nextRowIndex = rowIndex + 1; // Move to the next row
      const nextInput = inputRefs.current[tabKey]?.[nextRowIndex]?.[colIndex];

      if (nextInput) {
        nextInput.focus(); // Focus on the input in the next row
      } else {
        console.log("No more rows available.");
      }
    }
  };

  const autoResize = (textarea) => {
    textarea.style.height = "auto"; // Reset height to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height to content
  };

  return (
    <div className="p-4 text-xs">
      <h1 className="text-2xl font-bold mb-4">Manage Your Projects</h1>
      {/* Tabs Header */}
      <div className="flex gap-4 mb-4 overflow-auto">
        {keys.map((key, index) => (
          <button
            key={key}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-md  ${
              activeTab === index ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}>
            {key
              .split("_")
              .map((word, index) => {
                return index === 0
                  ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              })
              .join(" ")}
          </button>
        ))}
        <button
          onClick={addTab}
          className="bg-green-500 text-white p-2 rounded-md ml-4">
          Add Tab
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {keys[activeTab] && (
          <div>
            <div className="sticky top-0 bg-white">
              <h2 className="text-xl font-bold mb-2">
                {keys[activeTab]
                  .split("_")
                  .map((word, index) => {
                    return index === 0
                      ? word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      : word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase();
                  })
                  .join(" ")}
              </h2>
              <div className="flex items-center my-1">
                <button
                  onClick={() => addRow(keys[activeTab])}
                  className="bg-blue-500 text-white px-4  p-2 rounded mr-5">
                  Add Row
                </button>
                <button
                  onClick={() => addColumn(keys[activeTab])}
                  className="bg-yellow-500 text-white px-6 p-2 rounded mr-5">
                  Add Column
                </button>
                <button
                  onClick={saveData}
                  className="bg-green-500 text-white p-2 rounded">
                  Save Changes
                </button>
                <button
                  onClick={() => deleteTab(keys[activeTab])}
                  className="bg-red-500 text-white p-2 rounded ml-4">
                  Delete Tab
                </button>
              </div>
            </div>

            {/* Table Content for Active Tab */}
            <div className="flex overflow-auto">
              <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold">
                    {columns[keys[activeTab]]?.map((col) => {
                      // Calculate the total for numeric columns
                      const total = activeData[keys[activeTab]]?.reduce(
                        (sum, row) => {
                          const value = row[col];
                          return isNaN(Number(value))
                            ? sum
                            : sum + Number(value);
                        },
                        0
                      );

                      return (
                        <th
                          key={`total-${col}`}
                          className="border border-gray-300 px-4 py-2 min-w-[150px]">
                          {isNaN(total) || total === 0 ? "" : total}
                        </th>
                      );
                    })}
                  </tr>

                  {/* Header Row */}
                  <tr>
                    {columns[keys[activeTab]]?.map((col) => (
                      <th
                        key={col}
                        className="border border-gray-300 px-4 py-2 min-w-[150px]">
                        {col
                          .split("_")
                          .map((word, index) => {
                            return index === 0
                              ? word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              : word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase();
                          })
                          .join(" ")}
                        <button
                          onClick={() => deleteColumn(keys[activeTab], col)}
                          className="ml-2 text-red-500">
                          X
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeData[keys[activeTab]]?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns[keys[activeTab]]?.map((col, colIndex) => (
                        <td key={col} className="border border-gray-300">
                          {col === "id" ? (
                            <span className="p-2">{row[col]}</span> // Read-only for ID field
                          ) : (
                            <textarea
                              value={row[col]}
                              rows={3}
                              onChange={(e) => {
                                handleUpdate(
                                  keys[activeTab],
                                  rowIndex,
                                  col,
                                  e.target.value
                                );
                                autoResize(e.target); // Automatically resize the textarea
                              }}
                              className="w-full p-2 resize-none overflow-hidden" // Disable manual resizing
                              ref={(el) => {
                                if (!inputRefs.current[keys[activeTab]]) {
                                  inputRefs.current[keys[activeTab]] = []; // Initialize the tab array
                                }
                                if (
                                  !inputRefs.current[keys[activeTab]][rowIndex]
                                ) {
                                  inputRefs.current[keys[activeTab]][rowIndex] =
                                    []; // Initialize the row array
                                }
                                inputRefs.current[keys[activeTab]][rowIndex][
                                  colIndex
                                ] = el; // Assign the ref
                              }}
                              onKeyDown={(e) => {
                                if (e.ctrlKey && e.key === "Enter") {
                                  e.preventDefault();
                                  const target = e.target;
                                  const cursorPosition = target.selectionStart;
                                  const value = target.value;

                                  // Insert a newline at the cursor position
                                  const newValue =
                                    value.slice(0, cursorPosition) +
                                    "\n" +
                                    value.slice(cursorPosition);
                                  handleUpdate(
                                    keys[activeTab],
                                    rowIndex,
                                    col,
                                    newValue
                                  );

                                  // Update textarea value and caret position
                                  setTimeout(() => {
                                    target.value = newValue;
                                    target.selectionStart =
                                      target.selectionEnd = cursorPosition + 1;
                                    autoResize(target);
                                  }, 0);
                                } else {
                                  handleKeyDown(
                                    e,
                                    rowIndex,
                                    colIndex,
                                    keys[activeTab]
                                  );
                                }
                              }}
                            />
                          )}
                          {col === "id" && (
                            <button
                              onClick={() =>
                                deleteRow(keys[activeTab], rowIndex)
                              }
                              className="ml-2 text-red-500">
                              X
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
