import React from "react";

interface ContactCardProps {
  name: string;
  title: string;
  department: string;
  photoUrl?: string;
  className?: string;
}

const AboutCard: React.FC<ContactCardProps> = ({
  name,
  title,
  department,
  photoUrl,
  className = "",
}) => {
  // Fallback to a placeholder if no photo URL is provided
  const displayPhoto =
    photoUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60";

  return (
    <div
      className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${className}`}
    >
      <div className="contact-card bg-white rounded-lg shadow-md overflow-hidden max-w-sm w-full border border-gray-200">
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
    </div>
  );
};

export default AboutCard;
