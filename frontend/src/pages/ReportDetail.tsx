import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, User, Mail, AlertCircle, CheckCircle } from "lucide-react";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  name: string;
  email: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  image_url?: string;
  created_at: string;
  resolved: boolean;
}

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/reports/${id}/`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
          
          // Increment view count
          await fetch(`http://127.0.0.1:8000/api/reports/${id}/view/`, {
            method: 'POST',
          }).catch(err => console.error('Error incrementing views:', err));
        } else {
          console.error("Failed to fetch report:", res.status);
          setReport(null);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Report not found</p>
          <Button onClick={() => navigate("/")} variant="eco">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const status = report.resolved ? "Resolved" : "Pending";
  const statusColor = report.resolved
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="eco-outline"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        {/* Main Card */}
        <Card className="eco-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-foreground mb-2">
                  {report.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {report.description}
                </CardDescription>
              </div>
              <Badge className={statusColor}>{status}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Image Section */}
            {report.image_url && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Evidence Photo</h3>
                <img
                  src={report.image_url}
                  alt={report.title}
                  className="w-full h-96 object-cover rounded-lg border border-border/50"
                />
              </div>
            )}

            {/* Category & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">
                  Category
                </label>
                <p className="text-lg text-foreground mt-1">
                  {report.category.replace("-", " ").toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">
                  Severity Level
                </label>
                <p className="text-lg text-foreground mt-1">
                  {report.severity.replace("-", " ").toUpperCase()}
                </p>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </h3>
              <div className="space-y-3">
                <p className="text-foreground">{report.location_address}</p>

                {/* Simple Map - Only render if coordinates exist */}
                {report.location_lat && report.location_lng ? (
                  <div className="w-full h-96 rounded-lg overflow-hidden border border-border/50 bg-gray-100">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        report.location_lng - 0.01
                      },${report.location_lat - 0.01},${report.location_lng + 0.01},${
                        report.location_lat + 0.01
                      }&layer=mapnik&marker=${report.location_lat},${report.location_lng}`}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center border border-border/50">
                    <p className="text-muted-foreground">Map not available for this location</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-4">Reporter Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">{report.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">{report.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className={`p-6 rounded-lg flex items-start space-x-4 ${
              report.resolved ? "bg-green-50" : "bg-yellow-50"
            }`}>
              {report.resolved ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-900">Issue Resolved</h4>
                    <p className="text-sm text-green-800 mt-1">
                      This issue has been addressed and resolved.
                    </p>
                  </div>
                </>
  
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Pending Review</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      This report is currently being reviewed by our team.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportDetail;
