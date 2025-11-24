import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-card py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-eco-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Privacy Policy
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Your privacy matters to us. This policy explains how EcoGuard
              collects, uses, and protects your personal information.
            </p>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                1. Information We Collect
              </h3>
              <p>
                We collect basic user information such as name, email, and
                reported issue data to improve service quality and track
                reports.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                2. How Your Data is Used
              </h3>
              <p>
                Your information is used only for platform functionality
                reporting issues, showing updates, and enhancing service
                reliability. We do not sell or misuse your data.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                3. Data Protection
              </h3>
              <p>
                EcoGuard uses secure protocols and encrypted connections to
                protect your data from unauthorized access or misuse.
              </p>
            </div>

            <p>
              By using our platform, you consent to the collection and use of
              information as described in this privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
