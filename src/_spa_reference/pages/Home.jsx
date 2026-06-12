import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import TrustStrip from "@/components/site/TrustStrip";
import HowItWorks from "@/components/site/HowItWorks";
import FeaturedFleet from "@/components/site/FeaturedFleet";
import AirportConvenience from "@/components/site/AirportConvenience";
import WhyChooseUs from "@/components/site/WhyChooseUs";
import Testimonials from "@/components/site/Testimonials";
import FAQ from "@/components/site/FAQ";
import FinalCTA from "@/components/site/FinalCTA";
import Footer from "@/components/site/Footer";

export default function Home() {
    return (
        <main className="bg-white text-neutral-900 overflow-x-hidden">
            <Header />
            <Hero />
            <TrustStrip />
            <HowItWorks />
            <FeaturedFleet />
            <AirportConvenience />
            <WhyChooseUs />
            <Testimonials />
            <FAQ />
            <FinalCTA />
            <Footer />
        </main>
    );
}
