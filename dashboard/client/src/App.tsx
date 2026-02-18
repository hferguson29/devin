import FlagTable from "./components/FlagTable";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Feature Flag Removal Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View feature flags and trigger Devin sessions to remove them from
            the codebase.
          </p>
        </div>
        <FlagTable />
      </div>
    </div>
  );
}

export default App;
