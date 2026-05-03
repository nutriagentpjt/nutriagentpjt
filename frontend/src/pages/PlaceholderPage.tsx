interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="flex min-h-full flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-green-600">Phase 2 scaffold</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
      </div>
    </section>
  );
}
