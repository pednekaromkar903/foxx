export default function Forbidden() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-red-600">403 - Forbidden</h1>
      <p className="mt-4 text-gray-600">You do not have permission to access this page.</p>
    </div>
  );
}
