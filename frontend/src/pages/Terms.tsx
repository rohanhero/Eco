import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-card py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-eco-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Terms of Service
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Welcome to EcoGuard! By using our services, you agree to follow
              the terms listed below. These guidelines ensure a safe and fair
              experience for all users.
            </p>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                1. User Responsibilities
              </h3>
              <p>
                You agree to provide accurate information when reporting issues
                and interacting with the platform. Misuse or submitting false
                reports may result in account restrictions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                2. Acceptable Use
              </h3>
              <p>
                EcoGuard must not be used for harassment, fraud, or harmful
                activities. Content that violates community standards will be
                removed.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                3. Service Availability
              </h3>
              <p>
                Although we strive for uninterrupted service, EcoGuard does not
                guarantee constant availability and may temporarily go offline
                for updates or maintenance.
              </p>
            </div>

            <p>
              By continuing to use EcoGuard, you acknowledge and accept these
              terms. For questions, feel free to contact our support team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
