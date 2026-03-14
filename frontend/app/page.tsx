export default async function Home() {
  // Docker内のLaravel APIを叩く
  const res = await fetch("http://localhost/api/test", {
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <main className="p-24">
      <h1 className="text-2xl font-bold">Next.js + Docker Laravel</h1>
      <p className="mt-4 p-4 bg-gray-100 rounded">{data.message}</p>
    </main>
  );
}
