
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Simple Header */}
      <header className="border-b border-amber-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Car className="h-5 w-5 text-terra-600 mr-2" />
            <h1 className="text-xl font-medium text-terra-800">XYZ Park</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="text-terra-700"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Minimal Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-terra-800 mb-6">
            Smart Parking Management
          </h1>
          
          <p className="text-terra-700/80 mb-8">
            Streamline operations, increase efficiency, and enhance customer experience with our comprehensive parking management solution.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              className="bg-terra-600 hover:bg-terra-700 text-white"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              className="border-terra-200 text-terra-700"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
      
      {/* Simple Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <Car className="h-8 w-8 text-terra-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-terra-800 mb-1">Smart Parking</h3>
              <p className="text-sm text-terra-600">Real-time space monitoring</p>
            </div>
            <div className="text-center">
              <Car className="h-8 w-8 text-terra-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-terra-800 mb-1">Digital Ticketing</h3>
              <p className="text-sm text-terra-600">Paperless experience</p>
            </div>
            <div className="text-center">
              <Car className="h-8 w-8 text-terra-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-terra-800 mb-1">Easy Booking</h3>
              <p className="text-sm text-terra-600">Reserve spaces in advance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-medium text-terra-800 mb-4">
            Ready to optimize your parking operations?
          </h2>
          <Button 
            className="bg-terra-600 hover:bg-terra-700 text-white"
            onClick={() => navigate('/register')}
          >
            Get Started Today
          </Button>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer className="py-6 bg-white border-t border-amber-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-terra-600">
            &copy; {new Date().getFullYear()} XYZ Park. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;