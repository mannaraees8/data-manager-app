import TabManager from "./components/TabManager";

const HomePage = async () => {
  const data = await fetchDriveData(); // Fetch initial data from the API
  const keys = Object.keys(data);

  return (
    <div className="p-4 text-xs">
      <TabManager initialData={data} keys={keys} />
    </div>
  );
};

export default HomePage;

// utils/api.js
export async function fetchDriveData() {
  const response = await fetch(`${process.env.SERVER}/api/driveData`, {
    cache: "no-store", // Fetch fresh data on each request
  });
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
}
