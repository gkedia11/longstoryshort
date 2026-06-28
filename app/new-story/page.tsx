import { AppNav } from "@/components/AppNav";
import { NewStoryForm } from "@/components/NewStoryForm";

export default function NewStoryPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <AppNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-4xl font-semibold text-[#101513]">
            Start a manuscript order.
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#52615a]">
            Give us enough direction to write with intent. Specific characters,
            setting, stakes, and tone usually produce stronger drafts.
          </p>
        </div>
        <NewStoryForm />
      </section>
    </main>
  );
}
