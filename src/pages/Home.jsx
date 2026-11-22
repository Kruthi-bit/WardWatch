import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import ComplaintOverview from "../components/ComplaintOverview";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <ComplaintOverview />
      <Footer />
    </>
  );
}

export default Home;