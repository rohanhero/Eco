import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/background.jpg";

// Contact Card Component
interface ContactCardProps {
  name: string;
  title: string;
  department: string;
  photoUrl?: string;
  className?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  name,
  title,
  department,
  photoUrl,
  className = "",
}) => {
  const displayPhoto =
    photoUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60";

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden max-w-sm w-full border border-gray-200 ${className}`}
    >
      {/* Photo Section */}
      <div className="contact-card__photo h-48 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-center">
        <img
          src={displayPhoto}
          alt={name}
          className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-md"
        />
      </div>

      {/* Info Section */}
      <div className="contact-card__info p-6">
        <div className="contact-card__header mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
        </div>
        <div className="contact-card__body">
          <p className="text-gray-600 mb-1">{title}</p>
          <p className="text-gray-500">{department}</p>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const handleViewDetails = (id: string) => {
    console.log("View report details:", id);
    // Navigate to report details page
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="hero-section min-h-[70vh] flex items-center justify-center text-white relative"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-5xl font-bold mb-6 animate-fade-in">
            EcoGuard
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Fixing Issues, One Report at a Time
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-fade-in">
            Join our community in tracking and reporting municipal problems.
            Together, we can improve city services and build a cleaner, safer
            neighborhood for everyone.
          </p>
          <div className="space-x-4">
            <Link to="/report">
              <Button variant="eco" size="lg" className="text-lg px-8">
                Report an Issue
              </Button>
            </Link>
            <Link to="/about"></Link>
          </div>
        </div>
      </section>

      {/* About content above */}

      {/* Our Mission Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <div className="text-left text-lg text-muted-foreground">
            <ol className="list-decimal list-inside space-y-3">
              <li className="text-justify">
                Empower communities to actively improve their city by reporting
                local issues and collaborating on solutions.
              </li>
              <li className="text-justify">
                Track problems and work together to create cleaner, safer, and
                better-maintained neighborhoods.
              </li>
              <li className="text-justify">
                Make city improvement simple, actionable, and inclusive for all
                residents.
              </li>
              <li className="text-justify">
                Foster a sense of civic responsibility and encourage community
                engagement in maintaining the city.
              </li>
              <li className="text-justify">
                Support sustainable practices and initiatives that lead to a
                healthier, more vibrant, and resilient community.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Contact Card Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Our Developers
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            <ContactCard
              name="Aaradhya Gauri Dhakal (Bista)"
              title="Lead Developer"
              department="Full Stack"
              photoUrl="rohan.jpg"
            />

            {/* You can add more contact cards here if needed */}
            <ContactCard
              name="Pranistha Niraula"
              title="UI/UX Designer"
              department="Frontend"
              photoUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            />
          </div>
        </div>
      </section>

      {/* Other sections of your page would go here */}
    </div>
  );
};

export default Home;
