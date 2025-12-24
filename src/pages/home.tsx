import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, DollarSign, Users, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 text-foreground">
                Find Your Next Shift Today
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect with short-term job opportunities or find reliable temporary workers instantly. 
                The modern platform for flexible work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup?role=worker">
                  <Button size="lg" className="w-full sm:w-auto">
                    I'm Looking for Work
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/signup?role=employer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    I'm Hiring Workers
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/worker-hero.png" 
                alt="Workers" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Why Choose Shiftly?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <MapPin className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Location-Based</h3>
              <p className="text-muted-foreground">
                Find shifts near you with our smart distance filtering and interactive map view.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <Clock className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Instant Matching</h3>
              <p className="text-muted-foreground">
                Apply to shifts and get approved in the same session. No waiting around.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <DollarSign className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Transparent Pay</h3>
              <p className="text-muted-foreground">
                See hourly rates upfront. Track your earnings and filter by pay range.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Reliable Community</h3>
              <p className="text-muted-foreground">
                Rating system and reliability scores ensure quality matches on both sides.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Verified Users</h3>
              <p className="text-muted-foreground">
                All users are verified. Work with confidence knowing everyone is authentic.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your completed shifts, earnings, and build your reputation over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of workers and employers connecting through Shiftly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
