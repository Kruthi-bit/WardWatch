import {
  Construction,
  Trash2,
  Droplets,
  Lightbulb,
  Waves,
  CircleHelp,
} from "lucide-react";
import { Link } from "react-router-dom";

function Categories() {
  const categories = [
    {
      title: "Pothole",
      value: "Pothole",
      icon: <Construction className="w-9 h-9 text-red-500" />
    },
    {
      title: "Garbage",
      value: "Garbage",
      icon: <Trash2 className="w-8 h-8 text-green-500" />,
    },
    {
      title: "Water Leak",
      value: "Water Leakage",
      icon: <Droplets className="w-8 h-8 text-blue-500" />,
    },
    {
      title: "Streetlight",
      value: "Street Light",
      icon: <Lightbulb className="w-8 h-8 text-yellow-500" />,
    },
    {
      title: "Drainage",
      value: "Drainage",
      icon: <Waves className="w-8 h-8 text-cyan-500" />,
    },
    {
      title: "Other",
      value: "Others",
      icon: <CircleHelp className="w-8 h-8 text-gray-500" />,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <h3 className="text-sm font-bold uppercase text-gray-600 mb-6">
        What's the Issue?
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {categories.map((category, index) => (
          <Link
            key={index}
            to={`/complaint?category=${encodeURIComponent(category.value)}`}
            className="bg-white border border-gray-200 rounded-xl h-36 flex flex-col items-center justify-center shadow-sm hover:shadow-lg hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center group"
          >
            <div className="transition-transform group-hover:scale-110">
              {category.icon}
            </div>

            <p className="mt-4 font-semibold text-slate-700 group-hover:text-indigo-600">
              {category.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Categories;