import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, Clock, TrendingUp, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const features = [
    {
      icon: Navigation,
      title: "Smart Routing",
      desc: "Optimized routes to save fuel and time.",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      desc: "Track every delivery status instantly.",
    },
    {
      icon: TrendingUp,
      title: "Earnings Tracker",
      desc: "Visualize your daily income and bonuses.",
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:flex-row lg:text-left lg:gap-16 lg:px-24">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Trusted by autonomous drivers</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
            Deliver Faster,<br />
            <span className="text-primary">Earn More.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            The all-in-one route planner and financial assistant for professional delivery drivers. Optimize your stops, track your cash.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Button size="lg" className="h-14 text-lg font-semibold px-8 w-full sm:w-auto shadow-xl shadow-primary/20" asChild>
              <a href="/api/login">Start Driving Now</a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 text-lg px-8 w-full sm:w-auto" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-12 lg:mt-0 relative w-full max-w-md lg:max-w-lg aspect-square">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-3xl opacity-60" />
          {/* Unsplash abstract map/delivery image */}
          {/* delivery map navigation abstract */}
          <img 
            src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=2070&auto=format&fit=crop" 
            alt="Delivery Map"
            className="relative z-10 rounded-3xl shadow-2xl border-4 border-white rotate-3 hover:rotate-0 transition-transform duration-500 object-cover h-full w-full"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="bg-card border-t py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card key={i} className="bg-background border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2024 RotaCerta. Built for Speed.
      </footer>
    </div>
  );
}
