export default async function Home() {
  // 環境変数からURLを取得し、なければローカルを向くようにする
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

  // Docker内のURLではなく、RenderのURLを叩くように変更
  const res = await fetch(`${apiUrl}/api/test`, {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <main className="p-24">
      <h1 className="text-2xl font-bold">Next.js + Laravel (Cloud)</h1>
      <p className="mt-4 p-4 bg-gray-100 rounded">{data.message}</p>
    </main>
  );
}
